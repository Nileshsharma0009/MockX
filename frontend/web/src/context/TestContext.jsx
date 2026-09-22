import React, { createContext, useContext, useReducer, useEffect } from "react";

const TestStateContext = createContext();
const TestDispatchContext = createContext();

const initialState = {
  exam: null,
  sections: [],
  currentSection: "A",
  currentIndex: 0,
  totalSeconds: 180 * 60,
  timerRunning: false,

  // dynamic stores keyed by section id
  questionsBySection: {},
  questionStatusBySection: {},
  selectedOptionsBySection: {},

  // backward compatibility fields
  fullSetA: [],
  fullSetB: [],
  questionStatusA: [],
  questionStatusB: [],
  selectedOptionsA: [],
  selectedOptionsB: [],
};

function getSectionLength(state) {
  const currentSet = state.questionsBySection[state.currentSection] || [];
  return currentSet.length;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUESTIONS": {
      const payload = action.payload;
      const exam = payload.exam || null;
      const questionsMap = payload.questions || {
        A: payload.A || [],
        B: payload.B || [],
      };

      const sections =
        exam?.sections && exam.sections.length > 0
          ? exam.sections
          : Object.keys(questionsMap).map((key) => ({
              id: key,
              name: `Section ${key}`,
            }));

      const firstSectionId = sections[0]?.id || "A";

      const questionStatusBySection = {};
      const selectedOptionsBySection = {};

      for (const sec of sections) {
        const count = (questionsMap[sec.id] || []).length;
        questionStatusBySection[sec.id] = Array(count).fill("unseen");
        selectedOptionsBySection[sec.id] = Array(count).fill(null);
      }

      const durationSeconds = (exam?.duration ? exam.duration * 60 : 180 * 60);

      const fullSetA = questionsMap["A"] || [];
      const fullSetB = questionsMap["B"] || [];

      return {
        ...state,
        exam,
        sections,
        currentSection: firstSectionId,
        currentIndex: 0,
        totalSeconds: durationSeconds,
        questionsBySection: questionsMap,
        questionStatusBySection,
        selectedOptionsBySection,

        // backward compatibility
        fullSetA,
        fullSetB,
        questionStatusA: questionStatusBySection["A"] || Array(fullSetA.length).fill("unseen"),
        questionStatusB: questionStatusBySection["B"] || Array(fullSetB.length).fill("unseen"),
        selectedOptionsA: selectedOptionsBySection["A"] || Array(fullSetA.length).fill(null),
        selectedOptionsB: selectedOptionsBySection["B"] || Array(fullSetB.length).fill(null),
      };
    }

    case "SET_SECTION":
      return { ...state, currentSection: action.payload, currentIndex: 0 };

    case "SET_INDEX":
      return { ...state, currentIndex: action.payload };

    case "SET_SELECTED": {
      const sec = state.currentSection;
      const idx = state.currentIndex;
      const currentSelected = state.selectedOptionsBySection[sec] || [];
      const currentStatus = state.questionStatusBySection[sec] || [];

      const selected = [...currentSelected];
      const status = [...currentStatus];

      selected[idx] = action.payload;
      status[idx] = "answered";

      const nextSelectedBySection = {
        ...state.selectedOptionsBySection,
        [sec]: selected,
      };
      const nextStatusBySection = {
        ...state.questionStatusBySection,
        [sec]: status,
      };

      return {
        ...state,
        selectedOptionsBySection: nextSelectedBySection,
        questionStatusBySection: nextStatusBySection,
        selectedOptionsA: nextSelectedBySection["A"] || state.selectedOptionsA,
        selectedOptionsB: nextSelectedBySection["B"] || state.selectedOptionsB,
        questionStatusA: nextStatusBySection["A"] || state.questionStatusA,
        questionStatusB: nextStatusBySection["B"] || state.questionStatusB,
      };
    }

    case "MARK_REVIEW": {
      const sec = state.currentSection;
      const len = getSectionLength(state);
      if (len === 0) return state;

      const currentStatus = state.questionStatusBySection[sec] || [];
      const status = [...currentStatus];
      status[state.currentIndex] = "review";

      const nextStatusBySection = {
        ...state.questionStatusBySection,
        [sec]: status,
      };

      return {
        ...state,
        questionStatusBySection: nextStatusBySection,
        currentIndex: (state.currentIndex + 1) % len,
        questionStatusA: nextStatusBySection["A"] || state.questionStatusA,
        questionStatusB: nextStatusBySection["B"] || state.questionStatusB,
      };
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
      const sec = state.currentSection;
      const len = getSectionLength(state);
      if (len === 0) return state;

      const currentStatus = state.questionStatusBySection[sec] || [];
      const status = [...currentStatus];
      if (status[state.currentIndex] === "unseen") {
        status[state.currentIndex] = "skipped";
      }

      const nextStatusBySection = {
        ...state.questionStatusBySection,
        [sec]: status,
      };

      return {
        ...state,
        questionStatusBySection: nextStatusBySection,
        currentIndex: (state.currentIndex + 1) % len,
        questionStatusA: nextStatusBySection["A"] || state.questionStatusA,
        questionStatusB: nextStatusBySection["B"] || state.questionStatusB,
      };
    }

    case "SET_TIMER":
      return { ...state, totalSeconds: action.payload };

    case "DECREMENT_TIMER":
      return { ...state, totalSeconds: Math.max(0, state.totalSeconds - 1) };

    default:
      return state;
  }
}

export function TestProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist progress
  useEffect(() => {
    localStorage.setItem(
      "testState_v1",
      JSON.stringify({
        selectedOptionsBySection: state.selectedOptionsBySection,
        questionStatusBySection: state.questionStatusBySection,
        selectedOptionsA: state.selectedOptionsA,
        selectedOptionsB: state.selectedOptionsB,
        questionStatusA: state.questionStatusA,
        questionStatusB: state.questionStatusB,
        totalSeconds: state.totalSeconds,
      })
    );
  }, [
    state.selectedOptionsBySection,
    state.questionStatusBySection,
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
