import api from "./api";

export const fetchNotifications = () => {
  return api.get("/notifications");
};

export const markNotificationsRead = (notificationId = null) => {
  return api.post("/notifications/mark-read", { notificationId });
};

export const sendNotification = ({ targetUserId, title, message, type }) => {
  return api.post("/notifications/send", { targetUserId, title, message, type });
};

export const fetchAllNotifications = () => {
  return api.get("/notifications/all");
};
