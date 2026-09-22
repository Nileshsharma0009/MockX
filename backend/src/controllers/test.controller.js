

import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Mock from "../models/mock.model.js";

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

    // 2️⃣ FETCH MOCK CONFIGURATION
    const mock = await Mock.findById(mockId);
    const correctMarks = mock?.marking?.correct !== undefined ? mock.marking.correct : 1;
    const negativeMarks = mock?.marking?.incorrect !== undefined ? mock.marking.incorrect : 0.25;
    const totalExamMarks = mock?.totalMarks || (mock?.totalQuestions ? mock.totalQuestions * correctMarks : 200);

    // 3️⃣ MERGE ANSWERS (If partial save existed)
    const finalAnswers = result ? { ...result.answers, ...answers } : answers;

    // 4️⃣ FETCH ALL QUESTIONS IN ONE BATCH
    const questionCodes = Object.keys(finalAnswers);
    const questions = await Question.find({
      questionCode: { $in: questionCodes },
    }).select("+correctOption +marks +negativeMarks +subject +section");

    // Map for fast lookup
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q.questionCode, q));

    // 5️⃣ CALCULATE DYNAMIC SCORE & STATS
    let score = 0;
    const subjectStats = {};
    const sectionScores = {};

    for (const [code, selected] of Object.entries(finalAnswers)) {
      const q = questionMap.get(code);
      if (!q) continue;

      const subject = q.subject || code.split("-")[2] || "general";
      const section = q.section || "A";

      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, wrong: 0, accuracy: 0 };
      }
      if (sectionScores[section] === undefined) {
        sectionScores[section] = 0;
      }

      subjectStats[subject].attempted++;

      if (Number(selected) === q.correctOption) {
        score += correctMarks;
        sectionScores[section] += correctMarks;
        subjectStats[subject].correct++;
      } else {
        score -= negativeMarks;
        sectionScores[section] -= negativeMarks;
        subjectStats[subject].wrong++;
      }
    }

    // Round score to 2 decimal places to avoid floating point drift
    score = Math.round(score * 100) / 100;

    for (const subj of Object.keys(subjectStats)) {
      const s = subjectStats[subj];
      s.accuracy = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
    }

    // 6️⃣ SAVE / UPDATE RESULT
    if (result) {
      result.answers = finalAnswers;
      result.score = score;
      result.total = totalExamMarks;
      result.subjectStats = subjectStats;
      result.sectionScores = sectionScores;
      result.isSubmitted = true; // FINAL SUBMIT
      if (mock?.instituteId) {
        result.instituteId = mock.instituteId;
      }
      await result.save();
    } else {
      result = await Result.create({
        userId,
        mockId,
        score,
        total: totalExamMarks,
        answers: finalAnswers,
        subjectStats,
        sectionScores,
        isSubmitted: true,
        instituteId: mock?.instituteId || null,
      });
    }

    return res.status(201).json({
      resultId: result._id,
      score,
      total: totalExamMarks,
      subjectStats,
      sectionScores,
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

    const mock = await Mock.findById(mockId);

    let result = await Result.findOne({ userId, mockId });

    if (result && result.isSubmitted) {
      return res.status(409).json({ message: "Cannot save, test already submitted" });
    }

    if (result) {
      // Merge new answers
      result.answers = { ...result.answers, ...answers };
      if (mock?.instituteId) {
        result.instituteId = mock.instituteId;
      }
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
        instituteId: mock?.instituteId || null,
      });
    }

    res.status(200).json({ message: "Progress saved", savedCount: Object.keys(result.answers).length });

  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
    res.status(500).json({ message: "Save failed" });
  }
};

