import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";
import Institute from "../models/institute.model.js";
import TestAssignment from "../models/testAssignment.model.js";
async function verifyMockAttemptAccess(user, mock, mockId) {
  if (mock.instituteId) {
    if (!user.instituteId || String(user.instituteId) !== String(mock.instituteId)) {
      return { message: "You do not belong to the institute offering this mock test" };
    }

    const institute = await Institute.findById(mock.instituteId);
    if (!institute || institute.status === "SUSPENDED") {
      return { message: "This institute is currently suspended or inactive" };
    }

    const assignment = await TestAssignment.findOne({
      instituteId: mock.instituteId,
      mockId: mock._id,
      status: "ACTIVE",
      $or: [
        { assignToType: "ALL" },
        { assignToType: "BATCH", batch: user.batch },
        { assignToType: "STUDENTS", studentIds: user._id },
      ],
    });

    if (!assignment) {
      return { message: "This mock test is not currently assigned to you" };
    }

    const now = new Date();
    if (assignment.availableFrom && now < new Date(assignment.availableFrom)) {
      return { message: "This test is not yet available to attempt" };
    }
    if (assignment.availableUntil && now > new Date(assignment.availableUntil)) {
      return { message: "The window to attempt this test has expired" };
    }

    return { assignment };
  }

  const isFree = mock.isFree || mockId === "1" || mockId === "imu1";
  const hasAccess = isFree || (Array.isArray(user.purchasedExams) && user.purchasedExams.includes(mock.exam));

  if (!hasAccess) {
    return { message: "Please purchase this exam to access mocks" };
  }

  return { assignment: null };
}

export const submitTest = async (req, res) => {
  const startedAt = Date.now();
  const mockId = req.body?.mockId;
  const userId = req.user?._id;
  const logSubmission = (event, extra = {}) => {
    console.info(JSON.stringify({
      event,
      mockId: typeof mockId === "string" ? mockId : null,
      userId: userId ? String(userId) : null,
      durationMs: Date.now() - startedAt,
      ...extra,
    }));
  };
  const reject = (status, message, fields = {}) => {
    logSubmission(status === 409 ? "SUBMIT_DUPLICATE" : "SUBMIT_FAILED", { status });
    return res.status(status).json({ message, ...fields });
  };

  logSubmission("SUBMIT_START");
  try {
    const { answers: requestAnswers } = req.body || {};

    if (typeof mockId !== "string" || !mockId.trim()) {
      return reject(400, "A mock ID is required");
    }

    const answers = requestAnswers === undefined ? {} : requestAnswers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return reject(400, "Answers must be an object keyed by question code");
    }

    // Sequential retries are rejected here. The unique index and atomic update below
    // provide the same guarantee when requests arrive concurrently.
    const existingSubmittedResult = await Result.findOne({
      userId,
      mockId,
      isSubmitted: { $ne: false },
    });
    if (existingSubmittedResult) {
      return reject(409, "Test already submitted", { resultId: existingSubmittedResult._id });
    }

    const mock = await Mock.findById(mockId);
    if (!mock) {
      return reject(404, "Mock test not found");
    }

    const access = await verifyMockAttemptAccess(req.user, mock, mockId);
    if (!access.assignment && mock.instituteId) {
      return reject(403, access.message || "This mock test is not available to you");
    }
    if (access.message) {
      return reject(403, access.message);
    }

    // The final request is the complete current answer snapshot and is authoritative.
    const finalAnswers = answers;

    const questionCodes = Object.keys(finalAnswers);
    const questions = await Question.find({
      mockId,
      isActive: true,
      questionCode: { $in: questionCodes },
    }).select("+correctOption +marks +negativeMarks +subject +section");

    if (questions.length !== questionCodes.length) {
      return reject(400, "One or more question IDs are invalid for this mock");
    }

    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q.questionCode, q));

    // Keep MockX's existing mock-level marking rules, including custom mocks.
    const correctMarks = mock.marking?.correct !== undefined ? mock.marking.correct : 1;
    const negativeMarks = mock.marking?.incorrect !== undefined ? mock.marking.incorrect : 0.25;
    const totalExamMarks = mock.totalMarks || (mock.totalQuestions ? mock.totalQuestions * correctMarks : 200);

    let score = 0;
    const subjectStats = {};
    const sectionScores = {};

    for (const [code, selected] of Object.entries(finalAnswers)) {
      const q = questionMap.get(code);
      const subject = q.subject || code.split("-")[2] || "general";
      const section = q.section || "A";

      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, wrong: 0, accuracy: 0 };
      }
      if (sectionScores[section] === undefined) {
        sectionScores[section] = 0;
      }

      subjectStats[subject].attempted++;

      if (Number(selected) === q.correctOption) {
        score += correctMarks;
        sectionScores[section] += correctMarks;
        subjectStats[subject].correct++;
      } else {
        score -= negativeMarks;
        sectionScores[section] -= negativeMarks;
        subjectStats[subject].wrong++;
      }
    }

    score = Math.round(score * 100) / 100;

    for (const subj of Object.keys(subjectStats)) {
      const stats = subjectStats[subj];
      stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    }

    const resultFields = {
      score,
      total: totalExamMarks,
      answers: finalAnswers,
      subjectStats,
      sectionScores,
      isSubmitted: true,
      instituteId: mock.instituteId || null,
      assignmentId: access.assignment?._id || null,
    };

    let result;
    try {
      result = await Result.findOneAndUpdate(
        { userId, mockId, isSubmitted: { $ne: true } },
        {
          $set: resultFields,
          $setOnInsert: { userId, mockId },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (err?.code === 11000) {
        const submittedResult = await Result.findOne({ userId, mockId, isSubmitted: true });
        if (submittedResult) {
          return reject(409, "Test already submitted", { resultId: submittedResult._id });
        }
      }
      throw err;
    }

    logSubmission("SUBMIT_SUCCESS", { resultId: String(result._id), status: 201 });
    return res.status(201).json({
      resultId: result._id,
      score,
      total: totalExamMarks,
      subjectStats,
      sectionScores,
    });
  } catch (err) {
    logSubmission("SUBMIT_FAILED", { errorName: err?.name || "Error" });
    console.error("Submission failed:", err?.message || "Unknown error");
    return res.status(500).json({ message: "Test submission failed" });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { mockId, answers } = req.body || {};
    const userId = req.user._id;

    if (typeof mockId !== "string" || !mockId.trim()) {
      return res.status(400).json({ message: "A mock ID is required" });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an object keyed by question code" });
    }

    const mock = await Mock.findById(mockId);
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    const access = await verifyMockAttemptAccess(req.user, mock, mockId);
    if (access.message) {
      return res.status(403).json({ message: access.message });
    }

    const existingSubmittedResult = await Result.findOne({ userId, mockId, isSubmitted: true });
    if (existingSubmittedResult) {
      return res.status(409).json({ message: "Cannot save, test already submitted" });
    }

    const questionCodes = Object.keys(answers);
    const questions = await Question.find({
      mockId,
      isActive: true,
      questionCode: { $in: questionCodes },
    }).select("questionCode options");
    if (questions.length !== questionCodes.length) {
      return res.status(400).json({ message: "One or more question IDs are invalid for this mock" });
    }

    const questionMap = new Map(questions.map((question) => [question.questionCode, question]));
    for (const [questionCode, selectedOption] of Object.entries(answers)) {
      const question = questionMap.get(questionCode);
      if (
        !Number.isInteger(selectedOption) ||
        selectedOption < 0 ||
        selectedOption >= (question?.options?.length || 0)
      ) {
        return res.status(400).json({ message: "One or more answer selections are invalid" });
      }
    }

    // A complete snapshot plus a conditional atomic update prevents a checkpoint
    // from mutating a result that has already transitioned to SUBMITTED.
    let result;
    try {
      result = await Result.findOneAndUpdate(
        { userId, mockId, isSubmitted: { $ne: true } },
        {
          $set: {
            answers,
            isSubmitted: false,
            instituteId: mock.instituteId || null,
            assignmentId: access.assignment?._id || null,
          },
          $setOnInsert: {
            userId,
            mockId,
            score: 0,
            total: 0,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (err?.code === 11000) {
        const submittedResult = await Result.findOne({ userId, mockId, isSubmitted: true });
        if (submittedResult) {
          return res.status(409).json({ message: "Cannot save, test already submitted" });
        }
      }
      throw err;
    }

    // A final submission may have won between the pre-check and the atomic write.
    const submittedResult = await Result.findOne({ userId, mockId, isSubmitted: true });
    if (submittedResult) {
      if (String(submittedResult._id) !== String(result._id)) {
        await Result.deleteOne({
          _id: result._id,
          userId,
          mockId,
          isSubmitted: false,
        });
      }
      return res.status(409).json({ message: "Cannot save, test already submitted" });
    }

    return res.status(200).json({
      message: "Progress saved",
      savedCount: Object.keys(result.answers || {}).length,
    });

  } catch (err) {
    console.error("Progress checkpoint failed:", err?.message || "Unknown error");
    return res.status(500).json({ message: "Save failed" });
  }
};
