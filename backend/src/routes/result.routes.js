import express from "express";
import protect from "../middleware/auth.middleware.js";
import { getBestResult } from "../controllers/result.controller.js";

const router = express.Router();

router.get("/:mockId/best", protect, getBestResult);

export default router;
