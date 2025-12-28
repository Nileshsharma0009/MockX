import React, { createContext, useContext, useReducer, useEffect } from "react";

const TestStateContext = createContext();
const TestDispatchContext = createContext();

const initialState = {
  currentSection: "A",
  currentIndex: 0,
  totalSeconds: 180 * 60,
  timerRunning: false,

  // dynamic – filled after fetch
  fullSetA: [],
  fullSetB: [],

  questionStatusA: [],
  questionStatusB: [],
  questionLockA: [],
  questionLockB: [],
  selectedOptionsA: [],
  selectedOptionsB: [],
};

function getSectionLength(state) {
  return state.currentSection === "A"
    ? state.fullSetA.length
    : state.fullSetB.length;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUESTIONS": {
      const lenA = action.payload.A.length;
      const lenB = action.payload.B.length;

      return {
        ...state,
        fullSetA: action.payload.A,
        fullSetB: action.payload.B,

        currentSection: "A",
        currentIndex: 0,

        questionStatusA: Array(lenA).fill("unseen"),
        questionStatusB: Array(lenB).fill("unseen"),
        questionLockA: Array(lenA).fill(false),
        questionLockB: Array(lenB).fill(false),
        selectedOptionsA: Array(lenA).fill(null),
        selectedOptionsB: Array(lenB).fill(null),
      };
    }

    case "SET_SECTION":
      return { ...state, currentSection: action.payload, currentIndex: 0 };

    case "SET_INDEX":
      return { ...state, currentIndex: action.payload };

    case "SET_SELECTED": {
      const idx = state.currentIndex;

      if (state.currentSection === "A") {
        const selected = [...state.selectedOptionsA];
        const status = [...state.questionStatusA];

        selected[idx] = action.payload;
        status[idx] = "answered";

        return {
          ...state,
          selectedOptionsA: selected,
          questionStatusA: status,
        };
      } else {
        const selected = [...state.selectedOptionsB];
        const status = [...state.questionStatusB];

        selected[idx] = action.payload;
        status[idx] = "answered";

        return {
          ...state,
          selectedOptionsB: selected,
          questionStatusB: status,
        };
      }
    }

    case "MARK_REVIEW": {
      const len = getSectionLength(state);
      if (len === 0) return state;

      if (state.currentSection === "A") {
        const status = [...state.questionStatusA];
        status[state.currentIndex] = "review";

        return {
          ...state,
          questionStatusA: status,
          currentIndex: (state.currentIndex + 1) % len,
        };
      } else {
        const status = [...state.questionStatusB];
        status[state.currentIndex] = "review";

        return {
          ...state,
          questionStatusB: status,
          currentIndex: (state.currentIndex + 1) % len,
        };
      }
    }

    case "SAVE_AND_NEXT": {
      const len = getSectionLength(state);
      if (len === 0) return state;

      return {
        ...state,
        currentIndex: (state.currentIndex + 1) % len,
      };
    }

    case "GO_BACK":
      return {
        ...state,
        currentIndex: Math.max(0, state.currentIndex - 1),
      };

    case "SKIP": {
      const len = getSectionLength(state);
      if (len === 0) return state;

      if (state.currentSection === "A") {
        const status = [...state.questionStatusA];
        if (status[state.currentIndex] === "unseen") {
          status[state.currentIndex] = "skipped";
        }

        return {
          ...state,
          questionStatusA: status,
          currentIndex: (state.currentIndex + 1) % len,
        };
      } else {
        const status = [...state.questionStatusB];
        if (status[state.currentIndex] === "unseen") {
          status[state.currentIndex] = "skipped";
        }

        return {
          ...state,
          questionStatusB: status,
          currentIndex: (state.currentIndex + 1) % len,
        };
      }
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

  // persist progress (NOT questions)
  useEffect(() => {
    localStorage.setItem(
      "testState_v1",
      JSON.stringify({
        selectedOptionsA: state.selectedOptionsA,
        selectedOptionsB: state.selectedOptionsB,
        questionStatusA: state.questionStatusA,
        questionStatusB: state.questionStatusB,
        totalSeconds: state.totalSeconds,
      })
    );
  }, [
    state.selectedOptionsA,
    state.selectedOptionsB,
    state.questionStatusA,
    state.questionStatusB,
    state.totalSeconds,
  ]);

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
