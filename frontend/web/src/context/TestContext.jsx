import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";

const TestStateContext = createContext();
const TestDispatchContext = createContext();
const TestProgressContext = createContext();

export function getTestStorageKey(mockId) {
  return `mockx_test_${mockId}_v1`;
}

function readSavedProgress(mockId) {
  if (!mockId || typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(getTestStorageKey(mockId)) || "null");
    return saved?.version === 1 && String(saved.mockId) === String(mockId) ? saved : null;
  } catch (error) {
    console.warn("Could not restore saved exam progress:", error);
    return null;
  }
}

function answersByQuestionCode(state) {
  const answers = {};
  for (const [sectionId, questions] of Object.entries(state.questionsBySection || {})) {
    const selected = state.selectedOptionsBySection?.[sectionId] || [];
    questions.forEach((question, index) => {
      if (question?.questionCode && selected[index] != null) {
        answers[question.questionCode] = selected[index];
      }
    });
  }
  return answers;
}

function questionStatusByCode(state) {
  const statuses = {};
  for (const [sectionId, questions] of Object.entries(state.questionsBySection || {})) {
    const status = state.questionStatusBySection?.[sectionId] || [];
    questions.forEach((question, index) => {
      if (question?.questionCode && status[index] && status[index] !== "unseen") {
        statuses[question.questionCode] = status[index];
      }
    });
  }
  return statuses;
}

const initialState = {
  mockId: null,
  questionsLoaded: false,
  checkpoint60Complete: false,
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
      const mockId = String(payload.mockId || "");
      const recovery = payload.recovery?.mockId === mockId ? payload.recovery : null;
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

        const questions = questionsMap[sec.id] || [];
        questions.forEach((question, index) => {
          const questionCode = question?.questionCode;
          if (!questionCode) return;
          const savedAnswer = recovery?.answers?.[questionCode];
          if (Number.isInteger(savedAnswer) && savedAnswer >= 0 && savedAnswer < (question.options?.length || 0)) {
            selectedOptionsBySection[sec.id][index] = savedAnswer;
          }

          const savedStatus = recovery?.questionStatuses?.[questionCode];
          if (["unseen", "answered", "review", "skipped"].includes(savedStatus)) {
            questionStatusBySection[sec.id][index] = savedStatus;
          } else if (selectedOptionsBySection[sec.id][index] != null) {
            questionStatusBySection[sec.id][index] = "answered";
          }
        });
      }

      const durationSeconds = (exam?.duration ? exam.duration * 60 : 180 * 60);
      const savedSection = sections.some((section) => section.id === recovery?.currentSection)
        ? recovery.currentSection
        : firstSectionId;
      const savedQuestionCode = recovery?.currentQuestionCode;
      const savedIndex = savedQuestionCode
        ? (questionsMap[savedSection] || []).findIndex((question) => question?.questionCode === savedQuestionCode)
        : -1;
      const restoredSeconds = Number(recovery?.totalSeconds);
      const totalSeconds = Number.isFinite(restoredSeconds)
        ? Math.max(0, Math.min(durationSeconds, Math.floor(restoredSeconds)))
        : durationSeconds;

      const fullSetA = questionsMap["A"] || [];
      const fullSetB = questionsMap["B"] || [];

      return {
        ...state,
        mockId,
        questionsLoaded: true,
        checkpoint60Complete: Boolean(recovery?.checkpoint60Complete),
        exam,
        sections,
        currentSection: savedSection,
        currentIndex: savedIndex >= 0 ? savedIndex : 0,
        totalSeconds,
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

    case "MARK_60_PERCENT_CHECKPOINT_COMPLETE":
      return state.checkpoint60Complete ? state : { ...state, checkpoint60Complete: true };

    case "DECREMENT_TIMER":
      return { ...state, totalSeconds: Math.max(0, state.totalSeconds - 1) };

    default:
      return state;
  }
}

export function TestProvider({ children, mockId }) {
  const [state, reducerDispatch] = useReducer(reducer, initialState);
  const dirtyAnswersRef = useRef({});
  const previousAnswersRef = useRef({});
  const baselinePendingRef = useRef(false);
  const lastTrackedMockRef = useRef(null);
  const latestStateRef = useRef(state);

  useLayoutEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  // Read recovery outside the reducer, then let SET_QUESTIONS apply it to the freshly loaded question list.
  const dispatch = useCallback((action) => {
    if (action.type !== "SET_QUESTIONS") {
      if (action.type === "SET_SELECTED") {
        const currentState = latestStateRef.current;
        if (currentState.questionsLoaded) {
          const sectionId = currentState.currentSection;
          const question = currentState.questionsBySection?.[sectionId]?.[currentState.currentIndex];
          if (question?.questionCode) {
            dirtyAnswersRef.current[question.questionCode] = action.payload;
          }
        }
      }
      reducerDispatch(action);
      return;
    }

    const targetMockId = String(action.payload?.mockId || mockId || "");
    const recovery = readSavedProgress(targetMockId);
    dirtyAnswersRef.current = {};
    previousAnswersRef.current = {};
    baselinePendingRef.current = true;
    reducerDispatch({
      ...action,
      payload: { ...action.payload, mockId: targetMockId, recovery },
    });
  }, [mockId]);

  // Track only changed answers; the selectedOptionsBySection state remains the sole live answer store.
  useEffect(() => {
    if (!state.questionsLoaded) return;

    const currentAnswers = answersByQuestionCode(state);
    if (baselinePendingRef.current || lastTrackedMockRef.current !== state.mockId) {
      dirtyAnswersRef.current = {};
      previousAnswersRef.current = currentAnswers;
      lastTrackedMockRef.current = state.mockId;
      baselinePendingRef.current = false;
      return;
    }

    const previousAnswers = previousAnswersRef.current;
    const questionCodes = new Set([
      ...Object.keys(previousAnswers),
      ...Object.keys(currentAnswers),
    ]);
    for (const questionCode of questionCodes) {
      const hadAnswer = Object.prototype.hasOwnProperty.call(previousAnswers, questionCode);
      const hasAnswer = Object.prototype.hasOwnProperty.call(currentAnswers, questionCode);
      if (hadAnswer === hasAnswer && Object.is(previousAnswers[questionCode], currentAnswers[questionCode])) continue;
      dirtyAnswersRef.current[questionCode] = hasAnswer ? currentAnswers[questionCode] : null;
    }
    previousAnswersRef.current = currentAnswers;
  }, [state.mockId, state.questionsLoaded, state.questionsBySection, state.selectedOptionsBySection]);

  // Persist only recovery data, never question content or other server payloads.
  useEffect(() => {
    if (!state.questionsLoaded || !state.mockId || typeof window === "undefined") return;
    const sectionQuestions = state.questionsBySection?.[state.currentSection] || [];
    const currentQuestionCode = sectionQuestions[state.currentIndex]?.questionCode || null;
    const recovery = {
      version: 1,
      mockId: state.mockId,
      answers: answersByQuestionCode(state),
      questionStatuses: questionStatusByCode(state),
      totalSeconds: state.totalSeconds,
      currentSection: state.currentSection,
      currentQuestionCode,
      checkpoint60Complete: state.checkpoint60Complete,
    };
    try {
      window.localStorage.setItem(getTestStorageKey(state.mockId), JSON.stringify(recovery));
    } catch (error) {
      console.warn("Could not persist exam progress locally:", error);
    }
  }, [
    state.mockId,
    state.questionsLoaded,
    state.questionsBySection,
    state.selectedOptionsBySection,
    state.questionStatusBySection,
    state.currentSection,
    state.currentIndex,
    state.totalSeconds,
    state.checkpoint60Complete,
  ]);

  const getDirtyAnswersSnapshot = useCallback(() => ({ ...dirtyAnswersRef.current }), []);
  const clearDirtyAnswers = useCallback((snapshot) => {
    for (const [questionCode, savedValue] of Object.entries(snapshot || {})) {
      if (
        Object.prototype.hasOwnProperty.call(dirtyAnswersRef.current, questionCode) &&
        Object.is(dirtyAnswersRef.current[questionCode], savedValue)
      ) {
        delete dirtyAnswersRef.current[questionCode];
      }
    }
  }, []);
  const progressValue = useMemo(() => ({
    dirtyAnswersRef,
    getDirtyAnswersSnapshot,
    clearDirtyAnswers,
  }), [getDirtyAnswersSnapshot, clearDirtyAnswers]);

  return (
    <TestStateContext.Provider value={state}>
      <TestDispatchContext.Provider value={dispatch}>
        <TestProgressContext.Provider value={progressValue}>
          {children}
        </TestProgressContext.Provider>
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

export function useTestProgress() {
  return useContext(TestProgressContext);
}
