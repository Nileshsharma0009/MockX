import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (src/seed/../../.env)
dotenv.config({ path: join(__dirname, "../../.env") });

import fs from "fs";
import path from "path";
import connectDB from "../config/db.js";
import Question from "../models/question.model.js";
import { mocks } from "./mocks.config.js";

// ---------- helper ----------
const loadJSON = (filePath) => {
  // Resolve path relative to THIS file (src/seed/index.js)
  // ../../../ goes from src/seed -> src -> backend -> MockX root
  const absolutePath = path.resolve(__dirname, filePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
};

// ---------- main seeder ----------
const seed = async () => {
  try {
    await connectDB();

    for (const mock of mocks) {
      console.log(`⏳ Seeding ${mock.mockId}...`);

      // 1️⃣ Load raw grouped questions
      const rawQuestions = loadJSON(mock.questionsFile);

      /**
       * rawQuestions structure:
       * {
       *   A: { english: [...], gk: [...], aptitude: [...] },
       *   B: { physics: [...], chemistry: [...], maths: [...] }
       * }
       */

      // 2️⃣ Deep flatten → final questions array
      const questions = Object.values(rawQuestions) // A, B
        .flatMap((section) =>
          Object.values(section) // english, gk, aptitude...
            .flat(Infinity)
        );

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error(`❌ No questions found for ${mock.mockId}`);
      }

      // 3️⃣ Load answers
      const answers = loadJSON(mock.answersFile);

      // 4️⃣ Merge questions + answers
      const prepared = questions.map((q) => {
        if (!q.id) {
          throw new Error(`❌ Question missing id in ${mock.mockId}`);
        }

        if (answers[q.id] === undefined || answers[q.id] === null) {
          throw new Error(`❌ Missing or null answer for ${q.id}`);
        }

        return {
          questionCode: q.id,
          mockId: q.mockId,
          section: q.section,
          subject: q.subject,
          question: q.question,
          options: q.options,
          correctOption: answers[q.id],
          marks: q.marks || 1,
          imageUrl: q.imageUrl || null,
          paragraph: q.paragraph || null,
        };
      });

      // 5️⃣ Safe re-run (delete only this mock)
      await Question.deleteMany({ mockId: mock.mockId });
      await Question.insertMany(prepared);

      console.log(
        `✅ ${mock.mockId} seeded successfully (${prepared.length} questions)`
      );
    }

    console.log("🎉 ALL MOCKS SEEDED SUCCESSFULLY");
    process.exit(0);
  } catch (err) {
    console.error("❌ SEEDING FAILED");
    console.error(err.message || err);
    process.exit(1);
  }
};

seed();
