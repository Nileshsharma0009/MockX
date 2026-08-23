import api from "./api";

export const createOrder = ({ examId }) => {
  return api.post("/payments/create-order", { examId });
};

export const verifyPayment = (details) => {
  return api.post("/payments/verify", details);
};

export const reportPaymentFailure = (details) => {
  return api.post("/payments/failure", details);
};

export const fetchPrices = () => {
  return api.get("/payments/prices");
};

export const fetchTransactions = () => {
  return api.get("/payments/transactions");
};
