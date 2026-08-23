import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  fetchRecoveryMetrics,
  fetchRecoveryAuditLogs,
  handleCustomerAction,
  runCopilotChat
} from "../controllers/paymentRecovery.controller.js";

const router = express.Router();

// User action callback (requires authentication)
router.post("/action", protect, handleCustomerAction);

// Admin recovery platform routes
router.get("/metrics", protect, fetchRecoveryMetrics);
router.get("/audit-logs", protect, fetchRecoveryAuditLogs);
router.post("/copilot", protect, runCopilotChat);

export default router;
