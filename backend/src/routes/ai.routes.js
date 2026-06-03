// src/routes/ai.routes.js
import express from "express";
import { analyzeAI } from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/analyze",  analyzeAI);

export default router;
