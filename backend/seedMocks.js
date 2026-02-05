
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Mock from "./src/models/mock.model.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const mocks = [
    {
        _id: "imu1",
        title: "Mock Test 1",
        description: "Full syllabus coverage | 180 minutes | 200 questions",
        exam: "imucet",
        isFree: true,
    },
    {
        _id: "imu2",
        title: "Mock Test 2",
        description: "Full syllabus coverage | 180 minutes | 200 questions",
        exam: "imucet",
        isFree: false,
    },
    {
        _id: "imu3",
        title: "Mock Test 3",
        exam: "imucet",
        isFree: false,
    },
    {
        _id: "imu4",
        title: "Mock Test 4",
        exam: "imucet",
        isFree: false,
    },
    {
        _id: "imu5",
        title: "Mock Test 5",
        exam: "imucet",
        isFree: false,
    },
    {
        _id: "imu6",
        title: "Mock Test 6",
        exam: "imucet",
        isFree: false,
    },
];

const seed = async () => {
    try {
        console.log("Connecting to DB...", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected. Seeding mocks...");

        for (const m of mocks) {
            await Mock.findByIdAndUpdate(m._id, m, { upsert: true, new: true });
            console.log(`✅ Seeded: ${m.title}`);
        }

        console.log("🎉 Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seed();
