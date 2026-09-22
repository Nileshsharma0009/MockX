import mongoose from "mongoose";

const testAssignmentSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },
    mockId: {
      type: String,
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignToType: {
      type: String,
      enum: ["ALL", "BATCH", "STUDENTS"],
      required: true,
      default: "ALL",
    },
    batch: {
      type: String,
      default: null,
      index: true,
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    availableFrom: {
      type: Date,
      default: null,
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "ARCHIVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

testAssignmentSchema.index({ instituteId: 1, mockId: 1, status: 1 });

const TestAssignment = mongoose.model("TestAssignment", testAssignmentSchema);

export default TestAssignment;
