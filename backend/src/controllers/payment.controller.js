import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Notification from "../models/notification.model.js";
import { runRecoveryAgentForTransaction } from "../ai/recoveryAgent.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";
import { emitToAll } from "../services/socketService.js";
import { getPaymentProductConfig } from "../config/paymentConfig.js";
import { isPaymentEnabled } from "../utils/paymentToggle.js";

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys missing");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const signatureMatches = (expected, supplied) => {
  if (typeof supplied !== "string" || !/^[a-f0-9]+$/i.test(supplied)) return false;
  const expectedBytes = Buffer.from(expected, "hex");
  const suppliedBytes = Buffer.from(supplied, "hex");
  return expectedBytes.length === suppliedBytes.length && crypto.timingSafeEqual(expectedBytes, suppliedBytes);
};

const formatAmount = (amount, currency) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return String(amount);
  }
};

const createPurchaseNotification = async (userId, productId, productName, amount, currency) => {
  const existing = await Notification.findOne({
    userId,
    type: "purchase",
    "metadata.mockId": productId,
  });
  if (existing) return;

  const notification = new Notification({
    userId,
    title: "Purchase successful",
    message: `Your purchase of ${productName} (${formatAmount(amount, currency)}) is complete.`,
    type: "purchase",
    metadata: { mockId: productId, productName, amount, currency },
  });
  await notification.save();
};

const grantPurchase = async (transaction, paymentId, currency, productName = transaction.mockId) => {
  const normalizedPaymentId = paymentId || null;
  const completed = await PaymentTransaction.findOneAndUpdate(
    {
      _id: transaction._id,
      orderId: transaction.orderId,
      userId: transaction.userId,
      mockId: transaction.mockId,
      amount: transaction.amount,
      status: { $in: ["PENDING", "FAILED"] },
    },
    {
      $set: {
        paymentId: normalizedPaymentId,
        status: "SUCCESS",
        "recovery.status": "RECOVERED",
        "recovery.lastAction": "RECOVERED",
        "recovery.lastActionAt": new Date(),
      },
    },
    { new: true }
  );

  if (!completed) {
    const latest = await PaymentTransaction.findOne({ orderId: transaction.orderId });
    if (latest?.status !== "SUCCESS" || latest.paymentId !== normalizedPaymentId) return { conflict: true };
    const replayAccess = await User.updateOne(
      { _id: latest.userId },
      { $addToSet: { purchasedExams: latest.mockId }, $set: { hasPaid: true } }
    );
    return replayAccess.matchedCount ? { replay: true } : { missingUser: true };
  }

  const accessUpdate = await User.updateOne(
    { _id: completed.userId },
    { $addToSet: { purchasedExams: completed.mockId }, $set: { hasPaid: true } }
  );
  if (!accessUpdate.matchedCount) return { missingUser: true };

  await PaymentTransaction.updateMany(
    {
      userId: completed.userId,
      mockId: completed.mockId,
      _id: { $ne: completed._id },
      "recovery.status": { $in: ["NOT_STARTED", "ANALYZING", "CONTACTED", "REMIND_LATER", "RETRY_REQUESTED"] },
    },
    { $set: { "recovery.status": "STOPPED", "recovery.lastAction": "STOPPED_PAID_SUCCESS", "recovery.lastActionAt": new Date() } }
  );

  const auditLog = new RecoveryAuditLog({
    transactionId: completed._id,
    userId: completed.userId,
    agentName: "RevenueRecoveryAgent",
    action: "PAYMENT_SUCCESS",
    details: { amount: completed.amount, currency, productId: completed.mockId },
  });
  await auditLog.save();

  await Notification.updateMany(
    { userId: completed.userId, type: "payment_failed", "metadata.mockId": completed.mockId, isRead: false },
    { $set: { isRead: true } }
  );
  await createPurchaseNotification(completed.userId, completed.mockId, productName, completed.amount, currency);
  emitToAll("db_changed", { type: "transactions" });
  emitToAll("db_changed", { type: "recovery" });
  emitToAll("db_changed", { type: "notifs" });
  return { completed: true };
};
/* ---------------- CREATE ORDER ---------------- */
export const createOrder = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isPaymentEnabled()) return res.status(403).json({ message: "New payments are currently disabled" });

    let product;
    try {
      product = getPaymentProductConfig();
    } catch {
      return res.status(503).json({ message: "Payment product is not configured" });
    }

    const { examId } = req.body || {};
    if (typeof examId !== "string" || examId !== product.id) {
      return res.status(400).json({ message: "This product is not available for purchase" });
    }
    if (Array.isArray(req.user.purchasedExams) && req.user.purchasedExams.includes(product.id)) {
      return res.status(409).json({ message: "Already purchased" });
    }

    const amount = Math.round(product.price * 100);
    const order = await getRazorpayInstance().orders.create({
      amount,
      currency: product.currency,
      receipt: `rcpt_${product.id}_${req.user._id}`,
      notes: { productId: product.id, productName: product.name, userId: String(req.user._id) },
    });

    await new PaymentTransaction({
      orderId: order.id,
      userId: req.user._id,
      mockId: product.id,
      productName: product.name,
      amount: product.price,
      currency: product.currency,
      status: "PENDING",
    }).save();

    return res.status(200).json(order);
  } catch (err) {
    console.error("Create order error:", err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

/* ---------------- VERIFY PAYMENT ---------------- */
export const verifyPayment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: suppliedSignature } = req.body || {};
    if (![orderId, paymentId, suppliedSignature].every((value) => typeof value === "string" && value.length > 0)) {
      return res.status(400).json({ message: "Missing verification parameters" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(503).json({ message: "Payment verification is unavailable" });

    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).json({ message: "Payment order was not found" });
    if (String(transaction.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Payment order does not belong to this user" });
    }

    const expectedSignature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    if (!signatureMatches(expectedSignature, suppliedSignature)) {
      return res.status(400).json({ message: "Payment verification failed: signature mismatch" });
    }

    if (transaction.status === "SUCCESS") {
      if (transaction.paymentId === paymentId) {
        if (transaction.mockId && transaction.mockId !== "unknown") {
          const accessUpdate = await User.updateOne(
            { _id: transaction.userId },
            { $addToSet: { purchasedExams: transaction.mockId }, $set: { hasPaid: true } }
          );
          if (!accessUpdate.matchedCount) return res.status(404).json({ message: "Purchasing user no longer exists" });
        }
        return res.status(200).json({ success: true, message: "Payment was already verified" });
      }
      return res.status(409).json({ message: "Payment order has already been completed" });
    }
    if (!["PENDING", "FAILED"].includes(transaction.status)) return res.status(409).json({ message: "Payment order is not pending" });
    if (!transaction.mockId || transaction.mockId === "unknown" || !Number.isFinite(transaction.amount)) {
      return res.status(400).json({ message: "Payment order is invalid" });
    }

    let currency = transaction.currency;
    if (!currency) {
      try { currency = getPaymentProductConfig().currency; }
      catch { return res.status(503).json({ message: "Payment product is not configured" }); }
    }
    const expectedAmount = Math.round(transaction.amount * 100);
    const providerPayment = await getRazorpayInstance().payments.fetch(paymentId);
    if (
      providerPayment.id !== paymentId ||
      providerPayment.order_id !== orderId ||
      providerPayment.status !== "captured" ||
      providerPayment.amount !== expectedAmount ||
      providerPayment.currency !== currency
    ) {
      return res.status(400).json({ message: "Razorpay payment details do not match the order" });
    }

    const grant = await grantPurchase(transaction, paymentId, currency, transaction.productName || transaction.mockId);
    if (grant.missingUser) return res.status(404).json({ message: "Purchasing user no longer exists" });
    if (grant.conflict) return res.status(409).json({ message: "Payment order was processed with different payment details" });
    return res.status(200).json({ success: true, message: grant.replay ? "Payment was already verified" : "Payment verified and access granted" });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

/* ---------------- REPORT PAYMENT FAILURE ---------------- */
export const reportPaymentFailure = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { orderId, paymentId, error } = req.body || {};
    if (typeof orderId !== "string" || !orderId) return res.status(400).json({ message: "Missing orderId" });

    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).json({ message: "Payment order was not found" });
    if (String(transaction.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Payment order does not belong to this user" });
    }
    if (transaction.status === "SUCCESS") return res.status(409).json({ message: "A successful payment cannot be marked failed" });
    if (!["PENDING", "FAILED"].includes(transaction.status)) return res.status(409).json({ message: "Payment order is not pending" });

    transaction.status = "FAILED";
    if (paymentId) transaction.paymentId = paymentId;
    if (error) {
      transaction.failureDetails = {
        code: error.code || null,
        description: error.description || null,
        source: error.source || null,
        step: error.step || null,
        reason: error.reason || null,
        metadata: error.metadata || null,
      };
    }
    await transaction.save();

    runRecoveryAgentForTransaction(transaction._id).catch((err) => {
      console.error(`[Recovery Agent] Failed to run for failed checkout: ${transaction._id}`, err);
    });

    await Notification.updateMany(
      { userId: req.user._id, type: "payment_failed", "metadata.mockId": transaction.mockId, isRead: false },
      { $set: { isRead: true } }
    );
    let currency = transaction.currency;
    if (!currency) {
      try { currency = getPaymentProductConfig().currency; } catch { currency = undefined; }
    }
    const amountText = currency ? formatAmount(transaction.amount, currency) : String(transaction.amount);
    const notification = new Notification({
      userId: req.user._id,
      title: "Checkout interrupted",
      message: `Your payment of ${amountText} for ${transaction.mockId} was not completed.`,
      type: "payment_failed",
      metadata: {
        mockId: transaction.mockId,
        amount: transaction.amount,
        currency: currency || null,
        orderId: transaction.orderId,
        transactionId: String(transaction._id),
      },
    });
    await notification.save();
    return res.status(200).json({ success: true, message: "Payment failure recorded" });
  } catch (err) {
    console.error("Report payment failure error:", err);
    return res.status(500).json({ message: "Failed to record payment failure" });
  }
};


/* ---------------- WEBHOOK ---------------- */
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    if (!secret) return res.status(503).send("Webhook signature verification is not configured");
    if (typeof signature !== "string") return res.status(400).send("Signature missing");

    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : typeof req.body === "string" ? Buffer.from(req.body) : null);
    if (!rawBody) return res.status(400).send("Raw webhook body is required");
    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!signatureMatches(expectedSignature, signature)) return res.status(400).send("Invalid signature");

    const event = JSON.parse(rawBody.toString("utf8"));
    if (!event || typeof event.event !== "string") return res.status(400).send("Invalid webhook payload structure");

    let orderId;
    let paymentId;
    let amountInMinorUnits;
    let currency;
    let notes = {};
    let payment;

    if (event.event === "payment.captured") {
      payment = event.payload?.payment?.entity;
      orderId = payment?.order_id;
      paymentId = payment?.id;
      amountInMinorUnits = payment?.amount;
      currency = payment?.currency;
      notes = payment?.notes || {};
    } else if (event.event === "order.paid") {
      const order = event.payload?.order?.entity;
      payment = event.payload?.payment?.entity;
      orderId = order?.id;
      paymentId = payment?.id;
      amountInMinorUnits = order?.amount_paid;
      currency = order?.currency;
      notes = order?.notes || {};
    } else if (event.event === "payment.failed") {
      payment = event.payload?.payment?.entity;
      orderId = payment?.order_id;
      paymentId = payment?.id;
      amountInMinorUnits = payment?.amount;
      currency = payment?.currency;
      notes = payment?.notes || {};
    } else {
      return res.json({ status: "ok", message: "Ignored unhandled event" });
    }

    if (typeof orderId !== "string" || !orderId) return res.status(400).send("Order ID missing in webhook payload");
    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).send("Payment order was not found");
    if (notes.userId && String(notes.userId) !== String(transaction.userId)) return res.status(400).send("Webhook user does not match the order");
    const noteProductId = notes.productId || notes.examId;
    if (noteProductId && noteProductId !== transaction.mockId) return res.status(400).send("Webhook product does not match the order");

    if (event.event === "payment.failed") {
      if (transaction.status === "SUCCESS") return res.json({ status: "ok", message: "Successful payment is unchanged" });
      if (transaction.status === "FAILED" && transaction.paymentId === paymentId) return res.json({ status: "ok", message: "Failure event already processed" });
      if (!["PENDING", "FAILED"].includes(transaction.status)) return res.status(409).send("Payment order is not pending");
      transaction.status = "FAILED";
      transaction.paymentId = paymentId || null;
      transaction.failureDetails = {
        code: payment?.error_code || null,
        description: payment?.error_description || null,
        source: payment?.error_source || null,
        step: payment?.error_step || null,
        reason: payment?.error_reason || null,
      };
      await transaction.save();
      runRecoveryAgentForTransaction(transaction._id).catch((err) => {
        console.error(`[Webhook] Error in recovery agent for transaction ${transaction._id}:`, err);
      });
      emitToAll("db_changed", { type: "transactions" });
      emitToAll("db_changed", { type: "recovery" });
      return res.json({ status: "ok", message: "Failure recorded" });
    }

    if (transaction.status === "SUCCESS") {
      if (!paymentId || transaction.paymentId === paymentId) return res.json({ status: "ok", message: "Transaction already processed" });
      return res.status(409).send("Payment order was completed with different payment details");
    }
    if (!["PENDING", "FAILED"].includes(transaction.status)) return res.status(409).send("Payment order is not pending");
    const expectedMinorUnits = Math.round(transaction.amount * 100);
    const expectedCurrency = transaction.currency || getPaymentProductConfig().currency;
    const normalizedPaymentId = paymentId || null;
    if ((event.event !== "order.paid" && !normalizedPaymentId) || !expectedCurrency || amountInMinorUnits !== expectedMinorUnits || currency !== expectedCurrency) {
      return res.status(400).send("Webhook amount or currency does not match the order");
    }

    const grant = await grantPurchase(transaction, paymentId || null, expectedCurrency, notes.productName || transaction.productName || transaction.mockId);
    if (grant.missingUser) return res.status(404).send("Purchasing user no longer exists");
    if (grant.conflict) return res.status(409).send("Payment order was processed with different payment details");
    return res.json({ status: "ok", message: "Success event processed" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send("Webhook processing failed");
  }
};

/* ---------------- GET DYNAMIC PRICES ---------------- */
export const getPrices = async (req, res) => {
  let product = null;
  try {
    product = getPaymentProductConfig();
  } catch {
    // Keep free mock discovery available while paid product configuration is absent.
  }
  return res.status(200).json({
    paymentsEnabled: Boolean(isPaymentEnabled() && product),
    product,
  });
};


/* ---------------- GET ALL TRANSACTIONS (ADMIN ONLY) ---------------- */
export const getAllTransactions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied. Super Admins only." });
    }

    const transactions = await PaymentTransaction.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json(transactions);
  } catch (err) {
    console.error("Get transactions error:", err);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

