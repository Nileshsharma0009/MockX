import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const MockTestCard = ({ id, emoji, code, level, title, description, available, date, isFree, user }) => {
  const navigate = useNavigate();



  const handleStartTest = async () => {
    if (!available) {
      toast(`⏳ ${title} will be available on ${date}`);
      return;
    }

    // 🔐 LOGIN CHECK (only for paid mocks, if payments are enabled)
    const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";

    if (!isFree && !user && paymentsEnabled) {
      toast.error("Please login or register to access paid mocks");
      return;
    }

    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

      const res = await fetch(
        `${API_BASE}/api/mocks/${id}/questions`,
        {
          credentials: "include",
        }
      );

      if (res.status === 403) {
        toast.error("🔒 Please purchase the bundle to unlock this mock");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to start test");
      }

      navigate(`/test?mock=${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Unable to start test. Please try again.");
    }
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
        isFree || user?.hasPurchasedBundle ? (
          <button
            onClick={handleStartTest}
            className="bg-white/30 backdrop-blur-md text-sky-700 font-semibold px-6 py-3 rounded-full border border-sky-200"
          >
            Start Test
          </button>
        ) : (
          <button
            onClick={() => navigate("/mock-tests")}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full"
          >
            🔒 Buy to Unlock
          </button>
        )
      ) : (
        <button disabled className="bg-gray-200 px-6 py-3 rounded-full">
          Available on {date}
        </button>
      )}

    </div>
  );
};

export default MockTestCard;
