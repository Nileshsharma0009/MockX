import express from "express";
import protect from "../middleware/auth.middleware.js";
import { submitTest } from "../controllers/test.controller.js";

const router = express.Router();

router.post("/submit", protect, submitTest);

export default router;
