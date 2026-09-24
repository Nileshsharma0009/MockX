import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import express from "express";
import http from "node:http";
import jwt from "jsonwebtoken";
import User from "../src/models/user.model.js";
import Mock from "../src/models/mock.model.js";
import Question from "../src/models/question.model.js";
import Result from "../src/models/result.model.js";
import TestAssignment from "../src/models/testAssignment.model.js";
import Institute from "../src/models/institute.model.js";
import testRoutes from "../src/routes/test.routes.js";

process.env.JWT_SECRET = "submission-integrity-test-secret";

const users = {
  "student-a": { _id: "student-a", role: "STUDENT", instituteId: "institute-a", batch: "batch-a", purchasedExams: [], status: "ACTIVE" },
  "student-b": { _id: "student-b", role: "STUDENT", instituteId: "institute-b", batch: "batch-b", purchasedExams: [], status: "ACTIVE" },
};

const mocks = {
  "mock-a": { _id: "mock-a", totalMarks: 100, totalQuestions: 20, marking: { correct: 2, incorrect: 1 }, isFree: true, isActive: true, exam: "sample", instituteId: null },
  "paid-mock": { _id: "paid-mock", totalMarks: 100, totalQuestions: 20, marking: { correct: 2, incorrect: 1 }, isFree: false, isActive: true, exam: "imucet", instituteId: null },
  "institute-mock-a": { _id: "institute-mock-a", totalMarks: 40, totalQuestions: 10, marking: { correct: 2, incorrect: 0.5 }, isFree: true, isActive: true, exam: "institute-custom", instituteId: "institute-a" },
  "institute-mock-b": { _id: "institute-mock-b", totalMarks: 40, totalQuestions: 10, marking: { correct: 2, incorrect: 0.5 }, isFree: true, isActive: true, exam: "institute-custom", instituteId: "institute-b" },
  "custom-mock": { _id: "custom-mock", totalMarks: 14, totalQuestions: 2, marking: { correct: 3, incorrect: 0.5 }, isFree: true, isActive: true, exam: "institute-custom", instituteId: "institute-a" },
};

const questions = [
  { questionCode: "q-a", mockId: "mock-a", correctOption: 1, options: ["A", "B", "C", "D"], marks: 4, negativeMarks: 2, subject: "math", section: "A", isActive: true },
  { questionCode: "q-paid", mockId: "paid-mock", correctOption: 1, options: ["A", "B", "C", "D"], marks: 4, negativeMarks: 2, subject: "math", section: "A", isActive: true },
  { questionCode: "q-institute-a", mockId: "institute-mock-a", correctOption: 1, options: ["A", "B", "C", "D"], marks: 2, negativeMarks: 0.5, subject: "math", section: "A", isActive: true },
  { questionCode: "q-institute-b", mockId: "institute-mock-b", correctOption: 2, options: ["A", "B", "C", "D"], marks: 2, negativeMarks: 0.5, subject: "math", section: "A", isActive: true },
  { questionCode: "q-custom-correct", mockId: "custom-mock", correctOption: 1, options: ["A", "B", "C", "D"], marks: 7, negativeMarks: 4, subject: "math", section: "A", isActive: true },
  { questionCode: "q-custom-wrong", mockId: "custom-mock", correctOption: 1, options: ["A", "B", "C", "D"], marks: 7, negativeMarks: 4, subject: "math", section: "A", isActive: true },
];

const institutes = {
  "institute-a": { _id: "institute-a", status: "ACTIVE" },
  "institute-b": { _id: "institute-b", status: "ACTIVE" },
};

const originals = {
  userFindById: User.findById,
  mockFindById: Mock.findById,
  questionFind: Question.find,
  resultFindOne: Result.findOne,
  resultCreate: Result.create,
  resultFindOneAndUpdate: Result.findOneAndUpdate,
  resultDeleteOne: Result.deleteOne,
  assignmentFindOne: TestAssignment.findOne,
  instituteFindById: Institute.findById,
};

let server;
let baseUrl;
let storedResults;
let assignmentRecords;
let concurrentFindBarrier;
let concurrentFindArrivals;
let releaseConcurrentFinds;
let draftWriteGate;
const originalPaymentsEnabled = process.env.PAYMENTS_ENABLED;

function findStoredResult(query) {
  return storedResults.find(
    (result) => {
      if (String(result.userId) !== String(query.userId) || String(result.mockId) !== String(query.mockId)) return false;
      if (query._id && String(result._id) !== String(query._id)) return false;
      if (query.isSubmitted === true && result.isSubmitted !== true) return false;
      if (query.isSubmitted === false && result.isSubmitted !== false) return false;
      if (query.isSubmitted?.$ne !== undefined && result.isSubmitted === query.isSubmitted.$ne) return false;
      return true;
    }
  ) ?? null;
}

function matchesAssignmentTarget(assignment, query) {
  if (!query.$or) return true;
  return query.$or.some((target) => {
    if (target.assignToType === "ALL") return assignment.assignToType === "ALL";
    if (target.assignToType === "BATCH") return assignment.assignToType === "BATCH" && assignment.batch === target.batch;
    if (target.assignToType === "STUDENTS") return assignment.assignToType === "STUDENTS" && assignment.studentIds?.map(String).includes(String(target.studentIds));
    return false;
  });
}

before(async () => {
  User.findById = (id) => ({ select: async () => users[String(id)] ?? null });
  Mock.findById = async (id) => mocks[String(id)] ?? null;
  Question.find = (query) => ({
    select: async () => {
      const codes = query.questionCode?.$in ?? [];
      let found = questions.filter((question) => codes.includes(question.questionCode));
      if (query.mockId) found = found.filter((question) => question.mockId === query.mockId);
      if (query.isActive !== undefined) found = found.filter((question) => question.isActive === query.isActive);
      if (query.instituteId) found = found.filter((question) => question.instituteId === query.instituteId);
      return found;
    },
  });
  Result.findOne = (query) => {
    if (!concurrentFindBarrier) return Promise.resolve(findStoredResult(query));
    concurrentFindArrivals += 1;
    if (concurrentFindArrivals === 2) releaseConcurrentFinds();
    return concurrentFindBarrier.then(() => findStoredResult(query));
  };
  Result.create = async (data) => {
    const result = { ...data, _id: `result-${storedResults.length + 1}` };
    storedResults.push(result);
    return result;
  };
  Result.findOneAndUpdate = async (filter, update, options = {}) => {
    if (filter.isSubmitted?.$ne === true && draftWriteGate) {
      const gate = draftWriteGate;
      draftWriteGate = null;
      gate.entered();
      await gate.wait;
    }
    const excludesSubmitted = filter.isSubmitted?.$ne === true;
    const existingForAttempt = storedResults.find((result) =>
      String(result.userId) === String(filter.userId) && String(result.mockId) === String(filter.mockId)
    );
    if (update.$set?.isSubmitted === true && existingForAttempt?.isSubmitted === true) {
      const duplicate = new Error("duplicate key");
      duplicate.code = 11000;
      throw duplicate;
    }
    const existing = findStoredResult(filter);
    if (existing) {
      Object.assign(existing, update.$set ?? {});
      return existing;
    }
    if (!options.upsert) return null;
    const result = {
      ...(update.$setOnInsert ?? {}),
      ...(update.$set ?? {}),
      _id: `result-${storedResults.length + 1}`,
    };
    storedResults.push(result);
    return result;
  };
  Result.deleteOne = async (query) => {
    const index = storedResults.findIndex((result) =>
      String(result._id) === String(query._id) &&
      String(result.userId) === String(query.userId) &&
      String(result.mockId) === String(query.mockId) &&
      result.isSubmitted === query.isSubmitted
    );
    if (index >= 0) storedResults.splice(index, 1);
    return { deletedCount: index >= 0 ? 1 : 0 };
  };
  TestAssignment.findOne = async (query) => assignmentRecords.find((assignment) =>
    assignment.mockId === query.mockId &&
    assignment.instituteId === query.instituteId &&
    assignment.status === query.status &&
    matchesAssignmentTarget(assignment, query)
  ) ?? null;
  Institute.findById = async (id) => institutes[String(id)] ?? null;

  const app = express();
  app.use(express.json());
  app.use("/api/tests", testRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/tests`;
});

beforeEach(() => {
  storedResults = [];
  assignmentRecords = [];
  concurrentFindBarrier = null;
  concurrentFindArrivals = 0;
  releaseConcurrentFinds = null;
  draftWriteGate = null;
  process.env.PAYMENTS_ENABLED = "false";
});

afterEach(() => {
  if (originalPaymentsEnabled === undefined) delete process.env.PAYMENTS_ENABLED;
  else process.env.PAYMENTS_ENABLED = originalPaymentsEnabled;
});

after(async () => {
  User.findById = originals.userFindById;
  Mock.findById = originals.mockFindById;
  Question.find = originals.questionFind;
  Result.findOne = originals.resultFindOne;
  Result.create = originals.resultCreate;
  Result.findOneAndUpdate = originals.resultFindOneAndUpdate;
  Result.deleteOne = originals.resultDeleteOne;
  TestAssignment.findOne = originals.assignmentFindOne;
  Institute.findById = originals.instituteFindById;
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

function authHeader(userId) {
  return `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET)}`;
}

async function submit(userId, payload) {
  return fetch(`${baseUrl}/submit`, {
    method: "POST",
    headers: { Authorization: authHeader(userId), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function save(userId, payload) {
  return fetch(`${baseUrl}/save`, {
    method: "POST",
    headers: { Authorization: authHeader(userId), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function makeAssignment({ mockId = "institute-mock-a", instituteId = "institute-a", assignToType = "STUDENTS", studentIds = ["student-a"], batch = null, availableFrom = null, availableUntil = null } = {}) {
  return { mockId, instituteId, status: "ACTIVE", assignToType, studentIds, batch, availableFrom, availableUntil };
}

test("rejects a student who has no active assignment for an institute mock", async () => {
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 403);
});

test("rejects an institute assignment targeted to a different student", async () => {
  assignmentRecords = [makeAssignment({ studentIds: ["student-b"] })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 403);
});

test("accepts an active assignment targeted to the authenticated student", async () => {
  assignmentRecords = [makeAssignment()];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 201);
});
test("accepts an active assignment targeted to the authenticated student's batch", async () => {
  assignmentRecords = [makeAssignment({ assignToType: "BATCH", studentIds: [], batch: "batch-a" })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 201);
});

test("rejects an assignment targeted to a different batch", async () => {
  assignmentRecords = [makeAssignment({ assignToType: "BATCH", studentIds: [], batch: "batch-b" })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 403);
});

test("accepts an active assignment for all institute students", async () => {
  assignmentRecords = [makeAssignment({ assignToType: "ALL", studentIds: [], batch: null })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 201);
});

test("rejects submission after the assignment availability window expires", async () => {
  assignmentRecords = [makeAssignment({ availableUntil: new Date(Date.now() - 60_000) })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 403);
});

test("rejects a submission before the assignment availability window opens", async () => {
  assignmentRecords = [makeAssignment({ availableFrom: new Date(Date.now() + 60_000) })];
  const response = await submit("student-a", { mockId: "institute-mock-a", answers: { "q-institute-a": 1 } });
  assert.equal(response.status, 403);
});

test("rejects a mock ID that does not exist in the database", async () => {
  const response = await submit("student-a", { mockId: "missing-mock", answers: { "q-a": 1 } });
  assert.equal(response.status, 404);
});

test("rejects a paid mock when the student has not purchased its exam", async () => {
  process.env.PAYMENTS_ENABLED = "true";
  const response = await submit("student-a", { mockId: "paid-mock", answers: { "q-paid": 1 } });
  assert.equal(response.status, 403);
});

test("allows a paid mock when its exam is present in the student's purchases", async () => {
  process.env.PAYMENTS_ENABLED = "true";
  users["student-a"].purchasedExams = ["imucet"];
  try {
    const response = await submit("student-a", { mockId: "paid-mock", answers: { "q-paid": 1 } });
    assert.equal(response.status, 201);
  } finally {
    users["student-a"].purchasedExams = [];
  }
});

test("rejects a student submitting an institute mock owned by another institute", async () => {
  const response = await submit("student-a", { mockId: "institute-mock-b", answers: { "q-institute-b": 2 } });
  assert.equal(response.status, 403);
});

test("rejects answers containing unknown question IDs", async () => {
  const response = await submit("student-a", { mockId: "mock-a", answers: { "not-a-question": 1 } });
  assert.ok([400, 422].includes(response.status));
});

test("rejects question IDs that belong to a different mock", async () => {
  const response = await submit("student-a", { mockId: "mock-a", answers: { "q-institute-b": 2 } });
  assert.ok([400, 422].includes(response.status));
});

test("rejects a duplicate submission when a submitted result already exists", async () => {
  storedResults.push({ _id: "existing", userId: "student-a", mockId: "mock-a", isSubmitted: true, answers: { "q-a": 1 } });
  const response = await submit("student-a", { mockId: "mock-a", answers: { "q-a": 1 } });
  assert.equal(response.status, 409);
  assert.equal(storedResults.length, 1);
});

test("allows at most one result when two submissions arrive concurrently", async () => {
  concurrentFindBarrier = new Promise((resolve) => { releaseConcurrentFinds = resolve; });
  const payload = { mockId: "mock-a", answers: { "q-a": 1 } };
  const responses = await Promise.all([submit("student-a", payload), submit("student-a", payload)]);
  assert.equal(responses.filter((response) => response.status === 201).length, 1);
  assert.equal(responses.filter((response) => response.status === 409).length, 1);
  assert.equal(storedResults.length, 1);
});

test("keeps custom mock scoring on the existing mock-level marking rules", async () => {
  assignmentRecords = [makeAssignment({ mockId: "custom-mock" })];
  const response = await submit("student-a", {
    mockId: "custom-mock",
    answers: { "q-custom-correct": 1, "q-custom-wrong": 0 },
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.score, 2.5);
  assert.equal(body.total, 14);
});

test("ignores client-supplied score and marks and calculates the score on the server", async () => {
  const response = await submit("student-a", {
    mockId: "mock-a",
    answers: { "q-a": 1 },
    score: 999999,
    total: 999999,
    correctMarks: 999999,
    negativeMarks: 0,
    questionMarks: { "q-a": 999999 },
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.score, 2);
  assert.equal(body.total, 100);
});

test("rejects a replayed submission request without creating another result", async () => {
  const payload = { mockId: "mock-a", answers: { "q-a": 1 } };
  const firstResponse = await submit("student-a", payload);
  const replayResponse = await submit("student-a", payload);
  assert.equal(firstResponse.status, 201);
  assert.equal(replayResponse.status, 409);
  assert.equal(storedResults.length, 1);
});

test("a 30-second safety checkpoint racing final submission cannot overwrite the final result", async () => {
  let enteredDraftWrite;
  let releaseDraftWrite;
  const entered = new Promise((resolve) => { enteredDraftWrite = resolve; });
  const wait = new Promise((resolve) => { releaseDraftWrite = resolve; });
  draftWriteGate = { entered: enteredDraftWrite, wait };

  const checkpointPromise = save("student-a", {
    mockId: "mock-a",
    answers: { "q-a": 0 },
  });
  await entered;

  const finalResponse = await submit("student-a", {
    mockId: "mock-a",
    answers: { "q-a": 1 },
  });
  assert.equal(finalResponse.status, 201);

  releaseDraftWrite();
  const checkpointResponse = await checkpointPromise;
  assert.equal(checkpointResponse.status, 409);

  const submitted = storedResults.filter((result) => result.isSubmitted === true);
  assert.equal(submitted.length, 1);
  assert.deepEqual(submitted[0].answers, { "q-a": 1 });
  assert.equal(storedResults.length, 1);
});

test("Result schema has database uniqueness for one final result per student and mock", () => {
  const compoundIndex = Result.schema.indexes().find(([keys, options]) =>
    keys.userId === 1 && keys.mockId === 1 && options.unique === true
  );
  assert.ok(compoundIndex);
  assert.deepEqual(compoundIndex[1].partialFilterExpression, { isSubmitted: true });
});
