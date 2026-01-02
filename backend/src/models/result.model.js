import mongoose from "mongoose";

const Result = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    mockId: { type: String, required: true, index: true },

    score: { type: Number, required: true },
    total: { type: Number, required: true },

    sectionScores: {
      A: { type: Number, default: 0 },
      B: { type: Number, default: 0 },
    },

    percentile: { type: Number },   // calculated later

    answers: { type: Object, required: true },

    isBest: { type: Boolean, default: false }, // 🔑 KEY
  },
  { timestamps: true }
);
export default mongoose.model("Result", Result);