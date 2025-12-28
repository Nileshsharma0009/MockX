import api from "./api";

// signup
export const signupUser = (data) => {
  return api.post("/auth/signup", data); // ✅ FIXED
};

// login
export const loginUser = (data) => {
  return api.post("/auth/login", data); // ✅ already correct
};

// logout
export const logoutUser = () => {
  return api.post("/auth/logout"); // ✅ FIXED
};

// get current user
export const getMe = () => {
  return api.get("/auth/me"); // ✅ FIXED
};
