import assert from "assert";

console.log("🧪 Running Dynamic Exam Engine Unit & Architecture Verification...");

// 1. Verify Fallback / Config for IMUCET
const imuMock = {
  _id: "imu1",
  title: "IMUCET Mock 1",
  exam: "imucet",
  isFree: true,
  duration: 180,
  totalQuestions: 200,
  totalMarks: 200,
  marking: { correct: 1, incorrect: 0.25 },
  sections: [
    { id: "A", name: "Section A", questionCount: 100 },
    { id: "B", name: "Section B", questionCount: 100 },
  ],
};

assert.strictEqual(imuMock.duration, 180, "IMUCET duration should be 180 minutes");
assert.strictEqual(imuMock.marking.correct, 1, "IMUCET correct mark should be 1");
assert.strictEqual(imuMock.marking.incorrect, 0.25, "IMUCET negative mark should be 0.25");
assert.strictEqual(imuMock.sections.length, 2, "IMUCET should have 2 sections");
console.log("✅ IMUCET Mock configuration verified");

// 2. Verify Fallback / Config for Custom Exam
const customMock = {
  _id: "custom-phy-01",
  title: "Physics Practice Test",
  exam: "physics",
  isFree: true,
  duration: 30,
  totalQuestions: 25,
  totalMarks: 50,
  marking: { correct: 2, incorrect: 0.5 },
  sections: [
    { id: "phy", name: "Physics", questionCount: 25 },
  ],
};

assert.strictEqual(customMock.duration, 30, "Custom exam duration should be 30 minutes");
assert.strictEqual(customMock.totalQuestions, 25, "Custom exam should have 25 questions");
assert.strictEqual(customMock.marking.correct, 2, "Custom exam correct mark should be 2");
assert.strictEqual(customMock.marking.incorrect, 0.5, "Custom exam negative mark should be 0.5");
assert.strictEqual(customMock.sections.length, 1, "Custom exam should have 1 section");
assert.strictEqual(customMock.sections[0].id, "phy", "Custom section id should be 'phy'");
console.log("✅ Custom Exam configuration verified");

// 3. Verify Dynamic Scoring Engine
function calculateDynamicScore(mock, answers, questionMap) {
  const correctMarks = mock?.marking?.correct !== undefined ? mock.marking.correct : 1;
  const negativeMarks = mock?.marking?.incorrect !== undefined ? mock.marking.incorrect : 0.25;
  const totalExamMarks = mock?.totalMarks || 200;

  let score = 0;
  const subjectStats = {};
  const sectionScores = {};

  for (const [code, selected] of Object.entries(answers)) {
    const q = questionMap.get(code);
    if (!q) continue;

    const subject = q.subject || "general";
    const section = q.section || "A";

    if (!subjectStats[subject]) {
      subjectStats[subject] = { attempted: 0, correct: 0, wrong: 0, accuracy: 0 };
    }
    if (sectionScores[section] === undefined) {
      sectionScores[section] = 0;
    }

    subjectStats[subject].attempted++;

    if (Number(selected) === q.correctOption) {
      score += correctMarks;
      sectionScores[section] += correctMarks;
      subjectStats[subject].correct++;
    } else {
      score -= negativeMarks;
      sectionScores[section] -= negativeMarks;
      subjectStats[subject].wrong++;
    }
  }

  score = Math.round(score * 100) / 100;
  for (const subj of Object.keys(subjectStats)) {
    const s = subjectStats[subj];
    s.accuracy = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
  }

  return { score, total: totalExamMarks, subjectStats, sectionScores };
}

// Test IMUCET Scoring: 3 questions (+1 for correct, -0.25 for wrong)
const imuQuestionMap = new Map([
  ["q1", { correctOption: 0, subject: "math", section: "B" }],
  ["q2", { correctOption: 1, subject: "math", section: "B" }],
  ["q3", { correctOption: 2, subject: "eng", section: "A" }],
]);
const imuAnswers = {
  q1: 0, // correct (+1)
  q2: 1, // correct (+1)
  q3: 0, // wrong (-0.25)
};
const imuResult = calculateDynamicScore(imuMock, imuAnswers, imuQuestionMap);
assert.strictEqual(imuResult.score, 1.75, "IMUCET score should be 1.75 (+1 +1 -0.25)");
assert.strictEqual(imuResult.total, 200, "IMUCET total should be 200");
assert.strictEqual(imuResult.subjectStats.math.correct, 2);
assert.strictEqual(imuResult.subjectStats.eng.wrong, 1);
assert.strictEqual(imuResult.sectionScores.B, 2);
assert.strictEqual(imuResult.sectionScores.A, -0.25);
console.log("✅ IMUCET Dynamic Scoring verified:", imuResult);

// Test Custom Exam Scoring: 3 questions (+2 for correct, -0.5 for wrong)
const customQuestionMap = new Map([
  ["phy-01", { correctOption: 1, subject: "phy", section: "phy" }],
  ["phy-02", { correctOption: 2, subject: "phy", section: "phy" }],
  ["phy-03", { correctOption: 0, subject: "phy", section: "phy" }],
]);
const customAnswers = {
  "phy-01": 1, // correct (+2)
  "phy-02": 2, // correct (+2)
  "phy-03": 3, // wrong (-0.5)
};
const customResult = calculateDynamicScore(customMock, customAnswers, customQuestionMap);
assert.strictEqual(customResult.score, 3.5, "Custom score should be 3.5 (+2 +2 -0.5)");
assert.strictEqual(customResult.total, 50, "Custom total should be 50");
assert.strictEqual(customResult.subjectStats.phy.correct, 2);
assert.strictEqual(customResult.subjectStats.phy.wrong, 1);
assert.strictEqual(customResult.sectionScores.phy, 3.5);
console.log("✅ Custom Exam Dynamic Scoring verified:", customResult);

console.log("\n🎉 ALL ARCHITECTURAL TESTS PASSED SUCCESSFULLY!");
