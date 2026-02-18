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
      enum: ["A", "B"],
      required: true,
    },

    subject: {
      type: String,
      enum: ["apt", "eng", "gk", "phy", "chem", "math"],
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
      validate: v => v.length === 4,
    },

    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
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
  },
  { timestamps: true }
);

export default mongoose.model("Question", Question);
