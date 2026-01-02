import Question from "../models/question.model.js";

export const getQuestions = async (req, res) => {
  try {
    const { mockId, section, subject } = req.params;

    const questions = await Question.find(
      { mockId, section, subject, isActive: true },
      { correctOption: 0 } // IMPORTANT
    );

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};
