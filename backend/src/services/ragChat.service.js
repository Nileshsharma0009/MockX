import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import { examConfig } from "../config/examConfig.js";
import { runGemini } from "./gemini.service.js";
import { IMUCET_STATIC_CHUNKS } from "./imucetKnowledge.base.js";

const SUBJECT_LABELS = {
  eng: "English",
  gk: "General Knowledge",
  apt: "Aptitude",
  phy: "Physics",
  chem: "Chemistry",
  math: "Mathematics",
};

const SUBJECT_ALIASES = {
  english: "eng",
  eng: "eng",
  gk: "gk",
  "general knowledge": "gk",
  aptitude: "apt",
  apt: "apt",
  reasoning: "apt",
  physics: "phy",
  phy: "phy",
  chemistry: "chem",
  chem: "chem",
  maths: "math",
  math: "math",
  mathematics: "math",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "why",
  "with",
  "you",
  "your",
]);

const formatPercent = (value) => `${Math.round(Number(value) || 0)}%`;

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

const unique = (items) => [...new Set(items)];

const detectSubjectsInQuery = (question) => {
  const lowered = String(question || "").toLowerCase();
  return unique(
    Object.entries(SUBJECT_ALIASES)
      .filter(([alias]) => lowered.includes(alias))
      .map(([, subjectCode]) => subjectCode)
  );
};

const buildHistorySummary = (result) => {
  const parts = Object.entries(result.subjectStats || {}).map(([subject, stats]) => {
    const label = SUBJECT_LABELS[subject] || subject.toUpperCase();
    return `${label}: ${stats.correct || 0} correct, ${stats.wrong || 0} wrong, accuracy ${formatPercent(stats.accuracy)}`;
  });

  return [
    `Mock ${result.mockId}: score ${result.score}/${result.total}, created ${new Date(result.createdAt).toISOString()}.`,
    parts.join(" | "),
  ]
    .filter(Boolean)
    .join(" ");
};

const buildQuestionInsight = (questionDoc, selectedOption) => {
  const correctIndex = questionDoc.correctOption;
  const selectedIndex =
    selectedOption === undefined || selectedOption === null || selectedOption === ""
      ? null
      : Number(selectedOption);

  const selectedText =
    selectedIndex !== null && questionDoc.options[selectedIndex] !== undefined
      ? questionDoc.options[selectedIndex]
      : "Not answered";

  const correctText =
    correctIndex !== undefined && questionDoc.options[correctIndex] !== undefined
      ? questionDoc.options[correctIndex]
      : "Unavailable";

  const status =
    selectedIndex === null
      ? "unanswered"
      : selectedIndex === correctIndex
        ? "correct"
        : "wrong";

  return {
    status,
    text: [
      `Question ${questionDoc.questionCode} from ${questionDoc.mockId}.`,
      `Subject: ${SUBJECT_LABELS[questionDoc.subject] || questionDoc.subject}.`,
      `Question: ${questionDoc.question}`,
      questionDoc.paragraph ? `Passage: ${questionDoc.paragraph}` : null,
      `Student answer: ${selectedText}.`,
      `Correct answer: ${correctText}.`,
    ]
      .filter(Boolean)
      .join(" "),
  };
};

const buildChunks = async ({ currentResult, history, exam }) => {
  const chunks = [...IMUCET_STATIC_CHUNKS];

  chunks.push({
    id: `exam-${currentResult.mockId}`,
    label: "Exam overview",
    type: "exam",
    subject: null,
    text: `Exam ${currentResult.mockId} follows ${exam?.name || "the configured exam"} pattern. Configuration: ${JSON.stringify(
      exam || {}
    )}`,
  });

  chunks.push({
    id: `result-${currentResult._id}`,
    label: "Current mock overall result",
    type: "result",
    subject: null,
    text: `Current mock ${currentResult.mockId}. Score ${currentResult.score}/${currentResult.total}. Subject stats: ${JSON.stringify(
      currentResult.subjectStats || {}
    )}.`,
  });

  for (const [subject, stats] of Object.entries(currentResult.subjectStats || {})) {
    chunks.push({
      id: `subject-${subject}`,
      label: `${SUBJECT_LABELS[subject] || subject} performance`,
      type: "subject",
      subject,
      text: `${SUBJECT_LABELS[subject] || subject} in ${
        currentResult.mockId
      }: attempted ${stats.attempted || 0}, correct ${stats.correct || 0}, wrong ${
        stats.wrong || 0
      }, accuracy ${formatPercent(stats.accuracy)}.`,
    });
  }

  history.forEach((item) => {
    chunks.push({
      id: `history-${item._id}`,
      label: `History ${item.mockId}`,
      type: "history",
      subject: null,
      text: buildHistorySummary(item),
    });
  });

  const answerEntries = Object.entries(currentResult.answers || {});
  if (answerEntries.length) {
    const questionCodes = answerEntries.map(([questionCode]) => questionCode);
    const questionDocs = await Question.find({
      questionCode: { $in: questionCodes },
    }).select("+correctOption questionCode mockId subject question options paragraph");

    questionDocs.forEach((questionDoc) => {
      const selectedOption = currentResult.answers?.[questionDoc.questionCode];
      const insight = buildQuestionInsight(questionDoc, selectedOption);

      chunks.push({
        id: `question-${questionDoc.questionCode}`,
        label: `${SUBJECT_LABELS[questionDoc.subject] || questionDoc.subject} question ${questionDoc.questionCode}`,
        type: insight.status === "correct" ? "question-correct" : "question-review",
        subject: questionDoc.subject,
        text: insight.text,
      });
    });
  }

  return chunks;
};

// TODO: Plug PDF/Pinecone retrieval here later.
// Expected return format:
// [{ id, label, type: "knowledge", subject, text }]
const getExternalKnowledgeChunks = async ({ examCode, question }) => {
  void examCode;
  void question;
  return [];
};

const scoreChunk = (chunk, queryTokens, subjectMatches, loweredQuestion) => {
  const chunkTokens = tokenize(chunk.text);
  const overlap = queryTokens.reduce(
    (count, token) => count + (chunkTokens.includes(token) ? 1 : 0),
    0
  );

  let score = overlap * 3;

  if (subjectMatches.length && chunk.subject && subjectMatches.includes(chunk.subject)) {
    score += 8;
  }

  if (chunk.type === "question-review") {
    score += 2;
  }

  if (chunk.type === "subject" && loweredQuestion.includes("weak")) {
    score += 2;
  }

  if (chunk.type === "history" && (loweredQuestion.includes("trend") || loweredQuestion.includes("improv"))) {
    score += 3;
  }

  return score;
};

const retrieveRelevantChunks = (question, chunks) => {
  const loweredQuestion = String(question || "").toLowerCase();
  const queryTokens = tokenize(question);
  const subjectMatches = detectSubjectsInQuery(question);

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTokens, subjectMatches, loweredQuestion),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
};

const buildPrompt = ({ question, currentResult, retrievedChunks }) => `
You are MockX's RAG academic assistant for mock-test analysis.

Answer ONLY from the retrieved context below. If the context is not enough, say "Data insufficient in retrieved context" and avoid guessing.
Keep the answer focused, practical, and grounded in the student's actual performance.
Prefer short sections with plain text headings.
Mention exact numbers when available.
If relevant, end with a short "Next step" line.

Student question:
${question}

Current mock:
${currentResult.mockId}

Retrieved context:
${retrievedChunks
  .map((chunk, index) => `[${index + 1}] ${chunk.label}\n${chunk.text}`)
  .join("\n\n")}
`;

export const answerRagChat = async ({ userId, resultId, question }) => {
  const currentResult = await Result.findOne({ _id: resultId, userId });

  if (!currentResult) {
    const error = new Error("Result not found");
    error.statusCode = 404;
    throw error;
  }

  const examCode = currentResult.examCode || (currentResult.mockId?.startsWith("imu") ? "IMUCET" : null);
  const exam = examConfig[examCode]
    ? { name: examCode, ...examConfig[examCode] }
    : null;

  const history = await Result.find({
    userId,
    _id: { $ne: currentResult._id },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const chunks = await buildChunks({ currentResult, history, exam });
  const externalKnowledgeChunks = await getExternalKnowledgeChunks({
    examCode,
    question,
  });
  const combinedChunks = [...externalKnowledgeChunks, ...chunks];
  const retrievedChunks = retrieveRelevantChunks(question, combinedChunks);

  const fallbackChunks = retrievedChunks.length
    ? retrievedChunks
    : combinedChunks
        .filter((chunk) => ["result", "subject", "exam", "knowledge"].includes(chunk.type))
        .slice(0, 6);

  const prompt = buildPrompt({
    question,
    currentResult,
    retrievedChunks: fallbackChunks,
  });

  const answer = await runGemini(prompt);

  return {
    answer,
    citations: fallbackChunks.map((chunk) => chunk.label),
  };
};
