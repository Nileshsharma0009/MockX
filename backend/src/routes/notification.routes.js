import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markNotificationsRead,
  sendAdminNotification,
  getAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.get("/all", protect, getAllNotifications);
router.post("/mark-read", protect, markNotificationsRead);
router.post("/send", protect, sendAdminNotification);

export default router;
