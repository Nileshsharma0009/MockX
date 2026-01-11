import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  createOrder,
  razorpayWebhook,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);

// ❗ webhook has NO auth middleware
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;
