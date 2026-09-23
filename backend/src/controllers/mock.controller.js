import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";
import Institute from "../models/institute.model.js";
import TestAssignment from "../models/testAssignment.model.js";
export const getMockQuestions = async (req, res) => {
  try {
    const { mockId } = req.params;
    const user = req.user;

    /* -----------------------------
       1ï¸âƒ£ CHECK MOCK EXISTS (Safe Fallback)
    ----------------------------- */
    let mock = await Mock.findById(mockId);

    // âš ï¸ Fallback Data (Matches Frontend Config)
    const FALLBACK_MOCKS = {
      "1": { exam: "imucet", isFree: true, title: "IMUCET Mock 1", duration: 180, totalQuestions: 200, totalMarks: 200, marking: { correct: 1, incorrect: 0.25 }, sections: [{ id: "A", name: "Section A" }, { id: "B", name: "Section B" }] },
      "imu1": { exam: "imucet", isFree: true, title: "IMUCET Mock 1", duration: 180, totalQuestions: 200, totalMarks: 200, marking: { correct: 1, incorrect: 0.25 }, sections: [{ id: "A", name: "Section A" }, { id: "B", name: "Section B" }] },
      "2": { exam: "imucet", isFree: true },
      "imu2": { exam: "imucet", isFree: true },
      "3": { exam: "imucet", isFree: false },
      "imu3": { exam: "imucet", isFree: false },
      "4": { exam: "imucet", isFree: false },
      "imu4": { exam: "imucet", isFree: false },
      "5": { exam: "imucet", isFree: false },
      "imu5": { exam: "imucet", isFree: false },
      "6": { exam: "imucet", isFree: false },
      "imu6": { exam: "imucet", isFree: false },
      "custom-phy-01": {
        _id: "custom-phy-01",
        exam: "physics",
        isFree: true,
        title: "Physics Practice Test",
        description: "25 questions | 30 minutes | +2 / -0.5 marking (Dynamic Engine)",
        duration: 30,
        totalQuestions: 25,
        totalMarks: 50,
        marking: { correct: 2, incorrect: 0.5 },
        sections: [{ id: "phy", name: "Physics", questionCount: 25 }],
      },
    };

    if (!mock) {
      const fallback = FALLBACK_MOCKS[mockId];
      if (fallback) {
        mock = { _id: mockId, ...fallback };
      } else {
        // Generic default
        mock = {
          _id: mockId,
          exam: "imucet",
          isFree: mockId === "1" || mockId === "imu1",
        };
      }
    }

    const examId = mock.exam;

    // Check if free (Database flag or Hardcoded legacy ID)
    const isFree = mock.isFree || mockId === "1" || mockId === "imu1";

    /* -----------------------------
       2ï¸âƒ£ ACCESS CONTROL CHECK
    ----------------------------- */
    let hasAccess = false;

    // ðŸ« Case 0: Institute Custom Mock (Strict Private Access)
    if (mock.instituteId) {
      if (!user) {
        return res.status(401).json({
          message: "Please log in to access this institute mock test",
        });
      }

      if (user.status === "SUSPENDED") {
        return res.status(403).json({
          message: "Your student account is suspended",
        });
      }

      if (!user.instituteId || user.instituteId.toString() !== mock.instituteId.toString()) {
        return res.status(403).json({
          message: "You do not belong to the institute offering this mock test",
        });
      }

      const institute = await Institute.findById(mock.instituteId);
      if (!institute || institute.status === "SUSPENDED") {
        return res.status(403).json({
          message: "This institute is currently suspended or inactive",
        });
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
        return res.status(403).json({
          message: "This mock test is not currently assigned to you",
        });
      }

      const now = new Date();
      if (assignment.availableFrom && now < new Date(assignment.availableFrom)) {
        return res.status(403).json({
          message: "This test is not yet available to attempt",
        });
      }
      if (assignment.availableUntil && now > new Date(assignment.availableUntil)) {
        return res.status(403).json({
          message: "The window to attempt this test has expired",
        });
      }

      // Check already submitted
      const alreadyAttempted = await Result.findOne({
        userId: user._id,
        mockId,
        isSubmitted: true,
      });

      if (alreadyAttempted) {
        return res.status(403).json({
          message: "Test already attempted",
          redirectTo: `/result/${alreadyAttempted._id}`,
        });
      }

      hasAccess = true;
    }
    // âœ… Case A: It's free (public mock)
    else if (isFree) {
      hasAccess = true;
    }
// âœ… Case C: User has purchased the specific exam bundle
    else if (user && Array.isArray(user.purchasedExams) && user.purchasedExams.includes(examId)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: "Please purchase this exam to access mocks",
      });
    }

    /* -----------------------------
       3ï¸âƒ£ BLOCK RE-ATTEMPT (For public non-institute mocks)
    ----------------------------- */
    if (!mock.instituteId && user) {
      const alreadyAttempted = await Result.findOne({
        userId: user._id,
        mockId,
        isSubmitted: true,
      });

      if (alreadyAttempted) {
        return res.status(403).json({
          message: "Test already attempted",
          redirectTo: "/mock-tests",
        });
      }
    }



    /* -----------------------------
       4ï¸âƒ£ LOAD QUESTIONS
    ----------------------------- */
    const questions = await Question.find({
      mockId,
      isActive: true,
    }).select("-correctOption");

    // Dynamic sections: use mock.sections if configured, else auto-discover from questions or fallback
    let examSections = mock.sections && mock.sections.length > 0 ? mock.sections : [];
    if (examSections.length === 0) {
      const distinctSections = [...new Set(questions.map((q) => q.section))];
      if (distinctSections.length > 0) {
        examSections = distinctSections.map((sec) => ({
          id: sec,
          name: `Section ${sec}`,
          questionCount: questions.filter((q) => q.section === sec).length,
        }));
      } else {
        examSections = [
          { id: "A", name: "Section A" },
          { id: "B", name: "Section B" },
        ];
      }
    }

    const grouped = {};
    for (const sec of examSections) {
      grouped[sec.id] = [];
    }
    for (const q of questions) {
      if (!grouped[q.section]) {
        grouped[q.section] = [];
      }
      grouped[q.section].push(q);
    }

    const examData = {
      _id: mock._id || mockId,
      title: mock.title || `Mock Test ${mockId}`,
      exam: mock.exam || "imucet",
      duration: mock.duration || 180,
      totalQuestions: mock.totalQuestions || questions.length || 200,
      totalMarks: mock.totalMarks || (mock.totalQuestions || questions.length || 200),
      marking: mock.marking || { correct: 1, incorrect: 0.25 },
      sections: examSections,
    };

    return res.status(200).json({
      exam: examData,
      questions: grouped,
      ...grouped, // Backward compatibility for legacy callers expecting res.data.A, res.data.B
    });
  } catch (error) {
    console.error("getMockQuestions error:", error);
    res.status(500).json({ message: "Failed to load questions" });
  }
};

export const getMocks = async (req, res) => {
  try {
    const { exam } = req.query;
    const query = {
      isActive: true,
      isInstituteCustom: { $ne: true }, // Do not leak private institute mocks to public catalog
    };
    if (exam) {
      query.exam = { $regex: new RegExp(`^${exam}$`, "i") };
    }
    const mocks = await Mock.find(query);
    return res.status(200).json(mocks);
  } catch (error) {
    console.error("getMocks error:", error);
    return res.status(500).json({ message: "Failed to load mocks" });
  }
};
