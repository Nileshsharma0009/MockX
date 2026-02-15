import React, { useState } from "react";
import { useTestDispatch } from "../context/TestContext.jsx";

export default function ControlsBar({ onSubmit }) {
  const dispatch = useTestDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleMarkReview = () => dispatch({ type: "MARK_REVIEW" });
  const handleSaveAndNext = () => dispatch({ type: "SAVE_AND_NEXT" });
  const handleGoBack = () => dispatch({ type: "GO_BACK" });
  const handleForward = () => dispatch({ type: "SAVE_AND_NEXT" });

  const handleSubmitClick = async () => {
    // console.log("🟢 SUBMIT BUTTON CLICKED (ControlsBar)");
    if (submitting) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit the test?\nYou cannot change answers after submission."
    );

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit(); // 🔥 real submit happens in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-md flex items-center justify-between px-2 py-2 md:px-10 md:py-3"
      role="toolbar"
      aria-label="Question controls"
    >
      {/* Center buttons */}
      <div className="flex justify-center gap-2 md:gap-4 mx-auto">
        <button
          className="px-2 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md whitespace-nowrap"
          onClick={handleMarkReview}
        >
          Review
        </button>

        <button
          className="px-2 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md"
          onClick={handleGoBack}
        >
          Prev
        </button>

        <button
          className="px-2 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md whitespace-nowrap"
          onClick={handleSaveAndNext}
        >
          Save & Next
        </button>

        <button
          className="px-2 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md"
          onClick={handleForward}
        >
          Next
        </button>
      </div>

      {/* Submit button */}
      <button
        className={`px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm font-medium text-white rounded-md transition-all duration-200 ml-2 md:ml-8 ${submitting
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
          }`}
        onClick={handleSubmitClick}
        disabled={submitting}

      >
        {submitting ? "..." : "Submit"}
      </button>
    </div>
  );
}
