import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  LogOut,
  Layers,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getMyAssignedTestsApi,
  getMyInstituteResultsApi,
  getMyInstituteStatsApi,
} from "../../api/institute.api";
import Loader from "../../components/Loader";

export default function StudentInstitutePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("tests");
  const [instituteData, setInstituteData] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [resultsHistory, setResultsHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [testsRes, resultsRes, statsRes] = await Promise.all([
        getMyAssignedTestsApi(),
        getMyInstituteResultsApi(),
        getMyInstituteStatsApi(),
      ]);

      setInstituteData(testsRes.data?.institute);
      setAssignedTests(testsRes.data?.tests || []);
      setResultsHistory(resultsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error("Failed to load student data:", err);
      toast.error(err.response?.data?.message || "Failed to load student portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (user?.role || "").toUpperCase();
    if (!user || role !== "STUDENT") {
      toast.error("Please login with a student account to access this portal.");
      navigate("/v2/institute/login");
      return;
    }
    loadStudentData();
  }, [user, navigate]);

  const handleStartTest = (mockId) => {
    navigate(`/test?mock=${mockId}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="institute-ui min-h-screen bg-slate-50 text-slate-800 pb-16">
      <header className="mockx-site-header mockx-site-header__inner sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {instituteData?.logo ? (
            <img
              src={instituteData.logo}
              alt={instituteData.name}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-white"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="mockx-site-brand-detail">MockX · Student portal</p>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900">
                {instituteData?.name || "Institute Student Portal"}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Student Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {user?.name} • Batch: <span className="text-indigo-600 font-semibold">{user?.batch || "General"}</span>
              {user?.studentRollNo && ` • Roll: ${user.studentRollNo}`}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tests Attempted", value: stats?.testsAttempted || 0, sub: `Of ${assignedTests.length} assigned`, color: "text-slate-900" },
            { label: "Average Score", value: stats?.avgScore || 0, sub: "Cumulative average", color: "text-emerald-600" },
            { label: "Best Score", value: stats?.bestScore || 0, sub: "Peak performance", color: "text-violet-600" },
            { label: "Average Accuracy", value: `${stats?.avgAccuracy || 0}%`, sub: "Correct response rate", color: "text-sky-600" },
          ].map((card) => (
            <div key={card.label} className="inst-card rounded-2xl p-4 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">{card.label}</div>
              <div className={`text-2xl font-black mt-0.5 ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "tests"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-white text-slate-600 hover:text-indigo-700 border border-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Assigned Tests ({assignedTests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "results"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-white text-slate-600 hover:text-indigo-700 border border-slate-200"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>My Results & History ({resultsHistory.length})</span>
          </button>
        </div>

        {activeTab === "tests" && (
          <div className="space-y-4 animate-fadeIn">
            {assignedTests.length === 0 ? (
              <div className="inst-card rounded-3xl p-12 text-center text-slate-500 text-sm">
                No mock tests assigned yet. Your institute teachers will schedule tests for your batch here.
              </div>
            ) : (
              assignedTests.map((t) => (
                <div
                  key={t.assignmentId}
                  className="inst-card inst-card-hover rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{t.title}</h3>
                      {t.status === "AVAILABLE" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                          Ready to Attempt
                        </span>
                      )}
                      {t.status === "COMPLETED" && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      )}
                      {t.status === "UPCOMING" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                          Upcoming
                        </span>
                      )}
                      {t.status === "EXPIRED" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                          Closed
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">{t.description}</p>

                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t.duration} Minutes</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 border border-slate-200">
                        <Layers className="w-3.5 h-3.5 text-violet-500" />
                        <span>
                          {t.totalQuestions} Questions ({t.totalMarks} Marks)
                        </span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100">
                        +{t.marking?.correct} / -{t.marking?.incorrect} Marking
                      </span>
                    </div>

                    {t.availableUntil && (
                      <p className="text-[11px] text-slate-500">
                        Closes: {new Date(t.availableUntil).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
                    {t.status === "AVAILABLE" && (
                      <button
                        onClick={() => handleStartTest(t.mockId)}
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Test</span>
                      </button>
                    )}

                    {t.status === "COMPLETED" && (
                      <button
                        onClick={() => navigate(`/result/${t.result?.resultId}`)}
                        className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-sky-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>View Result ({t.result?.score} Marks)</span>
                      </button>
                    )}

                    {t.status === "UPCOMING" && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-amber-700">Available Soon</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          From {new Date(t.availableFrom).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {t.status === "EXPIRED" && (
                      <span className="text-xs font-semibold text-slate-500">Window Expired</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="space-y-4 animate-fadeIn">
            {resultsHistory.length === 0 ? (
              <div className="inst-card rounded-3xl p-12 text-center text-slate-500 text-sm">
                No completed tests yet. Start an assigned test to see your scorecards and analytics here.
              </div>
            ) : (
              resultsHistory.map((r) => (
                <div
                  key={r._id}
                  className="inst-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{r.mockTitle}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Completed on {new Date(r.createdAt).toLocaleDateString()} at{" "}
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>

                    {r.sectionScores && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(r.sectionScores).map(([sec, val]) => (
                          <span
                            key={sec}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200"
                          >
                            {sec.toUpperCase()}: <span className="text-emerald-600">{val} pts</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-600">
                        {r.score} / {r.total}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">{r.percentage}% Score</div>
                    </div>

                    <button
                      onClick={() => navigate(`/result/${r._id}`)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Full Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
