// src/controllers/ai.controller.js
import { runGemini } from "../services/gemini.service.js";
import { examConfig } from "../config/examConfig.js";

export const analyzeAI = async (req, res) => {


  console.log("=== AI HIT ===");
  console.log("BODY:", JSON.stringify(req.body, null, 2));

  try {
    const { question, resultData } = req.body;

    console.log("QUESTION:", question);
    console.log("RESULT DATA:", resultData);


    if (!question || !resultData) {
      return res.status(400).json({ message: "Missing question or result data" });
    }

    const examCode =
      resultData.examCode ||
      (resultData.mockId?.startsWith("imu") ? "IMUCET" : null);

    const exam = examConfig[examCode];

    console.log("EXAM CODE:", examCode);

    if (!exam) {
      return res.status(400).json({ message: "Unsupported exam" });
    }

    /* 🔑 BUILD PROMPT */
    /* 🔑 BUILD PROMPT */
    const historyData = req.body.resultData.history || [];

    const prompt = `
You are a strict, data-driven entrance-exam instructor. Your ONLY job is to analyze mock-test performance and give evidence-based conclusions. 
You must NEVER motivate, praise, console, or speak casually. 
Every response must follow this EXACT fixed structure:

1. **Overall Performance Summary**: Brief summary using accuracy, attempts, marks, and benchmarks.
2. **Subject-wise Diagnosis**: Specific analysis of each subject.
3. **Pattern Detection**: Analyze repeated errors across the provided ${historyData.length} previous mocks (if available) and the current one.
4. **Mistake Classification**: classify errors (conceptual, calculation, guessing, time-pressure, reading).
5. **Strategy Analysis**: Comment on time management and attempt strategy (e.g., risky attempter vs safe player).
6. **Next 14-Day Action Plan**: A short, ranked priority list of tasks.

**Strict Rules:**
- Speak in a calm, precise, teacher-like tone.
- Reference ONLY distinct computed data provided below. NEVER make assumptions.
- Compare results against standard exam-safe thresholds (e.g., >85% accuracy is safe).
- Label student behavior ONLY when supported by metrics.
- IF data is insufficient for a specific section (like specific chapter names), clearly state "Data insufficient for chapter-level analysis" and focus on Subject-level patterns.
- Do NOT repeat yourself. Avoid fluff.
- ensure every sentence answers "what is happening, why, and what to do next".

**Context Data:**
Exam: ${exam.name}
Current Mock Data: ${JSON.stringify(resultData, null, 2)}
Previous History (Oldest to Newest): ${JSON.stringify(historyData, null, 2)}
User Question: "${question}"
`;

    const analysis = await runGemini(prompt);

    res.json({ analysis });
  } catch (err) {
    console.error("AI ANALYSIS ERROR:", err);
    res.status(500).json({ message: " on maintenance" });
  }
};
