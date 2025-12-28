import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Question from "../model/question.model.js";
import dotenv from "dotenv";

dotenv.config();

const __dirname = new URL(".", import.meta.url).pathname;

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);

  const mocksDir = path.join(__dirname, "../../frontend/public");

  const files = fs
    .readdirSync(mocksDir)
    .filter((f) => f.startsWith("imu") && f.endsWith(".json"));

  for (const file of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(mocksDir, file), "utf-8")
    );

    await Question.insertMany(
      data.map((q) => ({
        questionId: q.id,
        mockId: q.mockId,
        section: q.section,
        subject: q.subject,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption, // 🔐 STORED HERE
        marks: q.marks || 1,
      }))
    );

    console.log(`Seeded ${file}`);
  }

  console.log("✅ All questions seeded");
  process.exit();
}

seed();
