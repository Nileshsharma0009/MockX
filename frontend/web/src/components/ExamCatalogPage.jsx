import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { 
  CheckCircle, ArrowRight, TrendingUp, Target,
  BarChart3, Clock, ShieldCheck 
} from "lucide-react";
import LoginModal from "./LoginModal";
import exams from "../data/SelectExam";
import { createOrder, verifyPayment, reportPaymentFailure, fetchPrices } from "../api/payment";
import Footer from "./Footer.jsx";
import MainNavbar from "./MainNavbar.jsx";

/* ---------------- MAIN PAGE ---------------- */
const ExamCatalogPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [paymentProduct, setPaymentProduct] = useState(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [priceConfigStatus, setPriceConfigStatus] = useState("loading");

  useEffect(() => {
    const getPrices = async () => {
      try {
        const res = await fetchPrices();
        if (res?.data) {
          setPaymentProduct(res.data.product || null);
          setPaymentsEnabled(Boolean(res.data.paymentsEnabled));
          setPriceConfigStatus("loaded");
        } else {
          setPriceConfigStatus("error");
        }
      } catch (err) {
        console.error("Failed to fetch dynamic prices:", err);
        setPriceConfigStatus("error");
      }
    };
    getPrices();
  }, []);

  const handleBuyExam = async (examId) => {
    try {
      if (!user) { setShowLogin(true); return; }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error("Payment configuration error. Key missing.");
        return;
      }

      const res = await createOrder({ examId });
      if (!res?.data?.id) {
        toast.error("Failed to create payment order");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: res.data.amount,
        currency: res.data.currency,
        order_id: res.data.id,
        name: res.data.notes?.productName || "Payment",
        description: res.data.notes?.productName || "",
        handler: async function (response) {
          try {
            // Cryptographically verify payment on backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment verified successfully! Access granted.");
            setPaymentSuccess(true);
            await refreshUser();
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            toast.error("Verification failed, but we saved your transaction. Please contact support.");
          }
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async function (response) {
        try {
          await reportPaymentFailure({
            orderId: response.error.metadata.order_id,
            paymentId: response.error.metadata.payment_id || null,
            mockId: examId,
            amount: res.data.amount / 100,
            error: {
              code: response.error.code || null,
              description: response.error.description || null,
              source: response.error.source || null,
              step: response.error.step || null,
              reason: response.error.reason || null,
              metadata: response.error.metadata || null,
            },
          });
          // Dispatch custom event to notify the notification inbox to refresh
          window.dispatchEvent(new Event("check_notifications"));
        } catch (failLogErr) {
          console.error("Failed to report payment failure to server:", failLogErr);
        }
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
    }
  };
return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <MainNavbar desktopLinks={["Home", "Practice", "Results", "Help"]} setShowLogin={setShowLogin} />

      <main className="catalog-main max-w-7xl mx-auto pt-32 px-6 pb-28">
        {/* HERO SECTION */}
        <div className="catalog-hero text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Crack Your Exam with <span className="text-transparent bg-clip-text  from-sky-600 to-indigo-600">Confidence </span>
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
        <div className="catalog-exam-grid grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam) => {
            const purchased = user?.purchasedExams?.includes(exam.id);
            const configuredProduct = paymentProduct?.id === exam.id;
         
            const displayedPrice = exam.price 

            return (
              <div key={exam.id} className="catalog-exam-card group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="catalog-card-top flex justify-between items-start mb-6">
                  <span className="uppercase text-[10px] tracking-widest font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                    {exam.name}
                  </span>
                  <div className="text-right">
                    <span className="catalog-price text-2xl font-bold text-slate-900">{displayedPrice}₹</span>
                    <p className="text-[10px] text-slate-400 font-medium">LIFETIME ACCESS</p>
                  </div>
                </div>

                <h2 className="catalog-card-title text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
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

               {purchased ? (
  <button
    onClick={() => navigate(exam.route)}
    className="catalog-primary-action w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
  >
    Start Test Series <ArrowRight className="w-4 h-4" />
  </button>
) : (
  <div className="flex flex-col gap-[10px]">
    <button
      onClick={() => navigate(exam.route)}
      className="catalog-secondary-action w-full py-3 rounded-2xl border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
    >
      Start Free Mocks <ArrowRight className="w-4 h-4" />
    </button>
    {paymentsEnabled && configuredProduct ? (
      <button
        onClick={() => handleBuyExam(exam.id)}
        className="catalog-primary-action w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-100"
      >
        Unlock {paymentProduct.name}
      </button>
    ) : (
      <p className="text-center text-xs text-slate-500">
        {priceConfigStatus === "loading"
          ? "Checking checkout availability…"
          : priceConfigStatus === "error"
            ? "Could not load checkout settings. Please refresh and try again."
            : paymentsEnabled
              ? "This product is not configured for checkout."
              : "New purchases are paused. Existing purchases remain available."}
      </p>
    )}
  </div>
)}
<p className="mt-4 text-[11px] text-center text-slate-400 font-medium italic">
  {priceConfigStatus === "error"
    ? "Price information is temporarily unavailable"
    : paymentsEnabled
      ? "Secure checkout"
      : "Free mocks remain available"}
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
              Preparation is not just about studying more about practicing
              the right way. High-quality mock tests help you refine your performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Real exam experience", desc: "Our mocks follow the exact exam pattern and time pressure so nothing feels new on the final day." },
              { icon: BarChart3, title: "Identify weak areas", desc: "Detailed performance analysis shows exactly where you lose marks to fix mistakes early." },
              { icon: Clock, title: "Master time management", desc: "Learn how to allocate time across sectionsâ€”the biggest factor separating top ranks." },
              { icon: TrendingUp, title: "Track real progress", desc: "See measurable improvement across testsâ€”accuracy, speed, and score history." },
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
            <h2 className="text-2xl font-bold text-slate-900">Payment Successful! </h2>
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
