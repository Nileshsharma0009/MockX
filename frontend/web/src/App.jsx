// // src/App.jsx
// // src/App.jsx
// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   TestProvider,
//   useTestState,
//   useTestDispatch,
// } from "./context/TestContext.jsx";

// import { submitAttempt } from "./api/api";
// import Footer from "./components/Footer.jsx";



// import Navbar from "./components/Navbar";
// import Timer from "./components/Timer";
// import QuestionPanel from "./components/QuestionPanel";
// import Sidebar from "./components/Sidebar";
// import ControlsBar from "./components/ControlsBar";
// import StatsToggleFab from "./components/StatsToggleFab";

// import { shuffleWithGroups } from "./utils/shuffle";

// /* ---------- API Base URL ---------- */
// const API_BASE = import.meta.env.VITE_API_BASE || "https://mockx-backend.vercel.app";

// /* ---------- helper: normalize mock id ---------- */
// function resolveMockId() {
//   const param = new URLSearchParams(window.location.search).get("mock");

//   // allow ?mock=1 or ?mock=imu1
//   if (!param) return "imu1";
//   if (param.startsWith("imu")) return param;

//   return `imu${param}`;
// }

// function TestPageInner() {
//   const state = useTestState();
//   const dispatch = useTestDispatch();
//   const navigate = useNavigate();

//   const [statsOpen, setStatsOpen] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [mockId, setMockId] = useState("imu1");

//   /* ⏱ Init timer (ONCE) */
//   useEffect(() => {
//     dispatch({ type: "SET_TIMER", payload: 180 * 60 });
//   }, [dispatch]);


//  /* 📥 Load questions FROM DATABASE */
// useEffect(() => {
//   const resolvedMock = resolveMockId();

//   setMockId(resolvedMock);
//   setLoading(true);

//   localStorage.removeItem("testState_v1");

//   // fetch(`http://localhost:5000/api/mocks/${resolvedMock}/questions`, {
//   //   credentials: "include", // 🔥 REQUIRED for cookie auth
//   // })

//   fetch(`${API_BASE}/api/mocks/${resolvedMock}/questions`, {
//   credentials: "include", // 🔥 REQUIRED for cookie auth
// })
//     .then(async (r) => {
//       // 🔒 BLOCK IF ALREADY ATTEMPTED
//       if (r.status === 403) {
//         const data = await r.json();
//         alert("You have already attempted this test.");
//         navigate("/mock-tests"); // ⬅️ redirect here
//         return null;
//       }

//       if (!r.ok) throw new Error("Failed to load questions");
//       return r.json();
//     })
//     .then((data) => {
//       if (!data) return; // ⬅️ important



//       dispatch({
//         type: "SET_QUESTIONS",
//         payload: {
//           A: shuffleWithGroups(data.A || []),
//           B: shuffleWithGroups(data.B || []),
//         },
//       });

//       setLoading(false);
//     })
//     .catch((err) => {
//       console.error(err);
//       alert("Failed to load questions");
//       setLoading(false);
//     });
// }, [dispatch, navigate]);







// const handleSubmit = useCallback(async () => {
//   if (!window.confirm("Are you sure you want to submit the test?")) return;

//   try {
//     const answers = {};

//     state.fullSetA.forEach((q, i) => {
//       const sel = state.selectedOptionsA[i];
//       if (sel !== null && sel !== undefined) {
//         answers[q.questionCode] = sel;
//       }
//     });

//     state.fullSetB.forEach((q, i) => {
//       const sel = state.selectedOptionsB[i];
//       if (sel !== null && sel !== undefined) {
//         answers[q.questionCode] = sel;
//       }
//     });

//     const res = await submitAttempt({ mockId, answers });
//     const data = res.data;

//     // ✅ ROUTE-BASED RESULT (NO localStorage DEPENDENCY)
//     navigate(`/result/${data.resultId}`, { replace: true });

//   } catch (err) {
//     console.error("SUBMIT ERROR:", err.response?.data || err.message);
//     alert(err.response?.data?.message || "Failed to submit test");
//   }
// }, [
//   state.fullSetA,
//   state.fullSetB,
//   state.selectedOptionsA,
//   state.selectedOptionsB,
//   mockId,
//   navigate,
// ]);

// useEffect(() => {
//   if (state.timer === 0 && !state.isSubmitted && !loading) {
//     handleSubmit(true); // 🔥 AUTO SUBMIT
//   }
// }, [state.timer, state.isSubmitted, loading, handleSubmit]);



//   return (
//     <>
//       <Navbar />
//       <Timer />

//       {loading ? (
//         <div className="mt-32 text-center text-gray-500">
//           Loading questions...
//         </div>
//       ) : (
//         <>
//           <QuestionPanel />
//           <StatsToggleFab
//             open={statsOpen}
//             onToggle={() => setStatsOpen((v) => !v)}
//           />
//           <Sidebar visible={statsOpen} />
//           <ControlsBar onSubmit={handleSubmit} />
//         </>
//       )}
//     </>
//   );
// }

// export default function App() {
//   return (
//     <TestProvider>
       
//       <TestPageInner />
//     </TestProvider>
//   );
// }

import React, {
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  TestProvider,
  useTestState,
  useTestDispatch,
} from "./context/TestContext.jsx";

import { submitAttempt } from "./api/api";
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
          alert("You have already attempted this test.");
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
        alert("Failed to load questions");
        setLoading(false);
      });
  }, [dispatch, navigate]);

  /* 📝 Submit */
  const handleSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    const answers = {};

    state.fullSetA.forEach((q, i) => {
      const sel = state.selectedOptionsA[i];
      if (sel != null) answers[q.questionCode] = sel;
    });

    state.fullSetB.forEach((q, i) => {
      const sel = state.selectedOptionsB[i];
      if (sel != null) answers[q.questionCode] = sel;
    });

    const res = await submitAttempt({ mockId, answers });
    navigate(`/result/${res.data.resultId}`, { replace: true });
  }, [
    state.fullSetA,
    state.fullSetB,
    state.selectedOptionsA,
    state.selectedOptionsB,
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
