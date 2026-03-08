

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
  if (param.startsWith("imu")) return param;
  return `imu${param}`;
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

  /* ⏱ Init timer (ONCE) */
  useEffect(() => {
    dispatch({ type: "SET_TIMER", payload: 180 * 60 });
  }, [dispatch]);

  /* 📥 Load questions */
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

        dispatch({
          type: "SET_QUESTIONS",
          payload: {
            A: shuffleWithGroups(data.A || []),
            B: shuffleWithGroups(data.B || []),
          },
        });

        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load questions");
        setLoading(false);
      });
  }, [dispatch, navigate]);

  /* 💾 Helper: Get Current Answers Object */
  const computeCurrentAnswers = useCallback(() => {
    const answers = {};
    state.fullSetA.forEach((q, i) => {
      const sel = state.selectedOptionsA[i];
      if (sel != null) answers[q.questionCode] = sel;
    });
    state.fullSetB.forEach((q, i) => {
      const sel = state.selectedOptionsB[i];
      if (sel != null) answers[q.questionCode] = sel;
    });
    return answers;
  }, [state.fullSetA, state.fullSetB, state.selectedOptionsA, state.selectedOptionsB]);

  /* 💾 Auto-Save Logic */
  useEffect(() => {
    if (loading || state.isSubmitted) return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;

      const currentAnswers = computeCurrentAnswers();
      const currentKeys = Object.keys(currentAnswers);
      const savedKeys = Object.keys(lastSavedData.current);

      // Check for changes (Simple count check + basic diff)
      // We only care if user has answered MORE questions or changed something
      // Simple heuristic: If count difference > 20 OR just periodically every 20 answers

      // Calculate Delta (Answers that are NEW or CHANGED)
      const delta = {};
      let changesCount = 0;

      for (const key of currentKeys) {
        if (currentAnswers[key] !== lastSavedData.current[key]) {
          delta[key] = currentAnswers[key];
          changesCount++;
        }
      }

      // THRESHOLD: Save if user made > 25 changes (Optimized for multiple concurrent users)
      if (changesCount >= 25) {
        isSavingRef.current = true;
        // console.log("💾 Auto-saving progress...", changesCount, "changes");

        try {
          await saveProgress({ mockId, answers: delta });

          // On success, update lastSavedData with what we sent
          // We assume merge was successful on server
          lastSavedData.current = { ...lastSavedData.current, ...delta };

          // console.log("✅ Auto-save complete");
        } catch (err) {
          console.error("❌ Auto-save failed (background)", err);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [computeCurrentAnswers, loading, mockId, state.isSubmitted]);


  /* 📝 Submit */
  const handleSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    // Send FULL answers just to be safe & consistent (backend will merge)
    // Or send Delta if we want to be super optimized? 
    // Backend handles merge, so sending FULL is fine unless it's huge. 
    // 200 items is tiny, so let's send FULL to ensure integrity.
    const answers = computeCurrentAnswers();

    const res = await submitAttempt({ mockId, answers });
    navigate(`/result/${res.data.resultId}`, { replace: true });
  }, [
    computeCurrentAnswers,
    mockId,
    navigate,
  ]);

  /* ⏰ Auto submit */
  useEffect(() => {
    if (state.timer === 0 && !state.isSubmitted && !loading) {
      handleSubmit();
    }
  }, [state.timer, state.isSubmitted, loading, handleSubmit]);

  return (
    <Suspense
      fallback={
        <div className="mt-32 text-center text-gray-500">
          Loading test interface...
        </div>
      }
    >
      <Navbar />
      <Timer />

      {loading ? (
        <div className="mt-32 text-center text-gray-500">
          Loading questions...
        </div>
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
