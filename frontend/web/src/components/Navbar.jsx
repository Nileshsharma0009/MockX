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
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="py-4 px-4 md:px-12">
        <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-4 md:px-6 py-3 shadow-md">
          {/* LEFT: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
            >

            </button>

            <div className="flex items-center gap-2 ml-1">
              <span className="text-2xl"></span>
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-extrabold tracking-tight text-gray-900">MockX</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 hidden sm:block">
                  IMUCET • Mock Test
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: section toggles + dark mode */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/80 rounded-full px-2 py-1 shadow-sm">
            <button
              role="tab"
              aria-selected={state.currentSection === "A"}
              onClick={() => toggleSection("A")}
              className={`px-4 py-2 rounded-full transition-colors duration-150 text-xs md:text-sm font-medium ${state.currentSection === "A"
                ? "bg-[#5c4d7d] text-white shadow-sm"
                : "bg-white text-gray-700"
                }`}
              title="Section A"
            >
              <span className="sm:hidden"> A</span>
              <span className="hidden sm:inline"> A</span>
            </button>

            <button
              role="tab"
              aria-selected={state.currentSection === "B"}
              onClick={() => toggleSection("B")}
              className={`px-4 py-2 rounded-full transition-colors duration-150 text-xs md:text-sm font-medium ${state.currentSection === "B"
                ? "bg-[#5c4d7d] text-white shadow-sm"
                : "bg-white text-gray-700"
                }`}
              title="Section B"
            >
              <span className="sm:hidden"> B</span>
              <span className="hidden sm:inline"> B</span>
            </button>

            {/* <button
              id="darkModeToggle"
              onClick={() => document.body.classList.toggle("dark-mode")}
              className="ml-1 px-3 py-1.5 rounded-full bg-[#5c4d7d] text-white text-xs md:text-sm"
              aria-pressed={document.body.classList.contains("dark-mode")}
              title="Toggle dark mode"
            >
              🌙
            </button> */}
          </div>

          {/* RIGHT: fullscreen + timer */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={enterFullscreen}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-[#5c4d7d] hover:bg-[#43325f] text-white text-xs md:text-sm font-semibold transition"
              aria-label="Enter fullscreen"
            >
              Enter Fullscreen
            </button>

            <div
              id="timer"
              className="min-w-[80px] sm:min-w-[96px] px-3 sm:px-4 py-2 rounded-full bg-[#2e1e2f] text-white text-xs md:text-sm font-semibold text-center"
              aria-live="polite"
              title="Remaining time"
            >
              00:00:00
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
