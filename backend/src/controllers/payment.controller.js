import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Notification from "../models/notification.model.js";
import { runRecoveryAgentForTransaction } from "../ai/recoveryAgent.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";
import { emitToAll } from "../services/socketService.js";

/* ---------------- DYNAMIC MOCK PRICING ---------------- */
const getMockPrice = (examId) => {
  const envKey = `PRICE_${examId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const envPrice = process.env[envKey];

  if (envPrice) {
    const parsed = parseFloat(envPrice);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Fallback to static pricing mapping
  const PRICE_MAP = {
    imucet: 499,
    "mht-cet": 299,
    "mht-cet-MBA": 499,
  };

  return PRICE_MAP[examId] || 499; // Default price if not found
};

/* ---------------- RAZORPAY INSTANCE ---------------- */
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys missing");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/* ---------------- CREATE ORDER ---------------- */
export const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { examId } = req.body;
    const user = req.user;

    if (!examId || typeof examId !== "string") {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    if (user.purchasedExams.includes(examId)) {
      return res.status(400).json({ message: "Already purchased" });
    }

    const price = getMockPrice(examId);
    const razorpay = getRazorpayInstance();
    const amount = Math.round(price * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${examId}_${user._id}`,
      notes: {
        examId,
        userId: user._id.toString(),
      },
    });

    // Track the transaction initialization in the DB
    const transaction = new PaymentTransaction({
      orderId: order.id,
      userId: user._id,
      mockId: examId,
      amount: price,
      status: "PENDING",
    });
    await transaction.save();

    return res.status(200).json(order);
  } catch (err) {
    console.error("Create order error:", err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

/* ---------------- VERIFY PAYMENT ---------------- */
export const verifyPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing verification parameters" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Razorpay keys missing on server" });
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Find transaction if it exists and mark as FAILED
      const txn = await PaymentTransaction.findOne({ orderId: razorpay_order_id });
      if (txn) {
        txn.status = "FAILED";
        txn.paymentId = razorpay_payment_id;
        txn.failureDetails = {
          code: "BAD_SIGNATURE",
          description: "Cryptographic signature verification failed.",
        };
        await txn.save();
      }
      return res.status(400).json({ message: "Payment verification failed: signature mismatch" });
    }

    // Find and update the transaction
    let transaction = await PaymentTransaction.findOne({ orderId: razorpay_order_id });
    if (!transaction) {
      // Fallback in case the initial creation log is missing
      transaction = new PaymentTransaction({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        userId: req.user._id,
        mockId: "unknown",
        amount: 0,
        status: "SUCCESS",
      });
    } else {
      transaction.paymentId = razorpay_payment_id;
      transaction.status = "SUCCESS";
    }

    // AI recovery status update
    if (transaction.recovery.status !== "RECOVERED") {
      transaction.recovery.status = "RECOVERED";
      transaction.recovery.lastAction = "RECOVERED";
      transaction.recovery.lastActionAt = new Date();
      
      const auditLog = new RecoveryAuditLog({
        transactionId: transaction._id,
        userId: transaction.userId || req.user._id,
        agentName: "RevenueRecoveryAgent",
        action: "PAYMENT_SUCCESS",
        details: {
          amount: transaction.amount,
          message: `Customer completed payment. Recovered revenue: ₹${transaction.amount}.`
        }
      });
      await auditLog.save();
    }

    // Stop recovery on other failed checkouts for the same mock by this user
    await PaymentTransaction.updateMany(
      {
        userId: transaction.userId || req.user._id,
        mockId: transaction.mockId,
        _id: { $ne: transaction._id },
        "recovery.status": { $in: ["NOT_STARTED", "ANALYZING", "CONTACTED", "REMIND_LATER", "RETRY_REQUESTED"] }
      },
      {
        $set: {
          "recovery.status": "STOPPED",
          "recovery.lastAction": "STOPPED_PAID_SUCCESS",
          "recovery.lastActionAt": new Date()
        }
      }
    );

    // Update user mock access
    const user = await User.findById(transaction.userId || req.user._id);
    if (user) {
      const mockId = transaction.mockId;
      if (mockId && mockId !== "unknown" && !user.purchasedExams.includes(mockId)) {
        user.purchasedExams.push(mockId);
      }
      user.hasPaid = true;
      await user.save();

      // Mark all previous payment failure notifications for this user/mock as read
      await Notification.updateMany(
        { userId: user._id, type: "payment_failed", "metadata.mockId": mockId, isRead: false },
        { $set: { isRead: true } }
      );

      // Create success notification if it doesn't already exist to prevent duplicate popups
      const existingNotif = await Notification.findOne({
        userId: user._id,
        type: "purchase",
        "metadata.mockId": mockId
      });
      if (!existingNotif) {
        const notif = new Notification({
          userId: user._id,
          title: "Purchase Successful 🎉",
          message: `Thank you for your purchase! You have successfully unlocked the ${(mockId || "unknown").toUpperCase()} mock test series.`,
          type: "purchase",
          metadata: {
            mockId
          }
        });
        await notif.save();
      }
    }

    await transaction.save();

    return res.status(200).json({ success: true, message: "Payment verified and mock access granted" });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

/* ---------------- REPORT PAYMENT FAILURE ---------------- */
export const reportPaymentFailure = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId, paymentId, mockId, amount, error } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId" });
    }

    let transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) {
      // Dynamic logging if PENDING state was never registered
      transaction = new PaymentTransaction({
        orderId,
        paymentId: paymentId || null,
        userId: req.user._id,
        mockId: mockId || "unknown",
        amount: amount || 0,
        status: "FAILED",
        failureDetails: error || {},
      });
    } else {
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
    }

    await transaction.save();

    // Trigger Recovery Agent in background
    runRecoveryAgentForTransaction(transaction._id).catch(err => {
      console.error(`[Recovery Agent] Failed to run for failed checkout: ${transaction._id}`, err);
    });

    // Mark previous unread payment failure notifications for this mock as read
    const finalMockId = mockId || transaction.mockId || "unknown";
    const finalAmount = amount || transaction.amount || 0;

    await Notification.updateMany(
      { userId: req.user._id, type: "payment_failed", "metadata.mockId": finalMockId, isRead: false },
      { isRead: true }
    );

    // Create payment failure notification
    const notif = new Notification({
      userId: req.user._id,
      title: "Checkout Interrupted ❌",
      message: `Your payment of ₹${finalAmount} for the ${finalMockId.toUpperCase()} test bundle was not completed.`,
      type: "payment_failed",
      metadata: {
        mockId: finalMockId,
        amount: finalAmount,
        orderId: transaction.orderId,
        transactionId: transaction._id.toString(),
      }
    });
    await notif.save();

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

    if (secret) {
      if (!signature) {
        return res.status(400).send("Signature missing");
      }

      // Compute signature using raw body representation.
      // Handles both req.rawBody (Buffer from express.json verify) and req.body (Buffer from express.raw).
      let verificationBody;
      if (req.rawBody) {
        verificationBody = req.rawBody;
      } else if (Buffer.isBuffer(req.body)) {
        verificationBody = req.body;
      } else if (typeof req.body === "string") {
        verificationBody = req.body;
      } else {
        // Fallback, but might fail due to key ordering
        verificationBody = JSON.stringify(req.body);
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(verificationBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Webhook signature mismatch");
        return res.status(400).send("Invalid signature");
      }
    }

    // Safely parse the event body
    let event;
    if (Buffer.isBuffer(req.body)) {
      event = JSON.parse(req.body.toString("utf8"));
    } else if (typeof req.body === "string") {
      event = JSON.parse(req.body);
    } else {
      event = req.body;
    }

    if (!event || !event.event) {
      return res.status(400).send("Invalid webhook payload structure");
    }

    let orderId = null;
    let paymentId = null;
    let amount = 0;
    let notes = {};
    let isSuccessEvent = false;
    let isFailureEvent = false;

    if (event.event === "payment.captured") {
      isSuccessEvent = true;
      const payment = event.payload.payment.entity;
      orderId = payment.order_id;
      paymentId = payment.id;
      amount = payment.amount ? payment.amount / 100 : 0;
      notes = payment.notes || {};
    } else if (event.event === "order.paid") {
      isSuccessEvent = true;
      const order = event.payload.order.entity;
      orderId = order.id;
      amount = order.amount ? order.amount / 100 : 0;
      notes = order.notes || {};
      if (event.payload.payment && event.payload.payment.entity) {
        paymentId = event.payload.payment.entity.id;
      }
    } else if (event.event === "payment.failed") {
      isFailureEvent = true;
      const payment = event.payload.payment.entity;
      orderId = payment.order_id;
      paymentId = payment.id;
      amount = payment.amount ? payment.amount / 100 : 0;
      notes = payment.notes || {};
    }

    if (isSuccessEvent) {
      if (!orderId) {
        return res.status(400).send("Order ID missing in success payload");
      }

      // Update or create transaction record
      let transaction = await PaymentTransaction.findOne({ orderId });

      // Handles duplicate events safely: if already SUCCESS, return early
      if (transaction && transaction.status === "SUCCESS") {
        console.log(`[Webhook] Duplicate success event for Order ID: ${orderId}, already SUCCESS.`);
        return res.json({ status: "ok", message: "Transaction already processed as SUCCESS" });
      }

      const { examId, userId } = notes;

      if (!transaction) {
        transaction = new PaymentTransaction({
          orderId,
          paymentId: paymentId || null,
          userId: userId || null,
          mockId: examId || "unknown",
          amount,
          status: "SUCCESS",
        });
      } else {
        transaction.status = "SUCCESS";
        if (paymentId) {
          transaction.paymentId = paymentId;
        }
      }

      // AI recovery status update
      if (transaction.recovery.status !== "RECOVERED") {
        transaction.recovery.status = "RECOVERED";
        transaction.recovery.lastAction = "RECOVERED";
        transaction.recovery.lastActionAt = new Date();
      }
      await transaction.save();

      const webhookUserId = userId || transaction.userId;
      if (webhookUserId) {
        const auditLog = new RecoveryAuditLog({
          transactionId: transaction._id,
          userId: webhookUserId,
          agentName: "RevenueRecoveryAgent",
          action: "PAYMENT_SUCCESS",
          details: {
            amount: transaction.amount,
            message: `Customer completed payment (Webhook: ${event.event}). Recovered revenue: ₹${transaction.amount}.`
          }
        });
        await auditLog.save();

        // Stop recovery on other failed checkouts for the same mock by this user
        await PaymentTransaction.updateMany(
          {
            userId: webhookUserId,
            mockId: transaction.mockId,
            _id: { $ne: transaction._id },
            "recovery.status": { $in: ["NOT_STARTED", "ANALYZING", "CONTACTED", "REMIND_LATER", "RETRY_REQUESTED"] }
          },
          {
            $set: {
              "recovery.status": "STOPPED",
              "recovery.lastAction": "STOPPED_PAID_SUCCESS",
              "recovery.lastActionAt": new Date()
            }
          }
        );
      }

      // Grant access to user
      const targetUserId = userId || transaction.userId;
      const targetMockId = examId || transaction.mockId;
      if (targetUserId && targetMockId) {
        const user = await User.findById(targetUserId);
        if (user) {
          if (!user.purchasedExams.includes(targetMockId)) {
            user.purchasedExams.push(targetMockId);
          }
          user.hasPaid = true;
          await user.save();

          // Mark all previous payment failure notifications for this user/mock as read
          await Notification.updateMany(
            { userId: user._id, type: "payment_failed", "metadata.mockId": targetMockId, isRead: false },
            { $set: { isRead: true } }
          );

          // Create success notification if it doesn't already exist to prevent duplicate popups
          const existingNotif = await Notification.findOne({
            userId: user._id,
            type: "purchase",
            "metadata.mockId": targetMockId
          });
          if (!existingNotif) {
            const notif = new Notification({
              userId: user._id,
              title: "Purchase Successful 🎉",
              message: `Thank you for your purchase! You have successfully unlocked the ${(targetMockId || "unknown").toUpperCase()} mock test series.`,
              type: "purchase",
              metadata: {
                mockId: targetMockId
              }
            });
            await notif.save();
          }
        }
      }

      emitToAll("db_changed", { type: "transactions" });
      emitToAll("db_changed", { type: "recovery" });
      emitToAll("db_changed", { type: "notifs" });

      return res.json({ status: "ok", message: "Success event processed successfully" });

    } else if (isFailureEvent) {
      if (!orderId) {
        return res.status(400).send("Order ID missing in failure payload");
      }

      let transaction = await PaymentTransaction.findOne({ orderId });

      // Out-of-order execution / duplicate safety:
      // If transaction is already SUCCESS, we do NOT change it to FAILED
      if (transaction && transaction.status === "SUCCESS") {
        console.log(`[Webhook] Redundant failed event for Order ID: ${orderId} ignored because status is already SUCCESS`);
        return res.json({ status: "ok", message: "Transaction already processed as SUCCESS, failure ignored" });
      }

      // If transaction is already FAILED and we already recorded this specific payment ID, skip to prevent duplicate AI triggers
      if (transaction && transaction.status === "FAILED" && transaction.paymentId === paymentId) {
        console.log(`[Webhook] Duplicate failed event for Payment ID: ${paymentId} already processed as FAILED`);
        return res.json({ status: "ok", message: "Transaction already processed as FAILED" });
      }

      const { examId, userId } = notes;
      const payment = event.payload.payment.entity;

      if (!transaction) {
        transaction = new PaymentTransaction({
          orderId,
          paymentId: paymentId || null,
          userId: userId || null,
          mockId: examId || "unknown",
          amount,
          status: "FAILED",
        });
      } else {
        transaction.status = "FAILED";
        transaction.paymentId = paymentId;
      }

      transaction.failureDetails = {
        code: payment.error_code || null,
        description: payment.error_description || null,
        source: payment.error_source || null,
        step: payment.error_step || null,
        reason: payment.error_reason || null,
      };

      await transaction.save();

      // Trigger the LangGraph AI Revenue Recovery Agent in the background
      console.log(`[Webhook] Triggering AI Recovery Agent in background for Txn: ${transaction._id}`);
      runRecoveryAgentForTransaction(transaction._id).catch((err) => {
        console.error(`[Webhook] Error in background AI Recovery Agent for Txn ${transaction._id}:`, err);
      });

      emitToAll("db_changed", { type: "transactions" });
      emitToAll("db_changed", { type: "recovery" });

      return res.json({ status: "ok", message: "Failure recorded and AI recovery agent triggered" });
    }

    return res.json({ status: "ok", message: "Ignored unhandled event: " + event.event });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).send("Webhook processing failed: " + err.message);
  }
};

/* ---------------- GET DYNAMIC PRICES ---------------- */
export const getPrices = async (req, res) => {
  try {
    const examIds = ["imucet", "mht-cet", "mht-cet-MBA"];
    const prices = {};
    for (const id of examIds) {
      prices[id] = getMockPrice(id);
    }
    return res.status(200).json(prices);
  } catch (err) {
    console.error("Get prices error:", err);
    return res.status(500).json({ message: "Failed to fetch prices" });
  }
};

/* ---------------- GET ALL TRANSACTIONS (ADMIN ONLY) ---------------- */
export const getAllTransactions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
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


