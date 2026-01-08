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
    const prompt = `
You are an expert ${exam.name} exam mentor.

Exam structure:
${JSON.stringify(exam, null, 2)}

Student performance data:
${JSON.stringify(resultData, null, 2)}

User question:
"${question}"

Instructions:
- Analyze strictly based on given data
- Identify weak subjects clearly
- Give exam-oriented advice
- Suggest what to improve before next mock
- NO motivational fluff
- NO recalculating marks
- Keep response structured and concise
`;

    const analysis = await runGemini(prompt);

    res.json({ analysis });
  } catch (err) {
    console.error("AI ANALYSIS ERROR:", err);
    res.status(500).json({ message: " on maintenance" });
  }
};
