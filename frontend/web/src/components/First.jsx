import React, { useState, useEffect } from "react";
import RegistrationForm from "./Registration.jsx";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";
import { Clock, GraduationCap, BarChart3, Trophy, User, LogOut, Shield } from "lucide-react";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Footer from "./Footer.jsx";

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
      case "Help": 
      navigate("/review-faq");
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
          Ace Your <Typewriter words={["IMUCET", "Dream" ,"MHTCET"]} />
        </h1>
        
        <p className="max-w-2xl mx-auto text-gray-600 text-base md:text-lg mb-8">    Studying hard is only half the battle. Structure your practice to ensure every hour of study translates into higher marks.</p>
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




      {/* Comparison Section */}
{/* Comparison Section - The Growth Path */}
{/* <section className="mt-32 relative">
  {/* Background Decorative Element */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent -z-10" />

  <div className="max-w-4xl mx-auto text-center mb-16">
    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
      Bridging the <span className="text-indigo-600">Preparation Gap</span>
    </h2>
    <p className="mt-4 text-gray-600 text-lg leading-relaxed">
   Exam-like mock tests with real-time tracking, instant results, and deep analytics to help you dominate Exam with confidence
    </p>
  </div>

  <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden border border-gray-200 shadow-2xl bg-white">
    
    {/* Center "VS" Badge (Hidden on mobile) */}
    <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="h-16 w-16 rounded-full bg-white border-4 border-[#F8FAFC] shadow-xl flex items-center justify-center">
        <span className="text-gray-400 font-black italic text-xl">VS</span>
      </div>
    </div>

    {/* LEFT SIDE: WITHOUT MOCKS */}
    <div className="p-8 md:p-12 bg-slate-50/50 relative">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm shadow-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">The Hard Way</h3>
          <p className="text-sm text-red-600 font-medium">Without Mock Tests</p>
        </div>
      </div>

      <ul className="space-y-6">
        {[
          "No real sense of exam pressure or time constraints",
          "Difficult to identify weak topics and recurring mistakes",
          "Overconfidence or underconfidence without feedback",
          "Poor time management during the actual exam",
          "Exam day feels unfamiliar and stressful"
        ].map((item, idx) => (
          <li key={idx} className="flex items-start gap-4 group">
            <div className="mt-1 bg-white rounded-full p-0.5 border border-red-100 group-hover:scale-110 transition-transform">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-gray-600 leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* RIGHT SIDE: WITH MOCKS */}
    <div className="p-8 md:p-12 bg-white relative">
      {/* Subtle Highlight Border for the "Winner" side */}
      <div className="absolute inset-0 border-l lg:border-l-0 border-t lg:border-t-0 border-indigo-50" />
      
      <div className="flex items-center gap-4 mb-10">
        <div className="h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-100">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">The Smart Way</h3>
          <p className="text-sm text-green-600 font-medium">With MockX Platform</p>
        </div>
      </div>

      <ul className="space-y-6">
        {[
          "Experience real exam-level pressure early",
          "Clear insights with AI-driven performance analysis",
          "Data-driven confidence based on actual accuracy",
          "Mastered section-wise time allocation strategy",
          "Calm, confident, and familiar exam-day experience"
        ].map((item, idx) => (
          <li key={idx} className="flex items-start gap-4 group">
            <div className="mt-1 bg-green-50 rounded-full p-0.5 border border-green-100 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-800 font-medium leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  {/* BOTTOM INSIGHT CARD */}
  {/* <div className="mt-12 max-w-4xl mx-auto">
    <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-3xl p-1 shadow-xl">
      <div className="bg-white/5 backdrop-blur-sm rounded-[1.4rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-7 w-7 text-indigo-300" />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-white text-lg font-semibold mb-1">Pro Tip for Aspirants</h4>
          <p className="text-indigo-100/70 text-sm leading-relaxed">
            Mocks don’t just test your knowledge; they build your <span className="text-indigo-300 font-semibold underline decoration-indigo-500/50 underline-offset-4">test-taking stamina</span>. 
            Students who take at least 10 mocks are 65% more likely to manage time effectively on the final day.
          </p>
        </div>
      </div>
    </div>
  </div> */}
{/* </section> */}  {/* Commented out for future use */}


      {showForm && <RegistrationForm onClose={() => setShowForm(false)} onOpenLogin={() => { setShowForm(false); setShowLogin(true); }} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowForm(true); }} />}
        <Footer />
    </div>

  );
};

export default First;