import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

const SUBJECTS = {
  eng: { name: "English" },
  gk: { name: "GK" },
  apt: { name: "Aptitude" },
  phy: { name: "Physics" },
  chem: { name: "Chemistry" },
  math: { name: "Maths" },
};

const ResultDetail = () => {
  const { mockId } = useParams(); // 🔑 imu1, imu2
  const navigate = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH RESULT ---------------- */
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetch(`${API_BASE}/api/results/${mockId}/best`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("No result");
        return r.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mockId, user, navigate]);

  /* ---------------- SUBJECT STATS ---------------- */
  const subjectStats = useMemo(() => {
    if (!result?.answers) return null;

    const stats = {};
    Object.keys(SUBJECTS).forEach((s) => {
      stats[s] = { attempted: 0, correct: 0 };
    });

    Object.entries(result.answers).forEach(([qid, value]) => {
      const subject = qid.split("-")[2];
      if (!stats[subject]) return;

      stats[subject].attempted++;
      if (value === 1) stats[subject].correct++;
    });

    return stats;
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading result…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
        <p>No result found for this mock.</p>
        <button
          onClick={() => navigate("/result-history")}
          className="mt-4 text-indigo-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Result – {mockId.toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500">
              Attempted on{" "}
              {new Date(result.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => navigate("/result-history")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Score" value={`${result.score} / ${result.total}`} />
          <Stat label="Section A" value={result.sectionScores?.A ?? 0} />
          <Stat label="Section B" value={result.sectionScores?.B ?? 0} />
          <Stat
            label="Accuracy"
            value={`${Math.round(
              (result.score / result.total) * 100
            )}%`}
          />
        </div>

        {/* SUBJECT BREAKDOWN */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Subject-wise Performance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectStats &&
              Object.entries(subjectStats).map(([key, stat]) => {
                const accuracy = stat.attempted
                  ? Math.round((stat.correct / stat.attempted) * 100)
                  : 0;

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border p-4"
                  >
                    <div className="flex justify-between text-sm font-medium">
                      <span>{SUBJECTS[key].name}</span>
                      <span>{accuracy}%</span>
                    </div>

                    <div className="h-1.5 bg-slate-100 rounded-full mt-2">
                      <div
                        className={`h-full rounded-full ${
                          accuracy >= 75
                            ? "bg-emerald-500"
                            : accuracy >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                      <span>Attempted: {stat.attempted}</span>
                      <span>Correct: {stat.correct}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* FUTURE ACTIONS */}
        <div className="flex gap-4">
          <button className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            Download Result
          </button>

          <button
            onClick={() => navigate("/result-stat")}
            className="px-5 py-2 rounded-full border text-sm font-medium"
          >
            Open AI Analyzer
          </button>
        </div>

      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-white rounded-2xl border p-4 text-center">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

  export default ResultDetail;
