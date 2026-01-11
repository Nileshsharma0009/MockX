export const isPaymentEnabled = () => {
  return process.env.PAYMENTS_ENABLED === "true";
};
