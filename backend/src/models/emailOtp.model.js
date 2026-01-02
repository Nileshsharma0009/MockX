import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("EmailOTP", emailOtpSchema);
