import express from "express";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import protect from "../middleware/auth.middleware.js";
import optionalAuth from "../middleware/optionalAuth.middleware.js";

import { getMockQuestions } from "../controllers/mock.controller.js";

const router = express.Router();

router.get("/:mockId/questions", optionalAuth, getMockQuestions);

export default router;
