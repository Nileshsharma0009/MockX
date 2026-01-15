import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* ---------- BASIC INFO ---------- */
    name: {
      type: String,
      required: true,
      trim: true,
      
    },

    age: Number,
    phone: String,
    state: String,
    exam: String,
    imucetOption: String,

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* ---------- ROLE (ADMIN / USER) ---------- */
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ---------- PAYMENT ACCESS ---------- */
    hasPaid: {
      type: Boolean,
      default: false,
    },

    /* ---------- EMAIL VERIFICATION ---------- */
   

    verificationToken: {
      type: String,
      default: null,
    },

    /* ---------- OPTIONAL (FUTURE) ---------- */
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    otp: String,
    otpExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },

    purchasedExams: {
  type: [String], // ["imucet", "mht-cet"]
  default: [],
},

  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
