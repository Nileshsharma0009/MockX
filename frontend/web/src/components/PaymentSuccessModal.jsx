import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X, Play, Loader2 } from "lucide-react";
import { markNotificationsRead } from "../api/notification";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PaymentSuccessModal({ notification, onClose }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!notification) return null;

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      // Mark notification as read
      await markNotificationsRead(notification._id);
      toast.success("Good luck with your tests!");
      navigate("/mock-tests");
      onClose();
    } catch (err) {
      console.error("Failed to dismiss success notification:", err);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await markNotificationsRead(notification._id);
      onClose();
    } catch (err) {
      console.error("Failed to dismiss success notification:", err);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[9999] animate-in fade-in-30 duration-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6 text-center">
          {/* Success Check Icon Container */}
          <div className="mx-auto w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center relative">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
              {notification.title?.replace("⚡", "") || "Purchase Successful 🎉"}
            </h3>
            <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 border border-emerald-100/60 px-2.5 py-0.5 rounded-full w-fit mx-auto">
              Access Unlocked
            </p>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-xs font-semibold leading-relaxed px-2">
            {notification.message || "Thank you for unlocking premium test mocks! Your purchase has been processed successfully and mock exams are now ready."}
          </p>

          {/* Action Row */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleStart}
              disabled={isProcessing}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  Loading mock tests...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  Start Mock Tests Now
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              disabled={isProcessing}
              className="w-full py-1.5 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 rounded-xl font-extrabold text-[10px] transition-colors active:scale-95"
            >
              Done & Return to Catalog
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
