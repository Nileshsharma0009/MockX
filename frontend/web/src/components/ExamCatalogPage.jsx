import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  User, LogOut, Shield, BookOpen, CheckCircle, 
  Lock, ArrowRight, TrendingUp, Target, Menu, X,
  BarChart3, Clock, ShieldCheck 
} from "lucide-react";
import LoginModal from "./LoginModal";
import exams from "../data/SelectExam";
import { createOrder } from "../api/payment";
import Footer from "./Footer.jsx";

/* ---------------- NAVBAR COMPONENT ---------------- */
const Navbar = ({ user, logout, setShowLogin }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (item) => {
    switch (item) {
      case "Home": navigate("/"); break;
      case "Results": 
        if (!user) setShowLogin(true);
        else navigate("/result-history");
        break;
      case "Help": 
        navigate("/review-faq");
      default: break;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 py-4 px-4 md:px-12 z-50">
      <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/80 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-sm">
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
            <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase">Exam Prep</p>
          </div>
        </div>

        <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
          {["Home", "Results", "Help"].map((item) => (
            <button key={item} onClick={() => handleNavClick(item)} className="hover:text-sky-600 transition-colors">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
            >
              <User className="w-4 h-4" /> Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user.role === "admin" && <Shield className="w-4 h-4 text-indigo-600" />}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </div>
              <button onClick={logout} className="p-2 hover:bg-red-50 rounded-full transition group">
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 mt-4 w-full absolute left-0 right-0">
          <div className="w-full bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col space-y-1 animate-in slide-in-from-top-2 mx-4">
            {["Home", "Results", "Help"].map((item) => (
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

/* ---------------- MAIN PAGE ---------------- */
const ExamCatalogPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleBuyExam = async (examId) => {
    try {
      if (!user) { setShowLogin(true); return; }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        alert("Payment configuration error. Key missing.");
        return;
      }

      const res = await createOrder({ examId });
      if (!res?.data?.id) {
        alert("Failed to create payment order");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: res.data.amount,
        currency: "INR",
        order_id: res.data.id,
        name: "MockX",
        description: "Exam Test Series",
        handler: async function () {
          setPaymentSuccess(true);
          setTimeout(async () => { await refreshUser(); }, 2000);
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    }
  };

  const PAYMENTS_ENABLED =
  import.meta.env.VITE_PAYMENTS_ENABLED === "true";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} logout={logout} setShowLogin={setShowLogin} />

      <main className="max-w-7xl mx-auto pt-32 px-6 pb-28">
        {/* HERO SECTION */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Crack Your Exam with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Confidence 🚀</span>
          </h1>
          <p className="mt-6 text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            High-quality mock tests designed by exam-focused experts. 
            Real patterns, accurate difficulty, and instant analysis.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["Trusted by students", "Real exam-level mocks", "Instant analysis"].map((feat) => (
              <span key={feat} className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                <CheckCircle className="inline h-4 w-4 mr-1.5 text-green-500" /> {feat}
              </span>
            ))}
          </div>
        </div>

        {/* EXAM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam) => {
            const purchased = user?.purchasedExams?.includes(exam.id);

            return (
              <div key={exam.id} className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <span className="uppercase text-[10px] tracking-widest font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                    {exam.name}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">₹{exam.price}</span>
                    <p className="text-[10px] text-slate-400 font-medium">LIFETIME ACCESS</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {exam.fullName}
                </h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  {exam.description}
                </p>
                   
                <ul className="space-y-3 text-sm text-slate-600 mb-8 flex-grow">
                  {[
                    "Full syllabus coverage",
                    "Exam-level difficulty",
                    "Detailed performance analysis",
                    "Instant result"
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="bg-green-100 p-0.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>

               {purchased || !PAYMENTS_ENABLED ? (
  /* ✅ FULL ACCESS */
  <button
    onClick={() => navigate(exam.route)}
    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold
               hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
  >
    Start Test Series <ArrowRight className="w-4 h-4" />
  </button>
) : (
  /* 🔒 NOT PURCHASED */
 <div className="flex flex-col gap-[10px]">
  <button
    onClick={() => navigate(exam.route)}
    className="w-full py-3 rounded-2xl border border-emerald-500
               text-emerald-600 font-semibold hover:bg-emerald-50
               transition-all flex items-center justify-center gap-2"
  >
    Start Free Mocks <ArrowRight className="w-4 h-4" />
  </button>

  <button
    onClick={() => handleBuyExam(exam.id)}
    className="w-full py-4 rounded-2xl bg-slate-900
               text-white font-bold hover:opacity-90 transition-all
               shadow-lg shadow-indigo-100"
  >
    Unlock Test Series
  </button>
</div>

  
  
)}

<p className="mt-4 text-[11px] text-center text-slate-400 font-medium italic">
  {PAYMENTS_ENABLED
    ? "One-time payment • Secure checkout"
    : "Free access enabled • No payment required"}
</p>

              </div>
            );
          })}
        </div>

        {/* VALUE PROPOSITION SECTION */}  {/* Commented out for future use */}
        <section className="mt-32 border-t border-slate-200 pt-24">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Why serious aspirants invest in mock tests
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Preparation is not just about studying more — it’s about practicing
              the right way. High-quality mock tests help you refine your performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Real exam experience", desc: "Our mocks follow the exact exam pattern and time pressure so nothing feels new on the final day." },
              { icon: BarChart3, title: "Identify weak areas", desc: "Detailed performance analysis shows exactly where you lose marks to fix mistakes early." },
              { icon: Clock, title: "Master time management", desc: "Learn how to allocate time across sections—the biggest factor separating top ranks." },
              { icon: TrendingUp, title: "Track real progress", desc: "See measurable improvement across tests—accuracy, speed, and score history." },
              { icon: ShieldCheck, title: "Exam day confidence", desc: "Face exam-level pressure multiple times so the real exam becomes just another test." }
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-indigo-200 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODALS */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Payment Successful! 🎉</h2>
            <p className="mt-3 text-slate-500 text-sm">Your exam access has been unlocked. Happy studying!</p>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="mt-8 w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition"
            >
              Start Learning
            </button>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        <Footer />
    </div>
  );
};

export default ExamCatalogPage;