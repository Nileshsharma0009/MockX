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

    // 🧩 section-wise scores (dynamic: { [sectionId]: score })
    sectionScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 📊 Subject-wise stats (dynamic: { [subjectKey]: { attempted, correct, wrong, accuracy } })
    subjectStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

    /* ---------- INSTITUTE ISOLATION ---------- */
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestAssignment",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Result", ResultSchema);
