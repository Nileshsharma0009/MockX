import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    // 🔐 user reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🧪 mock identifier
    mockId: {
      type: String,
      required: true,
      index: true,
    },

    // 🧮 overall marks
    score: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    // 🧩 section-wise (already used by you)
    sectionScores: {
      A: { type: Number, default: 0 },
      B: { type: Number, default: 0 },
    },

    // 📊 SUBJECT-WISE STATS (🔥 NEW – IMPORTANT)
    subjectStats: {
      math: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      phy: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      chem: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      eng: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      gk: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      apt: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
    },

    // 📝 raw answers (already used)
    answers: {
      type: Object,
      required: true,
    },

    // ⭐ future use
    percentile: {
      type: Number,
    },

    isBest: {
      type: Boolean,
      default: false,
    },

    isSubmitted: {
      type: Boolean,
      default: true, // Default true for backward compatibility
    },
  },
  { timestamps: true }
);

export default mongoose.model("Result", ResultSchema);
