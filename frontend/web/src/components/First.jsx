import React, { useState, useEffect } from "react";
import RegistrationForm from "./Registration.jsx";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";
import { Clock, GraduationCap, BarChart3, Trophy, User, LogOut, Shield } from "lucide-react";

// --- Typewriter Component (Keep as is) ---
const Typewriter = ({ words, typingSpeed = 150, deletingSpeed = 100, delay = 1000 }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  useEffect(() => {
    if (index === words.length) setIndex(0);
    if (subIndex === words[index].length + 1 && !reverse) { setTimeout(() => setReverse(true), delay); return; }
    if (subIndex === 0 && reverse) { setReverse(false); setIndex((prev) => (prev + 1) % words.length); return; }
    const timeout = setTimeout(() => { setSubIndex((prev) => prev + (reverse ? -1 : 1)); }, reverse ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, typingSpeed, deletingSpeed, delay]);
  return <span className="inline-block min-w-[150px] font-extrabold text-sky-600">{words[index].substring(0, subIndex)}<span className="border-r-2 border-sky-500 animate-blink ml-0.5" /></span>;
};

// --- Feature Card Component ---
const FeatureCard = ({ icon: Icon, title, description, iconColor, bgColor }) => (
  <div className="bg-white p-6 md:p-7 rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition duration-300 border border-gray-200 h-full flex flex-col items-start text-left">
    <div className={`p-4 rounded-2xl mb-5 ${bgColor} w-fit shadow-sm`}><Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={2.4} /></div>
    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{description}</p>
  </div>
);

const First = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false); 

  const handleNavClick = (item) => {
    switch (item) {
      case "Home": navigate("/"); break;
      case "Practice":
        if (!user) setShowLogin(true);
        else navigate("/mock-tests");
        break;
      case "Results":
        if (!user) setShowLogin(true);
        else navigate("/result-history");
        break;
      case "Help": alert("Coming soon"); break;
      default: break;
    }
  };

   // ✅ LOGOUT FUNCTION


  return (
    <div className="min-h-screen font-sans text-gray-900 overflow-hidden relative bg-white">
      {/* Background blobs */}
      <div className="absolute top-[-6rem] -left-24 w-80 h-80 bg-sky-100 rounded-full blur-3xl" />
      <div className="absolute top-[-4rem] -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl" />

      {/* Header */}
      <header className="py-4 px-4 md:px-12 relative z-10">
        <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-md">
          <div className="flex items-center gap-3">
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
                
                <LogOut onClick={logout} className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-600 transition" />
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Hero */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-20 text-center relative z-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8 text-gray-800">
          Ace Your <Typewriter words={["IMUCET", "Dream"]} />
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600 text-base md:text-lg mb-8">Exam-like mock tests with real-time tracking, instant results, and deep analytics to help you dominate IMUCET with confidence.</p>
        <div className="p-4">
          {!user ? (
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-semibold py-3.5 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 text-lg">Register Now</button>
          ) : (
            <button onClick={() => navigate("/mock-tests")} className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-semibold py-3.5 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 text-lg">Go to Practice</button>
          )}
        </div>
      </main>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <FeatureCard icon={Clock} title="180-Minute Tests" description="True exam duration to help you build stamina." iconColor="text-sky-500" bgColor="bg-sky-100" />
          <FeatureCard icon={GraduationCap} title="200 Smart Questions" description="Latest IMUCET patterns & difficulty levels." iconColor="text-indigo-500" bgColor="bg-indigo-100" />
          <FeatureCard icon={BarChart3} title="Progress Tracking" description="Accuracy, weak areas, improvement charts." iconColor="text-emerald-500" bgColor="bg-emerald-100" />
          <FeatureCard icon={Trophy} title="Instant Results" description="Detailed scorecards within seconds." iconColor="text-amber-500" bgColor="bg-amber-100" />
        </div>
      </section>

      {showForm && <RegistrationForm onClose={() => setShowForm(false)} onOpenLogin={() => { setShowForm(false); setShowLogin(true); }} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowForm(true); }} />}
    </div>
  );
};

export default First;