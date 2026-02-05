import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, ArrowRight, User, LogOut, Shield, Menu, X } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

const TOTAL_MOCKS = 10;



const Navbar = ({ user, logout, setShowLogin }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleNavClick = (item) => {
    switch (item) {
      case "Home":
        navigate("/");
        break;
      case "Practice":
        if (!user) setShowLogin(true);
        else navigate("/mock-tests");
        break;
      case "Results":
        if (!user) setShowLogin(true);
        else navigate("/result-history");
        break;
      case "Help":
        alert("Help page coming soon");
        break;
      default:
        break;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 py-4 px-4 md:px-12 z-20 bg-white/95">
      <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-md">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">MockX</span>
            <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase">IMUCET • Mock Tests</p>
          </div>
        </div>

        <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
          {["Home", "Practice", "Results", "Help"].map((item) => (
            <button key={item} onClick={() => handleNavClick(item)} className="hover:text-sky-600 transition duration-200">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow hover:shadow-lg hover:scale-105 transition">
              <User className="w-4 h-4" /> Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user.role === "admin" && <Shield className="w-4 h-4 text-indigo-600" />}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </div>
              <LogOut onClick={logout} className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-600 transition" title="Logout" />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 mt-4 w-full">
          <div className="w-full bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col space-y-1 animate-in slide-in-from-top-2">
            {["Home", "Practice", "Results", "Help"].map((item) => (
              <button
                key={item}
                onClick={() => { handleNavClick(item); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition duration-200 flex items-center justify-between group"
              >
                <span>{item}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};


const ResultHistory = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetch(`${API_BASE}/api/results/my`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading your progress…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 relative">
      <Navbar user={user} logout={logout} setShowLogin={setShowLogin} />
      <div className="px-4 py-12 pt-28">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900">
            Your Mock Test Journey
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track progress • Review performance • Improve smarter
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: TOTAL_MOCKS }, (_, i) => {
            const mockId = `imu${i + 1}`;
            const attempt = results.find((r) => r.mockId === mockId);

            return (
              <div
                key={mockId}
                className={`relative rounded-3xl border p-6 transition-all
                ${
                  attempt
                    ? "bg-white border-slate-200 shadow-md hover:shadow-xl"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                {/* STATUS DOT */}
                <div
                  className={`absolute top-5 right-5 h-3 w-3 rounded-full
                  ${attempt ? "bg-emerald-500" : "bg-slate-300"}`}
                />

                {/* CONTENT */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Mock Test
                    </p>
                    <h2 className="text-xl font-semibold text-slate-900">
                      IMU {i + 1}
                    </h2>
                  </div>

                  {attempt ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Score</p>
                          <p className="text-lg font-bold text-indigo-600">
                            {attempt.score}
                            <span className="text-slate-400 font-medium">
                              /200
                            </span>
                          </p>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div>
                          <p className="text-xs text-slate-400">Accuracy</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {Math.round(
                              (attempt.score / attempt.total) * 100
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          navigate(`/result/${attempt._id}`)
                        }
                        className="mt-4 w-full flex items-center justify-center gap-2
                        rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold
                        text-white hover:bg-indigo-700 transition"
                      >
                        View Detailed Result
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
                      <Lock className="w-4 h-4" />
                      Not attempted yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOT NOTE */}
        <p className="mt-12 text-center text-xs text-slate-400">
          Tip: Attempt mocks regularly and use AI Analyzer for insights 📈
        </p>
      </div>
      </div>
    </div>
  );
};

export default ResultHistory;
