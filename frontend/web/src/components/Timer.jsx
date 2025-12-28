import React, { useEffect, useRef } from "react";
import { useTestState, useTestDispatch } from "../context/TestContext.jsx";

export default function Timer() {
  const state = useTestState();
  const dispatch = useTestDispatch();
  const intervalRef = useRef(null);
  const startedRef = useRef(false);

  // Start timer only when question sets are present
  useEffect(() => {
    const questionsLoaded =
      (state.fullSetA && state.fullSetA.length > 0) ||
      (state.fullSetB && state.fullSetB.length > 0);

    if (!questionsLoaded) return;

    if (startedRef.current) return;
    startedRef.current = true;

    intervalRef.current = setInterval(() => {
      dispatch({ type: "DECREMENT_TIMER" });
    }, 1000);

    // notify app that test is running
    window.dispatchEvent(new CustomEvent("test-progress", { detail: { inProgress: true } }));
    window.__TEST_IN_PROGRESS = true;

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      startedRef.current = false;
      window.dispatchEvent(new CustomEvent("test-progress", { detail: { inProgress: false } }));
      window.__TEST_IN_PROGRESS = false;
    };
  }, [state.fullSetA, state.fullSetB, dispatch]);

  // update timer DOM and auto-submit when zero
  useEffect(() => {
    const el = document.getElementById("timer");
    if (el) {
      const hours = Math.floor(state.totalSeconds / 3600);
      const minutes = Math.floor((state.totalSeconds % 3600) / 60);
      const secs = state.totalSeconds % 60;
      el.textContent = `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
    }

    if (state.totalSeconds <= 0) {
      clearInterval(intervalRef.current);
      window.dispatchEvent(new CustomEvent('submit-test'));
    }
  }, [state.totalSeconds]);

  return null;
}
