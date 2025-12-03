// src/components/StatsToggleFab.jsx
import React from "react";

export default function StatsToggleFab({ open, onToggle }) {
  return (
    <button
      id="statsToggleBtn"
      onClick={onToggle}
      className={`fixed right-6 top-1/2 z-60 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200
        ${open ?" bg-[#5c4d7d]  translate-x-[-270px]" : "bg-[#5c4d7d]"}
      `}
      aria-pressed={open}
      title="Toggle question palette"
    >
      {open ? "❌" : "📊"}
    </button>
  );
}
