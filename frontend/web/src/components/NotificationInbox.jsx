import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Bell, MailOpen, Mail, Check, CreditCard, 
  ShieldAlert, Sparkles, X, CheckCheck, Loader2 
} from "lucide-react";
import { fetchNotifications, markNotificationsRead } from "../api/notification";
import toast from "react-hot-toast";
import PaymentRecoveryModal from "./PaymentRecoveryModal";
import PaymentSuccessModal from "./PaymentSuccessModal";
import { io } from "socket.io-client";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRecovery, setActiveRecovery] = useState(null);
  const [activeSuccess, setActiveSuccess] = useState(null);
  const dropdownRef = useRef(null);

  const getNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchNotifications();
      if (res?.data) {
        setNotifications(res.data);
        const failedPay = res.data.find((n) => !n.isRead && n.type === "payment_failed");
        const successPay = res.data.find((n) => !n.isRead && n.type === "purchase");

        if (successPay) {
          setActiveRecovery(null);
          setActiveSuccess(successPay);
        } else if (failedPay) {
          setActiveRecovery(failedPay);
        } else {
          setActiveRecovery(null);
          setActiveSuccess(null);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    getNotifications();

    const socketUrl = import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";
    const socket = io(socketUrl, {
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to notifications sync via WebSockets");
    });

    socket.on("db_changed", (data) => {
      if (data.type === "notifs") {
        console.log("🔔 Socket notified of new notification event");
        getNotifications(true);
      }
    });

    const handleCheckNotifications = () => {
      getNotifications(true);
    };

    window.addEventListener("check_notifications", handleCheckNotifications);

    // Poll every 30s for new notifications (fallback)
    const interval = setInterval(() => {
      getNotifications(true);
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
      window.removeEventListener("check_notifications", handleCheckNotifications);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      getNotifications(true);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    e.stopPropagation(); // Avoid closing dropdown if we click mark read
    try {
      await markNotificationsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "purchase":
        return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>;
      case "payment_failed":
        return <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ShieldAlert className="w-4 h-4" /></div>;
      case "agent":
        return <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Sparkles className="w-4 h-4" /></div>;
      case "support":
        return <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><ShieldAlert className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Mail className="w-4 h-4" /></div>;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 600);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 bg-rose-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 origin-top-right">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">Inbox Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Checking updates...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl mb-3">
                  <MailOpen className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Any purchase logs or helper alerts will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 flex gap-3 hover:bg-slate-50/50 transition-colors ${
                    !notif.isRead ? "bg-indigo-50/10" : ""
                  }`}
                >
                  {getNotificationIcon(notif.type)}
                  
                  <div className="flex-grow space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-extrabold text-slate-900 leading-tight ${!notif.isRead ? "font-black" : ""}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkSingleRead(notif._id, e)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 h-fit self-center transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Payment Failure Warning Modal Overlay */}
      {activeRecovery && createPortal(
        <PaymentRecoveryModal
          notification={activeRecovery}
          onClose={() => {
            setActiveRecovery(null);
            getNotifications(true);
          }}
        />,
        document.body
      )}

      {/* Payment Success Modal Overlay */}
      {activeSuccess && createPortal(
        <PaymentSuccessModal
          notification={activeSuccess}
          onClose={() => {
            setActiveSuccess(null);
            getNotifications(true);
          }}
        />,
        document.body
      )}
    </div>
  );
}
