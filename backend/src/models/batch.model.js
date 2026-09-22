import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

batchSchema.index({ instituteId: 1, name: 1 }, { unique: true });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
