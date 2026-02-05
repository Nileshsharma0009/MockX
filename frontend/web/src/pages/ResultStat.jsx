import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AIChatPanel, { createWelcomeMessage } from "./AIChatPanel";
import { User, LogOut, Shield, Menu, X, Bot, ArrowRight } from "lucide-react";
import { analyzeQuery } from "../analysis/analysisEngine";
import LoginModal from "../components/LoginModal"; // Assuming this exists based on context

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

/* ---------------- UNIFIED NAVBAR ---------------- */
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
    <header className="py-4 px-4 md:px-12 relative z-20">
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
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
              </button>
            ))}
          </div>
        </div>
      )}
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
  const [isInputFocused, setIsInputFocused] = useState(false);

  /* ---------------- CHAT STATE ---------------- */
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  /* ---------------- CHAT CONFIG ---------------- */
  const getWelcomeMsg = () => createWelcomeMessage(user?.name);


  // Fetch Results
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

  // Load Chat History for Selected Mock
  useEffect(() => {
    console.log("ChatHistory Effect Triggered", { userId: user?.id, mockId: selected?.mockId });
    // If no user, can't load history
    if (!user) return;

    const userId = user.id || user._id || "user";
    // Determine key based on selected mock or general
    const contextId = selected?.mockId || "general";
    const key = `chat_history_${userId}_${contextId}`;

    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only use saved history if it has messages, otherwise show welcome
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
        } else {
          setChatMessages([getWelcomeMsg()]);
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setChatMessages([getWelcomeMsg()]);
      }
    } else {
      setChatMessages([getWelcomeMsg()]);
    }
  }, [selected?.mockId, user]);

  const saveChatHistory = (msgs) => {
    if (!user) return;
    const userId = user.id || user._id || "user";
    const contextId = selected?.mockId || "general";
    const key = `chat_history_${userId}_${contextId}`;
    localStorage.setItem(key, JSON.stringify(msgs));
  };


  const subjectStats = useMemo(() => {
    if (!selected?.subjectStats) return null;
    return selected.subjectStats;
  }, [selected]);

  /* ---------------- LOCAL AI ENGINE (Integrated) ---------------- */
  const handleSendMessage = (textOverride = null) => {
    const text = typeof textOverride === "string" ? textOverride : chatInput;
    if (!text || !text.trim()) return;

    // Add User Message
    const userMsg = { id: Date.now(), role: "user", content: text, ts: new Date().toISOString() };
    setChatMessages((prev) => {
      const next = [...prev, userMsg];
      saveChatHistory(next);
      return next;
    });
    setChatInput("");

    // Generate Analysis (Instant)
    setTimeout(() => {
      const rawResponse = analyzeQuery({
        query: text,
        result: selected,
        subjectsMap: SUBJECTS,
      });

      const safeResponse = normalizeAssistantContent(rawResponse);

      setChatMessages((prev) => {
        const assistantMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: safeResponse,
          ts: new Date().toISOString(),
        };
        const next = [...prev, assistantMsg];
        saveChatHistory(next);
        return next;
      });
    }, 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading analysis…</div>;

  return (
    <div className="min-h-screen bg-slate-50 relative">
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

      <button onClick={() => setIsAiOpen((s) => !s)} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
        <Bot size={28} />
      </button>

      {isAiOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden pointer-events-none flex flex-col justify-end"
        >
          {/* Backdrop passes clicks due to pointer-events-none */}

          <div
            className={`w-full pointer-events-auto bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border-t border-gray-100 flex flex-col transition-all duration-300 ease-out ${isInputFocused ? "h-[90vh] pb-8" : "h-[60vh]"
              }`}
          >
            <div className={`flex items-center justify-between p-3 border-b border-gray-100 bg-white rounded-t-3xl transition-opacity duration-200 ${isInputFocused ? "opacity-0 h-0 p-0 overflow-hidden" : "opacity-100"}`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">MockX Assistant</div>
                  <div className="text-xs text-slate-400">Context: {selected?.mockId || "General"}</div>
                </div>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-h-0 bg-white">
              <AIChatPanel
                isOpenDesktop={false}
                messages={chatMessages}
                input={chatInput}
                setInput={setChatInput}
                onSend={handleSendMessage}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </div>

            {/* Minimal close btn when focused */}
            {isInputFocused && (
              <button
                onClick={() => setIsInputFocused(false)}
                className="absolute top-2 right-2 bg-slate-100 text-slate-400 p-1 rounded-full z-50 shadow-sm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => setShowLogin(false)} />}
    </div>
  );
};

export default ResultStat;
