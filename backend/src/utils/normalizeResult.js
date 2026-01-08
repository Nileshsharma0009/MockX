export function normalizeResult(rawResult, examCode) {
  const config = examConfig[examCode];

  const subjects = {};

  for (const sub in config.subjects) {
    subjects[sub] = {
      attempted: rawResult[sub].attempted,
      correct: rawResult[sub].correct,
      wrong: rawResult[sub].wrong,
      marks: rawResult[sub].correct * config.subjects[sub].marks,
      timeSpentMin: rawResult[sub].time
    };
  }

  return {
    exam: examCode,
    mockId: rawResult.mockId,
    summary: {
      score: rawResult.score,
      accuracy: rawResult.accuracy
    },
    subjects
  };
}
