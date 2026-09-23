import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";
import Institute from "../models/institute.model.js";
import TestAssignment from "../models/testAssignment.model.js";
import { isPaymentEnabled } from "../utils/paymentToggle.js";

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
  const hasAccess =
    isFree ||
    !isPaymentEnabled() ||
    (user.purchasedExams && user.purchasedExams.includes(mock.exam));

  if (!hasAccess) {
    return { message: "Please purchase this exam to access mocks" };
  }

  return { assignment: null };
}

export const submitTest = async (req, res) => {
  try {
    const { mockId, answers: requestAnswers } = req.body || {};
    const userId = req.user._id;

    if (typeof mockId !== "string" || !mockId.trim()) {
      return res.status(400).json({ message: "A mock ID is required" });
    }

    const answers = requestAnswers === undefined ? {} : requestAnswers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an object keyed by question code" });
    }

    // Sequential retries are rejected here. The unique index and atomic update below
    // provide the same guarantee when requests arrive concurrently.
    const existingSubmittedResult = await Result.findOne({
      userId,
      mockId,
      isSubmitted: { $ne: false },
    });
    if (existingSubmittedResult) {
      return res.status(409).json({
        message: "Test already submitted",
        resultId: existingSubmittedResult._id,
      });
    }

    const mock = await Mock.findById(mockId);
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    const access = await verifyMockAttemptAccess(req.user, mock, mockId);
    if (!access.assignment && mock.instituteId) {
      return res.status(403).json({ message: access.message || "This mock test is not available to you" });
    }
    if (access.message) {
      return res.status(403).json({ message: access.message });
    }

    const draftResult = await Result.findOne({ userId, mockId, isSubmitted: false });
    const finalAnswers = { ...(draftResult?.answers || {}), ...answers };

    const questionCodes = Object.keys(finalAnswers);
    const questions = await Question.find({
      mockId,
      isActive: true,
      questionCode: { $in: questionCodes },
    }).select("+correctOption +marks +negativeMarks +subject +section");

    if (questions.length !== questionCodes.length) {
      return res.status(400).json({ message: "One or more question IDs are invalid for this mock" });
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
          return res.status(409).json({
            message: "Test already submitted",
            resultId: submittedResult._id,
          });
        }
      }
      throw err;
    }

    return res.status(201).json({
      resultId: result._id,
      score,
      total: totalExamMarks,
      subjectStats,
      sectionScores,
    });
  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err);
    return res.status(500).json({ message: "Test submission failed" });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { mockId, answers } = req.body;
    const userId = req.user._id;

    const mock = await Mock.findById(mockId);

    let result = await Result.findOne({ userId, mockId });

    if (result && result.isSubmitted) {
      return res.status(409).json({ message: "Cannot save, test already submitted" });
    }

    if (result) {
      // Merge new answers
      result.answers = { ...result.answers, ...answers };
      if (mock?.instituteId) {
        result.instituteId = mock.instituteId;
      }
      await result.save();
    } else {
      // Create new draft
      result = await Result.create({
        userId,
        mockId,
        score: 0, // temporary
        total: 0,
        answers,
        isSubmitted: false, // DRAFT
        instituteId: mock?.instituteId || null,
      });
    }

    res.status(200).json({ message: "Progress saved", savedCount: Object.keys(result.answers).length });

  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
    res.status(500).json({ message: "Save failed" });
  }
};


// concurrency is added
