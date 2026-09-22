import express from "express";
import protect from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getMyAssignedTests,
  getMyInstituteResults,
  getMyInstituteStats,
} from "../controllers/instituteStudent.controller.js";

const router = express.Router();

const studentGuard = [protect, authorizeRoles("STUDENT")];

router.get("/my-tests", studentGuard, getMyAssignedTests);
router.get("/my-results", studentGuard, getMyInstituteResults);
router.get("/my-stats", studentGuard, getMyInstituteStats);

export default router;
