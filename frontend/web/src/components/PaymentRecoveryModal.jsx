import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CreditCard, ChevronRight, Loader2, BellRing, UserMinus, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import exams from "../data/SelectExam";
import { createOrder, verifyPayment } from "../api/payment";
import { markNotificationsRead } from "../api/notification";
import { postRecoveryAction } from "../api/paymentRecovery";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function PaymentRecoveryModal({ notification, onClose }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const parseInlineStyles = (text) => {
    if (typeof text !== "string") return text;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const splitText = text.split(regex);
    
    return splitText.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const cleanMessage = (text) => {
    if (!text) return "";
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "");
    const markers = [
      "word count",
      "wordcheck",
      "self-correction",
      "verification during",
      "output matches",
      "constraints met",
      "âœ…",
      "proceed. output"
    ];
    let lowestIndex = cleaned.length;
    const lowerCleaned = cleaned.toLowerCase();
    for (const marker of markers) {
      const idx = lowerCleaned.indexOf(marker);
      if (idx !== -1 && idx < lowestIndex) {
        lowestIndex = idx;
      }
    }
    cleaned = cleaned.slice(0, lowestIndex).trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) cleaned = cleaned.slice(1, -1);
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) cleaned = cleaned.slice(1, -1);
    return cleaned.trim();
  };

  if (!notification || !notification.metadata) return null;

  const mockId = notification.metadata.mockId || notification.metadata.examId || "unknown";
  const { amount } = notification.metadata;
  const currency = notification.metadata.currency;
  const amountLabel = currency && Number.isFinite(Number(amount))
    ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount))
    : String(amount ?? "");
  const isAlreadyPurchased = user?.purchasedExams?.includes(mockId);

  const handleStartMocks = async () => {
    setIsProcessing(true);
    try {
      await markNotificationsRead(notification._id);
      toast.success("Welcome back! Loading your unlocked mock tests.");
      navigate("/v2/mock-tests");
      onClose();
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Find matching exam metadata for rich details
  const exam = exams.find((e) => e.id === mockId);
  const examName = exam?.fullName || mockId.toUpperCase();

  const handleRetry = async () => {
    setIsProcessing(true);
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error("Payment configuration error. Key missing.");
        return;
      }

      // Initiate order creation
      const res = await createOrder({ examId: mockId });
      if (!res?.data?.id) {
        toast.error("Failed to create retry checkout order");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: res.data.amount,
        currency: res.data.currency,
        order_id: res.data.id,
        name: res.data.notes?.productName || "Payment",
        description: res.data.notes?.productName || "",
        handler: async function (response) {
          try {
            // Verify payment on backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Mark this specific failure notification as read
            await markNotificationsRead(notification._id);

            toast.success("Payment completed successfully! Access granted.");
            await refreshUser();
            onClose();
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            toast.error("Verification failed. Please contact support.");
          }
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.log("Retry checkout failed:", response.error.description);
      });

      rzp.open();

      // Mark the recovery alert as read so it doesn't pop up again
      await markNotificationsRead(notification._id);
      onClose();
    } catch (err) {
      console.error("Retry checkout error:", err);
      const errMsg = err.response?.data?.message || "Could not initiate checkout. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    try {
      // Mark notification as read so it won't prompt the user again
      await markNotificationsRead(notification._id);
      onClose();
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      onClose();
    }
  };

  const handleRemindLater = async () => {
    setIsProcessing(true);
    try {
      const refId = notification.metadata.transactionId || notification.metadata.orderId;
      await postRecoveryAction({ transactionId: refId, action: "REMIND_LATER" });
      await markNotificationsRead(notification._id);
      toast.success("Got it! We will remind you later.");
      onClose();
    } catch (err) {
      console.error("Remind me later error:", err);
      toast.error("Failed to set reminder. Dismissing modal.");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotInterested = async () => {
    setIsProcessing(true);
    try {
      const refId = notification.metadata.transactionId || notification.metadata.orderId;
      await postRecoveryAction({ transactionId: refId, action: "NOT_INTERESTED" });
      await markNotificationsRead(notification._id);
      toast.success("Understood. We will stop sending recovery alerts.");
      onClose();
    } catch (err) {
      console.error("Not interested error:", err);
      toast.error("Failed to update preferences. Dismissing modal.");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60  flex items-center justify-center p-4 z-[9999] animate-in fade-in-30 duration-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          title="Dismiss Alert"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-5 text-center">
          {/* Warning Icon Container */}
          {/* <div className="mx-auto w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            {/* <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" /> */}
          {/* </div> */} 

          {/* Heading */}
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              {notification.title?.replace("âš¡", "") || "Complete Your Checkout"}
            </h3>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Razor -AI
            </p>
          </div>

          {/* AI Personalized Message Bubble */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 text-left relative shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Special Offer For You
            </div>
            <p className="text-[14.5px] text-slate-700 leading-relaxed font-semibold">
              {parseInlineStyles(cleanMessage(notification.message))}
            </p>
          </div>

          {/* Order Details Invoice Card */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4.5 text-left space-y-3 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Order Summary</span>
              {notification.metadata.orderId && (
                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  ID: {notification.metadata.orderId.substring(0, 15)}...
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-slate-900">{examName}</h4>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{mockId.toUpperCase()} exam bundle</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">{amountLabel}</span>
                <p className="text-[8px] text-emerald-600 font-bold">Unlocks immediately</p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-2.5 pt-1">
            {isAlreadyPurchased ? (
              <button
                onClick={handleStartMocks}
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                    Accessing Mocks...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Access Your Mock Tests Now
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRetry}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                    Initiating Checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Continue Payment & Access Mocks
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </>
                )}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleRemindLater}
                disabled={isProcessing}
                className="py-2.5 px-2 border border-slate-200 hover:bg-slate-50/70 text-slate-600 rounded-xl font-extrabold text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5 text-slate-400" />
                Remind Me Later
              </button>
              <button
                onClick={handleNotInterested}
                disabled={isProcessing}
                className="py-2.5 px-2 border border-slate-200 hover:bg-slate-50/70 text-slate-500 hover:text-rose-600 rounded-xl font-extrabold text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5 text-slate-400" />
                Not Interested
              </button>
            </div>
            <button
              onClick={handleDismiss}
              disabled={isProcessing}
              className="w-full py-1.5 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 rounded-xl font-extrabold text-[10px] transition-colors active:scale-95"
            >
              Dismiss & Continue Browsing
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
