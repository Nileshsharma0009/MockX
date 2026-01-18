// import Question from "../models/question.model.js";
// import Result from "../models/result.model.js";

// export const submitTest = async (req, res) => {
//   try {
//     const { mockId, answers } = req.body;
//     const userId = req.user._id;

//     // ⛔ block re-attempt
//     const existing = await Result.findOne({ userId, mockId });
//     if (existing) {
//       return res.status(409).json({
//         message: "Test already submitted",
//         resultId: existing._id,
//         score: existing.score,
//         total: existing.total,
//       });
//     }

//     let score = 0;
//     let total = 0;

//     for (const [code, selected] of Object.entries(answers)) {
//       const q = await Question.findOne({ questionCode: code })
//         .select("+correctOption +marks +negativeMarks");

//       if (!q) continue;

//       total += q.marks;

//       if (Number(selected) === q.correctOption) {
//         score += q.marks;
//       } else {
//         score -= q.negativeMarks || 0;
//       }
//     }

//     // ✅ SAVE RESULT
//     const result = await Result.create({
//       userId,
//       mockId,
//       score,
//       total,
//       answers,
//     });

//     return res.status(201).json({
//       resultId: result._id,
//       score,
//       total,
//     });

//   } catch (err) {
//     console.error("SUBMIT ERROR:", err);
//     res.status(500).json({ message: "Test submission failed" });
//   }
// };

import Question from "../models/question.model.js";
import Result from "../models/result.model.js";

export const submitTest = async (req, res) => {
  try {
    const { mockId, answers } = req.body;
    const userId = req.user._id;

    const existing = await Result.findOne({ userId, mockId });
    if (existing) {
      return res.status(409).json({
        message: "Test already submitted",
        resultId: existing._id,
        score: existing.score,
        total: existing.total,
      });
    }

    let score = 0;
    let total = 0;

    const CORRECT_MARKS = 1;
    const NEGATIVE_MARKS = 0.25;

    const subjectStats = {};

    for (const [code, selected] of Object.entries(answers)) {
      const q = await Question.findOne({ questionCode: code })
        .select("+correctOption");

      if (!q) continue;

      const subject = code.split("-")[2]; // eng, phy, math, etc

      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          attempted: 0,
          correct: 0,
          wrong: 0,
        };
      }

      subjectStats[subject].attempted++;
      total += CORRECT_MARKS;

      if (Number(selected) === q.correctOption) {
        score += CORRECT_MARKS;
        subjectStats[subject].correct++;
      } else {
        score -= NEGATIVE_MARKS;
        subjectStats[subject].wrong++;
      }
    }

    const result = await Result.create({
      userId,
      mockId,
      score,
      total,
      answers,
      subjectStats,
    });

    return res.status(201).json({
      resultId: result._id,
      score,
      total,
      subjectStats,
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    res.status(500).json({ message: "Test submission failed" });
  }
};
