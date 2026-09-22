

import React, {
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  TestProvider,
  useTestState,
  useTestDispatch,
} from "./context/TestContext.jsx";

import { submitAttempt, saveProgress } from "./api/api";
import { shuffleWithGroups } from "./utils/shuffle";
import Loader from "./components/Loader";

/* ---------- LAZY LOAD HEAVY UI ---------- */
const Navbar = lazy(() => import("./components/Navbar"));
const Timer = lazy(() => import("./components/Timer"));
const QuestionPanel = lazy(() => import("./components/QuestionPanel"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const ControlsBar = lazy(() => import("./components/ControlsBar"));
const StatsToggleFab = lazy(() => import("./components/StatsToggleFab"));

/* ---------- API Base URL ---------- */
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

/* ---------- helper: normalize mock id ---------- */
function resolveMockId() {
  const param = new URLSearchParams(window.location.search).get("mock");
  if (!param) return "imu1";
  return param;
}

/* ---------- PAGE ---------- */
function TestPageInner() {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const navigate = useNavigate();

  const [statsOpen, setStatsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mockId, setMockId] = useState("imu1");

  // 🔄 Auto-Save Refs
  const lastSavedData = React.useRef({}); // Tracks what's in DB
  const isSavingRef = React.useRef(false); // Prevents overlapping saves

  /* 📥 Load questions & exam config */
  useEffect(() => {
    const resolvedMock = resolveMockId();
    setMockId(resolvedMock);
    setLoading(true);

    localStorage.removeItem("testState_v1");

    fetch(`${API_BASE}/api/mocks/${resolvedMock}/questions`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 403) {
          const data = await r.json();
          toast.error(data.message || "Access denied.");
          navigate("/mock-tests");
          return null;
        }
        if (!r.ok) throw new Error("Failed to load questions");
        return r.json();
      })
      .then((data) => {
        if (!data) return;

        const exam = data.exam || null;
        const rawQuestions = data.questions || {
          A: data.A || [],
          B: data.B || [],
        };

        const shuffledQuestions = {};
        for (const secKey of Object.keys(rawQuestions)) {
          shuffledQuestions[secKey] = shuffleWithGroups(rawQuestions[secKey] || []);
        }

        dispatch({
          type: "SET_QUESTIONS",
          payload: {
            exam,
            questions: shuffledQuestions,
            A: shuffledQuestions["A"] || [],
            B: shuffledQuestions["B"] || [],
          },
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Load questions error:", err);
        toast.error("Failed to load questions");
        setLoading(false);
      });
  }, [dispatch, navigate]);

  /* 💾 Helper: Get Current Answers Object across all sections */
  const computeCurrentAnswers = useCallback(() => {
    const answers = {};
    const questionsBySection = state.questionsBySection || {};
    const selectedOptionsBySection = state.selectedOptionsBySection || {};

    for (const sec of Object.keys(questionsBySection)) {
      const qList = questionsBySection[sec] || [];
      const selList = selectedOptionsBySection[sec] || [];
      qList.forEach((q, i) => {
        const sel = selList[i];
        if (sel != null && q?.questionCode) {
          answers[q.questionCode] = sel;
        }
      });
    }
    return answers;
  }, [state.questionsBySection, state.selectedOptionsBySection]);

  /* 💾 Auto-Save Logic */
  useEffect(() => {
    if (loading || state.isSubmitted) return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;

      const currentAnswers = computeCurrentAnswers();
      const currentKeys = Object.keys(currentAnswers);

      // Calculate Delta (Answers that are NEW or CHANGED)
      const delta = {};
      let changesCount = 0;

      for (const key of currentKeys) {
        if (currentAnswers[key] !== lastSavedData.current[key]) {
          delta[key] = currentAnswers[key];
          changesCount++;
        }
      }

      // THRESHOLD: Save if user made >= 20 changes
      if (changesCount >= 20) {
        isSavingRef.current = true;
        try {
          await saveProgress({ mockId, answers: delta });
          lastSavedData.current = { ...lastSavedData.current, ...delta };
        } catch (err) {
          console.error("❌ Auto-save failed (background)", err);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [computeCurrentAnswers, loading, mockId, state.isSubmitted]);

  /* 📝 Submit */
  const handleSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    const answers = computeCurrentAnswers();
    const res = await submitAttempt({ mockId, answers });
    navigate(`/result/${res.data.resultId}`, { replace: true });
  }, [computeCurrentAnswers, mockId, navigate]);

  /* ⏰ Auto submit when timer reaches 0 */
  useEffect(() => {
    if (state.totalSeconds === 0 && !state.isSubmitted && !loading) {
      handleSubmit();
    }
  }, [state.totalSeconds, state.isSubmitted, loading, handleSubmit]);

  return (
    <Suspense fallback={<Loader />}>
      <Navbar />
      <Timer />

      {loading ? (
        <Loader />
      ) : (
        <>
          <QuestionPanel />

          <StatsToggleFab
            open={statsOpen}
            onToggle={() => setStatsOpen((v) => !v)}
          />

          {/* ✅ Sidebar loads ONLY when opened */}
          {statsOpen && <Sidebar visible={statsOpen} />}

          <ControlsBar onSubmit={handleSubmit} />
        </>
      )}
    </Suspense>
  );
}

/* ---------- PROVIDER ---------- */
export default function App() {
  return (
    <TestProvider>
      <TestPageInner />
    </TestProvider>
  );
}
