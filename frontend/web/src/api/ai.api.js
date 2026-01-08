// src/api/ai.api.js

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

export async function analyzeWithAI({ question, resultData }) {
  const res = await fetch(`${API_BASE}/api/ai/analyze`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, resultData }),
  });

  if (!res.ok) {
    throw new Error("we are working ,will activate this soon"); // ai analysis failed
  }

  return res.json(); // { analysis: "..." }
}
