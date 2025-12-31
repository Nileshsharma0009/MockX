// src/App.jsx
// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TestProvider,
  useTestState,
  useTestDispatch,
} from "./context/TestContext.jsx";

import api from "../api/api";

import Navbar from "./components/Navbar";
import Timer from "./components/Timer";
import QuestionPanel from "./components/QuestionPanel";
import Sidebar from "./components/Sidebar";
import ControlsBar from "./components/ControlsBar";
import StatsToggleFab from "./components/StatsToggleFab";

import { shuffleWithGroups } from "./utils/shuffle";

/* ---------- helper: normalize mock id ---------- */
function resolveMockId() {
  const param = new URLSearchParams(window.location.search).get("mock");

  // allow ?mock=1 or ?mock=imu1
  if (!param) return "imu1";
  if (param.startsWith("imu")) return param;

  return `imu${param}`;
}

function TestPageInner() {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const navigate = useNavigate();

  const [statsOpen, setStatsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mockId, setMockId] = useState("imu1");

  /* ⏱ Init timer (ONCE) */
  useEffect(() => {
    dispatch({ type: "SET_TIMER", payload: 180 * 60 });
  }, [dispatch]);


 /* 📥 Load questions FROM DATABASE */
useEffect(() => {
  const resolvedMock = resolveMockId();

  setMockId(resolvedMock);
  setLoading(true);

  localStorage.removeItem("testState_v1");

  // fetch(`http://localhost:5000/api/mocks/${resolvedMock}/questions`, {
  //   credentials: "include", // 🔥 REQUIRED for cookie auth
  // })

  fetch(`${API_BASE}/api/mocks/${resolvedMock}/questions`, {
  credentials: "include", // 🔥 REQUIRED for cookie auth
})
    .then(async (r) => {
      // 🔒 BLOCK IF ALREADY ATTEMPTED
      if (r.status === 403) {
        const data = await r.json();
        alert("You have already attempted this test.");
        navigate("/mock-tests"); // ⬅️ redirect here
        return null;
      }

      if (!r.ok) throw new Error("Failed to load questions");
      return r.json();
    })
    .then((data) => {
      if (!data) return; // ⬅️ important

      console.log("🟢 QUESTIONS FROM DB:", data);

      dispatch({
        type: "SET_QUESTIONS",
        payload: {
          A: shuffleWithGroups(data.A || []),
          B: shuffleWithGroups(data.B || []),
        },
      });

      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to load questions");
      setLoading(false);
    });
}, [dispatch, navigate]);


  /* ✅ Submit test → backend scoring */
  const handleSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    try {
      const answers = {};

      state.fullSetA.forEach((q, i) => {
        const sel = state.selectedOptionsA[i];
        if (sel !== null && sel !== undefined) {
          answers[q.questionCode] = sel;
        }
      });

      state.fullSetB.forEach((q, i) => {
        const sel = state.selectedOptionsB[i];
        if (sel !== null && sel !== undefined) {
          answers[q.questionCode] = sel;
        }
      });

      console.log("🟡 SENDING ANSWERS:", answers);


const token = localStorage.getItem("token");
// const res = await fetch("http://localhost:5000/api/tests/submit", {
//   method: "POST",
//   credentials: "include", // 🔥 REQUIRED
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({ mockId, answers }),
// }); 

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const res = await fetch(`${API_BASE}/api/tests/submit`, {
  method: "POST",
  credentials: "include", // 🔥 REQUIRED
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ mockId, answers }),
});


      if (!res.ok) throw new Error("Submission failed");

      const data = await res.json();

      localStorage.setItem("testScore", data.score);
      localStorage.setItem("testResult", JSON.stringify(data));
      localStorage.setItem("mockTestName", `IMU Mock Test ${mockId}`);

      navigate("/result", { replace: true });

    } catch (err) {
      console.error(err);
      alert("Failed to submit test");
    }
  }, [
    state.fullSetA,
    state.fullSetB,
    state.selectedOptionsA,
    state.selectedOptionsB,
    mockId,
    navigate,
  ]);

  return (
    <>
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
