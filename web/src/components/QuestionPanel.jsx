import React, { useEffect } from "react";
import { useTestState, useTestDispatch } from "../context/TestContext.jsx";

export default function QuestionPanel() {
  const state = useTestState();
  const dispatch = useTestDispatch();

  const setSelected = (i) => dispatch({ type: "SET_SELECTED", payload: i });

  const currentSet = state.currentSection === "A" ? state.fullSetA : state.fullSetB;
  const sel = state.currentSection === "A" ? state.selectedOptionsA[state.currentIndex] : state.selectedOptionsB[state.currentIndex];
  const q = currentSet[state.currentIndex] || null;

  // Keyboard shortcuts: A/B/C/D to pick options; Left/Right for nav
  useEffect(() => {
    const onKey = (e) => {
      if (!q) return;
      const key = e.key.toLowerCase();
      if (key === "a" || key === "b" || key === "c" || key === "d") {
        const idx = key.charCodeAt(0) - "a".charCodeAt(0);
        if (q.options && idx < q.options.length) setSelected(idx);
      } else if (e.key === "ArrowLeft") {
        dispatch({ type: "GO_BACK" });
      } else if (e.key === "ArrowRight") {
        dispatch({ type: "SAVE_AND_NEXT" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, dispatch]);

  if (!q) {
    return <div id="questionsPanel" className="mt-24 p-8 text-center text-gray-500">Loading questions...</div>;
  }

  return (
    <main
      id="questionsPanel"
      className="flex flex-col justify-center items-center min-h-[80vh] px-6 md:px-20 bg-white"
    >
      <div className="w-full max-w-4xl text-left">
        {/* Question title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Question {state.currentIndex + 1} of {state.totalQuestions}
        </h2>
  
        {/* Optional paragraph (like reading passage) */}
        {q.paragraph && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md text-gray-700 shadow-sm leading-relaxed"> 
          style={{ width: "200px" }}
            {q.paragraph}
          </div>
        )}
  
        {/* Question text */}
        <p className="mb-20 text-lg text-gray-800 leading-relaxed">
          {q.question}
        </p>
  
        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {q.options.map((opt, idx) => {
            const isSelected = sel === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`
                  flex items-center gap-3 px-4 py-3 w-full rounded-xl border-2 
                  transition-all duration-200 font-medium text-left
                  ${isSelected
                    ? "bg-violet-100 border-violet-600 text-violet-900 shadow-sm"
                    : "bg-violet-50 hover:bg-violet-100 border-violet-200 text-gray-800 hover:border-violet-400"
                  }
                `}
                aria-pressed={isSelected}
              >
                <span className="text-violet-800 font-semibold">{String.fromCharCode(65 + idx)})</span>
                <span className="text-base">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
  
}
