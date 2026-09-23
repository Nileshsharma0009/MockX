import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import Razorpay from "razorpay";
import User from "../src/models/user.model.js";
import Mock from "../src/models/mock.model.js";
import Question from "../src/models/question.model.js";
import Result from "../src/models/result.model.js";
import PaymentTransaction from "../src/models/paymentTransaction.model.js";
import Notification from "../src/models/notification.model.js";
import RecoveryAuditLog from "../src/models/recoveryAuditLog.model.js";
import { createOrder, verifyPayment, razorpayWebhook } from "../src/controllers/payment.controller.js";
import { getMockQuestions } from "../src/controllers/mock.controller.js";

const userAId = "64b000000000000000000001";
const userBId = "64b000000000000000000002";
const product = { id: "configured-product", name: "Configured Mock Bundle", price: 23.45, currency: "USD" };
const users = new Map([
  [userAId, { _id: userAId, purchasedExams: [], hasPaid: false }],
  [userBId, { _id: userBId, purchasedExams: [], hasPaid: false }],
]);
const transactions = new Map();
const providerPayments = new Map();
const savedNotifications = [];
const savedAuditLogs = [];
const envKeys = [
  "PAYMENTS_ENABLED", "PAYMENT_PRODUCT_ID", "PAYMENT_PRODUCT_NAME", "PAYMENT_PRODUCT_PRICE", "PAYMENT_CURRENCY",
  "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET",
];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const methods = [
  [User, "updateOne"], [Mock, "findById"], [Question, "find"], [Result, "findOne"],
  [PaymentTransaction, "findOne"], [PaymentTransaction, "findOneAndUpdate"], [PaymentTransaction, "updateMany"],
  [PaymentTransaction.prototype, "save"], [Notification, "findOne"], [Notification, "updateMany"],
  [Notification.prototype, "save"], [RecoveryAuditLog.prototype, "save"],
];
const descriptors = methods.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));
let originalAddResources;

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

function signature(orderId, paymentId) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest("hex");
}

function webhookSignature(rawBody) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
}

function makeTransaction({ orderId, userId = userAId, mockId = product.id, productName = product.name, amount = product.price, currency = product.currency, status = "PENDING" }) {
  const transaction = new PaymentTransaction({ orderId, userId, mockId, productName, amount, currency, status });
  transactions.set(orderId, transaction);
  return transaction;
}

function addCapturedPayment(orderId, paymentId) {
  providerPayments.set(paymentId, {
    id: paymentId, order_id: orderId, amount: Math.round(product.price * 100),
    currency: product.currency, status: "captured",
  });
}

before(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_stub";
  process.env.RAZORPAY_KEY_SECRET = "payment-security-test-secret";
  process.env.PAYMENT_PRODUCT_ID = product.id;
  process.env.PAYMENT_PRODUCT_NAME = product.name;
  process.env.PAYMENT_PRODUCT_PRICE = String(product.price);
  process.env.PAYMENT_CURRENCY = product.currency;

  User.updateOne = async ({ _id }, update) => {
    const user = users.get(String(_id));
    if (!user) return { matchedCount: 0 };
    for (const value of update.$addToSet?.purchasedExams ? [update.$addToSet.purchasedExams] : []) {
      if (!user.purchasedExams.includes(value)) user.purchasedExams.push(value);
    }
    Object.assign(user, update.$set || {});
    return { matchedCount: 1 };
  };
  PaymentTransaction.findOne = async ({ orderId }) => transactions.get(orderId) ?? null;
  PaymentTransaction.findOneAndUpdate = async (filter, update) => {
    const transaction = transactions.get(filter.orderId);
    const allowedStatuses = Array.isArray(filter.status?.$in) ? filter.status.$in : [filter.status];
    if (!transaction || !allowedStatuses.includes(transaction.status) || String(transaction.userId) !== String(filter.userId)) return null;
    if (transaction.mockId !== filter.mockId || transaction.amount !== filter.amount) return null;
    for (const [key, value] of Object.entries(update.$set || {})) {
      const parts = key.split(".");
      let target = transaction;
      while (parts.length > 1) target = target[parts.shift()];
      target[parts[0]] = value;
    }
    return transaction;
  };
  PaymentTransaction.updateMany = async () => ({ modifiedCount: 0 });
  PaymentTransaction.prototype.save = async function () { transactions.set(this.orderId, this); return this; };
  Notification.findOne = async () => null;
  Notification.updateMany = async () => ({ modifiedCount: 0 });
  Notification.prototype.save = async function () { savedNotifications.push(this); return this; };
  RecoveryAuditLog.prototype.save = async function () { savedAuditLogs.push(this); return this; };

  originalAddResources = Razorpay.prototype.addResources;
  Razorpay.prototype.addResources = function () {
    this.orders = { create: async (payload) => ({ id: `order_${transactions.size + 1}`, ...payload }) };
    this.payments = { fetch: async (paymentId) => providerPayments.get(paymentId) };
  };
});

beforeEach(() => {
  transactions.clear();
  providerPayments.clear();
  savedNotifications.length = 0;
  savedAuditLogs.length = 0;
  for (const user of users.values()) { user.purchasedExams = []; user.hasPaid = false; }
  process.env.PAYMENT_PRODUCT_ID = product.id;
  process.env.PAYMENT_PRODUCT_NAME = product.name;
  process.env.PAYMENT_PRODUCT_PRICE = String(product.price);
  process.env.PAYMENT_CURRENCY = product.currency;
  Result.findOne = async () => null;
  Mock.findById = async () => null;
  Question.find = () => ({ select: async () => [] });
});

after(() => {
  for (const [index, [target, key]] of methods.entries()) {
    if (descriptors[index]) Object.defineProperty(target, key, descriptors[index]);
    else delete target[key];
  }
  if (originalAddResources) Razorpay.prototype.addResources = originalAddResources;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("PAYMENTS_ENABLED=false rejects new server-side order creation", async () => {
  process.env.PAYMENTS_ENABLED = "false";
  const res = response();
  await createOrder({ user: { _id: userAId, purchasedExams: [] }, body: { examId: product.id } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(transactions.size, 0);
});

test("PAYMENTS_ENABLED=true creates an order from backend product configuration", async () => {
  process.env.PAYMENTS_ENABLED = "true";
  const res = response();
  await createOrder({ user: { _id: userAId, purchasedExams: [] }, body: { examId: product.id, amount: 1 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.amount, 2345);
  assert.equal(res.body.currency, product.currency);
  assert.equal(transactions.get(res.body.id)?.amount, product.price);
});

test("orders for unconfigured product IDs are rejected", async () => {
  process.env.PAYMENTS_ENABLED = "true";
  const res = response();
  await createOrder({ user: { _id: userAId, purchasedExams: [] }, body: { examId: "invented-product" } }, res);
  assert.equal(res.statusCode, 400);
});

test("invalid payment signature cannot grant access or mark the order failed", async () => {
  makeTransaction({ orderId: "order_bad_signature" });
  const res = response();
  await verifyPayment({
    user: { _id: userAId },
    body: { razorpay_order_id: "order_bad_signature", razorpay_payment_id: "pay_fake", razorpay_signature: "invalid" },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(transactions.get("order_bad_signature").status, "PENDING");
  assert.deepEqual(users.get(userAId).purchasedExams, []);
});

test("a different user cannot reuse another user's signed order", async () => {
  makeTransaction({ orderId: "order_user_a" });
  const paymentId = "pay_user_a";
  addCapturedPayment("order_user_a", paymentId);
  const res = response();
  await verifyPayment({
    user: { _id: userBId },
    body: { razorpay_order_id: "order_user_a", razorpay_payment_id: paymentId, razorpay_signature: signature("order_user_a", paymentId) },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(users.get(userBId).purchasedExams, []);
  assert.equal(transactions.get("order_user_a").status, "PENDING");
});

test("provider amount, currency, order association, and captured status must match", async () => {
  makeTransaction({ orderId: "order_provider_check" });
  providerPayments.set("pay_mismatch", {
    id: "pay_mismatch", order_id: "another_order", amount: 1, currency: "EUR", status: "authorized",
  });
  const res = response();
  await verifyPayment({
    user: { _id: userAId },
    body: { razorpay_order_id: "order_provider_check", razorpay_payment_id: "pay_mismatch", razorpay_signature: signature("order_provider_check", "pay_mismatch") },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(users.get(userAId).purchasedExams, []);
});

 test("a captured retry can complete an order previously marked failed", async () => {
  makeTransaction({ orderId: "order_failed_retry", status: "FAILED" });
  const paymentId = "pay_failed_retry";
  addCapturedPayment("order_failed_retry", paymentId);
  const res = response();
  await verifyPayment({
    user: { _id: userAId },
    body: { razorpay_order_id: "order_failed_retry", razorpay_payment_id: paymentId, razorpay_signature: signature("order_failed_retry", paymentId) },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(transactions.get("order_failed_retry").status, "SUCCESS");
  assert.deepEqual(users.get(userAId).purchasedExams, [product.id]);
});
test("a valid pending order remains verifiable after product configuration changes", async () => {
  makeTransaction({ orderId: "order_config_changed" });
  const paymentId = "pay_config_changed";
  addCapturedPayment("order_config_changed", paymentId);
  process.env.PAYMENT_PRODUCT_ID = "replacement-product";
  process.env.PAYMENT_PRODUCT_NAME = "Replacement Bundle";
  process.env.PAYMENT_PRODUCT_PRICE = "99";
  process.env.PAYMENT_CURRENCY = "EUR";
  const res = response();
  await verifyPayment({
    user: { _id: userAId },
    body: { razorpay_order_id: "order_config_changed", razorpay_payment_id: paymentId, razorpay_signature: signature("order_config_changed", paymentId) },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(users.get(userAId).purchasedExams, [product.id]);
});
test("valid captured payment grants one purchase and repeated verification is idempotent", async () => {
  makeTransaction({ orderId: "order_replay" });
  const paymentId = "pay_replay";
  addCapturedPayment("order_replay", paymentId);
  const req = {
    user: { _id: userAId },
    body: { razorpay_order_id: "order_replay", razorpay_payment_id: paymentId, razorpay_signature: signature("order_replay", paymentId) },
  };
  const first = response();
  const second = response();
  await verifyPayment(req, first);
  await verifyPayment(req, second);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.deepEqual(users.get(userAId).purchasedExams, [product.id]);
  assert.equal(transactions.size, 1);
});

test("concurrent verification uses one success transition and one entitlement", async () => {
  makeTransaction({ orderId: "order_concurrent" });
  const paymentId = "pay_concurrent";
  addCapturedPayment("order_concurrent", paymentId);
  const req = {
    user: { _id: userAId },
    body: { razorpay_order_id: "order_concurrent", razorpay_payment_id: paymentId, razorpay_signature: signature("order_concurrent", paymentId) },
  };
  const results = await Promise.all([verifyPayment(req, response()), verifyPayment(req, response())]);
  assert.ok(results.every((res) => res.statusCode === 200));
  assert.deepEqual(users.get(userAId).purchasedExams, [product.id]);
  assert.equal(transactions.size, 1);
});

test("payments disabled blocks unpurchased paid access but preserves existing entitlements", async () => {
  process.env.PAYMENTS_ENABLED = "false";
  const mock = { _id: "paid-mock", exam: product.id, isFree: false, instituteId: null, sections: [] };
  Mock.findById = async () => mock;
  Result.findOne = async () => null;
  Question.find = () => ({ select: async () => [] });

  const denied = response();
  await getMockQuestions({ params: { mockId: mock._id }, user: { _id: userAId, purchasedExams: [] } }, denied);
  assert.equal(denied.statusCode, 403);

  const paidUser = { _id: userAId, purchasedExams: [product.id] };
  const allowed = response();
  await getMockQuestions({ params: { mockId: mock._id }, user: paidUser }, allowed);
  assert.equal(allowed.statusCode, 200);
});

test("free mock access remains available when payments are disabled", async () => {
  process.env.PAYMENTS_ENABLED = "false";
  Mock.findById = async () => ({ _id: "free-mock", exam: product.id, isFree: true, instituteId: null, sections: [] });
  Result.findOne = async () => null;
  Question.find = () => ({ select: async () => [] });
  const res = response();
  await getMockQuestions({ params: { mockId: "free-mock" }, user: null }, res);
  assert.equal(res.statusCode, 200);
});

test("unsigned webhook cannot grant a purchase", async () => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = Buffer.from(JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: {
      id: "pay_forged", order_id: "order_forged", amount: 2345, currency: product.currency,
      notes: { productId: product.id, userId: userAId },
    } } },
  }));
  const res = response();
  await razorpayWebhook({ headers: {}, body: rawBody }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(users.get(userAId).purchasedExams, []);
});

test("signed webhook completes an existing order using its stored user and product", async () => {
  process.env.PAYMENTS_ENABLED = "false";
  process.env.RAZORPAY_WEBHOOK_SECRET = "payment-webhook-test-secret";
  makeTransaction({ orderId: "order_webhook" });
  const event = {
    event: "payment.captured",
    payload: { payment: { entity: {
      id: "pay_webhook", order_id: "order_webhook", amount: 2345, currency: product.currency,
      notes: { productId: product.id, userId: userAId, productName: product.name },
    } } },
  };
  const rawBody = Buffer.from(JSON.stringify(event));
  const res = response();
  await razorpayWebhook({ headers: { "x-razorpay-signature": webhookSignature(rawBody) }, body: rawBody }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(users.get(userAId).purchasedExams, [product.id]);
});

