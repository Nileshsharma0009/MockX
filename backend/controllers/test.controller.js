import Question from "../models/question.model.js";
import Result from "../models/result.model.js";

export const submitTest = async (req, res) => {
  try {
    const { mockId, answers } = req.body;
    const userId = req.user._id;

    // 🔒 1️⃣ BLOCK RE-ATTEMPT (ONLY ADDITION)
    const existingResult = await Result.findOne({ userId, mockId });

    if (existingResult) {
      return res.status(409).json({
        message: "Test already submitted",
        resultId: existingResult._id,
        score: existingResult.score,
        total: existingResult.total,
      });
    }

    // ✅ 2️⃣ EXISTING LOGIC (UNCHANGED)
    let score = 0;
    let total = 0;

    for (const [code, selected] of Object.entries(answers || {})) {
      const q = await Question.findOne({ questionCode: code })
        .select("+correctOption");

      if (!q) continue;

      total += q.marks;

      const selectedNum = Number(selected);

      if (selectedNum === q.correctOption) {
        score += q.marks;
      } else {
        score -= q.negativeMarks || 0;
      }
    }

    // ✅ 3️⃣ SAVE RESULT (UNCHANGED)
    const result = await Result.create({
      userId,
      mockId,
      score,
      total,
      answers,
    });

    return res.status(200).json({
      score,
      total,
      resultId: result._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Test submission failed" });
  }
};
