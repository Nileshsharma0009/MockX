import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";

const PRICE_MAP = {
  imucet: 2,        // test price
  "mht-cet": 149,
};

/* ---------------- RAZORPAY INSTANCE ---------------- */
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys missing");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/* ---------------- CREATE ORDER ---------------- */
export const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { examId } = req.body;
    const user = req.user;

    if (!examId || typeof examId !== "string") {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    if (!(examId in PRICE_MAP)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    if (user.purchasedExams.includes(examId)) {
      return res.status(400).json({ message: "Already purchased" });
    }

    const razorpay = getRazorpayInstance();
    const amount = Math.round(PRICE_MAP[examId] * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${examId}_${user._id}`,
      notes: {
        examId,
        userId: user._id.toString(),
      },
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error("Create order error:", err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

/* ---------------- WEBHOOK ---------------- */
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Webhook secret missing");

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const { examId, userId } = payment.notes || {};

      if (examId && userId) {
        const user = await User.findById(userId);
        if (user && !user.purchasedExams.includes(examId)) {
          user.purchasedExams.push(examId);
          await user.save();
        }
      }
    }

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).send("Webhook processing failed");
  }
};
