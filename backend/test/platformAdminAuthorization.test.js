import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import User from "../src/models/user.model.js";
import PaymentTransaction from "../src/models/paymentTransaction.model.js";
import Notification from "../src/models/notification.model.js";
import RecoveryAuditLog from "../src/models/recoveryAuditLog.model.js";
import { getAllUsers } from "../src/controllers/auth.controller.js";
import { getAllTransactions } from "../src/controllers/payment.controller.js";
import { getAllNotifications, sendAdminNotification } from "../src/controllers/notification.controller.js";
import { fetchRecoveryAuditLogs, fetchRecoveryMetrics, runCopilotChat } from "../src/controllers/paymentRecovery.controller.js";

const handlers = [
  ["users", getAllUsers],
  ["transactions", getAllTransactions],
  ["notifications", getAllNotifications],
  ["send notification", sendAdminNotification],
  ["recovery metrics", fetchRecoveryMetrics],
  ["recovery audit logs", fetchRecoveryAuditLogs],
  ["recovery copilot", runCopilotChat],
];
const originals = [];

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function queryResult(value = []) {
  return {
    populate() { return this; },
    sort() { return this; },
    limit() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

function replace(target, key, value) {
  originals.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
  target[key] = value;
}

before(() => {
  replace(User, "find", () => queryResult([]));
  replace(User, "findById", async () => ({ _id: "target-user" }));
  replace(PaymentTransaction, "find", () => queryResult([]));
  replace(Notification, "find", () => queryResult([]));
  replace(Notification, "countDocuments", async () => 0);
  replace(Notification.prototype, "save", async function save() { return this; });
  replace(RecoveryAuditLog, "find", () => queryResult([]));
});

after(() => {
  for (const [target, key, descriptor] of originals.reverse()) {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else delete target[key];
  }
});

test("only SUPER_ADMIN passes the platform administration controller guards", async () => {
  for (const role of ["admin", "INSTITUTE_ADMIN", "STUDENT"]) {
    for (const [name, handler] of handlers) {
      const res = response();
      await handler({ user: { _id: "user-1", role }, body: {} }, res);
      assert.equal(res.statusCode, 403, `${role} must be denied by ${name}`);
    }
  }
});

test("SUPER_ADMIN can use the platform administration handlers", async () => {
  for (const [name, handler] of handlers) {
    const body = name === "send notification"
      ? { targetUserId: "target-user", title: "Notice", message: "Test message" }
      : {};
    const res = response();
    await handler({ user: { _id: "platform-user", role: "SUPER_ADMIN" }, body }, res);
    if (name === "recovery copilot") {
      assert.equal(res.statusCode, 400, "missing copilot query confirms authorization passed before validation");
      assert.match(res.body.message, /query/i);
    } else {
      assert.ok(res.statusCode >= 200 && res.statusCode < 300, `${name} should accept SUPER_ADMIN, got ${res.statusCode}`);
    }
  }
});


