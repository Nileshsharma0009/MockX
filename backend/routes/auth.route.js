import express from "express";
import { signup, login, logout, getMe,register } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js"; 
import {
  verifyOTP,
  resendOTP,
} from "../controllers/otp.controller.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/register", register);
authRouter.post("/verify-otp", verifyOTP);
authRouter.post("/resend-otp", resendOTP);

// 🔐 get logged-in user
authRouter.get("/me", protect, getMe);

export default authRouter;
