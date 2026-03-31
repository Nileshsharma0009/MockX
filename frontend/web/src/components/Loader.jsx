import React from "react";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-white/95 via-slate-50/90 to-slate-100/80 backdrop-blur-xl">
      
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-slate-200/40 to-transparent" />

      <div className="relative flex flex-col items-center space-y-10 p-8">
        
        {/* 🎨 ENHANCED CIRCULAR SYSTEM */}
        <div className="relative">
          
          {/* Outer breathing ring */}
          <motion.div
            className="absolute inset-0 w-28 h-28 border-4 border-slate-200/60 rounded-full"
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main spinner container */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            
            {/* Track ring */}
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full shadow-inner" />
            
            {/* Rotating arc - gradient border */}
            <motion.div
              className="absolute inset-1 border-4 border-transparent rounded-full border-t-[linear-gradient(90deg,#64748b_0%,#475569_50%,transparent_100%)]"
              animate={{ rotate: "360deg" }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Secondary counter-rotate arc */}
            <motion.div
              className="absolute inset-2 border-2 border-transparent rounded-full border-t-slate-400 border-b-slate-400"
              animate={{ rotate: "-180deg" }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />

            {/* Pulsing core */}
            <motion.div
              className="relative w-8 h-8 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-full shadow-lg"
              animate={{ 
                scale: [1, 1.25, 1],
                boxShadow: [
                  "0 0 12px rgba(71,85,105,0.4)",
                  "0 0 24px rgba(71,85,105,0.6)",
                  "0 0 12px rgba(71,85,105,0.4)"
                ]
              }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Inner spark */}
              <motion.div
                className="absolute inset-1 bg-white/90 rounded-full shadow-md"
                animate={{ scale: [1, 1.6, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
            </motion.div>
          </div>

          {/* Orbiting accent dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-slate-500/80 rounded-full shadow-md"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  x: `${Math.cos((i * 90) * Math.PI / 180) * 48}px`,
                  y: `${Math.sin((i * 90) * Math.PI / 180) * 48}px`,
                }}
                animate={{ rotate: "360deg" }}
                transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "linear" }}
              />
            ))}
          </div>
        </div>

        {/* 🎯 PREMIUM TYPOGRAPHY */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          {/* Logo */}
          <motion.h2 
            className="text-4xl md:text-5xl font-black tracking-[0.3em] uppercase bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900/80 bg-clip-text text-transparent drop-shadow-lg"
            animate={{ 
              scale: [1, 1.02, 1],
              y: [0, -2, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Mock<span className="text-slate-700 font-black tracking-normal">X</span>
          </motion.h2>

          {/* Loading states */}
          <div className="flex items-center space-x-2">
            {["Loading", "Ready", "Live"].map((state, i) => (
              <motion.span
                key={state}
                className="text-lg font-medium text-slate-600 tracking-wider uppercase"
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: i === 0 ? 1 : 0.3,
                  scale: i === 0 ? [1, 1.05, 1] : 1
                }}
                transition={{ 
                  duration: 0.4, 
                  delay: i * 0.4,
                  repeat: Infinity 
                }}
              >
                {state}
              </motion.span>
            ))}
          </div>

          {/* Micro progress dots */}
          <div className="flex items-center justify-center space-x-1.5 pt-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-slate-400/70 rounded-full shadow-sm"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  delay: i * 0.15 
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Subtle bottom shadow */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-200/50 rounded-full blur-sm -skew-x-12 animate-pulse" />
      </div>
    </div>
  );
};

export default Loader;
