const configuredApiBase = import.meta.env.VITE_API_BASE?.trim().replace(/\/+$/, "");

if (import.meta.env.PROD && !configuredApiBase) {
  throw new Error("VITE_API_BASE must be set to the deployed backend URL for production builds.");
}

// The Express server defaults to port 10000 when PORT is not supplied.
export const API_BASE = configuredApiBase || "http://localhost:10000";
export const API_URL = `${API_BASE}/api`;