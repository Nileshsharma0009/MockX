import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";
    import { isPaymentEnabled } from "../utils/paymentToggle.js";
export const getMockQuestions = async (req, res) => {
  try {
    const { mockId } = req.params;
    const user = req.user;

    /* -----------------------------
       1️⃣ CHECK MOCK EXISTS
    ----------------------------- */
    const mock = await Mock.findById(mockId);
    if (!mock) {
      return res.status(404).json({
        message: "Mock not found",
      });
    }

    const examId = mock.exam; // 🔥 THIS WAS MISSING

    /* -----------------------------
       2️⃣ PAYMENT CHECK (EXAM LEVEL)
    ----------------------------- */
    if (!user.purchasedExams.includes(examId)) {
      return res.status(403).json({
        message: "Please purchase this exam to access mocks",
      });
    }



if (isPaymentEnabled()) {
  if (!req.user.purchasedExams.includes(examId)) {
    return res.status(403).json({
      message: "Please purchase access",
    });
  }
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

    const grouped = { A: [], B: [] };
    for (const q of questions) {
      grouped[q.section].push(q);
    }

    return res.status(200).json(grouped);
  } catch (error) {
    console.error("getMockQuestions error:", error);
    res.status(500).json({ message: "Failed to load questions" });
  }
};
