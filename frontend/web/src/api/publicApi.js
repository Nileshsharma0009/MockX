import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

const publicApi = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default publicApi;
