// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TestProvider, useTestState, useTestDispatch } from "./context/TestContext.jsx";
import Navbar from "./components/Navbar";
import Timer from "./components/Timer";
import QuestionPanel from "./components/QuestionPanel";
import Sidebar from "./components/Sidebar";
import ControlsBar from "./components/ControlsBar";
import StatsToggleFab from "./components/StatsToggleFab";
import { shuffle } from "./utils/shuffle";

function TestPageInner() {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mockId, setMockId] = useState("1");

  // initialize timer and clear previous transient test state
  useEffect(() => {
    dispatch({ type: "SET_TIMER", payload: 180 * 60 });
    localStorage.removeItem("testState_v1");
  }, [dispatch]);

  const handleSubmit = useCallback(() => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    function calc(questions, answers) {
      let score = 0,
        correct = 0,
        attempted = 0;
      (questions || []).forEach((q, i) => {
        const a = answers?.[i];
        if (a !== null && a !== undefined) {
          attempted++;
          if (a === q.answer) {
            score += 1;
            correct++;
          } else {
            score -= 0.25;
          }
        }
      });
      return { score, correct, attempted };
    }

    const resA = calc(state.fullSetA, state.selectedOptionsA);
    const resB = calc(state.fullSetB, state.selectedOptionsB);
    const totalScore = (resA.score || 0) + (resB.score || 0);

    // persist results for ResultPage to read
    const resultPayload = { resA, resB, totalScore };
    localStorage.setItem("testResult", JSON.stringify(resultPayload));
    localStorage.setItem("testScore", String(totalScore));
    // store mock test name dynamically based on mock ID
    localStorage.setItem("mockTestName", `IMU Mock Test ${mockId}`);

    // ensure userData exists (your registration flow should set this earlier)
    // we simply preserve it if present
    const existingUser = localStorage.getItem("userData");
    if (!existingUser) {
      // optional fallback if you want to auto-fill a minimal object:
      // localStorage.setItem("userData", JSON.stringify({ name: "Unknown", email: "" }));
      console.warn("userData not found in localStorage — ResultPage may show missing user info.");
    }

    // navigate to SPA result route
    navigate("/result");
  }, [state.fullSetA, state.fullSetB, state.selectedOptionsA, state.selectedOptionsB, navigate, mockId]);

  // load questions JSON for selected mock (once on mount)
  useEffect(() => {
    const mock = new URLSearchParams(window.location.search).get("mock") || "1";
    setMockId(mock);
    setLoading(true);

    fetch(`/imu${mock}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch questions JSON");
        return r.json();
      })
      .then((data) => {
        const englishA = shuffle(data.A?.english || []);
        const gkA = shuffle(data.A?.gk || []);
        const aptA = shuffle(data.A?.apptitude || []);
        const fullA = [...englishA, ...gkA, ...aptA].slice(0, state.totalQuestions);

        const phy = shuffle(data.B?.physics || []);
        const maths = shuffle(data.B?.maths || []);
        const che = shuffle(data.B?.chemistry || []);
        const fullB = [...phy, ...maths, ...che].slice(0, state.totalQuestions);

        dispatch({ type: "SET_QUESTIONS", payload: { A: fullA, B: fullB } });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load questions JSON");
        setLoading(false);
      });
  }, [dispatch, state.totalQuestions]);

  // copy-protect + listen for submit-test custom event
  useEffect(() => {
    const onCopy = (e) => {
      e.preventDefault();
      if (e.clipboardData) e.clipboardData.setData("text/plain", "Copying disabled on this page.");
      // lightweight UX note rather than noisy repeated alerts in production
      alert("Copying is disabled on the test page.");
    };
    document.addEventListener("copy", onCopy);

    const onSubmitEvent = () => handleSubmit();
    window.addEventListener("submit-test", onSubmitEvent);

    return () => {
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("submit-test", onSubmitEvent);
    };
  }, [handleSubmit]);

  // adjust main container padding when stats sidebar opens/closes
  useEffect(() => {
    const container = document.querySelector(".container");
    if (!container) return;
    const update = () => {
      if (window.innerWidth <= 768) container.style.paddingRight = "15px";
      else container.style.paddingRight = statsOpen ? "300px" : "20px";
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [statsOpen]);

  return (
    <>
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <Timer />
      {loading ? (
        <div className="mt-32 text-center text-gray-500">Loading questions...</div>
      ) : (
        <>
          <QuestionPanel />
          <StatsToggleFab open={statsOpen} onToggle={() => setStatsOpen((v) => !v)} />
          <Sidebar visible={statsOpen} />
          <ControlsBar onSubmit={handleSubmit} />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <TestProvider>
      <TestPageInner />
    </TestProvider>
  );
}
