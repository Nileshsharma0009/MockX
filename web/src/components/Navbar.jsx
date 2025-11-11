import React from "react";
import { useTestState, useTestDispatch } from "../context/TestContext.jsx";

export default function Navbar({ onToggleSidebar }) {
  const state = useTestState();
  const dispatch = useTestDispatch();

  const toggleSection = (s) => dispatch({ type: "SET_SECTION", payload: s });

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
        <div className="relative h-full flex items-center">
          {/* LEFT: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
            >
              ☰
            </button>

            <div className="flex items-center gap-2 ml-1">
              <span className="text-xl">🎓</span>
              <span className="font-semibold text-base md:text-lg text-gray-900">IMU-MOCK</span>
            </div>
          </div>

          {/* CENTER: absolute centered group (A B moon) */}
          <div className="absolute inset-x-0 left-0 right-0 flex justify-center pointer-events-none">
            {/* pointer-events-none prevents center from blocking clicks on left/right; inner group re-enables it */}
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                role="tab"
                aria-selected={state.currentSection === "A"}
                onClick={() => toggleSection("A")}
                className={`px-3 py-2 rounded-full transition-colors duration-150 text-sm font-medium ${
                  state.currentSection === "A"
                    ? "bg-[#5c4d7d] text-white"
                    : "bg-slate-100 text-gray-700"
                }`}
                title="Section A"
              >
                A
              </button>

              <button
                role="tab"
                aria-selected={state.currentSection === "B"}
                onClick={() => toggleSection("B")}
                className={`px-3 py-2 rounded-full transition-colors duration-150 text-sm font-medium ${
                  state.currentSection === "B"
                    ? "bg-[#5c4d7d] text-white"
                    : "bg-slate-100 text-gray-700"
                }`}
                title="Section B"
              >
                B
              </button>

              <button
                id="darkModeToggle"
                onClick={() => document.body.classList.toggle("dark-mode")}
                className="px-3 py-2 rounded-full bg-[#5c4d7d] text-white text-sm"
                aria-pressed={document.body.classList.contains("dark-mode")}
                title="Toggle dark mode"
              >
                🌙
              </button>
            </div>
          </div>

          {/* RIGHT: fullscreen + timer */}
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={enterFullscreen}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-[#5c4d7d] hover:bg-[#43325f] text-white text-sm font-semibold transition"
              aria-label="Enter fullscreen"
            >
              Enter Fullscreen
            </button>

            <div
              id="timer"
              className="min-w-[96px] px-4 py-[6px] rounded-full bg-[#2e1e2f] text-white text-sm font-medium text-center"
              aria-live="polite"
              title="Remaining time"
            >
              00:00:00
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
