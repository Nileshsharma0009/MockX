import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AIChatPanel from "./AIChatPanel";
import { User, LogOut, Shield } from "lucide-react";
import { analyzeQuery } from "../analysis/analysisEngine";
import LoginModal from "../components/LoginModal"; // Assuming this exists based on context

const API_BASE = "http://localhost:5000";

const SUBJECTS = {
  eng: { name: "English" },
  gk: { name: "GK" },
  apt: { name: "Aptitude" },
  phy: { name: "Physics" },
  chem: { name: "Chemistry" },
  math: { name: "Maths" },
};

/* ---------------- UNIFIED NAVBAR ---------------- */
const Navbar = ({ user, logout, setShowLogin }) => {
  const navigate = useNavigate();

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
    <header className="py-4 px-4 md:px-12 relative z-10">
      <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-200">
            <span className="text-white font-extrabold text-lg">IM</span>
          </div>
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
    </header>
  );
};

/* ---------------- HARD SAFETY NORMALIZER ---------------- */
const normalizeAssistantContent = (content) => {
  if (typeof content === "string") {
    return {
      title: "Assistant Response",
      points: [content.replace(/\*\*/g, "").replace(/\n+/g, " ").trim()],
    };
  }
  return content;
};

/* ---------------- PAGE ---------------- */
const ResultStat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: {
        title: "MockX Official Assistant",
        points: [
          "Analyze your mock test performance",
          "Identify weak subjects",
          "Generate a structured improvement plan",
        ],
        hint: "Try asking: Weakest subject or Next 14-day plan",
      },
      ts: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetch(`${API_BASE}/api/results/my`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setResults(arr);
        if (arr.length) setSelected(arr[arr.length - 1]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, navigate]);

  const subjectStats = useMemo(() => {
    if (!selected?.subjectStats) return null;
    return selected.subjectStats;
  }, [selected]);

  /* ---------------- LOCAL AI ENGINE (Integrated) ---------------- */
  const handleSendMessage = (textOverride = null) => {
    const text = typeof textOverride === "string" ? textOverride : chatInput;
    if (!text || !text.trim()) return;

    // Add User Message
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text, ts: new Date().toISOString() },
    ]);
    setChatInput("");

    // Generate Analysis (Instant)
    setTimeout(() => {
      const rawResponse = analyzeQuery({
        query: text,
        result: selected,
        subjectsMap: SUBJECTS,
      });

      const safeResponse = normalizeAssistantContent(rawResponse);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: safeResponse,
          ts: new Date().toISOString(),
        },
      ]);
    }, 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading analysis…</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} logout={logout} setShowLogin={setShowLogin} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">

            <section className="mb-10">
              <h3 className="text-[10px] font-semibold text-slate-400 tracking-[0.22em] uppercase mb-3">
                Mock Attempts
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => {
                  const mockId = `imu${i + 1}`;
                  const attempt = results.find((r) => r.mockId === mockId);
                  const active = selected?.mockId === mockId;

                  const stateClasses = attempt
                    ? active
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-300"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-md"
                    : "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed";

                  return (
                    <button
                      key={mockId}
                      disabled={!attempt}
                      onClick={() => attempt && setSelected(attempt)}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${stateClasses}`}
                    >
                      Mock {i + 1}
                    </button>
                  );
                })}
              </div>
            </section>

            <h1 className="text-2xl font-semibold">Performance <span className="text-indigo-600">Dashboard</span></h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjectStats &&
                Object.entries(subjectStats).map(([k, s]) => {
                  const accuracy = s.attempted
                    ? Math.round((s.correct / s.attempted) * 100)
                    : 0;

                  return (
                    <div key={k} className="p-4 bg-white rounded-2xl border shadow-sm">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{SUBJECTS[k]?.name || k.toUpperCase()}</span>
                        <span>{accuracy}%</span>
                      </div>

                      <div className="h-1.5 bg-slate-100 rounded-full mt-2">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>

                      <div className="mt-2 text-xs text-slate-500 flex justify-between">
                        <span>Attempted: {s.attempted}</span>
                        <span>Correct: {s.correct}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <aside className="hidden lg:block lg:col-span-5">
            <AIChatPanel messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleSendMessage} />
          </aside>
        </div>
      </main>

      <button onClick={() => setIsAiOpen(true)} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-xl">🤖</button>

      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsAiOpen(false)} />
          <div className="w-full bg-white rounded-t-3xl p-4 max-h-[85vh]"><AIChatPanel isOpenDesktop={false} messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleSendMessage} /></div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => setShowLogin(false)} />}
    </div>
  );
};

export default ResultStat;
