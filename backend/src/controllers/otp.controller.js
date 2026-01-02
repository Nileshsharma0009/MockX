import User from "../models/user.model.js";
import EmailOTP from "../models/emailOtp.model.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { generateOTP, hashOTP } from "../utils/otp.js";

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
];

const BLOCKED_EMAIL_DOMAINS = [
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
];

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const domain = email.split("@")[1]?.toLowerCase();

    if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
      return res.status(400).json({
        message: "Temporary email addresses are not allowed",
      });
    }

    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return res.status(400).json({
        message: "Please use Gmail, Yahoo, Outlook, or iCloud email",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered. Please login.",
      });
    }

    const otp = generateOTP();

    await EmailOTP.findOneAndUpdate(
      { email },
      {
        otp: hashOTP(otp),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
      },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent to your email",
    });

  } catch (error) {
    console.error("RESEND OTP ERROR:", error);
    return res.status(500).json({
      message: "Failed to send OTP. Please try again.",
    });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const record = await EmailOTP.findOne({ email });

  if (!record) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.attempts >= 3) {
    return res.status(429).json({
      message: "Too many attempts. Please resend OTP.",
    });
  }

  if (record.otp !== hashOTP(otp)) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await EmailOTP.deleteOne({ email });

  return res.status(200).json({
    message: "Email verified successfully",
  });
};
