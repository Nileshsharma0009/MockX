import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  createOrder,
  verifyPayment,
  reportPaymentFailure,
  razorpayWebhook,
  getPrices,
  getAllTransactions,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/prices", getPrices);
router.get("/transactions", protect, getAllTransactions);

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/failure", protect, reportPaymentFailure);

// ❗ webhook has NO auth middleware
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);

export default router;
