import axios from "axios";



const API_BASE = import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});




export const fetchMockQuestions = (mockId) =>
  api.get(`/mocks/${mockId}/questions`);

export const submitAttempt = (data) =>
  api.post(`/tests/submit`, data); // ✅ FIXED (was /attempts)

export default api;
