import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Institute from "../models/institute.model.js";
import User from "../models/user.model.js";
import Batch from "../models/batch.model.js";
import Mock from "../models/mock.model.js";
import Question from "../models/question.model.js";
import TestAssignment from "../models/testAssignment.model.js";
import Result from "../models/result.model.js";

/* ==========================================================================
   1. SUPER ADMIN CONTROLLERS
   ========================================================================== */

/**
 * Super Admin: Create a new Institute and its primary Institute Admin account
 */
export const createInstitute = async (req, res) => {
  try {
    const {
      name,
      code,
      email,
      phone,
      address,
      logo,
      adminName,
      adminEmail,
      adminPassword,
      adminPhone,
    } = req.body;

    if (!name || !code || !email || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: "Institute name, code, email, and admin details (name, email, password) are required.",
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check code uniqueness
    const existingInst = await Institute.findOne({ code: cleanCode });
    if (existingInst) {
      return res.status(400).json({ message: `Institute code "${cleanCode}" is already in use.` });
    }

    // Check admin email uniqueness
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: `Email "${adminEmail}" is already registered to a user.` });
    }

    // 1. Create Institute
    const institute = await Institute.create({
      name: name.trim(),
      code: cleanCode,
      email: email.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      logo: logo || "",
      status: "ACTIVE",
    });

    // 2. Create Institute Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await User.create({
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      phone: adminPhone || phone || "",
      role: "INSTITUTE_ADMIN",
      instituteId: institute._id,
      status: "ACTIVE",
      isVerified: true,
    });

    // 3. Link adminId back to Institute
    institute.adminId = adminUser._id;
    await institute.save();

    return res.status(201).json({
      message: "Institute and Admin created successfully.",
      institute: {
        _id: institute._id,
        name: institute.name,
        code: institute.code,
        email: institute.email,
        status: institute.status,
        admin: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
    });
  } catch (error) {
    console.error("createInstitute error:", error);
    return res.status(500).json({ message: "Failed to create institute", error: error.message });
  }
};

/**
 * Super Admin: Get all institutes with aggregated stats
 */
export const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().populate("adminId", "name email phone").sort({ createdAt: -1 });

    const results = await Promise.all(
      institutes.map(async (inst) => {
        const studentCount = await User.countDocuments({
          instituteId: inst._id,
          role: "STUDENT",
        });
        const mockCount = await Mock.countDocuments({
          instituteId: inst._id,
        });
        const attemptCount = await Result.countDocuments({
          instituteId: inst._id,
          isSubmitted: true,
        });

        return {
          _id: inst._id,
          name: inst.name,
          code: inst.code,
          email: inst.email,
          phone: inst.phone,
          address: inst.address,
          logo: inst.logo,
          status: inst.status,
          admin: inst.adminId,
          studentCount,
          mockCount,
          attemptCount,
          createdAt: inst.createdAt,
        };
      })
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("getAllInstitutes error:", error);
    return res.status(500).json({ message: "Failed to fetch institutes" });
  }
};

/**
 * Super Admin: Update Institute details / status
 */
export const updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, logo, status } = req.body;

    const institute = await Institute.findById(id);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    if (name) institute.name = name.trim();
    if (phone !== undefined) institute.phone = phone;
    if (address !== undefined) institute.address = address;
    if (logo !== undefined) institute.logo = logo;
    if (status && ["ACTIVE", "SUSPENDED"].includes(status)) {
      institute.status = status;
    }

    await institute.save();

    return res.status(200).json({
      message: "Institute updated successfully",
      institute,
    });
  } catch (error) {
    console.error("updateInstitute error:", error);
    return res.status(500).json({ message: "Failed to update institute" });
  }
};

/* ==========================================================================
   2. INSTITUTE ADMIN: DASHBOARD STATS
   ========================================================================== */

export const getInstituteDashboardStats = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;

    const [studentsCount, mocksCount, results, batchesCount, activeAssignmentsCount] =
      await Promise.all([
        User.countDocuments({ instituteId, role: "STUDENT" }),
        Mock.countDocuments({ instituteId, isInstituteCustom: true }),
        Result.find({ instituteId, isSubmitted: true })
          .populate("userId", "name email batch")
          .sort({ createdAt: -1 }),
        Batch.countDocuments({ instituteId }),
        TestAssignment.countDocuments({ instituteId, status: "ACTIVE" }),
      ]);

    const totalAttempts = results.length;
    let totalScore = 0;
    let totalAccuracySum = 0;
    let accuracyCount = 0;

    for (const r of results) {
      totalScore += r.score || 0;
      if (r.subjectStats) {
        let subjAccSum = 0;
        let subjCount = 0;
        for (const subj of Object.values(r.subjectStats)) {
          if (subj.attempted > 0) {
            subjAccSum += subj.accuracy || 0;
            subjCount++;
          }
        }
        if (subjCount > 0) {
          totalAccuracySum += subjAccSum / subjCount;
          accuracyCount++;
        }
      }
    }

    const avgScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 100) / 100 : 0;
    const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0;

    const recentAttempts = results.slice(0, 8).map((r) => ({
      _id: r._id,
      mockId: r.mockId,
      studentName: r.userId?.name || "Unknown",
      studentEmail: r.userId?.email || "",
      batch: r.userId?.batch || "Unassigned",
      score: r.score,
      total: r.total,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      institute: {
        _id: req.institute._id,
        name: req.institute.name,
        code: req.institute.code,
        email: req.institute.email,
        logo: req.institute.logo,
      },
      stats: {
        studentsCount,
        mocksCount,
        totalAttempts,
        avgScore,
        avgAccuracy,
        batchesCount,
        activeAssignmentsCount,
      },
      recentAttempts,
    });
  } catch (error) {
    console.error("getInstituteDashboardStats error:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

/* ==========================================================================
   3. BATCHES MANAGEMENT
   ========================================================================== */

export const getBatches = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const batches = await Batch.find({ instituteId }).sort({ name: 1 });

    const batchesWithCount = await Promise.all(
      batches.map(async (b) => {
        const studentCount = await User.countDocuments({
          instituteId,
          role: "STUDENT",
          batch: b.name,
        });
        return {
          _id: b._id,
          name: b.name,
          description: b.description,
          studentCount,
          createdAt: b.createdAt,
        };
      })
    );

    return res.status(200).json(batchesWithCount);
  } catch (error) {
    console.error("getBatches error:", error);
    return res.status(500).json({ message: "Failed to fetch batches" });
  }
};

export const createBatch = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Batch name is required." });
    }

    const cleanName = name.trim();
    const existing = await Batch.findOne({ instituteId, name: cleanName });
    if (existing) {
      return res.status(400).json({ message: `Batch "${cleanName}" already exists.` });
    }

    const batch = await Batch.create({
      instituteId,
      name: cleanName,
      description: description?.trim() || "",
    });

    return res.status(201).json({ message: "Batch created successfully", batch });
  } catch (error) {
    console.error("createBatch error:", error);
    return res.status(500).json({ message: "Failed to create batch" });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { batchId } = req.params;

    const batch = await Batch.findOne({ _id: batchId, instituteId });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Unassign students from this batch
    await User.updateMany({ instituteId, batch: batch.name }, { $set: { batch: null } });

    await Batch.deleteOne({ _id: batchId });

    return res.status(200).json({ message: `Batch "${batch.name}" removed successfully.` });
  } catch (error) {
    console.error("deleteBatch error:", error);
    return res.status(500).json({ message: "Failed to delete batch" });
  }
};

/* ==========================================================================
   4. STUDENT MANAGEMENT
   ========================================================================== */

export const getStudents = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { batch, search, status } = req.query;

    const query = { instituteId, role: "STUDENT" };
    if (batch) query.batch = batch;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { studentRollNo: regex }, { phone: regex }];
    }

    const students = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    // Attach performance summary per student
    const studentData = await Promise.all(
      students.map(async (s) => {
        const studentResults = await Result.find({
          userId: s._id,
          instituteId,
          isSubmitted: true,
        }).select("score total");

        const attemptsCount = studentResults.length;
        const totalMarksScored = studentResults.reduce((sum, r) => sum + (r.score || 0), 0);
        const avgScore = attemptsCount > 0 ? Math.round((totalMarksScored / attemptsCount) * 10) / 10 : 0;

        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          batch: s.batch,
          studentRollNo: s.studentRollNo,
          status: s.status,
          attemptsCount,
          avgScore,
          createdAt: s.createdAt,
        };
      })
    );

    return res.status(200).json(studentData);
  } catch (error) {
    console.error("getStudents error:", error);
    return res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const createStudent = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { name, email, password, phone, batch, studentRollNo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: `Email "${cleanEmail}" is already registered.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      batch: batch?.trim() || null,
      studentRollNo: studentRollNo?.trim() || null,
      role: "STUDENT",
      instituteId,
      status: "ACTIVE",
      isVerified: true,
    });

    const response = student.toObject();
    delete response.password;

    return res.status(201).json({ message: "Student created successfully", student: response });
  } catch (error) {
    console.error("createStudent error:", error);
    return res.status(500).json({ message: "Failed to create student" });
  }
};

export const bulkCreateStudents = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { students } = req.body; // Array of student objects

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "An array of students is required." });
    }

    const created = [];
    const skipped = [];

    for (const item of students) {
      const { name, email, password, phone, batch, studentRollNo } = item;
      if (!name || !email || !password) {
        skipped.push({ email: email || "unknown", reason: "Missing required fields" });
        continue;
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        skipped.push({ email: cleanEmail, reason: "Email already in use" });
        continue;
      }

      const hashedPassword = await bcrypt.hash(String(password), 10);
      const student = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? String(phone).trim() : "",
        batch: batch ? String(batch).trim() : null,
        studentRollNo: studentRollNo ? String(studentRollNo).trim() : null,
        role: "STUDENT",
        instituteId,
        status: "ACTIVE",
        isVerified: true,
      });

      created.push({ _id: student._id, name: student.name, email: student.email });
    }

    return res.status(201).json({
      message: `Bulk import completed: ${created.length} students created, ${skipped.length} skipped.`,
      createdCount: created.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    console.error("bulkCreateStudents error:", error);
    return res.status(500).json({ message: "Bulk student creation failed" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { studentId } = req.params;
    const { name, phone, batch, studentRollNo, password } = req.body;

    const student = await User.findOne({ _id: studentId, instituteId, role: "STUDENT" });
    if (!student) {
      return res.status(404).json({ message: "Student not found in your institute." });
    }

    if (name) student.name = name.trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (batch !== undefined) student.batch = batch ? batch.trim() : null;
    if (studentRollNo !== undefined) student.studentRollNo = studentRollNo ? studentRollNo.trim() : null;
    if (password) {
      student.password = await bcrypt.hash(password, 10);
    }

    await student.save();

    const response = student.toObject();
    delete response.password;

    return res.status(200).json({ message: "Student updated successfully", student: response });
  } catch (error) {
    console.error("updateStudent error:", error);
    return res.status(500).json({ message: "Failed to update student" });
  }
};

export const toggleStudentStatus = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, instituteId, role: "STUDENT" });
    if (!student) {
      return res.status(404).json({ message: "Student not found in your institute." });
    }

    student.status = student.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await student.save();

    return res.status(200).json({
      message: `Student status updated to ${student.status}.`,
      status: student.status,
    });
  } catch (error) {
    console.error("toggleStudentStatus error:", error);
    return res.status(500).json({ message: "Failed to toggle student status" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, instituteId, role: "STUDENT" });
    if (!student) {
      return res.status(404).json({ message: "Student not found in your institute." });
    }

    await User.deleteOne({ _id: studentId });

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("deleteStudent error:", error);
    return res.status(500).json({ message: "Failed to delete student" });
  }
};

export const getStudentPerformance = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, instituteId, role: "STUDENT" }).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const results = await Result.find({ userId: studentId, instituteId, isSubmitted: true })
      .sort({ createdAt: -1 });

    const attemptsCount = results.length;
    let totalScore = 0;
    let bestScore = 0;
    let totalAccuracySum = 0;
    let accuracyCount = 0;

    const history = results.map((r) => {
      totalScore += r.score || 0;
      if (r.score > bestScore) bestScore = r.score;

      let subjAccuracy = 0;
      let count = 0;
      if (r.subjectStats) {
        for (const s of Object.values(r.subjectStats)) {
          if (s.attempted > 0) {
            subjAccuracy += s.accuracy || 0;
            count++;
          }
        }
      }
      const testAccuracy = count > 0 ? Math.round(subjAccuracy / count) : 0;
      if (count > 0) {
        totalAccuracySum += testAccuracy;
        accuracyCount++;
      }

      return {
        _id: r._id,
        mockId: r.mockId,
        score: r.score,
        total: r.total,
        percentage: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
        accuracy: testAccuracy,
        sectionScores: r.sectionScores,
        subjectStats: r.subjectStats,
        createdAt: r.createdAt,
      };
    });

    const avgScore = attemptsCount > 0 ? Math.round((totalScore / attemptsCount) * 10) / 10 : 0;
    const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0;

    return res.status(200).json({
      student,
      summary: {
        attemptsCount,
        avgScore,
        bestScore,
        avgAccuracy,
      },
      history,
    });
  } catch (error) {
    console.error("getStudentPerformance error:", error);
    return res.status(500).json({ message: "Failed to fetch student performance" });
  }
};

/* ==========================================================================
   5. INSTITUTE QUESTION BANK
   ========================================================================== */

export const getQuestionBank = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { section, subject, search } = req.query;

    const query = { instituteId, isPrivate: true, isActive: true };
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (search) {
      query.question = new RegExp(search.trim(), "i");
    }

    const questions = await Question.find(query).select("+correctOption").sort({ createdAt: -1 });

    return res.status(200).json(questions);
  } catch (error) {
    console.error("getQuestionBank error:", error);
    return res.status(500).json({ message: "Failed to load question bank" });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { section, subject, question, options, correctOption, marks, negativeMarks, paragraph, imageUrl } = req.body;

    if (!section || !subject || !question || !options || correctOption === undefined) {
      return res.status(400).json({ message: "Section, subject, question text, options, and correctOption are required." });
    }

    const institute = req.institute;
    const questionCode = `inst_${institute.code.toLowerCase()}_q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newQuestion = await Question.create({
      questionCode,
      mockId: `bank_${institute._id}`, // Default bucket for bank questions
      section: section.trim(),
      subject: subject.trim().toLowerCase(),
      question: question.trim(),
      options: options.map((opt) => String(opt).trim()),
      correctOption: Number(correctOption),
      marks: marks !== undefined ? Number(marks) : 1,
      negativeMarks: negativeMarks !== undefined ? Number(negativeMarks) : 0.25,
      paragraph: paragraph || null,
      imageUrl: imageUrl || null,
      instituteId,
      createdBy: req.user._id,
      isPrivate: true,
      isActive: true,
    });

    return res.status(201).json({ message: "Question created successfully", question: newQuestion });
  } catch (error) {
    console.error("createQuestion error:", error);
    return res.status(500).json({ message: "Failed to create question", error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { id } = req.params;

    const q = await Question.findOne({ _id: id, instituteId });
    if (!q) {
      return res.status(404).json({ message: "Question not found in your institute bank." });
    }

    q.isActive = false;
    await q.save();

    return res.status(200).json({ message: "Question removed from question bank." });
  } catch (error) {
    console.error("deleteQuestion error:", error);
    return res.status(500).json({ message: "Failed to delete question" });
  }
};

/* ==========================================================================
   6. CUSTOM MOCK CREATION (REUSING EXISTING DYNAMIC ENGINE)
   ========================================================================== */

/**
 * Institute Admin: Create a custom mock test
 * Configures title, duration, marks, negative marking, sections, and questions.
 * This directly adheres to Mock schema used by the dynamic exam engine.
 */
export const createCustomMock = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const institute = req.institute;
    const {
      title,
      description,
      duration,
      marking,
      sections,
      questions, // Array of question objects
    } = req.body;

    if (!title || !duration || !sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ message: "Title, duration, and at least one section are required." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Please provide at least one question for the test." });
    }

    // Generate unique mockId for this institute test
    const cleanInstCode = institute.code.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mockId = `inst_${cleanInstCode}_${Date.now()}`;

    const correctMarks = marking?.correct !== undefined ? Number(marking.correct) : 1;
    const incorrectPenalty = marking?.incorrect !== undefined ? Number(marking.incorrect) : 0.25;

    // Verify sections
    const formattedSections = sections.map((sec, idx) => {
      const safeId = String(sec.id || sec.name || `sec_${idx + 1}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `sec_${idx + 1}`;

      return {
        id: safeId,
        name: String(sec.name || sec.id || `Section ${idx + 1}`).trim() || `Section ${idx + 1}`,
        questionCount: sec.questionCount || 0,
      };
    });

    const validSectionIds = new Set(formattedSections.map((s) => s.id));

    // Create question records with this mockId
    const createdQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qCode = `${mockId}_q${i + 1}`;
      const qSection = validSectionIds.has(String(q.section || ""))
        ? String(q.section)
        : formattedSections[0]?.id || "section1";

      const newQ = await Question.create({
        questionCode: qCode,
        mockId,
        section: qSection,
        subject: q.subject || "general",
        question: q.question,
        options: q.options,
        correctOption: Number(q.correctOption),
        marks: q.marks !== undefined ? Number(q.marks) : correctMarks,
        negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : incorrectPenalty,
        paragraph: q.paragraph || null,
        imageUrl: q.imageUrl || null,
        instituteId,
        createdBy: req.user._id,
        isPrivate: true,
        isActive: true,
      });
      createdQuestions.push(newQ);
    }

    // Update question counts in sections
    for (const sec of formattedSections) {
      sec.questionCount = createdQuestions.filter((q) => q.section === sec.id).length;
    }

    const totalQuestions = createdQuestions.length;
    const totalMarks = createdQuestions.reduce((sum, q) => sum + (q.marks || correctMarks), 0);

    // Save to Mock collection (reusing the dynamic exam engine model!)
    const mock = await Mock.create({
      _id: mockId,
      title: title.trim(),
      description: description?.trim() || `${totalQuestions} questions | ${duration} mins`,
      exam: "institute-custom",
      isFree: true,
      isActive: true,
      duration: Number(duration),
      totalQuestions,
      totalMarks,
      marking: {
        correct: correctMarks,
        incorrect: incorrectPenalty,
      },
      sections: formattedSections,
      instituteId,
      createdBy: req.user._id,
      isInstituteCustom: true,
    });

    return res.status(201).json({
      message: "Custom mock test created successfully.",
      mock,
      questionCount: createdQuestions.length,
    });
  } catch (error) {
    console.error("createCustomMock error:", error);
    return res.status(500).json({ message: "Failed to create custom mock", error: error.message });
  }
};

export const getInstituteMocks = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const mocks = await Mock.find({ instituteId, isInstituteCustom: true }).sort({ createdAt: -1 });

    const mocksWithStats = await Promise.all(
      mocks.map(async (m) => {
        const attemptsCount = await Result.countDocuments({
          instituteId,
          mockId: m._id,
          isSubmitted: true,
        });
        const assignmentsCount = await TestAssignment.countDocuments({
          instituteId,
          mockId: m._id,
        });

        return {
          ...m.toObject(),
          attemptsCount,
          assignmentsCount,
        };
      })
    );

    return res.status(200).json(mocksWithStats);
  } catch (error) {
    console.error("getInstituteMocks error:", error);
    return res.status(500).json({ message: "Failed to fetch institute mocks" });
  }
};

export const getInstituteMockById = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { mockId } = req.params;

    const mock = await Mock.findOne({ _id: mockId, instituteId });
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found in your institute." });
    }

    const questions = await Question.find({ mockId, instituteId, isActive: true })
      .select("+correctOption")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      mock,
      questions,
    });
  } catch (error) {
    console.error("getInstituteMockById error:", error);
    return res.status(500).json({ message: "Failed to load mock details" });
  }
};

export const deleteCustomMock = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { mockId } = req.params;

    const mock = await Mock.findOne({ _id: mockId, instituteId });
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found." });
    }

    // Delete mock, questions, and assignments
    await Mock.deleteOne({ _id: mockId });
    await Question.deleteMany({ mockId, instituteId });
    await TestAssignment.deleteMany({ mockId, instituteId });

    return res.status(200).json({ message: "Mock test and associated questions deleted." });
  } catch (error) {
    console.error("deleteCustomMock error:", error);
    return res.status(500).json({ message: "Failed to delete mock" });
  }
};

/* ==========================================================================
   7. TEST ASSIGNMENTS
   ========================================================================== */

export const createAssignment = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { mockId, assignToType, batch, studentIds, availableFrom, availableUntil } = req.body;

    if (!mockId || !assignToType) {
      return res.status(400).json({ message: "Mock test and assignment target type (ALL, BATCH, STUDENTS) are required." });
    }

    // Verify mock belongs to this institute
    const mock = await Mock.findOne({ _id: mockId, instituteId });
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found in your institute." });
    }

    if (assignToType === "BATCH" && !batch) {
      return res.status(400).json({ message: "Batch name is required when assigning by batch." });
    }

    if (assignToType === "STUDENTS" && (!Array.isArray(studentIds) || studentIds.length === 0)) {
      return res.status(400).json({ message: "Selected students are required when assigning to specific students." });
    }

    const assignment = await TestAssignment.create({
      instituteId,
      mockId,
      assignedBy: req.user._id,
      assignToType,
      batch: assignToType === "BATCH" ? batch.trim() : null,
      studentIds: assignToType === "STUDENTS" ? studentIds : [],
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      status: "ACTIVE",
    });

    return res.status(201).json({ message: "Test assigned successfully.", assignment });
  } catch (error) {
    console.error("createAssignment error:", error);
    return res.status(500).json({ message: "Failed to create test assignment" });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const assignments = await TestAssignment.find({ instituteId })
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });

    const list = await Promise.all(
      assignments.map(async (a) => {
        const mock = await Mock.findById(a.mockId);

        // Determine number of eligible students
        let assignedCount = 0;
        let studentQuery = { instituteId, role: "STUDENT", status: "ACTIVE" };

        if (a.assignToType === "ALL") {
          assignedCount = await User.countDocuments(studentQuery);
        } else if (a.assignToType === "BATCH") {
          studentQuery.batch = a.batch;
          assignedCount = await User.countDocuments(studentQuery);
        } else if (a.assignToType === "STUDENTS") {
          assignedCount = a.studentIds?.length || 0;
        }

        // Count attempts submitted for this mock in this institute
        const attemptedCount = await Result.countDocuments({
          instituteId,
          mockId: a.mockId,
          isSubmitted: true,
        });

        // Compute active/expired status based on date
        let effectiveStatus = a.status;
        const now = new Date();
        if (a.availableUntil && now > new Date(a.availableUntil)) {
          effectiveStatus = "EXPIRED";
        }

        return {
          _id: a._id,
          mockId: a.mockId,
          mockTitle: mock?.title || a.mockId,
          duration: mock?.duration || 0,
          totalQuestions: mock?.totalQuestions || 0,
          assignToType: a.assignToType,
          batch: a.batch,
          assignedCount,
          attemptedCount,
          availableFrom: a.availableFrom,
          availableUntil: a.availableUntil,
          status: effectiveStatus,
          createdAt: a.createdAt,
        };
      })
    );

    return res.status(200).json(list);
  } catch (error) {
    console.error("getAssignments error:", error);
    return res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { id } = req.params;

    const assignment = await TestAssignment.findOne({ _id: id, instituteId });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    await TestAssignment.deleteOne({ _id: id });
    return res.status(200).json({ message: "Assignment cancelled successfully." });
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return res.status(500).json({ message: "Failed to delete assignment" });
  }
};

/* ==========================================================================
   8. MULTI-DIMENSIONAL INSTITUTE ANALYTICS
   ========================================================================== */

/**
 * Student-wise Analytics
 * Ranked list with tests taken, average score, best score, and accuracy
 */
export const getStudentWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { batch } = req.query;

    const query = { instituteId, role: "STUDENT" };
    if (batch) query.batch = batch;

    const students = await User.find(query).select("name email batch studentRollNo");

    const analytics = await Promise.all(
      students.map(async (s) => {
        const results = await Result.find({
          userId: s._id,
          instituteId,
          isSubmitted: true,
        }).select("score total subjectStats createdAt mockId");

        const testsAttempted = results.length;
        if (testsAttempted === 0) {
          return {
            _id: s._id,
            name: s.name,
            email: s.email,
            batch: s.batch || "Unassigned",
            rollNo: s.studentRollNo || "-",
            testsAttempted: 0,
            avgScore: 0,
            bestScore: 0,
            avgAccuracy: 0,
          };
        }

        let totalScore = 0;
        let bestScore = 0;
        let totalAccuracy = 0;
        let accuracyTests = 0;

        for (const r of results) {
          totalScore += r.score || 0;
          if (r.score > bestScore) bestScore = r.score;

          if (r.subjectStats) {
            let subjAccSum = 0;
            let count = 0;
            for (const subj of Object.values(r.subjectStats)) {
              if (subj.attempted > 0) {
                subjAccSum += subj.accuracy || 0;
                count++;
              }
            }
            if (count > 0) {
              totalAccuracy += subjAccSum / count;
              accuracyTests++;
            }
          }
        }

        const avgScore = Math.round((totalScore / testsAttempted) * 10) / 10;
        const avgAccuracy = accuracyTests > 0 ? Math.round(totalAccuracy / accuracyTests) : 0;

        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          batch: s.batch || "Unassigned",
          rollNo: s.studentRollNo || "-",
          testsAttempted,
          avgScore,
          bestScore,
          avgAccuracy,
        };
      })
    );

    // Sort by bestScore descending, then avgScore descending
    analytics.sort((a, b) => b.bestScore - a.bestScore || b.avgScore - a.avgScore);

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("getStudentWiseAnalytics error:", error);
    return res.status(500).json({ message: "Failed to fetch student-wise analytics" });
  }
};

/**
 * Test-wise Analytics
 * Performance per custom mock test: assigned vs attempted, avg/high/low score, avg accuracy
 */
export const getTestWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const mocks = await Mock.find({ instituteId, isInstituteCustom: true }).sort({ createdAt: -1 });

    const totalStudentsInInstitute = await User.countDocuments({
      instituteId,
      role: "STUDENT",
      status: "ACTIVE",
    });

    const testAnalytics = await Promise.all(
      mocks.map(async (m) => {
        const assignments = await TestAssignment.find({ instituteId, mockId: m._id });

        // Calculate assigned count
        let totalAssigned = 0;
        const assignedStudentSet = new Set();

        for (const a of assignments) {
          if (a.assignToType === "ALL") {
            totalAssigned = totalStudentsInInstitute;
            break;
          } else if (a.assignToType === "BATCH") {
            const batchStudents = await User.find({ instituteId, role: "STUDENT", batch: a.batch }).select("_id");
            batchStudents.forEach((s) => assignedStudentSet.add(s._id.toString()));
          } else if (a.assignToType === "STUDENTS") {
            a.studentIds.forEach((id) => assignedStudentSet.add(id.toString()));
          }
        }

        if (totalAssigned === 0) {
          totalAssigned = assignedStudentSet.size;
        }

        const results = await Result.find({
          instituteId,
          mockId: m._id,
          isSubmitted: true,
        }).select("score total subjectStats userId");

        const attempted = results.length;
        const notAttempted = Math.max(0, totalAssigned - attempted);

        if (attempted === 0) {
          return {
            mockId: m._id,
            title: m.title,
            duration: m.duration,
            totalMarks: m.totalMarks,
            totalQuestions: m.totalQuestions,
            assigned: totalAssigned,
            attempted: 0,
            notAttempted,
            avgScore: 0,
            highestScore: 0,
            lowestScore: 0,
            avgAccuracy: 0,
            scoreDistribution: [],
          };
        }

        let highestScore = -Infinity;
        let lowestScore = Infinity;
        let scoreSum = 0;
        let totalAccuracy = 0;
        let accuracyCount = 0;

        for (const r of results) {
          const s = r.score || 0;
          scoreSum += s;
          if (s > highestScore) highestScore = s;
          if (s < lowestScore) lowestScore = s;

          if (r.subjectStats) {
            let subjAccSum = 0;
            let count = 0;
            for (const subj of Object.values(r.subjectStats)) {
              if (subj.attempted > 0) {
                subjAccSum += subj.accuracy || 0;
                count++;
              }
            }
            if (count > 0) {
              totalAccuracy += subjAccSum / count;
              accuracyCount++;
            }
          }
        }

        const avgScore = Math.round((scoreSum / attempted) * 10) / 10;
        const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 0;

        return {
          mockId: m._id,
          title: m.title,
          duration: m.duration,
          totalMarks: m.totalMarks,
          totalQuestions: m.totalQuestions,
          assigned: totalAssigned,
          attempted,
          notAttempted,
          avgScore,
          highestScore: highestScore === -Infinity ? 0 : highestScore,
          lowestScore: lowestScore === Infinity ? 0 : lowestScore,
          avgAccuracy,
        };
      })
    );

    return res.status(200).json(testAnalytics);
  } catch (error) {
    console.error("getTestWiseAnalytics error:", error);
    return res.status(500).json({ message: "Failed to fetch test-wise analytics" });
  }
};

/**
 * Question-wise Analytics
 * For a specific mock test: Correct %, Wrong %, Skipped %
 */
export const getQuestionWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { mockId } = req.params;

    // Verify mock belongs to this institute
    const mock = await Mock.findOne({ _id: mockId, instituteId });
    if (!mock) {
      return res.status(404).json({ message: "Mock test not found in your institute." });
    }

    const questions = await Question.find({ mockId, instituteId, isActive: true })
      .select("+correctOption")
      .sort({ questionCode: 1 });

    const results = await Result.find({ mockId, instituteId, isSubmitted: true }).select("answers");
    const totalSubmissions = results.length;

    const questionStats = questions.map((q, idx) => {
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;

      for (const r of results) {
        const ans = r.answers?.[q.questionCode];
        if (ans === undefined || ans === null || ans === -1) {
          skippedCount++;
        } else if (Number(ans) === q.correctOption) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      const correctPct = totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;
      const wrongPct = totalSubmissions > 0 ? Math.round((wrongCount / totalSubmissions) * 100) : 0;
      const skippedPct = totalSubmissions > 0 ? Math.round((skippedCount / totalSubmissions) * 100) : 0;

      return {
        index: idx + 1,
        questionCode: q.questionCode,
        questionText: q.question,
        section: q.section,
        subject: q.subject,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        totalAttempts: totalSubmissions,
        correctCount,
        wrongCount,
        skippedCount,
        correctPct,
        wrongPct,
        skippedPct,
      };
    });

    return res.status(200).json({
      mockId: mock._id,
      mockTitle: mock.title,
      totalSubmissions,
      questions: questionStats,
    });
  } catch (error) {
    console.error("getQuestionWiseAnalytics error:", error);
    return res.status(500).json({ message: "Failed to fetch question-wise analytics" });
  }
};
