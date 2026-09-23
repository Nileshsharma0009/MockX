import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { createCsrfProtection } from "../src/middleware/csrf.middleware.js";
import { AUTH_TOKEN_MAX_AGE_MS, getAuthCookieOptions, getClearAuthCookieOptions } from "../src/config/authCookie.js";
import { createRateLimiter, loginRateLimit, signupRateLimit } from "../src/middleware/authRateLimit.middleware.js";
import http from "node:http";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "mockx-auth-security-test-secret-2026";
process.env.NODE_ENV = "development";
process.env.APP_ENV = "development";

const [{ default: User }, { default: authRoutes }, { default: protect }, { default: genToken, getValidatedJwtSecret, JWT_ALGORITHM }, { authorizeRoles }] = await Promise.all([
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
  app.use(cookieParser());
  app.use(createCsrfProtection({ APP_ENV: "development", ALLOWED_ORIGINS: "" }));
  app.use("/auth", authRoutes);
  app.get("/private", protect, (req, res) => res.json({ userId: String(req.user._id) }));
  app.post("/private-write", (req, res) => res.json({ ok: true }));
  app.post("/external-webhook", (req, res) => res.json({ ok: true }));
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
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173", ...headers },
    body: JSON.stringify(body),
  });
}

test("cookie configuration is consistent across production and staging", () => {
  for (const APP_ENV of ["staging", "production"]) {
    const options = getAuthCookieOptions({ APP_ENV });
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "none");
    assert.equal(options.maxAge, AUTH_TOKEN_MAX_AGE_MS);
    const clearOptions = getClearAuthCookieOptions({ APP_ENV });
    assert.equal(clearOptions.httpOnly, options.httpOnly);
    assert.equal(clearOptions.secure, options.secure);
    assert.equal(clearOptions.sameSite, options.sameSite);
    assert.equal(clearOptions.path, options.path);
    assert.equal(Object.hasOwn(clearOptions, "maxAge"), false);
  }
  assert.equal(getAuthCookieOptions({ APP_ENV: "development" }).sameSite, "lax");
});

test("cookie set and clear responses use matching attributes", async () => {
  const signupResponse = await post("/auth/signup", { name: "Cookie Test", email: "cookie@example.com", password: "long-enough-test-password" });
  const signupCookie = signupResponse.headers.get("set-cookie");
  assert.match(signupCookie, /HttpOnly/i);
  assert.match(signupCookie, /SameSite=Lax/i);
  assert.match(signupCookie, /Path=\//i);
  assert.match(signupCookie, /Max-Age=604800/i);
  assert.doesNotMatch(signupCookie, /; Secure/i);

  const loginResponse = await post("/auth/login", { email: "cookie@example.com", password: "long-enough-test-password" });
  const loginCookie = loginResponse.headers.get("set-cookie");
  assert.match(loginCookie, /HttpOnly/i);
  assert.match(loginCookie, /SameSite=Lax/i);
  assert.match(loginCookie, /Path=\//i);
  assert.match(loginCookie, /Max-Age=604800/i);
  assert.doesNotMatch(loginCookie, /; Secure/i);

  const logoutResponse = await post("/auth/logout");
  const clearCookie = logoutResponse.headers.get("set-cookie");
  for (const attribute of ["HttpOnly", "SameSite=Lax", "Path=/"]) assert.ok(clearCookie.includes(attribute));
  assert.doesNotMatch(clearCookie, /; Secure/i);
});

test("JWT secret requires 32 bytes and tokens explicitly use HS256", async () => {
  assert.throws(() => getValidatedJwtSecret("short-secret"), /at least 32 bytes/);
  assert.equal(getValidatedJwtSecret("x".repeat(32)), "x".repeat(32));
  const token = await genToken("jwt-algorithm-user");
  assert.equal(jwt.decode(token, { complete: true }).header.alg, JWT_ALGORITHM);
});

test("CSRF protection requires an allowed Origin for auth mutations and cookie-authenticated writes", async () => {
  const noOriginAuth = await fetch(baseUrl + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "x@example.com", password: "x" }) });
  assert.equal(noOriginAuth.status, 403);

  const noOriginCookieWrite = await fetch(baseUrl + "/private-write", { method: "POST", headers: { Cookie: "token=present" } });
  assert.equal(noOriginCookieWrite.status, 403);

  const allowedOriginWrite = await fetch(baseUrl + "/private-write", { method: "POST", headers: { Cookie: "token=present", Origin: "http://localhost:5173" } });
  assert.equal(allowedOriginWrite.status, 200);

  const deniedOriginWrite = await fetch(baseUrl + "/private-write", { method: "POST", headers: { Cookie: "token=present", Origin: "https://attacker.example" } });
  assert.equal(deniedOriginWrite.status, 403);

  const originlessExternalWebhook = await fetch(baseUrl + "/external-webhook", { method: "POST" });
  assert.equal(originlessExternalWebhook.status, 200);
});

test("rate limiter enforces a rolling fixed window and reports retry timing", () => {
  let now = 1000;
  const limiter = createRateLimiter({ windowMs: 1000, limit: 2, clock: () => now, keyGenerator: (req) => req.ip });
  const attempt = () => {
    const headers = {};
    let statusCode;
    let body;
    let continued = false;
    const req = { ip: "client-a" };
    const res = {
      set: (key, value) => { headers[key] = value; return res; },
      status: (status) => { statusCode = status; return res; },
      json: (value) => { body = value; return res; },
    };
    limiter(req, res, () => { continued = true; });
    return { headers, statusCode, body, continued };
  };
  assert.equal(attempt().continued, true);
  assert.equal(attempt().continued, true);
  const limited = attempt();
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers["Retry-After"], "1");
  now += 1001;
  assert.equal(attempt().continued, true);
});

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

test("JWT signed with an unapproved algorithm is rejected", async () => {
  records.set("wrong-alg-user", asDocument({ name: "Wrong algorithm", email: "wrong-alg@example.com" }, "wrong-alg-user"));
  const token = jwt.sign({ id: "wrong-alg-user" }, process.env.JWT_SECRET, { algorithm: "HS512", expiresIn: "1h" });
  const response = await fetch(`${baseUrl}/private`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
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

test("login attempts are rate limited", async () => {
  loginRateLimit.reset();
  for (let attempt = 1; attempt <= 11; attempt += 1) {
    const response = await post("/auth/login", { email: "missing-" + attempt + "@example.com", password: "wrong-password" });
    assert.equal(response.status, attempt <= 10 ? 401 : 429);
    if (attempt === 11) assert.ok(response.headers.get("retry-after"));
  }
});

test("signup and register attempts share a rate limit", async () => {
  signupRateLimit.reset();
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await post("/auth/signup", {});
    assert.equal(response.status, 400);
  }
  const registerResponse = await post("/auth/register", {});
  assert.equal(registerResponse.status, 429);
});

test("unauthenticated requests cannot access protected endpoints", async () => {
  const response = await fetch(`${baseUrl}/private`);
  assert.equal(response.status, 401);
});
