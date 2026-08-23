import mongoose from "mongoose";

const recoveryAuditLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    agentName: {
      type: String,
      required: true,
      enum: ["RevenueRecoveryAgent", "MerchantCopilot"],
    },
    action: {
      type: String,
      required: true, // "TRIGGER", "TOOL_CALL", "DECISION", "NOTIFICATION_SENT", "CUSTOMER_ACTION", "PAYMENT_SUCCESS", "STOPPED", "ESCALATED"
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const RecoveryAuditLog = mongoose.model(
  "RecoveryAuditLog",
  recoveryAuditLogSchema
);

export default RecoveryAuditLog;
