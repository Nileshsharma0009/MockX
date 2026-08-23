import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, Shield, Menu, X, Loader2 } from "lucide-react";
import MainNavbar from "./MainNavbar.jsx";
import { motion } from "framer-motion";
import MocktestCard from "./MocktestCard.jsx";
import LoginModal from "./LoginModal";
import api from "../api/api"; // backend API client
import mockTestsFallback from "../data/mocktest.js"; // Fallback tests if DB has none for 'imucet'
import SelectExam from "../data/SelectExam";

/* -------------------------------------------------
   MAIN PAGE
------------------------------------------------- */
const MockTestPage = () => {
  const [now, setNow] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { examId } = useParams();
  const { user, logout } = useAuth();

  // Find dynamic metadata of the exam (e.g. correct casing, fullName, price)
  const currentExam = SelectExam.find(
    (e) => e.id.toLowerCase() === examId?.toLowerCase()
  );
  const targetExamId = currentExam ? currentExam.id : examId;
  const examTitle = currentExam ? currentExam.fullName : `${examId} Series`;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMocks = async () => {
      try {
        setLoading(true);
        // Use the resolved case-sensitive ID for querying the DB
        const res = await api.get(`/mocks?exam=${targetExamId}`);
        
        // If the backend returns mocks for this exam, use them.
        // Otherwise, if the exam is 'imucet', fall back to the legacy mock list so it doesn't look empty.
        if (res.data && res.data.length > 0) {
          setMocks(res.data);
        } else if (targetExamId === "imucet") {
          // Add exam field to fallbacks
          const mappedFallback = mockTestsFallback.map(t => ({
            _id: String(t.id),
            title: t.title,
            description: t.description || "Full syllabus coverage | 180 minutes | 200 questions",
            releaseDate: t.releaseDate,
            isFree: t.isFree,
            exam: "imucet",
            isActive: true
          }));
          setMocks(mappedFallback);
        } else {
          setMocks([]);
        }
      } catch (err) {
        console.error("Failed to load mocks from backend:", err);
        // Fallback for imucet if API fails
        if (targetExamId === "imucet") {
          setMocks(mockTestsFallback.map(t => ({ ...t, _id: String(t.id), exam: "imucet" })));
        } else {
          setMocks([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMocks();
  }, [targetExamId]);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <MainNavbar
        desktopLinks={["Home", "Ai-Analyzer", "Results", "Help"]}
        setShowLogin={setShowLogin}
      />

      <main className="max-w-6xl mx-auto pt-10 px-6 pb-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 flex items-center justify-center gap-3">
          <img
            src="/rocket.svg"
            alt="rocket"
            className="w-20 object-contain"
          />
          <span>{examTitle}</span>
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading test series...</p>
          </div>
        ) : mocks.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm p-8 max-w-lg mx-auto mt-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">No Mocks Available Yet</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              We are curating premium mocks for the {examId.toUpperCase()} exam series. They will be added here shortly!
            </p>
            <button
              onClick={() => navigate("/mock-tests")}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
            >
              Back to Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
            {mocks.map((test, index) => {
              const releaseTime = new Date(test.releaseDate);
              const available = now >= releaseTime;
              return (
                <MocktestCard
                  key={test._id}
                  id={test._id}
                  exam={test.exam}
                  title={test.title}
                  description={test.description}
                  isFree={test.isFree}
                  available={available}
                  date={releaseTime.toLocaleDateString("en-IN")}
                  user={user}
                  index={index}
                />
              );
            })}
          </div>
        )}
      </main>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onOpenRegister={() => setShowLogin(false)}
        />
      )}
    </div>
  );
};

export default MockTestPage;