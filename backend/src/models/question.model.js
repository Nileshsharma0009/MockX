import mongoose from "mongoose";

const Question = new mongoose.Schema(
  {
    questionCode: {
      type: String,
      required: true,
      unique: true,
    },

    mockId: {
      type: String,
      required: true,
      index: true,
    },

    section: {
      type: String,
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
      validate: v => Array.isArray(v) && v.length >= 2,
    },

    correctOption: {
      type: Number,
      required: true,
      min: 0,
      select: false,
    },

    marks: {
      type: Number,
      default: 1,
    },

    negativeMarks: {
      type: Number,
      default: 0,
    },

    paragraph: String,
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },

    /* ---------- INSTITUTE ISOLATION ---------- */
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", Question);
