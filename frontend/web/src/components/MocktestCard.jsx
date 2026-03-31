

import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdRocketLaunch,
  MdLockOpen,
  MdSchedule,
  MdCheckCircle,
  MdAccessTime,
} from "react-icons/md";

const MockTestCard = ({
  id,
  code,
  level,
  title,
  description,
  available,
  date,
  isFree,
  user,
  index = 0,
}) => {
  const navigate = useNavigate();

  const handleStartTest = async () => {
    if (!available) {
      toast(`Available on ${date}`);
      return;
    }

    const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";
    if (!isFree && !user && paymentsEnabled) {
      toast.error("Please login to access premium mocks");
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";
      const res = await fetch(`${API_BASE}/api/mocks/${id}/questions`, {
        credentials: "include",
      });

      if (res.status === 403) {
        toast.error("Please purchase the bundle to unlock");
        return;
      }

      if (!res.ok) throw new Error("Failed to start");
      navigate(`/test?mock=${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Unable to start test. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 350, // All come from the bottom
      x: 0,   
      rotate: (index % 2 === 0) ? -10 : 10, // Overlapping stack effect
      scale: 0.6,
      zIndex: 100 - index
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      zIndex: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 2,
        delay: index * 0.2, // Deals one by one sequentially
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const badgeVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2, yoyo: Infinity },
    },
  };

  const iconVariants = {
    hover: {
      scale: 1.2,
      rotate: 5,
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <motion.div
      className="group flex flex-col h-full"
      variants={containerVariants}
      whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3, type: "spring" } }}
    >
      <div className="relative flex flex-col h-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
        
        {/* Animated Top Banner with Gradient Glow */}
        <motion.div 
          className="h-1.5 w-full bg-gradient-to-r from-slate-50 via-blue-400/60 to-slate-50 group-hover:from-blue-500 group-hover:to-blue-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Floating Shine Effect */}
        <motion.div 
          className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-white/20 to-transparent rounded-full blur-xl"
          animate={{ 
            x: [0, 20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="p-6 flex flex-col flex-grow relative z-10">
          
          {/* Animated Badge Row */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            variants={itemVariants}
          >
            <motion.div 
              className="flex gap-2"
              whileHover="hover"
            >
              <motion.span
                className="relative text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg uppercase shadow-sm border border-slate-200/50"
                variants={badgeVariants}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent rounded-lg -skew-x-12"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {code || `MT-${String(id).padStart(2, "0")}`}
              </motion.span>
              {level && (
                <motion.span
                  className="relative text-[10px] font-bold tracking-wider text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1.5 rounded-lg uppercase shadow-sm border border-blue-100/50"
                  whileHover={{ scale: 1.08, y: -1 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-lg opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                  {level}
                </motion.span>
              )}
            </motion.div>
            
            <AnimatePresence>
              {isFree && (
                <motion.span 
                  className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50/90 px-3 py-1.5 rounded-full shadow-sm border border-emerald-100/50 backdrop-blur-sm"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <motion.span 
                    className="h-2 w-2 rounded-full bg-emerald-500"
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity 
                    }}
                  />
                  FREE ACCESS
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Content Section with Staggered Animation */}
          <motion.div className="mb-8" variants={itemVariants}>
            <motion.h3 
              className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight mb-3 group-hover:from-blue-600 group-hover:to-blue-500"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
            <motion.p 
              className="text-sm text-slate-500/90 leading-relaxed line-clamp-2 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>
          </motion.div>

          {/* Meta Info with Slide Up */}
          <motion.div 
            className="mt-auto pt-6 border-t border-slate-100/60 flex items-center justify-between backdrop-blur-sm"
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col">
              <motion.span 
                className="text-[11px] text-slate-400 uppercase font-medium tracking-wider"
                whileHover={{ scale: 1.05 }}
              >
                Status
              </motion.span>
              <motion.span 
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  available 
                    ? "text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full" 
                    : "text-slate-700"
                }`}
                whileHover={{ scale: 1.02 }}
              >
                {available ? <MdCheckCircle className="w-3.5 h-3.5" /> : <MdSchedule className="w-3.5 h-3.5" />}
                <span>{available ? "Open for Entry" : "Coming Soon"}</span>
              </motion.span>
            </div>
            {!available && (
              <motion.div 
                className="text-right"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Date</span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-gradient-to-r from-slate-100 to-slate-200 px-2 py-1 rounded-lg mt-1">
                  <MdAccessTime className="w-3 h-3" />
                  {date}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced Action Button */}
          <motion.div className="mt-8" variants={itemVariants}>
            <AnimatePresence mode="wait">
              {available ? (
                isFree || user?.hasPurchasedBundle ? (
                  <motion.button
                    key="start"
                    onClick={handleStartTest}
                    className="group/btn relative w-full py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 border border-slate-800/50 overflow-hidden active:scale-[0.97]"
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover/btn:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <motion.div variants={iconVariants} whileHover="hover" whileTap="tap">
                        <MdRocketLaunch className="w-4 h-4 group-hover/btn:text-blue-300" />
                      </motion.div>
                      Start Now
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    key="unlock"
                    onClick={() => navigate("/mock-tests")}
                    className="group/btn relative w-full py-4 border-2 border-slate-900/80 text-slate-900 hover:text-white rounded-2xl font-bold text-sm transition-all overflow-hidden bg-white hover:bg-slate-900 shadow-lg hover:shadow-2xl active:scale-[0.97]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-700 opacity-0 group-hover/btn:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <motion.div variants={iconVariants} whileHover="hover" whileTap="tap">
                        <MdLockOpen className="w-4 h-4 group-hover/btn:text-blue-300" />
                      </motion.div>
                      Unlock Premium
                    </span>
                  </motion.button>
                )
              ) : (
                <motion.button
                  key="waitlist"
                  disabled
                  className="group relative w-full py-4 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-400 border border-slate-200/50 rounded-2xl font-bold text-sm shadow-sm cursor-not-allowed backdrop-blur-sm"
                  whileHover={{ scale: 1.01 }}
                >
                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-2xl opacity-40 animate-pulse"
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <MdSchedule className="w-4 h-4 animate-pulse" />
                    Waitlist Active
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom Glow Effect */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-500/5 to-transparent"
          animate={{ height: ["20px", "40px", "20px"] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
      </div>
    </motion.div>
  );
};

export default MockTestCard;