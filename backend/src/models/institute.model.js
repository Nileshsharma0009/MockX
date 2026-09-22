import mongoose from "mongoose";

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institute name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Institute code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Institute email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Institute = mongoose.model("Institute", instituteSchema);

export default Institute;
