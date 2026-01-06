import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  getMyResults,
  getResultById,
} from "../controllers/result.controller.js";

const router = express.Router();

/**
 * 🔐 Logged-in user's result history
 * GET /api/results/my
 */
router.get("/my", protect, getMyResults);

/**
 * 🌍 Public / shareable result page
 * GET /api/results/public/:resultId
 */
router.get("/public/:resultId", getResultById);

/**
 * 🔐 Private single result (owner only)
 * GET /api/results/:resultId
 */
router.get("/:resultId", protect, getResultById);

export default router;
