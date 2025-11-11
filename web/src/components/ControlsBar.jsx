import React from "react";
import { useTestDispatch } from "../context/TestContext.jsx";

export default function ControlsBar({ onSubmit }) {
  const dispatch = useTestDispatch();

  const handleMarkReview = () => dispatch({ type: "MARK_REVIEW" });
  const handleSaveAndNext = () => dispatch({ type: "SAVE_AND_NEXT" });
  const handleSkip = () => dispatch({ type: "SKIP" });
  const handleGoBack = () => dispatch({ type: "GO_BACK" });
  const handleForward = () => dispatch({ type: "SAVE_AND_NEXT" }); // forward same as save&next for now

  // return (
  //   <div
  //     className="controls-bar flex justify-center gap-6 py-4 bg-white border-t shadow-md fixed bottom-0 left-0 right-0 z-40"
  //     role="toolbar"
  //     aria-label="Question controls"
  //   >
  //     <button
  //       className="px-3 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //       onClick={handleMarkReview}
  //       aria-label="Mark for Review"
  //     >
  //       Mark for Review
  //     </button>
  
  //     <button
  //       className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //       onClick={handleGoBack}
  //       aria-label="Previous question"
  //     >
  //       backward
  //     </button>
  
  //     <button
  //       className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //       onClick={handleSaveAndNext}
  //       aria-label="Save and go to next question"
  //     >
  //       Save & Next
  //     </button>
  
  //     <button
  //       className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //       onClick={handleForward}
  //       aria-label="Forward"
  //     >
  //       forward
  //     </button>
  //     <div className="ml-60">
  //   <button
  //     className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200"
  //     onClick={onSubmit}
  //     aria-label="Submit test"
  //   >
  //     Submit
  //   </button>
  // </div>
  //   </div>
  // );
  
  // return (
  //   <div
  //     className="controls-bar fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-md"
  //     role="toolbar"
  //     aria-label="Question controls"
  //     style={{ height: "72px" }} // keeps consistent bar height
  //   >
  //     {/* inner container constrains width and positions elements */}
  //     <div className="max-w-7xl mx-auto h-full px-6 flex items-center relative">
  //       {/* CENTER GROUP - absolutely centered so it remains visually centered */}
  //       <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-4">
  //         <button
  //           className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //           onClick={handleMarkReview}
  //           aria-label="Mark for Review"
  //         >
  //           Mark for Review
  //         </button>

  //         <button
  //           className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //           onClick={handleGoBack}
  //           aria-label="Previous question"
  //         >
  //           backward
  //         </button>

  //         <button
  //           className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //           onClick={handleSaveAndNext}
  //           aria-label="Save and go to next question"
  //         >
  //           Save & Next
  //         </button>

  //         <button
  //           className="px-4 py-2 text-sm bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
  //           onClick={handleForward}
  //           aria-label="Forward"
  //         >
  //           forward
  //         </button>
  //       </div>

  //       {/* Right: Submit button */}
  //       <div className="ml-auto">
  //         <button
  //           className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200"
  //           onClick={onSubmit}
  //           aria-label="Submit test"
  //         >
  //           Submit
  //         </button>
  //       </div>

  //       {/* For accessibility: ensure keyboard users can tab to center group first.
  //           Add invisible left filler so tab order is logical on some browsers. */}
  //       <div className="invisible" aria-hidden="true">
  //         {/* filler keeps center group from being overlapped by left-side content */}
  //       </div>
  //     </div>

  //     {/* Responsive fallback: on very small screens stack controls vertically */}
  //     <style jsx>{`
  //       @media (max-width: 640px) {
  //         .controls-bar > div > .absolute {
  //           position: static !important;
  //           transform: none !important;
  //         }
  //         .controls-bar > div {
  //           flex-direction: column;
  //           gap: 8px;
  //           align-items: center;
  //           justify-content: center;
  //           padding-top: 8px;
  //           padding-bottom: 8px;
  //         }
  //         .controls-bar { height: auto; }
  //         .controls-bar .ml-auto { margin-left: 0 !important; }
  //       }
  //     `}</style>
  //   </div>
  // );  


  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-md flex items-center justify-between px-10 py-3"
      role="toolbar"
      aria-label="Question controls"
    >
      {/* Centered group of control buttons */}
      <div className="flex justify-center gap-4 mx-auto">
        <button
          className="px-4 py-2 text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
          onClick={handleMarkReview}
        >
          Mark for Review
        </button>

        <button
          className="px-4 py-2 text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
          onClick={handleGoBack}
        >
          backward
        </button>

        <button
          className="px-4 py-2 text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
          onClick={handleSaveAndNext}
        >
          Save & Next
        </button>

        <button
          className="px-4 py-2 text-sm font-medium bg-[#5c4d7d] hover:bg-[#43325f] text-white rounded-md transition-all duration-200"
          onClick={handleForward}
        >
          forward
        </button>
      </div>

      {/* Submit button on the far right */}
      <button
        className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200 ml-8"
        onClick={onSubmit}
      >
        Submit
      </button>
    </div>
  );
}
