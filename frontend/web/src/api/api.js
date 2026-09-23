import axios from "axios";

import { API_URL } from "./apiBase.js";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // required for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchMockQuestions = (mockId) =>
  api.get(`/mocks/${mockId}/questions`);

export const submitAttempt = (data) =>
  api.post(`/tests/submit`, data);

export const saveProgress = (data) =>
  api.post(`/tests/save`, data);

export default api;
