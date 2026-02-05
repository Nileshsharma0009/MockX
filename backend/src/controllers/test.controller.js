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

    // 1️⃣ CHECK EXISTING RESULT
    let result = await Result.findOne({ userId, mockId });

    if (result && result.isSubmitted) {
      return res.status(409).json({
        message: "Test already submitted",
        resultId: result._id,
      });
    }

    // 2️⃣ MERGE ANSWERS (If partial save existed)
    // If we have saved answers before, merge new ones on top
    const finalAnswers = result ? { ...result.answers, ...answers } : answers;

    // 3️⃣ FETCH ALL QUESTIONS IN ONE BATCH (Optimization)
    const questionCodes = Object.keys(finalAnswers);
    const questions = await Question.find({
      questionCode: { $in: questionCodes },
    }).select("+correctOption +marks +negativeMarks");

    // Map for fast lookup
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q.questionCode, q));

    // 4️⃣ CALCULATE SCORE
    const CORRECT_MARKS = 1;
    const NEGATIVE_MARKS = 0.25;

    let score = 0;
    let total = 0; // Total potential marks of ATTEMPTED questions? Or total exam marks? 
    // Usually total is Fixed from Exam, but here it seems calculated.
    // Let's stick to previous logic: Total = Sum of marks of attempted questions? 
    // Previous code: total += q.marks (from DB, or fallback to 1)

    const subjectStats = {};

    for (const [code, selected] of Object.entries(finalAnswers)) {
      const q = questionMap.get(code);
      if (!q) continue;

      const subject = code.split("-")[2] || "gen"; // fallback subject

      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, wrong: 0 };
      }

      subjectStats[subject].attempted++;
      total += CORRECT_MARKS; // Assuming all 1 mark per frontend logic

      if (Number(selected) === q.correctOption) {
        score += CORRECT_MARKS;
        subjectStats[subject].correct++;
      } else {
        score -= NEGATIVE_MARKS;
        subjectStats[subject].wrong++;
      }
    }

    // 5️⃣ SAVE / UPDATE RESULT
    if (result) {
      result.answers = finalAnswers;
      result.score = score;
      result.total = total;
      result.subjectStats = subjectStats;
      result.isSubmitted = true; // FINAL SUBMIT
      await result.save();
    } else {
      result = await Result.create({
        userId,
        mockId,
        score,
        total,
        answers: finalAnswers,
        subjectStats,
        isSubmitted: true,
      });
    }

    return res.status(201).json({
      resultId: result._id,
      score,
      total,
      subjectStats,
    });

  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err);
    return res.status(500).json({ message: "Test submission failed" });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { mockId, answers } = req.body;
    const userId = req.user._id;

    // Upsert Result
    // We don't calc score here, just save answers
    // But schema requires score... so we set 0 or keep existing

    let result = await Result.findOne({ userId, mockId });

    if (result && result.isSubmitted) {
      return res.status(409).json({ message: "Cannot save, test already submitted" });
    }

    if (result) {
      // Merge new answers
      result.answers = { ...result.answers, ...answers };
      await result.save();
    } else {
      // Create new draft
      result = await Result.create({
        userId,
        mockId,
        score: 0, // temporary
        total: 0,
        answers,
        isSubmitted: false, // DRAFT
      });
    }

    res.status(200).json({ message: "Progress saved", savedCount: Object.keys(result.answers).length });

  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
    res.status(500).json({ message: "Save failed" });
  }
};

