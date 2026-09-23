import axios from 'axios';

import { API_URL } from "../api/apiBase.js";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export default api;
