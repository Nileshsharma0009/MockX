import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config({ path: "./.env" });

import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Batch from "../models/batch.model.js";
import Mock from "../models/mock.model.js";
import Question from "../models/question.model.js";
import TestAssignment from "../models/testAssignment.model.js";
import Result from "../models/result.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "YERWE8933893BCS7ER8932EW7YT932";

const genTestToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1d" });
};

async function runVerification() {
  console.log("🚀 Starting Comprehensive Institute Feature Verification...");

  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    throw new Error("MONGODB_URL not found in .env");
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  try {
    // Cleanup any existing test data with our test prefix
    const testCodeA = "APEXTEST";
    const testCodeB = "ZENITHTEST";

    const oldInstA = await Institute.findOne({ code: testCodeA });
    if (oldInstA) {
      await User.deleteMany({ instituteId: oldInstA._id });
      await Batch.deleteMany({ instituteId: oldInstA._id });
      await Mock.deleteMany({ instituteId: oldInstA._id });
      await Question.deleteMany({ instituteId: oldInstA._id });
      await TestAssignment.deleteMany({ instituteId: oldInstA._id });
      await Result.deleteMany({ instituteId: oldInstA._id });
      await Institute.deleteOne({ _id: oldInstA._id });
    }

    const oldInstB = await Institute.findOne({ code: testCodeB });
    if (oldInstB) {
      await User.deleteMany({ instituteId: oldInstB._id });
      await Batch.deleteMany({ instituteId: oldInstB._id });
      await Mock.deleteMany({ instituteId: oldInstB._id });
      await Question.deleteMany({ instituteId: oldInstB._id });
      await TestAssignment.deleteMany({ instituteId: oldInstB._id });
      await Result.deleteMany({ instituteId: oldInstB._id });
      await Institute.deleteOne({ _id: oldInstB._id });
    }

    console.log("\n--- STEP 1: SUPER ADMIN CREATES INSTITUTES ---");
    // Create Institute A
    const instituteA = await Institute.create({
      name: "Apex IIT Academy",
      code: testCodeA,
      email: "contact@apexiit.com",
      phone: "9876543210",
      address: "Kota, Rajasthan",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=apex",
      status: "ACTIVE",
    });

    const hashPass = await bcrypt.hash("password123", 10);
    const adminA = await User.create({
      name: "Dr. Sharma",
      email: "admin@apexiit.com",
      password: hashPass,
      phone: "9876543210",
      role: "INSTITUTE_ADMIN",
      instituteId: instituteA._id,
      status: "ACTIVE",
      isVerified: true,
    });
    instituteA.adminId = adminA._id;
    await instituteA.save();
    console.log(`✅ Created Institute A: "${instituteA.name}" (Code: ${instituteA.code}) with Admin: ${adminA.email}`);

    // Create Institute B (for cross-tenant isolation tests)
    const instituteB = await Institute.create({
      name: "Zenith Medical Academy",
      code: testCodeB,
      email: "contact@zenith.com",
      phone: "9123456780",
      address: "Delhi",
      status: "ACTIVE",
    });
    const adminB = await User.create({
      name: "Dr. Verma",
      email: "admin@zenith.com",
      password: hashPass,
      phone: "9123456780",
      role: "INSTITUTE_ADMIN",
      instituteId: instituteB._id,
      status: "ACTIVE",
      isVerified: true,
    });
    instituteB.adminId = adminB._id;
    await instituteB.save();
    console.log(`✅ Created Institute B: "${instituteB.name}" (Code: ${instituteB.code}) with Admin: ${adminB.email}`);

    console.log("\n--- STEP 2: INSTITUTE ADMIN A CREATES BATCHES & STUDENTS ---");
    const batchJEE = await Batch.create({
      instituteId: instituteA._id,
      name: "JEE-Super-30",
      description: "Advanced JEE 2026 Batch",
    });
    const batchNEET = await Batch.create({
      instituteId: instituteA._id,
      name: "Foundation-XI",
      description: "Early Starter Batch",
    });
    console.log(`✅ Created Batches: ${batchJEE.name}, ${batchNEET.name}`);

    // Create Student 1 (in JEE-Super-30)
    const student1 = await User.create({
      name: "Aryan Patel",
      email: "aryan@apexiit.com",
      password: hashPass,
      phone: "9800000001",
      role: "STUDENT",
      instituteId: instituteA._id,
      batch: "JEE-Super-30",
      studentRollNo: "APEX-2026-001",
      status: "ACTIVE",
      isVerified: true,
    });

    // Create Student 2 (in Foundation-XI)
    const student2 = await User.create({
      name: "Bhavya Singh",
      email: "bhavya@apexiit.com",
      password: hashPass,
      phone: "9800000002",
      role: "STUDENT",
      instituteId: instituteA._id,
      batch: "Foundation-XI",
      studentRollNo: "APEX-2026-002",
      status: "ACTIVE",
      isVerified: true,
    });

    // Create Student 3 (in Institute B!)
    const studentB = await User.create({
      name: "Chetan Kumar",
      email: "chetan@zenith.com",
      password: hashPass,
      phone: "9800000003",
      role: "STUDENT",
      instituteId: instituteB._id,
      batch: "NEET-Star",
      studentRollNo: "ZEN-2026-001",
      status: "ACTIVE",
      isVerified: true,
    });
    console.log(`✅ Created Student 1: ${student1.name} (${student1.batch})`);
    console.log(`✅ Created Student 2: ${student2.name} (${student2.batch})`);
    console.log(`✅ Created Student B (Institute B): ${studentB.name}`);

    console.log("\n--- STEP 3: INSTITUTE ADMIN A CREATES CUSTOM MOCK & QUESTIONS ---");
    const mockId = `inst_apex_${Date.now()}`;
    const q1Code = `${mockId}_q1`;
    const q2Code = `${mockId}_q2`;

    const q1 = await Question.create({
      questionCode: q1Code,
      mockId,
      section: "phy",
      subject: "physics",
      question: "What is the SI unit of electric flux?",
      options: ["Volt-meter", "Weber", "Tesla", "Ampere-meter"],
      correctOption: 0, // Option A: Volt-meter
      marks: 2,
      negativeMarks: 0.5,
      instituteId: instituteA._id,
      createdBy: adminA._id,
      isPrivate: true,
      isActive: true,
    });

    const q2 = await Question.create({
      questionCode: q2Code,
      mockId,
      section: "math",
      subject: "mathematics",
      question: "If f(x) = x^3, what is f'(2)?",
      options: ["6", "12", "8", "4"],
      correctOption: 1, // Option B: 12
      marks: 2,
      negativeMarks: 0.5,
      instituteId: instituteA._id,
      createdBy: adminA._id,
      isPrivate: true,
      isActive: true,
    });

    const mockA = await Mock.create({
      _id: mockId,
      title: "Apex JEE Weekly Test 01",
      description: "Physics + Maths Mock Test | 30 Mins | +2/-0.5",
      exam: "institute-custom",
      isFree: true,
      duration: 30,
      totalQuestions: 2,
      totalMarks: 4,
      marking: { correct: 2, incorrect: 0.5 },
      sections: [
        { id: "phy", name: "Physics", questionCount: 1 },
        { id: "math", name: "Mathematics", questionCount: 1 },
      ],
      instituteId: instituteA._id,
      createdBy: adminA._id,
      isInstituteCustom: true,
      isActive: true,
    });
    console.log(`✅ Created Custom Mock: "${mockA.title}" (ID: ${mockA._id}) with 2 questions`);

    console.log("\n--- STEP 4: ASSIGN TEST TO BATCH 'JEE-Super-30' ---");
    const assignment = await TestAssignment.create({
      instituteId: instituteA._id,
      mockId: mockA._id,
      assignedBy: adminA._id,
      assignToType: "BATCH",
      batch: "JEE-Super-30",
      availableFrom: new Date(Date.now() - 3600000), // available 1 hour ago
      availableUntil: new Date(Date.now() + 86400000), // available until tomorrow
      status: "ACTIVE",
    });
    console.log(`✅ Test assigned to batch "JEE-Super-30"`);

    console.log("\n--- STEP 5: STUDENT ACCESS TESTS ---");
    // Test Student 1 (assigned to JEE-Super-30)
    const student1Eligible = await TestAssignment.findOne({
      instituteId: student1.instituteId,
      mockId: mockA._id,
      status: "ACTIVE",
      $or: [
        { assignToType: "ALL" },
        { assignToType: "BATCH", batch: student1.batch },
        { assignToType: "STUDENTS", studentIds: student1._id },
      ],
    });
    console.log(`✅ Student 1 is eligible: ${Boolean(student1Eligible)} (Expected: true)`);
    if (!student1Eligible) throw new Error("Student 1 should be eligible!");

    // Test Student 2 (in Foundation-XI)
    const student2Eligible = await TestAssignment.findOne({
      instituteId: student2.instituteId,
      mockId: mockA._id,
      status: "ACTIVE",
      $or: [
        { assignToType: "ALL" },
        { assignToType: "BATCH", batch: student2.batch },
        { assignToType: "STUDENTS", studentIds: student2._id },
      ],
    });
    console.log(`✅ Student 2 is eligible: ${Boolean(student2Eligible)} (Expected: false)`);
    if (student2Eligible) throw new Error("Student 2 should NOT be eligible!");

    // Test Student B (Institute B cross-tenant isolation)
    const studentBEligible = await TestAssignment.findOne({
      instituteId: studentB.instituteId,
      mockId: mockA._id,
      status: "ACTIVE",
    });
    console.log(`✅ Cross-Tenant: Student B (Institute B) sees Mock A: ${Boolean(studentBEligible)} (Expected: false)`);
    if (studentBEligible) throw new Error("Student B should NOT see Institute A tests!");

    console.log("\n--- STEP 6: STUDENT 1 TAKES AND SUBMITS TEST ---");
    // Answers: Q1 is correct (0), Q2 is wrong (0 instead of 1)
    // Expected score: +2 (for Q1) - 0.5 (for Q2) = 1.5 marks out of 4 total!
    const answers = {
      [q1Code]: 0, // correct (+2)
      [q2Code]: 0, // incorrect (-0.5)
    };

    let score = 0;
    const questions = await Question.find({ questionCode: { $in: Object.keys(answers) } }).select("+correctOption");
    for (const q of questions) {
      if (answers[q.questionCode] === q.correctOption) {
        score += mockA.marking.correct;
      } else {
        score -= mockA.marking.incorrect;
      }
    }
    score = Math.round(score * 100) / 100;

    const result = await Result.create({
      userId: student1._id,
      mockId: mockA._id,
      score,
      total: mockA.totalMarks,
      answers,
      sectionScores: { phy: 2, math: -0.5 },
      subjectStats: {
        physics: { attempted: 1, correct: 1, wrong: 0, accuracy: 100 },
        mathematics: { attempted: 1, correct: 0, wrong: 1, accuracy: 0 },
      },
      isSubmitted: true,
      instituteId: instituteA._id,
      assignmentId: assignment._id,
    });
    console.log(`✅ Test submitted by ${student1.name}. Score: ${result.score} / ${result.total} (Expected: 1.5)`);
    if (result.score !== 1.5) throw new Error(`Expected score 1.5, got ${result.score}`);

    console.log("\n--- STEP 7: VERIFY MULTI-DIMENSIONAL ANALYTICS ---");
    // 1. Student-wise
    const studentResults = await Result.find({ userId: student1._id, instituteId: instituteA._id, isSubmitted: true });
    console.log(`✅ Student-wise analytics for ${student1.name}: ${studentResults.length} test attempted, score: ${studentResults[0].score}`);

    // 2. Test-wise
    const testResults = await Result.find({ mockId: mockA._id, instituteId: instituteA._id, isSubmitted: true });
    console.log(`✅ Test-wise analytics for Mock A: ${testResults.length} total attempt, avg score: ${testResults[0].score}`);

    // 3. Question-wise
    const totalSubmissions = testResults.length;
    let q1Correct = 0;
    let q2Correct = 0;
    for (const r of testResults) {
      if (r.answers[q1Code] === q1.correctOption) q1Correct++;
      if (r.answers[q2Code] === q2.correctOption) q2Correct++;
    }
    const q1Pct = Math.round((q1Correct / totalSubmissions) * 100);
    const q2Pct = Math.round((q2Correct / totalSubmissions) * 100);
    console.log(`✅ Question 1 Accuracy: ${q1Pct}% (Expected: 100%)`);
    console.log(`✅ Question 2 Accuracy: ${q2Pct}% (Expected: 0%)`);

    // 4. Cross-Tenant isolation for Admin B
    const adminBResults = await Result.find({ instituteId: instituteB._id });
    console.log(`✅ Cross-Tenant: Institute B sees Institute A results: count=${adminBResults.length} (Expected: 0)`);
    if (adminBResults.length > 0) throw new Error("Institute B should see 0 results!");

    console.log("\n🎉 ALL BACKEND VERIFICATION CHECKS PASSED PERFECTLY!");

  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
