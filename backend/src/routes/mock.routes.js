import express from "express";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:mockId/questions", protect, async (req, res) => {
  try {
    const { mockId } = req.params;
    const userId = req.user._id;

    // 🚫 BLOCK IF ALREADY ATTEMPTED
    const attempted = await Result.findOne({ userId, mockId });

    if (attempted) {
      return res.status(403).json({
        message: "Test already attempted",
        redirectTo: "/mock-tests",
      });
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
