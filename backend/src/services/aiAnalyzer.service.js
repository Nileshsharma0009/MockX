import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeExam(resultJSON, examConfig) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an expert ${resultJSON.exam} exam mentor.

Exam pattern:
${JSON.stringify(examConfig, null, 2)}

Student result data:
${JSON.stringify(resultJSON, null, 2)}

Tasks:
1. Subject-wise analysis
2. Weak areas
3. Time management issues
4. 5 actionable improvement steps
5. Priority subject

Rules:
- Do NOT recalculate marks
- No motivational fluff
- Be exam-focused
`;

  const res = await model.generateContent(prompt);
  return res.response.text();
}
