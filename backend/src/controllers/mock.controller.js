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
      "1": { exam: "imucet", isFree: true },
      "imu1": { exam: "imucet", isFree: true },
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
