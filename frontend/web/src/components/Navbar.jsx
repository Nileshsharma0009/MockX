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
                <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 hidden sm:block truncate max-w-[200px]">
                  {state.exam?.title || (state.exam?.exam ? `${state.exam.exam.toUpperCase()} • Mock Test` : "IMUCET • Mock Test")}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: dynamic section toggles */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/80 rounded-full px-2 py-1 shadow-sm overflow-x-auto max-w-[50vw]">
            {(state.sections && state.sections.length > 0
              ? state.sections
              : [
                  { id: "A", name: "Section A" },
                  { id: "B", name: "Section B" },
                ]
            ).map((sec) => (
              <button
                key={sec.id}
                role="tab"
                aria-selected={state.currentSection === sec.id}
                onClick={() => toggleSection(sec.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors duration-150 text-xs md:text-sm font-medium whitespace-nowrap ${
                  state.currentSection === sec.id
                    ? "bg-[#5c4d7d] text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-slate-200/60"
                }`}
                title={sec.name || `Section ${sec.id}`}
              >
                <span>{sec.name || `Section ${sec.id}`}</span>
              </button>
            ))}
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
