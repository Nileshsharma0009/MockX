import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://mockx-backend.vercel.app';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
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
