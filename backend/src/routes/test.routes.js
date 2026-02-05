import express from "express";
import protect from "../middleware/auth.middleware.js";
import { submitTest, saveProgress } from "../controllers/test.controller.js";

const router = express.Router();

router.post("/submit", protect, submitTest);
router.post("/save", protect, saveProgress);

export default router;
