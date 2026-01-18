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

    // ⛔ Prevent re-attempt
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

    // 🔥 SUBJECT STATS (dynamic)
    const subjectStats = {}; 
    // { phy: { attempted, correct, wrong } }

    for (const [code, selected] of Object.entries(answers)) {
      const q = await Question.findOne({ questionCode: code })
        .select("+correctOption +marks +negativeMarks");

      if (!q) continue;

      total += q.marks;

      // ✅ derive subject from questionCode (MOST RELIABLE)
      const subject = code.split("-")[2]; // phy, math, eng

      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          attempted: 0,
          correct: 0,
          wrong: 0,
        };
      }

      subjectStats[subject].attempted++;

      if (Number(selected) === q.correctOption) {
        score += q.marks;
        subjectStats[subject].correct++;
      } else {
        score -= q.negativeMarks || 0;
        subjectStats[subject].wrong++;
      }
    }

    // ✅ SAVE RESULT
    const result = await Result.create({
      userId,
      mockId,
      score,
      total,
      answers,
      subjectStats, // 🔥 KEY FOR AI ANALYZER
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
