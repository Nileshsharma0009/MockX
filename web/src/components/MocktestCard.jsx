import React from "react";
import { useNavigate } from "react-router-dom";

const MockTestCard = ({ id, emoji, code, level, title, description, available, date }) => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      alert("Please register first to start the test");
      return;
    }

    if (!available) {
      alert(`⏳ ${title} will be available on ${date}`);
      return;
    }

    // Navigate to test page with mock number
    navigate(`/test?mock=${id}`);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1 text-center border border-gray-100">
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="inline-flex items-center justify-center rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-4 py-2 text-sm font-semibold tracking-[0.18em] uppercase">
          {code || `MT-${String(id).padStart(2, "0")}`}
        </div>
        {level && (
          <span className="text-[11px] font-medium text-sky-600 uppercase tracking-[0.18em]">
            {level}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 mb-6 text-sm leading-relaxed">{description}</p>

      {available ? (
     <button
     onClick={handleStartTest}
     className="bg-white/30 backdrop-blur-md text-sky-700 font-semibold px-6 py-3 rounded-full border border-sky-200 shadow-sm hover:bg-sky-50 transition text-sm"
   >
     Start Test
   </button>
   
      ) : (
        <button
          disabled
          className="bg-gray-200 text-gray-600 px-6 py-3 rounded-full cursor-not-allowed shadow-sm text-sm"
        >
          Available on {date}
        </button>
      )}
    </div>
  );
};

export default MockTestCard;
