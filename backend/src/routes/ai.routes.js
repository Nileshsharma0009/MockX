// src/routes/ai.routes.js
import express from "express";
import { analyzeAI, chatWithRag } from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/analyze",  analyzeAI);
router.post("/chat", protect, chatWithRag);

export default router;
