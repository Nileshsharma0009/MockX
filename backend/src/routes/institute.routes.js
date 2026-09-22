import express from "express";
import protect from "../middleware/auth.middleware.js";
import { authorizeRoles, requireInstitute } from "../middleware/role.middleware.js";
import {
  createInstitute,
  getAllInstitutes,
  updateInstitute,
  getInstituteDashboardStats,
  getBatches,
  createBatch,
  deleteBatch,
  getStudents,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
  getStudentPerformance,
  getQuestionBank,
  createQuestion,
  deleteQuestion,
  createCustomMock,
  getInstituteMocks,
  getInstituteMockById,
  deleteCustomMock,
  createAssignment,
  getAssignments,
  deleteAssignment,
  getStudentWiseAnalytics,
  getTestWiseAnalytics,
  getQuestionWiseAnalytics,
} from "../controllers/institute.controller.js";

const router = express.Router();

/* ==========================================================================
   SUPER ADMIN ROUTES
   ========================================================================== */
router.post("/", protect, authorizeRoles("SUPER_ADMIN"), createInstitute);
router.get("/", protect, authorizeRoles("SUPER_ADMIN"), getAllInstitutes);
router.put("/:id", protect, authorizeRoles("SUPER_ADMIN"), updateInstitute);

/* ==========================================================================
   INSTITUTE ADMIN ROUTES (Strictly Isolated by instituteId)
   ========================================================================== */
const adminGuard = [protect, authorizeRoles("INSTITUTE_ADMIN"), requireInstitute];

// Dashboard
router.get("/my/dashboard", adminGuard, getInstituteDashboardStats);

// Batches
router.get("/my/batches", adminGuard, getBatches);
router.post("/my/batches", adminGuard, createBatch);
router.delete("/my/batches/:batchId", adminGuard, deleteBatch);

// Students
router.get("/my/students", adminGuard, getStudents);
router.post("/my/students", adminGuard, createStudent);
router.post("/my/students/bulk", adminGuard, bulkCreateStudents);
router.put("/my/students/:studentId", adminGuard, updateStudent);
router.put("/my/students/:studentId/status", adminGuard, toggleStudentStatus);
router.delete("/my/students/:studentId", adminGuard, deleteStudent);
router.get("/my/students/:studentId/performance", adminGuard, getStudentPerformance);

// Question Bank
router.get("/my/questions", adminGuard, getQuestionBank);
router.post("/my/questions", adminGuard, createQuestion);
router.delete("/my/questions/:id", adminGuard, deleteQuestion);

// Custom Mocks
router.post("/my/mocks", adminGuard, createCustomMock);
router.get("/my/mocks", adminGuard, getInstituteMocks);
router.get("/my/mocks/:mockId", adminGuard, getInstituteMockById);
router.delete("/my/mocks/:mockId", adminGuard, deleteCustomMock);

// Test Assignments
router.post("/my/assignments", adminGuard, createAssignment);
router.get("/my/assignments", adminGuard, getAssignments);
router.delete("/my/assignments/:id", adminGuard, deleteAssignment);

// Multi-Dimensional Analytics
router.get("/my/analytics/students", adminGuard, getStudentWiseAnalytics);
router.get("/my/analytics/tests", adminGuard, getTestWiseAnalytics);
router.get("/my/analytics/tests/:mockId/questions", adminGuard, getQuestionWiseAnalytics);

export default router;
