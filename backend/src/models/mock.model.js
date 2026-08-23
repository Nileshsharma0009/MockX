import mongoose from "mongoose";

const mockSchema = new mongoose.Schema(
    {
        _id: {
            type: String, // "1", "imu1", etc.
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "Full syllabus coverage | 180 minutes | 200 questions",
        },
        releaseDate: {
            type: String,
            default: () => new Date().toISOString(),
        },
        exam: {
            type: String,
            required: true, // "imucet", "mht-cet", etc.
        },
        isFree: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false, timestamps: true } // _id is explicitly defined above
);

export default mongoose.model("Mock", mockSchema);
