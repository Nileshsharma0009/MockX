import api from "./api";

export const postRecoveryAction = ({ transactionId, action }) => {
  return api.post("/payment-recovery/action", { transactionId, action });
};

export const fetchRecoveryMetrics = () => {
  return api.get("/payment-recovery/metrics");
};

export const fetchRecoveryAuditLogs = () => {
  return api.get("/payment-recovery/audit-logs");
};

export const postCopilotQuery = ({ query, history }) => {
  return api.post("/payment-recovery/copilot", { query, history });
};
