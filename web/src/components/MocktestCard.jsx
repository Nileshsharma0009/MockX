import React from "react";
import { useNavigate } from "react-router-dom";

const MockTestCard = ({ id, emoji, title, description, available, date }) => {
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
      <div className="text-4xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 mb-6 text-sm leading-relaxed">{description}</p>

      {available ? (
        <button
          onClick={handleStartTest}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-full shadow hover:shadow-lg text-sm hover:-translate-y-[2px] transition"
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
