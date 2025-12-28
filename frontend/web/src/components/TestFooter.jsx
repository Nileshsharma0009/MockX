import { submitAttempt } from "../api/api";
import { useTestState } from "../context/TestContext";

const submitTest = async () => {
  const state = useTestState();

  const allQuestions = [...state.fullSetA, ...state.fullSetB];
  const allSelected = [
    ...state.selectedOptionsA,
    ...state.selectedOptionsB,
  ];

  const responses = allQuestions
    .map((q, i) => ({
      questionCode: q.questionCode,
      selected: allSelected[i],
    }))
    .filter(r => r.selected !== null);

  const res = await submitAttempt({
    mockId: "imu1",
    responses,
  });

  console.log("RESULT:", res.data);
};
export default submitTest;