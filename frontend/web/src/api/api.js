import axios from "axios";

const api = axios.create({
  baseURL: process.env.SERVER_URL || "http://localhost:5000/api",
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
