import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const MockTestCard = ({
  id,
  code,
  level,
  title,
  description,
  available,
  date,
  isFree,
  user,
}) => {
  const navigate = useNavigate();

  const handleStartTest = async () => {
    if (!available) {
      toast(`Available on ${date}`);
      return;
    }

    const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";
    if (!isFree && !user && paymentsEnabled) {
      toast.error("Please login to access premium mocks");
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";
      const res = await fetch(`${API_BASE}/api/mocks/${id}/questions`, {
        credentials: "include",
      });

      if (res.status === 403) {
        toast.error("Please purchase the bundle to unlock");
        return;
      }

      if (!res.ok) throw new Error("Failed to start");
      navigate(`/test?mock=${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Unable to start test. Please try again.");
    }
  };

  return (
    <div className="group flex flex-col h-full bg-white border border-slate-200 rounded-2xl transition-all duration-300 hover:border-blue-400 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
      
      {/* Top Banner Area (Optional context color) */}
      <div className="h-1.5 w-full bg-slate-50 group-hover:bg-blue-500 transition-colors duration-300" />

      <div className="p-6 flex flex-col flex-grow">
        
        {/* Badge Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">
              {code || `MT-${String(id).padStart(2, "0")}`}
            </span>
            {level && (
              <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                {level}
              </span>
            )}
          </div>
          
          {isFree && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FREE ACCESS
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Status</span>
                <span className="text-sm font-semibold text-slate-700">
                    {available ? "Open for Entry" : "Coming Soon"}
                </span>
            </div>
            {!available && (
               <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Date</span>
                  <span className="block text-sm font-semibold text-slate-700">{date}</span>
               </div>
            )}
        </div>

        {/* Action Button */}
        <div className="mt-5">
          {available ? (
            isFree || user?.hasPurchasedBundle ? (
              <button
                onClick={handleStartTest}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] hover:bg-blue-600 shadow-sm"
              >
                Start Now
              </button>
            ) : (
              <button
                onClick={() => navigate("/mock-tests")}
                className="w-full py-3.5 border-2 border-slate-900 text-slate-900 rounded-xl font-bold text-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Unlock Premium
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-3.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl font-bold text-sm cursor-not-allowed"
            >
              Waitlist Active
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestCard;