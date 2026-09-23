import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import http from "node:http";
import jwt from "jsonwebtoken";
import User from "../src/models/user.model.js";
import Result from "../src/models/result.model.js";
import resultRoutes from "../src/routes/result.routes.js";

process.env.JWT_SECRET = "result-authorization-test-secret";

const users = {
  "student-a": { _id: "student-a", role: "STUDENT", instituteId: "institute-a", status: "ACTIVE" },
  "student-a2": { _id: "student-a2", role: "STUDENT", instituteId: "institute-a", status: "ACTIVE" },
  "student-b": { _id: "student-b", role: "STUDENT", instituteId: "institute-b", status: "ACTIVE" },
  "admin-a": { _id: "admin-a", role: "INSTITUTE_ADMIN", instituteId: "institute-a", status: "ACTIVE" },
  "admin-b": { _id: "admin-b", role: "INSTITUTE_ADMIN", instituteId: "institute-b", status: "ACTIVE" },
  "platform-admin": { _id: "platform-admin", role: "SUPER_ADMIN", status: "ACTIVE" },
  "legacy-admin": { _id: "legacy-admin", role: "admin", email: "admin@mockx.com", status: "ACTIVE" },
};

const resultRecords = {
  "ordinary-own": { _id: "ordinary-own", userId: { _id: "student-a" }, instituteId: null, score: 87 },
  "ordinary-other": { _id: "ordinary-other", userId: { _id: "student-a2" }, instituteId: null, score: 72 },
  "institute-a": { _id: "institute-a", userId: { _id: "student-a", instituteId: "institute-a" }, instituteId: "institute-a", score: 91 },
  "institute-b": { _id: "institute-b", userId: { _id: "student-b", instituteId: "institute-b" }, instituteId: "institute-b", score: 68 },
};

const originalUserFindById = User.findById;
const originalResultFindById = Result.findById;
let server;
let baseUrl;

before(async () => {
  User.findById = (id) => ({ select: async () => users[String(id)] ?? null });
  Result.findById = (id) => ({ populate: async () => resultRecords[String(id)] ?? null });

  const app = express();
  app.use(express.json());
  app.use("/api/results", resultRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/results`;
});

after(async () => {
  User.findById = originalUserFindById;
  Result.findById = originalResultFindById;
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function getResult(resultId, userId, publicRoute = false) {
  const path = publicRoute ? `/public/${resultId}` : `/${resultId}`;
  const headers = {};
  if (userId) headers.Authorization = `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET)}`;
  return fetch(`${baseUrl}${path}`, { headers });
}

test("student can access their own result", async () => {
  const response = await getResult("ordinary-own", "student-a");
  assert.equal(response.status, 200);
});

test("student cannot access another student's ordinary result", async () => {
  const response = await getResult("ordinary-other", "student-a");
  assert.equal(response.status, 403);
});

test("student can access their own institute result", async () => {
  const response = await getResult("institute-a", "student-a");
  assert.equal(response.status, 200);
});

test("institute admin can access a result from their institute", async () => {
  const response = await getResult("institute-a", "admin-a");
  assert.equal(response.status, 200);
});

test("institute admin cannot access another institute's result", async () => {
  const response = await getResult("institute-b", "admin-a");
  assert.equal(response.status, 403);
});

test("student cannot access another student's result in the same institute", async () => {
  const response = await getResult("institute-a", "student-a2");
  assert.equal(response.status, 403);
});

test("platform SUPER_ADMIN can access results across institutes", async () => {
  const response = await getResult("institute-b", "platform-admin");
  assert.equal(response.status, 200);
});

test("legacy admin identity alone cannot access results across institutes", async () => {
  const response = await getResult("institute-b", "legacy-admin");
  assert.equal(response.status, 403);
});

test("unauthenticated users cannot access a private result, including through the public alias", async () => {
  const response = await getResult("ordinary-own", null, true);
  assert.equal(response.status, 401);
});
