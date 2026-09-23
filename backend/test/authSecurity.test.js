import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import http from "node:http";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "mockx-auth-security-test-secret";
process.env.NODE_ENV = "development";

const [{ default: User }, { default: authRoutes }, { default: protect }, { default: genToken }, { authorizeRoles }] = await Promise.all([
  import("../src/models/user.model.js"),
  import("../src/routes/auth.routes.js"),
  import("../src/middleware/auth.middleware.js"),
  import("../src/config/token.js"),
  import("../src/middleware/role.middleware.js"),
]);

const records = new Map();
const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalFindById = User.findById;
let server;
let baseUrl;

function asDocument(data, id) {
  return {
    _id: id,
    status: "ACTIVE",
    role: "user",
    isVerified: false,
    verificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpire: null,
    ...data,
    save: async function () { records.set(String(this._id), this); },
    toObject: function () {
      const { save, toObject, ...plain } = this;
      return plain;
    },
  };
}

before(async () => {
  User.findOne = async ({ email }) => [...records.values()].find((u) => u.email === email) ?? null;
  User.create = async (data) => {
    const user = asDocument(data, `user-${records.size + 1}`);
    records.set(String(user._id), user);
    return user;
  };
  User.findById = (id) => ({
    select: async () => records.get(String(id)) ?? null,
  });

  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);
  app.get("/private", protect, (req, res) => res.json({ userId: String(req.user._id) }));
  app.get("/superadmin", protect, authorizeRoles("SUPER_ADMIN"), (req, res) => res.json({ ok: true }));
  app.get("/legacy-admin", protect, authorizeRoles("admin"), (req, res) => res.json({ ok: true }));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
  User.findById = originalFindById;
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function post(path, body = {}, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("signup ignores caller-supplied role and instituteId", async () => {
  const response = await post("/auth/signup", {
    name: "Student", email: "student@example.com", password: "long-enough-test-password",
    role: "SUPER_ADMIN", instituteId: "507f1f77bcf86cd799439011",
  });
  assert.equal(response.status, 201);
  const { user } = await response.json();
  assert.equal(user.role, "user");
  assert.notEqual(user.instituteId, "507f1f77bcf86cd799439011");
});

test("reserved email signup remains an ordinary user and login does not promote it", async () => {
  const response = await post("/auth/signup", {
    name: "Claimant", email: "admin@mockx.com", password: "long-enough-test-password",
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.role, "user");
  const loginResponse = await post("/auth/login", { email: "admin@mockx.com", password: "long-enough-test-password" });
  assert.equal(loginResponse.status, 200);
  assert.equal((await loginResponse.json()).user.role, "user");
});

test("login rejects suspended and disabled accounts", async () => {
  const bcrypt = await import("bcryptjs");
  for (const status of ["SUSPENDED", "DISABLED"]) {
    const id = status.toLowerCase();
    records.set(id, asDocument({ name: status, email: id + "@example.com", password: await bcrypt.default.hash("correct-password", 10), status }, id));
    const response = await post("/auth/login", { email: id + "@example.com", password: "correct-password" });
    assert.equal(response.status, 403, status + " accounts must be rejected");
  }
});

test("unverified login remains allowed because no verification workflow exists", async () => {
  const bcrypt = await import("bcryptjs");
  records.set("unverified", asDocument({ name: "Unverified", email: "unverified@example.com", password: await bcrypt.default.hash("correct-password", 10), isVerified: false }, "unverified"));
  const response = await post("/auth/login", { email: "unverified@example.com", password: "correct-password" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.isVerified, undefined);
});

test("legacy register path does not claim verification when no verification workflow exists", async () => {
  const response = await post("/auth/register", { name: "Register route", email: "register@example.com", password: "long-enough-test-password" });
  assert.equal(response.status, 201);
  const created = [...records.values()].find((user) => user.email === "register@example.com");
  assert.equal(created.isVerified, false);
});

test("signup response does not expose password-reset, verification, or OTP fields", async () => {
  const response = await post("/auth/signup", {
    name: "Secret fields", email: "secrets@example.com", password: "long-enough-test-password",
  });
  const { user } = await response.json();
  for (const field of ["password", "verificationToken", "resetPasswordToken", "resetPasswordExpire", "otp", "otpExpires"]) {
    assert.equal(Object.hasOwn(user, field), false, `${field} must not be returned`);
  }
});

test("logout clears its cookie but does not revoke an already issued bearer token", async () => {
  records.set("logout-user", asDocument({ name: "Logout", email: "logout@example.com" }, "logout-user"));
  const token = await genToken("logout-user");
  const logoutResponse = await post("/auth/logout");
  assert.equal(logoutResponse.status, 200);
  const privateResponse = await fetch(`${baseUrl}/private`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(privateResponse.status, 200, "stateless JWT remains valid until expiry; revocation is out of scope");
});

test("expired JWT is rejected", async () => {
  records.set("expired-user", asDocument({ name: "Expired", email: "expired@example.com" }, "expired-user"));
  const token = jwt.sign({ id: "expired-user" }, process.env.JWT_SECRET, { expiresIn: -1 });
  const response = await fetch(`${baseUrl}/private`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
});

test("deleted user cannot use an otherwise valid token", async () => {
  const token = await genToken("deleted-user");
  const response = await fetch(`${baseUrl}/private`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
});





test("/auth/me does not expose verification, password-reset, or OTP fields", async () => {
  records.set("me-secrets", asDocument({
    name: "Private fields", email: "me-secrets@example.com", verificationToken: "verification-secret",
    resetPasswordToken: "reset-secret", resetPasswordExpire: new Date(), otp: "123456", otpExpires: new Date(),
  }, "me-secrets"));
  const token = await genToken("me-secrets");
  const response = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const { user } = await response.json();
  for (const field of ["verificationToken", "resetPasswordToken", "resetPasswordExpire", "otp", "otpExpires"]) {
    assert.equal(Object.hasOwn(user, field), false, `${field} must not be returned`);
  }
});

test("legacy admin role alone cannot access SUPER_ADMIN endpoints", async () => {
  records.set("legacy-admin", asDocument({ name: "Legacy Admin", email: "admin@mockx.com", role: "admin" }, "legacy-admin"));
  const token = await genToken("legacy-admin");
  const superResponse = await fetch(`${baseUrl}/superadmin`, { headers: { Authorization: `Bearer ${token}` } });
  const adminResponse = await fetch(`${baseUrl}/legacy-admin`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(superResponse.status, 403);
  assert.equal(adminResponse.status, 200);
  records.set("true-superadmin", asDocument({ name: "Platform Admin", email: "platform@example.com", role: "SUPER_ADMIN" }, "true-superadmin"));
  const superToken = await genToken("true-superadmin");
  const legitimateSuperResponse = await fetch(baseUrl + "/superadmin", { headers: { Authorization: "Bearer " + superToken } });
  assert.equal(legitimateSuperResponse.status, 200);
});

test("unauthenticated requests cannot access protected endpoints", async () => {
  const response = await fetch(`${baseUrl}/private`);
  assert.equal(response.status, 401);
});
