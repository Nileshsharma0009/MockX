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

// OTP
authRouter.post("/resend-otp", resendOTP);
authRouter.post("/verify-otp", verifyOTP);

// USER
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});

// 🔴 DEBUG ROUTE (TEMP – VERY IMPORTANT)
authRouter.get("/__test", (req, res) => {
  res.json({ ok: true, route: "auth" });
});

export default authRouter;
