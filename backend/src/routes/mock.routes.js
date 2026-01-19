import express from "express";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import protect from "../middleware/auth.middleware.js";
import optionalAuth from "../middleware/optionalAuth.middleware.js";

const router = express.Router();

/**
 * FREE MOCK RULE
 * Mock 1 → FREE
 * Others → PAID
 */
const FREE_MOCKS = ["1"];

router.get("/:mockId/questions", optionalAuth, async (req, res) => {
  try {
    const { mockId } = req.params;
    const user = req.user || null;

    const isFreeMock = FREE_MOCKS.includes(mockId);

    // 🔐 AUTH CHECK FOR PAID MOCKS
    if (!isFreeMock) {
      if (!user) {
        return res.status(401).json({
          message: "Login required",
        });
      }

      if (!user.hasPurchasedBundle) {
        return res.status(403).json({
          message: "Purchase required",
        });
      }
    }

    // 🚫 BLOCK IF ALREADY ATTEMPTED (only if logged in)
    if (user) {
      const attempted = await Result.findOne({
        userId: user._id,
        mockId,
      });

      if (attempted) {
        return res.status(403).json({
          message: "Test already attempted",
          redirectTo: "/mock-tests",
        });
      }
    }

    // ✅ LOAD QUESTIONS
    const questions = await Question.find({
      mockId,
      isActive: true,
    }).select("-correctOption");

    const grouped = { A: [], B: [] };

    questions.forEach((q) => {
      grouped[q.section].push(q);
    });

    res.status(200).json(grouped);
  } catch (err) {
    console.error("❌ Load questions error:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

export default router;
