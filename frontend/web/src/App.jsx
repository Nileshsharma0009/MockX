

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
  useTestProgress,
  getTestStorageKey,
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
import { API_BASE } from "./api/apiBase.js";

/* ---------- helper: normalize mock id ---------- */
function resolveMockId() {
  const param = new URLSearchParams(window.location.search).get("mock");
  if (!param) return "imu1";
  return param;
}

/* ---------- PAGE ---------- */
function TestPageInner({ mockId }) {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const { getDirtyAnswersSnapshot, clearDirtyAnswers } = useTestProgress();
  const navigate = useNavigate();

  const [statsOpen, setStatsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const checkpoint60TriggeredRef = React.useRef(false);
  const finalCheckpointStartedRef = React.useRef(false);
  const submissionInFlightRef = React.useRef(false);
  const checkpointMockRef = React.useRef(null);

  /* 📥 Load questions & exam config */
  useEffect(() => {
    const resolvedMock = mockId;
    setLoading(true);

    fetch(`${API_BASE}/api/mocks/${resolvedMock}/questions`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 403) {
          const data = await r.json();
          toast.error(data.message || "Access denied.");
          navigate("/v2/mock-tests");
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
            mockId: resolvedMock,
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
  }, [dispatch, mockId, navigate]);

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

  const saveCheckpoint = useCallback(async (answers, { mark60PercentComplete = false } = {}) => {
    const dirtySnapshot = getDirtyAnswersSnapshot();
    try {
      await saveProgress({ mockId, answers });
      clearDirtyAnswers(dirtySnapshot);
      if (mark60PercentComplete) {
        dispatch({ type: "MARK_60_PERCENT_CHECKPOINT_COMPLETE" });
      }
      return true;
    } catch (err) {
      // Checkpoints are best-effort. Keep local recovery and dirty values for the next safe opportunity.
      console.warn("Exam checkpoint failed; local progress is retained.", {
        mockId,
        status: err.response?.status,
      });
      return false;
    }
  }, [clearDirtyAnswers, dispatch, getDirtyAnswersSnapshot, mockId]);

  useEffect(() => {
    if (!state.questionsLoaded) return;
    if (checkpointMockRef.current === state.mockId) return;
    checkpointMockRef.current = state.mockId;
    checkpoint60TriggeredRef.current = Boolean(state.checkpoint60Complete);
    finalCheckpointStartedRef.current = false;
  }, [state.questionsLoaded, state.mockId, state.checkpoint60Complete]);

  // One automatic durable checkpoint, the first time the answered share reaches 60%.
  useEffect(() => {
    if (
      loading ||
      !state.questionsLoaded ||
      state.checkpoint60Complete ||
      checkpoint60TriggeredRef.current ||
      submissionInFlightRef.current
    ) return;

    const totalQuestions = Object.values(state.questionsBySection || {})
      .reduce((count, questions) => count + questions.length, 0);
    const answers = computeCurrentAnswers();
    if (!totalQuestions || Object.keys(answers).length / totalQuestions < 0.6) return;

    checkpoint60TriggeredRef.current = true;
    void saveCheckpoint(answers, { mark60PercentComplete: true });
  }, [
    computeCurrentAnswers,
    loading,
    saveCheckpoint,
    state.checkpoint60Complete,
    state.questionsBySection,
    state.questionsLoaded,
  ]);

  // A single complete safety snapshot near expiry; final submission remains independent and authoritative.
  useEffect(() => {
    if (
      loading ||
      !state.questionsLoaded ||
      state.totalSeconds > 30 ||
      finalCheckpointStartedRef.current ||
      submissionInFlightRef.current
    ) return;

    finalCheckpointStartedRef.current = true;
    void saveCheckpoint(computeCurrentAnswers());
  }, [computeCurrentAnswers, loading, saveCheckpoint, state.questionsLoaded, state.totalSeconds]);

  /* 📝 Submit */
  const handleSubmit = useCallback(async () => {
    if (!state.questionsLoaded || submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    const answers = computeCurrentAnswers();
    let resultId = null;

    try {
      const response = await submitAttempt({ mockId, answers });
      resultId = response.data?.resultId || null;
      if (!resultId) throw new Error("Submission response did not include a result ID");
    } catch (err) {
      const duplicateResultId = err.response?.status === 409 ? err.response.data?.resultId : null;
      if (duplicateResultId) {
        resultId = duplicateResultId;
      } else {
        submissionInFlightRef.current = false;
        toast.error(err.response?.data?.message || "Submission failed. Your answers are still saved on this device.");
        return;
      }
    }

    try {
      window.localStorage.removeItem(getTestStorageKey(mockId));
    } catch (storageError) {
      console.warn("Could not clear submitted exam recovery data:", storageError);
    }
    navigate(`/result/${resultId}`, { replace: true });
  }, [computeCurrentAnswers, mockId, navigate, state.questionsLoaded]);

  /* ⏰ Auto submit when timer reaches 0 */
  useEffect(() => {
    if (state.totalSeconds <= 0 && state.questionsLoaded && !loading) {
      void handleSubmit();
    }
  }, [state.totalSeconds, state.questionsLoaded, loading, handleSubmit]);

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
  const mockId = resolveMockId();
  return (
    <TestProvider mockId={mockId}>
      <TestPageInner mockId={mockId} />
    </TestProvider>
  );
}
