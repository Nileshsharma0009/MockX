import api from "./api";

export const createOrder = ({ examId }) => {
  return api.post("/payments/create-order", { examId });
};
