import React, { useEffect, useState } from "react";
import { useTestState, useTestDispatch } from "../context/TestContext.jsx";

export default function QuestionPanel() {
  const state = useTestState();
  const dispatch = useTestDispatch();

  const [showFullImage, setShowFullImage] = useState(false);
  const [showFullParagraph, setShowFullParagraph] = useState(false);

  const setSelected = (i) =>
    dispatch({ type: "SET_SELECTED", payload: i });

  // Current question set by section
  const currentSet =
    state.currentSection === "A" ? state.fullSetA : state.fullSetB;

  const totalQuestions = currentSet.length;

  const sel =
    state.currentSection === "A"
      ? state.selectedOptionsA[state.currentIndex]
      : state.selectedOptionsB[state.currentIndex];

  const q = currentSet[state.currentIndex] || null;

  // Backward-compatible image field
  const imageSrc = q?.imageUrl || q?.image || null;

  /* ================= Keyboard shortcuts ================= */
  useEffect(() => {
    const onKey = (e) => {
      if (!q) return;

      const key = e.key.toLowerCase();

      if (["a", "b", "c", "d"].includes(key)) {
        const idx = key.charCodeAt(0) - "a".charCodeAt(0);
        if (q.options && idx < q.options.length) {
          setSelected(idx);
        }
      } else if (e.key === "ArrowLeft") {
        dispatch({ type: "GO_BACK" });
      } else if (e.key === "ArrowRight") {
        dispatch({ type: "SAVE_AND_NEXT" });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, dispatch]);

  /* ============ Close modals on navigation ============ */
  useEffect(() => {
    setShowFullImage(false);
    setShowFullParagraph(false);
  }, [state.currentIndex, state.currentSection]);

  /* ============ Guard: no question yet ============ */
  if (!q) {
    return (
      <div className="mt-24 p-8 text-center text-gray-500">
        Loading questions...
      </div>
    );
  }

  return (
    <main className="flex flex-col justify-center items-center min-h-[80vh] px-6 md:px-20 bg-white">
      <div className="w-full max-w-4xl text-left">

        {/* ================= Header ================= */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Question {state.currentIndex + 1} of {totalQuestions}
        </h2>

        {/* ================= Paragraph ================= */}
        {q.paragraph && (
          <div className="mb-6">
            <div className="p-4 bg-gray-50 rounded-md text-gray-700 shadow-sm leading-relaxed max-h-40 overflow-hidden relative">
              <p className="line-clamp-4">{q.paragraph}</p>
              <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-gray-50 to-transparent" />
            </div>

            <button
              onClick={() => setShowFullParagraph(true)}
              className="mt-2 text-sm font-medium text-violet-700 hover:text-violet-900"
            >
              Show Full Paragraph
            </button>
          </div>
        )}

        {/* ================= Paragraph Modal ================= */}
        {showFullParagraph && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[90%] max-w-2xl max-h-[80vh] rounded-xl shadow-xl p-6 overflow-auto">
              <h3 className="text-xl font-bold mb-4">
                Reading Passage
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {q.paragraph}
              </p>
              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowFullParagraph(false)}
                  className="px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= Image ================= */}
        {imageSrc && (
          <div className="flex justify-center items-center mt-2 mb-4">
            <div className="border border-gray-200 rounded-lg shadow-sm w-[350px] h-[250px] bg-white overflow-hidden">
              <img
                src={imageSrc}
                alt="Question diagram"
                className="object-contain w-full h-full cursor-pointer"
                onClick={() => setShowFullImage(true)}
              />
            </div>
          </div>
        )}

        {/* ================= Image Modal ================= */}
        {showFullImage && imageSrc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative">
              <img
                src={imageSrc}
                alt="Full diagram"
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
              />
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute top-3 right-3 bg-white px-3 py-1 rounded-md shadow font-semibold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ================= Question ================= */}
        <p className="mb-8 text-lg text-gray-800">
          {q.question}
        </p>

        {/* ================= Options ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {q.options.map((opt, idx) => {
            const isSelected = sel === idx;

            return (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition
                  ${
                    isSelected
                      ? "bg-violet-100 border-violet-600 text-violet-900"
                      : "bg-violet-50 border-violet-200 hover:border-violet-400"
                  }`}
              >
                <span className="font-semibold">
                  {String.fromCharCode(65 + idx)})
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
