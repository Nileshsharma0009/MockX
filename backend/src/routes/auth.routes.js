import express from "express";
import { signup, login, logout, getMe, register, getAllUsers } from "../controllers/auth.controller.js";

import protect from "../middleware/auth.middleware.js";
import { loginRateLimit, signupRateLimit } from "../middleware/authRateLimit.middleware.js";

const authRouter = express.Router();

/* AUTH */
authRouter.post("/signup", signupRateLimit, signup);
authRouter.post("/login", loginRateLimit, login);
authRouter.post("/logout", logout);
authRouter.post("/register", signupRateLimit, register);

/* OTP */


/* USER */
authRouter.get("/me", protect, getMe);
authRouter.get("/users", protect, getAllUsers);

/* DEBUG */
authRouter.get("/__test", (req, res) => {
  res.json({ ok: true, route: "auth" });
});

export default authRouter;
