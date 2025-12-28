import express from "express";
import Question from "../models/question.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Get questions for a mock
router.get("/:mockId", protect, async (req, res) => {
  const { mockId } = req.params;

  const questions = await Question.find({ mockId })
    .select("-correctOption"); // extra safety

  res.json(questions);
});

export default router;
