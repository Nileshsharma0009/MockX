
import User from "../models/user.model.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { generateOTP, hashOTP } from "../utils/otp.js";

import EmailOTP from "../models/emailOtp.model.js";


/* temp mail validator  */  
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
  // Temp mail services
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "getnada.com",
  "dispostable.com",
  "fakeinbox.com",
  "mintemail.com",
  "maildrop.cc",
  "moakt.com",
  "sharklasers.com",
  "spamgourmet.com",
  "emailondeck.com",
  "anonaddy.com",
  "simplelogin.com",

  // Random inbox services
  "inboxbear.com",
  "tempmailo.com",
  "tempmail.plus",
  "temp-mail.io",
  "burnermail.io",
  "mailnesia.com",
  "mailcatch.com"
];


/* ================= RESEND OTP ================= */
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  const domain = email.split("@")[1]?.toLowerCase();

  // ❌ Block temp emails
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
    return res.status(400).json({
      message: "Temporary email addresses are not allowed"
    });
  }

 /* temp mail validator  */  
  
  // ❌ Allow only trusted providers
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return res.status(400).json({
      message: "Please use Gmail, Yahoo, Outlook, or iCloud email"
    });
  } 


  

  // ❌ Already registered users cannot request OTP
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "This email is already registered. Please login."
    });
  }

  // 🔁 Generate OTP
  const otp = generateOTP();

  await EmailOTP.findOneAndUpdate(
    { email },
    {
      otp: hashOTP(otp),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    },
    { upsert: true, new: true }
  );

  await sendOTPEmail(email, otp);

  res.json({ message: "OTP sent to your email" });
};

// export const resendOTP = async (req, res) => {
//   const { email } = req.body;

//   const now = Date.now();
//   const existing = await EmailOTP.findOne({ email });

//   // ⏱ Cooldown check (60s)
//   if (existing && now - existing.lastSentAt < 60 * 1000) {
//     const remaining = Math.ceil(
//       (60 * 1000 - (now - existing.lastSentAt)) / 1000
//     );
//     return res
//       .status(429)
//       .json({ message: `Please wait ${remaining}s before resending OTP` });
//   }

//   const otp = generateOTP();

//   await EmailOTP.findOneAndUpdate(
//     { email },
//     {
//       otp: hashOTP(otp),
//       expiresAt: now + 10 * 60 * 1000,
//       lastSentAt: now,
//       attempts: 0,
//     },
//     { upsert: true }
//   );

//   await sendOTPEmail(email, otp);

//   res.json({ message: "OTP sent successfully" });
// };




/* ================= VERIFY OTP ================= */

//   const { email, otp } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) {
//     return res.status(400).json({ message: "User not found" });
//   }

//   const hashedOTP = crypto
//     .createHash("sha256")
//     .update(otp)
//     .digest("hex");

//   if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
//     return res.status(400).json({ message: "Invalid or expired OTP" });
//   }

//   user.isVerified = true;
//   user.otp = undefined;
//   user.otpExpires = undefined;
//   await user.save();

//   res.json({ message: "Email verified successfully" });
// };

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const record = await EmailOTP.findOne({ email });

  if (!record)
    return res.status(400).json({ message: "OTP not found" });

  if (record.expiresAt < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  if (record.attempts >= 3)
    return res
      .status(429)
      .json({ message: "Too many attempts. Please resend OTP." });

  if (record.otp !== hashOTP(otp)) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ Success
  await EmailOTP.deleteOne({ email });

  res.json({ message: "Email verified successfully" });
};
