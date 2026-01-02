import Question from "../models/question.model.js";

export const submitAttempt = async (req, res) => {
  const { mockId, responses } = req.body;

  const questions = await Question.find({
    mockId,
    questionCode: { $in: responses.map(r => r.questionCode) }
  }).select("+correctOption");

  let score = 0, correct = 0, wrong = 0;

  const map = new Map(questions.map(q => [q.questionCode, q]));

  for (const r of responses) {
    const q = map.get(r.questionCode);
    if (!q) continue;

    if (r.selected === q.correctOption) {
      score += q.marks;
      correct++;
    } else {
      score -= q.negativeMarks || 0;
      wrong++;
    }
  }

  res.json({ score, correct, wrong });
};
