import Question from "../models/question.model.js";
import Result from "../models/result.model.js";

export const getMockQuestions = async (req, res) => {
  try {
    const { mockId } = req.params;
    const userId = req.user._id;

    // 🔒 BLOCK ENTRY IF ALREADY ATTEMPTED
    const alreadyAttempted = await Result.findOne({ userId, mockId });

    if (alreadyAttempted) {
      return res.status(403).json({
        message: "Test already attempted",
        redirectTo: "/mock-tests",
      });
    }

    // ✅ LOAD QUESTIONS
    const questions = await Question.find({ mockId, isActive: true })
      .select("-correctOption");

    const grouped = { A: [], B: [] };

    for (const q of questions) {
      grouped[q.section].push(q);
    }

    return res.status(200).json(grouped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load questions" });
  }
};
