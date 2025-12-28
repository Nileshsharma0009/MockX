import React, { useEffect, useRef } from "react";
import { useTestState, useTestDispatch } from "../context/TestContext.jsx";

export default function Sidebar({ visible = true }) {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const questionStatus = state.currentSection === "A" ? state.questionStatusA : state.questionStatusB;

  const scrollRef = useRef(null);

  const goTo = (i) => dispatch({ type: "SET_INDEX", payload: i });

  useEffect(() => {
    const idx = state.currentIndex;
    const el = document.getElementById(`qbox-${idx}`);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [state.currentIndex]);

  return (
    <aside
      id={`statsSidebar${state.currentSection}`}
      className={`fixed right-6 top-20 z-50 w-64 rounded-lg p-3 bg-white shadow-lg transform transition-transform duration-300
        ${visible ? "translate-x-0" : "translate-x-full"}`}
      aria-label="Question palette"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Question Palette</h3>
        <span className="text-sm text-gray-400">Section {state.currentSection}</span>
      </div>

      {/* Scrollable question grid */}
      <div
        ref={scrollRef}
        role="list"
        className="grid grid-cols-5 gap-2 p-1 overflow-y-auto max-h-[calc(100vh-220px)]"
      >
        {questionStatus.map((s, i) => {
          const isActive = i === state.currentIndex;

          const base =
            "w-9 h-9 flex items-center justify-center rounded-md m-0.5 text-sm font-semibold cursor-pointer select-none border transition-all duration-150";

          // 🎨 Custom color mapping
          const stateClasses = isActive
            ? "bg-[#6c5ce7] text-white border-[#6c5ce7] scale-105 shadow-md"
            : s === "answered"
            ? "bg-[rgb(144,239,144)] text-black border-[rgb(144,239,144)]"
            : s === "review"
            ? "bg-[rgb(233,20,20)] text-[rgb(6,6,6)] border-[2px] border-[darkred]"
            : s === "skipped"
            ? "bg-[rgb(114, 174, 239)] text-black border-[rgb(114, 174, 239)]"
            : "bg-white text-gray-700 border border-transparent hover:border-[#6c5ce7] hover:bg-[#eef2ff]";

          return (
            <div
              key={i}
              id={`qbox-${i}`}
              className={`${base} ${stateClasses}`}
              onClick={() => goTo(i)}
              title={`Question ${i + 1}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") goTo(i);
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>
          Answered:{" "}
          <strong>{questionStatus.filter((x) => x === "answered").length}</strong>
        </div>
        <div>
          Marked:{" "}
          <strong>{questionStatus.filter((x) => x === "review").length}</strong>
        </div>
      </div>

     
    </aside>
  );
}
