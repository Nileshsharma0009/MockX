import TestAssignment from "../models/testAssignment.model.js";
import Mock from "../models/mock.model.js";
import Result from "../models/result.model.js";
import Institute from "../models/institute.model.js";

/**
 * Student: Get all tests assigned to this student
 */
export const getMyAssignedTests = async (req, res) => {
  try {
    const student = req.user;
    const instituteId = student.instituteId;

    if (!instituteId) {
      return res.status(403).json({ message: "No institute linked to student account." });
    }

    const institute = await Institute.findById(instituteId).select("name code logo status");
    if (!institute || institute.status === "SUSPENDED") {
      return res.status(403).json({ message: "Your institute account is inactive or suspended." });
    }

    // Find all assignments matching student (ALL, BATCH, or explicitly listed)
    const assignments = await TestAssignment.find({
      instituteId,
      status: "ACTIVE",
      $or: [
        { assignToType: "ALL" },
        { assignToType: "BATCH", batch: student.batch },
        { assignToType: "STUDENTS", studentIds: student._id },
      ],
    }).sort({ createdAt: -1 });

    const now = new Date();

    const assignedTests = await Promise.all(
      assignments.map(async (a) => {
        const mock = await Mock.findById(a.mockId);
        if (!mock) return null;

        // Check if student already submitted this mock
        const existingResult = await Result.findOne({
          userId: student._id,
          mockId: a.mockId,
          isSubmitted: true,
        }).select("_id score total createdAt");

        let status = "AVAILABLE";
        if (existingResult) {
          status = "COMPLETED";
        } else if (a.availableFrom && now < new Date(a.availableFrom)) {
          status = "UPCOMING";
        } else if (a.availableUntil && now > new Date(a.availableUntil)) {
          status = "EXPIRED";
        }

        return {
          assignmentId: a._id,
          mockId: mock._id,
          title: mock.title,
          description: mock.description,
          duration: mock.duration,
          totalQuestions: mock.totalQuestions,
          totalMarks: mock.totalMarks,
          marking: mock.marking,
          sections: mock.sections,
          availableFrom: a.availableFrom,
          availableUntil: a.availableUntil,
          status,
          result: existingResult
            ? {
                resultId: existingResult._id,
                score: existingResult.score,
                total: existingResult.total,
                submittedAt: existingResult.createdAt,
              }
            : null,
        };
      })
    );

    const filteredTests = assignedTests.filter(Boolean);

    return res.status(200).json({
      institute,
      tests: filteredTests,
    });
  } catch (error) {
    console.error("getMyAssignedTests error:", error);
    return res.status(500).json({ message: "Failed to fetch assigned tests" });
  }
};

/**
 * Student: Get all test results / history for this student
 */
export const getMyInstituteResults = async (req, res) => {
  try {
    const student = req.user;
    const instituteId = student.instituteId;

    const results = await Result.find({
      userId: student._id,
      instituteId,
      isSubmitted: true,
    }).sort({ createdAt: -1 });

    const detailedResults = await Promise.all(
      results.map(async (r) => {
        const mock = await Mock.findById(r.mockId).select("title duration totalQuestions totalMarks sections");
        return {
          _id: r._id,
          mockId: r.mockId,
          mockTitle: mock?.title || r.mockId,
          score: r.score,
          total: r.total,
          percentage: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
          sectionScores: r.sectionScores,
          subjectStats: r.subjectStats,
          createdAt: r.createdAt,
        };
      })
    );

    return res.status(200).json(detailedResults);
  } catch (error) {
    console.error("getMyInstituteResults error:", error);
    return res.status(500).json({ message: "Failed to fetch results" });
  }
};

/**
 * Student: Overall performance summary
 */
export const getMyInstituteStats = async (req, res) => {
  try {
    const student = req.user;
    const instituteId = student.instituteId;

    const results = await Result.find({
      userId: student._id,
      instituteId,
      isSubmitted: true,
    }).select("score total subjectStats");

    const testsAttempted = results.length;
    let totalScore = 0;
    let bestScore = 0;
    let totalAccuracySum = 0;
    let accuracyCount = 0;

    for (const r of results) {
      totalScore += r.score || 0;
      if (r.score > bestScore) bestScore = r.score;

      if (r.subjectStats) {
        let subjAccSum = 0;
        let count = 0;
        for (const s of Object.values(r.subjectStats)) {
          if (s.attempted > 0) {
            subjAccSum += s.accuracy || 0;
            count++;
          }
        }
        if (count > 0) {
          totalAccuracySum += subjAccSum / count;
          accuracyCount++;
        }
      }
    }

    const avgScore = testsAttempted > 0 ? Math.round((totalScore / testsAttempted) * 10) / 10 : 0;
    const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0;

    return res.status(200).json({
      testsAttempted,
      avgScore,
      bestScore,
      avgAccuracy,
    });
  } catch (error) {
    console.error("getMyInstituteStats error:", error);
    return res.status(500).json({ message: "Failed to fetch student stats" });
  }
};
