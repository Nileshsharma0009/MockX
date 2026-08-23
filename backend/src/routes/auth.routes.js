import express from "express";
import { signup, login, logout, getMe, register, getAllUsers } from "../controllers/auth.controller.js";

import protect from "../middleware/auth.middleware.js";

const authRouter = express.Router();

/* AUTH */
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/register", register);

/* OTP */


/* USER */
authRouter.get("/me", protect, getMe);
authRouter.get("/users", protect, getAllUsers);

/* DEBUG */
authRouter.get("/__test", (req, res) => {
  res.json({ ok: true, route: "auth" });
});

export default authRouter;
