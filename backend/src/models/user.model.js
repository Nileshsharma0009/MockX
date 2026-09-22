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

    /* ---------- ROLE (ADMIN / USER / INSTITUTE) ---------- */
    role: {
      type: String,
      enum: ["user", "admin", "SUPER_ADMIN", "INSTITUTE_ADMIN", "STUDENT"],
      default: "user",
    },

    /* ---------- INSTITUTE ISOLATION ---------- */
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    batch: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    studentRollNo: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
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
