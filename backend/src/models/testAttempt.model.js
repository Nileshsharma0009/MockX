import mongoose from "mongoose";

const testAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mockId: {
      type: String,
      required: true,
    },
    score: Number,
    total: Number,
    percentage: Number,
    details: Object, // question-wise breakdown
  },
  { timestamps: true }
);

export default mongoose.model("TestAttempt", testAttemptSchema);
