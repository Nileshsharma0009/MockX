import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Question from "../models/question.model.js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function buildAnswerMap(filePath) {
  const answerJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return answerJson;
}

function flattenQuestions(rawSectionData, answerMap) {
  const rows = [];

  function pushItem(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const correctOption = answerMap[item.id];

    if (correctOption === undefined) {
      console.warn(`⚠️ Missing answer for ${item.id}`);
    }

    rows.push({
      questionCode: item.id,
      mockId: item.mockId,
      section: item.section,
      subject: item.subject,
      question: item.question,
      options: item.options,
      correctOption,
      marks: item.marks || 1,
      negativeMarks: 0,
      isActive: true,
    });
  }

  for (const subjectKey of Object.keys(rawSectionData)) {
    const items = rawSectionData[subjectKey];

    if (!Array.isArray(items)) {
      continue;
    }

    for (const item of items) {
      if (Array.isArray(item)) {
        for (const nested of item) pushItem(nested);
      } else {
        pushItem(item);
      }
    }
  }

  return rows;
}

async function seed() {
  if (!process.env.MONGODB_URL) {
    throw new Error("Missing MONGODB_URL in .env");
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const mockFile = path.resolve(process.cwd(), "../frontend/web/public/imu4.json");
  const answerFile = path.resolve(process.cwd(), "../frontend/web/public/answers/imu4-answers.json");

  const raw = JSON.parse(fs.readFileSync(mockFile, "utf-8"));
  const answerMap = buildAnswerMap(answerFile);

  const allQuestions = [];

  for (const sectionKey of Object.keys(raw)) {
    const sectionData = raw[sectionKey];
    allQuestions.push(...flattenQuestions(sectionData, answerMap));
  }

  const mockId = allQuestions[0]?.mockId || "imu4";
  await Question.deleteMany({ mockId });
  await Question.insertMany(allQuestions);

  console.log(`✅ Seeded ${allQuestions.length} questions from imu4.json`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
