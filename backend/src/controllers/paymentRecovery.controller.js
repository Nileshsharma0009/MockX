import PaymentTransaction from "../models/paymentTransaction.model.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";
import { getRecoveryMetrics } from "../ai/dbTools.js";
import { runMerchantCopilot } from "../ai/merchantCopilot.js";
import { emitToAll } from "../services/socketService.js";
import mongoose from "mongoose";

/* ---------------- GET RECOVERY METRICS (ADMIN ONLY) ---------------- */
export const fetchRecoveryMetrics = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const metrics = await getRecoveryMetrics();
    return res.status(200).json(metrics);
  } catch (err) {
    console.error("fetchRecoveryMetrics error:", err);
    return res.status(500).json({ message: "Failed to fetch recovery metrics" });
  }
};

/* ---------------- GET AUDIT LOGS (ADMIN ONLY) ---------------- */
export const fetchRecoveryAuditLogs = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const logs = await RecoveryAuditLog.find({ agentName: "RevenueRecoveryAgent" })
      .populate("userId", "name email phone")
      .populate("transactionId", "orderId mockId status amount")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(logs);
  } catch (err) {
    console.error("fetchRecoveryAuditLogs error:", err);
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

/* ---------------- CUSTOMER ACTION RESPONSE (USER ONLY) ---------------- */
export const handleCustomerAction = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { transactionId, action } = req.body;

    if (!transactionId || !["REMIND_LATER", "NOT_INTERESTED"].includes(action)) {
      return res.status(400).json({ message: "Invalid transactionId or action" });
    }

    let txn;
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
      txn = await PaymentTransaction.findById(transactionId);
    }
    
    if (!txn) {
      txn = await PaymentTransaction.findOne({ orderId: transactionId });
    }

    if (!txn) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update transaction recovery state
    txn.recovery.status = action;
    txn.recovery.lastAction = action;
    txn.recovery.lastActionAt = new Date();
    await txn.save();

    // Log the user interaction in audit log
    const auditLog = new RecoveryAuditLog({
      transactionId: txn._id,
      userId: req.user._id,
      agentName: "RevenueRecoveryAgent",
      action: "CUSTOMER_ACTION",
      details: {
        action,
        message: `Customer responded to notification: selected ${action.replace("_", " ")}.`
      }
    });
    await auditLog.save();

    emitToAll("db_changed", { type: "recovery" });

    return res.status(200).json({
      success: true,
      message: `Action ${action} recorded successfully`,
      recovery: txn.recovery
    });
  } catch (err) {
    console.error("handleCustomerAction error:", err);
    return res.status(500).json({ message: "Failed to record customer action" });
  }
};

/* ---------------- RUN MERCHANT COPILOT CHAT (ADMIN ONLY) ---------------- */
export const runCopilotChat = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { query, history } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const response = await runMerchantCopilot(query, history || [], req.user._id);
    return res.status(200).json({ success: true, response });
  } catch (err) {
    console.error("runCopilotChat error:", err);
    return res.status(500).json({ message: "Failed to run Copilot Chat" });
  }
};
