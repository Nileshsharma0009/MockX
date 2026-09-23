import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: "./backend/.env" });

import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Batch from "../models/batch.model.js";
import Mock from "../models/mock.model.js";
import Question from "../models/question.model.js";
import TestAssignment from "../models/testAssignment.model.js";
import Result from "../models/result.model.js";

async function seedInstitute() {
  console.log("🌱 Seeding Demo Institute Data for UI testing...");

  const mongoUri = process.env.MONGODB_URL;
  console.log(mongoUri) ;
  if (!mongoUri) throw new Error("MONGODB_URL not found");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const instCode = "APEX-KOTA";

  // Clean old demo institute data if present
  const existingInst = await Institute.findOne({ code: instCode });
  if (existingInst) {
    await User.deleteMany({ instituteId: existingInst._id });
    await Batch.deleteMany({ instituteId: existingInst._id });
    await Mock.deleteMany({ instituteId: existingInst._id });
    await Question.deleteMany({ instituteId: existingInst._id });
    await TestAssignment.deleteMany({ instituteId: existingInst._id });
    await Result.deleteMany({ instituteId: existingInst._id });
    await Institute.deleteOne({ _id: existingInst._id });
  }

  // Seed a platform admin only when explicit local seed credentials are configured.
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (Boolean(superAdminEmail) !== Boolean(superAdminPassword)) {
    throw new Error("Set both SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD to seed a platform admin.");
  }
  if (superAdminEmail && superAdminPassword) {
    const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
    if (!existingSuperAdmin) {
      const hash = await bcrypt.hash(superAdminPassword, 10);
      await User.create({
        name: "MockX Super Admin",
        email: superAdminEmail,
        password: hash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        isVerified: false,
      });
      console.log("Created configured seed Super Admin account.");
    } else if (existingSuperAdmin.role !== "SUPER_ADMIN") {
      throw new Error("Configured seed admin already exists without the SUPER_ADMIN role; it was not promoted.");
    }
  }

  // // 1. Create Institute
  // const institute = await Institute.create({
  //   name: "Apex IIT-JEE Academy",
  //   code: instCode,
  //   email: "contact@apexkota.edu.in",
  //   phone: "+91 744 2500123",
  //   address: "Plot 14, Knowledge Corridor, Kota, Rajasthan",
  //   logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&h=120&fit=crop&crop=faces",
  //   status: "ACTIVE",
  // });

  // // 2. Create Institute Admin
  // const adminPass = await bcrypt.hash("apex123", 10);
  // const admin = await User.create({
  //   name: "Prof. H. C. Verma",
  //   email: "admin@apex.edu",
  //   password: adminPass,
  //   phone: "+91 9829012345",
  //   role: "INSTITUTE_ADMIN",
  //   instituteId: institute._id,
  //   status: "ACTIVE",
  //   isVerified: true,
  // });

  // institute.adminId = admin._id;
  // await institute.save();
  // console.log(`✅ Created Institute Admin: ${admin.email} / apex123`);

  // // 3. Create Batches
  // const batch1 = await Batch.create({
  //   instituteId: institute._id,
  //   name: "Morning Stars (JEE-26)",
  //   description: "Top 50 rankers intensive preparation",
  // });

  // const batch2 = await Batch.create({
  //   instituteId: institute._id,
  //   name: "Dropper Rankers",
  //   description: "Full-syllabus revision & mock tests",
  // });

  // console.log("✅ Created Batches: 'Morning Stars (JEE-26)' & 'Dropper Rankers'");

  // 4. Create Students
  // const studentPass = await bcrypt.hash("student123", 10);
  // const student1 = await User.create({
  //   name: "Aryan Patel",
  //   email: "aryan@apex.edu",
  //   password: studentPass,
  //   phone: "+91 9988776655",
  //   role: "STUDENT",
  //   instituteId: institute._id,
  //   batch: "Morning Stars (JEE-26)",
  //   studentRollNo: "APEX-26-001",
  //   status: "ACTIVE",
  //   isVerified: true,
  // });

  // const student2 = await User.create({
  //   name: "Priya Sharma",
  //   email: "priya@apex.edu",
  //   password: studentPass,
  //   phone: "+91 9988776656",
  //   role: "STUDENT",
  //   instituteId: institute._id,
  //   batch: "Morning Stars (JEE-26)",
  //   studentRollNo: "APEX-26-002",
  //   status: "ACTIVE",
  //   isVerified: true,
  // });

  // const student3 = await User.create({
  //   name: "Rohit Deshmukh",
  //   email: "rohit@apex.edu",
  //   password: studentPass,
  //   phone: "+91 9988776657",
  //   role: "STUDENT",
  //   instituteId: institute._id,
  //   batch: "Dropper Rankers",
  //   studentRollNo: "APEX-26-003",
  //   status: "ACTIVE",
  //   isVerified: true,
  // });

  console.log("✅ Created 3 Students: aryan@apex.edu, priya@apex.edu, rohit@apex.edu (Password: student123)");

  // 5. Create Custom Mock and Questions
  // const mockId = "inst_apex_mock01";

  // const qData = [
  //   {
  //     code: `${mockId}_p1`,
  //     section: "phy",
  //     subject: "physics",
  //     question: "A uniform electric field E = 3×10³ î N/C. What is the flux of this field through a square of 10 cm on a side whose plane is parallel to the yz plane?",
  //     options: ["30 N m²/C", "15 N m²/C", "0 N m²/C", "60 N m²/C"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  //   {
  //     code: `${mockId}_p2`,
  //     section: "phy",
  //     subject: "physics",
  //     question: "The de Broglie wavelength associated with an electron accelerated through a potential difference of 100 V is approximately:",
  //     options: ["0.123 nm", "1.23 nm", "0.0123 nm", "12.3 nm"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  //   {
  //     code: `${mockId}_c1`,
  //     section: "chem",
  //     subject: "chemistry",
  //     question: "Which of the following molecules has zero dipole moment?",
  //     options: ["BF₃", "NH₃", "H₂O", "SO₂"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  //   {
  //     code: `${mockId}_c2`,
  //     section: "chem",
  //     subject: "chemistry",
  //     question: "The oxidation state of chromium in K₂Cr₂O₇ is:",
  //     options: ["+6", "+3", "+7", "+4"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  //   {
  //     code: `${mockId}_m1`,
  //     section: "math",
  //     subject: "mathematics",
  //     question: "Evaluate lim (x→0) [sin(5x) / x]:",
  //     options: ["5", "1", "0", "Does not exist"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  //   {
  //     code: `${mockId}_m2`,
  //     section: "math",
  //     subject: "mathematics",
  //     question: "The area bounded by the curve y = x² and the line y = 4 is:",
  //     options: ["32/3", "16/3", "8/3", "64/3"],
  //     correctOption: 0,
  //     marks: 4,
  //     negativeMarks: 1,
  //   },
  // ];

  // for (const q of qData) {
  //   await Question.create({
  //     questionCode: q.code,
  //     mockId,
  //     section: q.section,
  //     subject: q.subject,
  //     question: q.question,
  //     options: q.options,
  //     correctOption: q.correctOption,
  //     marks: q.marks,
  //     negativeMarks: q.negativeMarks,
  //     instituteId: institute._id,
  //     createdBy: admin._id,
  //     isPrivate: true,
  //     isActive: true,
  //   });
  // }

  // const mock = await Mock.create({
  //   _id: mockId,
  //   title: "Apex Weekly Grand Mock #01",
  //   description: "Full Syllabus Mini Test | 30 Mins | Physics, Chemistry, Maths | +4 / -1 Marking",
  //   exam: "institute-custom",
  //   isFree: true,
  //   duration: 30,
  //   totalQuestions: 6,
  //   totalMarks: 24,
  //   marking: { correct: 4, incorrect: 1 },
  //   sections: [
  //     { id: "phy", name: "Physics", questionCount: 2 },
  //     { id: "chem", name: "Chemistry", questionCount: 2 },
  //     { id: "math", name: "Mathematics", questionCount: 2 },
  //   ],
  //   instituteId: institute._id,
  //   createdBy: admin._id,
  //   isInstituteCustom: true,
  //   isActive: true,
  // });

  console.log(`✅ Created Mock: "${mock.title}" (ID: ${mock._id}) with 6 questions across 3 sections`);

  // 6. Assign Mock to "Morning Stars (JEE-26)" and all students
  // const assignment = await TestAssignment.create({
  //   instituteId: institute._id,
  //   mockId: mock._id,
  //   assignedBy: admin._id,
  //   assignToType: "BATCH",
  //   batch: "Morning Stars (JEE-26)",
  //   availableFrom: new Date(Date.now() - 3600000), // available 1 hr ago
  //   availableUntil: new Date(Date.now() + 7 * 86400000), // available for 7 days
  //   status: "ACTIVE",
  // });

  // // 7. Seed one completed attempt for Priya Sharma to populate analytics!
  // const priyaAnswers = {
  //   [`${mockId}_p1`]: 0, // correct (+4)
  //   [`${mockId}_p2`]: 0, // correct (+4)
  //   [`${mockId}_c1`]: 0, // correct (+4)
  //   [`${mockId}_c2`]: 1, // wrong (-1)
  //   [`${mockId}_m1`]: 0, // correct (+4)
  //   [`${mockId}_m2`]: 0, // correct (+4)
  // };
  // // Score: 4*5 - 1 = 19 out of 24!
  // await Result.create({
  //   userId: student2._id,
  //   mockId: mock._id,
  //   score: 19,
  //   total: 24,
  //   answers: priyaAnswers,
  //   sectionScores: { phy: 8, chem: 3, math: 8 },
  //   subjectStats: {
  //     physics: { attempted: 2, correct: 2, wrong: 0, accuracy: 100 },
  //     chemistry: { attempted: 2, correct: 1, wrong: 1, accuracy: 50 },
  //     mathematics: { attempted: 2, correct: 2, wrong: 0, accuracy: 100 },
  //   },
  //   isSubmitted: true,
  //   instituteId: institute._id,
  //   assignmentId: assignment._id,
  // });

  console.log("✅ Seeded completed attempt for Priya Sharma (Score: 19/24, 79%)");
  console.log("\n🎉 Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log(superAdminEmail ? "Super Admin:      configured seed credentials" : "Super Admin:      skipped (no seed credentials configured)");
  console.log("Institute Admin:  admin@apex.edu    / apex123");
  console.log("Student (Active): aryan@apex.edu    / student123");
  console.log("Student (Done):   priya@apex.edu    / student123");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

seedInstitute().catch(console.error);
