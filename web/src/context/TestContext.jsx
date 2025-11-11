import React, { createContext, useContext, useReducer, useEffect } from "react";

const TestStateContext = createContext();
const TestDispatchContext = createContext();

const initialState = {
  totalQuestions: 100,
  currentSection: "A",
  currentIndex: 0,
  totalSeconds: 180 * 60,
  timerRunning: false,
  questionStatusA: Array(100).fill("unseen"),
  questionStatusB: Array(100).fill("unseen"),
  questionLockA: Array(100).fill(false),
  questionLockB: Array(100).fill(false),
  selectedOptionsA: Array(100).fill(null),
  selectedOptionsB: Array(100).fill(null),
  fullSetA: [],
  fullSetB: []
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, fullSetA: action.payload.A, fullSetB: action.payload.B };
    case "SET_SECTION":
      return { ...state, currentSection: action.payload, currentIndex: 0 };
    case "SET_INDEX":
      return { ...state, currentIndex: action.payload };
    case "SET_SELECTED":
      if (state.currentSection === "A") {
        const selA = state.selectedOptionsA.slice();
        selA[state.currentIndex] = action.payload;
        const statusA = state.questionStatusA.slice();
        statusA[state.currentIndex] = "answered";
        return { ...state, selectedOptionsA: selA, questionStatusA: statusA };
      } else {
        const selB = state.selectedOptionsB.slice();
        selB[state.currentIndex] = action.payload;
        const statusB = state.questionStatusB.slice();
        statusB[state.currentIndex] = "answered";
        return { ...state, selectedOptionsB: selB, questionStatusB: statusB };
      }
    case "MARK_REVIEW":
      if (state.currentSection === "A") {
        const s = state.questionStatusA.slice(); s[state.currentIndex] = "review";
        return { ...state, questionStatusA: s, currentIndex: (state.currentIndex + 1) % state.totalQuestions };
      } else {
        const s = state.questionStatusB.slice(); s[state.currentIndex] = "review";
        return { ...state, questionStatusB: s, currentIndex: (state.currentIndex + 1) % state.totalQuestions };
      }
    case "SAVE_AND_NEXT":
      return { ...state, currentIndex: (state.currentIndex + 1) % state.totalQuestions };
    case "GO_BACK":
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case "SKIP":
      if (state.currentSection === "A") {
        const s = state.questionStatusA.slice();
        if (s[state.currentIndex] === "unseen") s[state.currentIndex] = "skipped";
        return { ...state, questionStatusA: s, currentIndex: (state.currentIndex + 1) % state.totalQuestions };
      } else {
        const s = state.questionStatusB.slice();
        if (s[state.currentIndex] === "unseen") s[state.currentIndex] = "skipped";
        return { ...state, questionStatusB: s, currentIndex: (state.currentIndex + 1) % state.totalQuestions };
      }
    case "SET_TIMER":
      return { ...state, totalSeconds: action.payload };
    case "DECREMENT_TIMER":
      return { ...state, totalSeconds: state.totalSeconds - 1 };
    default:
      return state;
  }
}

export function TestProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // persist some parts
  useEffect(() => {
    localStorage.setItem("testState_v1", JSON.stringify({
      selectedOptionsA: state.selectedOptionsA,
      selectedOptionsB: state.selectedOptionsB,
      questionStatusA: state.questionStatusA,
      questionStatusB: state.questionStatusB,
      totalSeconds: state.totalSeconds
    }));
  }, [state.selectedOptionsA, state.selectedOptionsB, state.questionStatusA, state.questionStatusB, state.totalSeconds]);

  return (
    <TestStateContext.Provider value={state}>
      <TestDispatchContext.Provider value={dispatch}>
        {children}
      </TestDispatchContext.Provider>
    </TestStateContext.Provider>
  );
}

export function useTestState() {
  return useContext(TestStateContext);
}
export function useTestDispatch() {
  return useContext(TestDispatchContext);
}
