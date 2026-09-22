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
        duration: {
            type: Number, // in minutes
            default: 180,
        },
        totalQuestions: {
            type: Number,
            default: 200,
        },
        totalMarks: {
            type: Number,
            default: 200,
        },
        marking: {
            correct: { type: Number, default: 1 },
            incorrect: { type: Number, default: 0.25 },
        },
        sections: {
            type: [
                {
                    id: { type: String, required: true },
                    name: { type: String, required: true },
                    questionCount: { type: Number },
                },
            ],
            default: () => [
                { id: "A", name: "Section A" },
                { id: "B", name: "Section B" },
            ],
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
        isInstituteCustom: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { _id: false, timestamps: true } // _id is explicitly defined above
);

export default mongoose.model("Mock", mockSchema);
