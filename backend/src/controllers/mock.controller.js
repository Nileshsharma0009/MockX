import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";
import { isPaymentEnabled } from "../utils/paymentToggle.js";
export const getMockQuestions = async (req, res) => {
  try {
    const { mockId } = req.params;
    const user = req.user;

    /* -----------------------------
       1️⃣ CHECK MOCK EXISTS (Safe Fallback)
    ----------------------------- */
    let mock = await Mock.findById(mockId);

    // ⚠️ Fallback Data (Matches Frontend Config)
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
       2️⃣ ACCESS CONTROL CHECK
    ----------------------------- */
    let hasAccess = false;

    // ✅ Case A: It's free
    if (isFree) {
      hasAccess = true;
    }
    // ✅ Case B: Payments are disabled globally
    else if (!isPaymentEnabled()) {
      hasAccess = true;
    }
    // ✅ Case C: User has purchased the specific exam bundle
    else if (user && user.purchasedExams && user.purchasedExams.includes(examId)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: "Please purchase this exam to access mocks",
      });
    }

    /* -----------------------------
       3️⃣ BLOCK RE-ATTEMPT
    ----------------------------- */
    const alreadyAttempted = await Result.findOne({
      userId: user._id,
      mockId,
    });

    if (alreadyAttempted) {
      return res.status(403).json({
        message: "Test already attempted",
        redirectTo: "/mock-tests",
      });
    }



    /* -----------------------------
       4️⃣ LOAD QUESTIONS
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
    const query = { isActive: true };
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
