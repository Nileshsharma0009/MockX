import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    // Razorpay order ID
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Razorpay payment ID (null until paid/failed with transaction reference)
    paymentId: {
      type: String,
      default: null,
      index: true,
    },

    // Who is purchasing
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // What exam/mock bundle is purchased
    mockId: {
      type: String,
      required: true,
      index: true,
    },

    // Payment amount (in main currency unit, i.e., Rupees)
    amount: {
      type: Number,
      required: true,
    },

    // Transaction status
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },

    // Detailed failure information for the AI recovery agent
    failureDetails: {
      code: { type: String, default: null },
      description: { type: String, default: null },
      source: { type: String, default: null },
      step: { type: String, default: null },
      reason: { type: String, default: null },
      metadata: { type: mongoose.Schema.Types.Mixed, default: null }
    },

    // Recovery tracking for the AI Revenue Recovery Agent
    recovery: {
      status: {
        type: String,
        enum: [
          "NOT_STARTED",
          "ANALYZING",
          "CONTACTED",
          "RETRY_REQUESTED",
          "REMIND_LATER",
          "NOT_INTERESTED",
          "RECOVERED",
          "STOPPED",
        ],
        default: "NOT_STARTED",
        index: true,
      },
      attempts: { type: Number, default: 0 },
      lastAction: { type: String, default: null },
      lastActionAt: { type: Date, default: null },
    }
  },
  {
    timestamps: true, // Stores createdAt and updatedAt automatically
  }
);

const PaymentTransaction = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);

export default PaymentTransaction;