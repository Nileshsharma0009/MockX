import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { emitToAll } from "../services/socketService.js";

/* ---------------- GET USER NOTIFICATIONS ---------------- */
export const getUserNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/* ---------------- MARK NOTIFICATIONS AS READ ---------------- */
export const markNotificationsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { notificationId } = req.body;
    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, userId: req.user._id },
        { isRead: true }
      );
    } else {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true }
      );
    }
    return res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};

/* ---------------- SEND ADMIN NOTIFICATION (ADMIN ONLY) ---------------- */
export const sendAdminNotification = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied. Super Admins only." });
    }
    const { targetUserId, title, message, type } = req.body;
    if (!targetUserId || !title || !message) {
      return res.status(400).json({ message: "targetUserId, title, and message are required" });
    }

    const userExists = await User.findById(targetUserId);
    if (!userExists) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const notif = new Notification({
      userId: targetUserId,
      title,
      message,
      type: type || "general",
    });
    await notif.save();

    emitToAll("db_changed", { type: "notifs" });

    return res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    console.error("Send notification error:", err);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};

/* ---------------- GET ALL NOTIFICATIONS (ADMIN ONLY) ---------------- */
export const getAllNotifications = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied. Super Admins only." });
    }
    const notifications = await Notification.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(notifications);
  } catch (err) {
    console.error("Get all notifications error:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
