import { StateGraph, END, Annotation } from "@langchain/langgraph";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Notification from "../models/notification.model.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";
import { emitToAll } from "../services/socketService.js";
import { SmartLLMProvider } from "./llmProvider.js";
import { recoveryLogger } from "../utils/logger.js";
import {
  getCustomerDetails,
  getTransactionDetails,
  getPreviousFailedAttempts,
  getRecoveryHistory
} from "./dbTools.js";

// 1. Define State Graph Channels using Annotation.Root
const RecoveryState = Annotation.Root({
  transactionId: Annotation(),
  userId: Annotation(),
  mockId: Annotation(),
  amount: Annotation(),
  customerDetails: Annotation(),
  previousAttempts: Annotation(),
  previousNotifications: Annotation(),
  recoveryHistory: Annotation(),
  decisionReasoning: Annotation(),
  actionToTake: Annotation(), // "SEND_NOW" | "WAIT_LATER" | "STOP" | "ESCALATE"
  personalizedMessage: Annotation(),
  attemptsCount: Annotation(),
  isResolved: Annotation(),
  failureDetails: Annotation()
});

// 2. Nodes Implementation

// ANALYZE NODE: Fetches all contextual data from MongoDB through tools
const analyzeNode = async (state) => {
  recoveryLogger.info(`[Recovery Agent] Node: Analyze - Loading details for Txn ID: ${state.transactionId}`);
  
  const txn = await getTransactionDetails(state.transactionId);
  if (!txn) {
    throw new Error(`Transaction ${state.transactionId} not found`);
  }

  const userId = txn.userId?._id || txn.userId;
  const customer = await getCustomerDetails(userId);
  const failedAttempts = await getPreviousFailedAttempts(userId, txn.mockId);
  const history = await getRecoveryHistory(state.transactionId);

  // Fetch notifications previously sent
  const prevNotifs = await Notification.find({
    userId,
    type: "payment_failed",
    "metadata.mockId": txn.mockId
  }).sort({ createdAt: -1 });

  return {
    userId,
    mockId: txn.mockId,
    amount: txn.amount,
    customerDetails: customer || {},
    previousAttempts: failedAttempts || [],
    previousNotifications: prevNotifs.map(n => n.toObject()) || [],
    recoveryHistory: history || [],
    attemptsCount: txn.recovery?.attempts || 0,
    isResolved: txn.status === "SUCCESS" || txn.recovery?.status === "RECOVERED",
    failureDetails: txn.failureDetails || null
  };
};

// DECIDE NODE: Evaluates context and policies to choose intervention
const decideNode = async (state) => {
  recoveryLogger.info(`[Recovery Agent] Node: Decide - Formulating action strategy...`);

  // --- STRICT SAFETY POLICIES & BOUNDED ACTIONS ---
  
  // Rule 1: Stop if payment is already recovered or successful
  if (state.isResolved) {
    return {
      actionToTake: "STOP",
      decisionReasoning: "Payment already successfully completed or marked as recovered."
    };
  }

  // Rule 2: Respect Customer Opt-Out / Opt-out limits
  const currentTxn = await PaymentTransaction.findById(state.transactionId);
  if (currentTxn?.recovery?.status === "NOT_INTERESTED" || currentTxn?.recovery?.status === "STOPPED") {
    return {
      actionToTake: "STOP",
      decisionReasoning: "Customer explicitly indicated they are NOT_INTERESTED or recovery process was manually stopped."
    };
  }

  const lastNotif = state.previousNotifications[0];
  let newFailureSinceLastNotif = false;
  if (lastNotif && currentTxn) {
    // If transaction's updatedAt is newer than lastNotif.createdAt, it means a new retry failure occurred after the last recovery contact
    newFailureSinceLastNotif = new Date(currentTxn.updatedAt).getTime() > new Date(lastNotif.createdAt).getTime() + 1000;
  }

  // Rule 3: Escalate if attempts count reached threshold (unless it's a new failure attempt)
  if (state.attemptsCount >= 5 && !newFailureSinceLastNotif) {
    return {
      actionToTake: "ESCALATE",
      decisionReasoning: `Recovery process reached threshold (${state.attemptsCount} attempts). Escalled to Support Admin.`
    };
  }

  // Rule 4: Prevent spam / rate limits (e.g. wait if we sent recovery notification in last 15 minutes, unless it's a new failure attempt)
  if (lastNotif && !newFailureSinceLastNotif) {
    const minutesSinceLast = (Date.now() - new Date(lastNotif.createdAt).getTime()) / (1000 * 60);
    if (minutesSinceLast < 15) {
      return {
        actionToTake: "WAIT_LATER",
        decisionReasoning: `Rate limit check: sent recovery notification only ${Math.round(minutesSinceLast)} minutes ago (limit 15m). Awaiting response.`
      };
    }
  }

  // AI Cognitive Decision making via SmartLLMProvider (Groq Qwen primary / Gemini fallback)
  const systemPrompt = `You are the AI Revenue Recovery Agent for MockX.
Analyze this user's payment failure context and decide on the best bounded action.

Context:
- Customer Name: ${state.customerDetails?.name || "Customer"}
- Purchase Attempt: Exam Bundle "${state.mockId.toUpperCase()}"
- Amount: ₹${state.amount}
- Failure Reason: ${state.failureDetails?.description || state.failureDetails?.reason || "Payment window closed or bank declined"}
- Failure Code: ${state.failureDetails?.code || "N/A"}
- Previous Failed Checkouts (This Exam): ${state.previousAttempts.length}
- AI Recovery Attempts Made So Far: ${state.attemptsCount}
- Recovery status: ${currentTxn?.recovery?.status || "NOT_STARTED"}

Bounded Actions Options:
- "SEND_NOW": The customer should be sent a highly personalized recovery notification immediately. Do this if this is the first attempt, or if it is a fresh checkout failure.
- "WAIT_LATER": Wait and do not message yet. Do this if we have contacted them recently, or if we want to wait for 15-30 minutes.
- "STOP": Stop recovery efforts. Choose this if they had too many failures, or status is NOT_INTERESTED.
- "ESCALATE": Escalate to Admin. Choose this if the customer is repeatedly failing despite multiple recovery notices, or if there is a gateway auth error.

You MUST respond ONLY with a JSON object in this format:
{
  "action": "SEND_NOW" | "WAIT_LATER" | "STOP" | "ESCALATE",
  "reason": "Explain step-by-step why this action was decided, citing customer details and history."
}`;

  try {
    const llmResponse = await SmartLLMProvider.call([
      { role: "user", content: "Provide your decision in JSON format." }
    ], {
      jsonMode: true,
      systemInstruction: systemPrompt
    });

    const decision = JSON.parse(llmResponse);
    console.log(`[Recovery Agent] LLM Decision: ${decision.action}. Reason: ${decision.reason}`);
    
    return {
      actionToTake: decision.action || "WAIT_LATER",
      decisionReasoning: decision.reason || "Default wait action on parse error."
    };
  } catch (err) {
    console.error("[Recovery Agent] LLM decision failed, falling back to safe WAIT_LATER.", err);
    return {
      actionToTake: "WAIT_LATER",
      decisionReasoning: "Fallback triggered due to LLM reasoning error: " + err.message
    };
  }
};

const cleanLlmResponse = (text) => {
  if (!text) return "";
  
  // 1. Remove <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<\/?think>/gi, "");

  // 1.5. Remove any leading thinking process, analysis, or deconstruction headers
  const lower = cleaned.toLowerCase();
  if (lower.includes("thinking process") || lower.includes("analyze user input") || lower.includes("customer name:") || lower.includes("deconstruct requirements")) {
    const greetingMatch = cleaned.match(/(?:hi|hello|dear|hey)\s+[a-z0-9]/i);
    if (greetingMatch) {
      cleaned = cleaned.substring(greetingMatch.index);
    } else {
      const headerMatch = cleaned.match(/(?:message|draft|response|email|inbox|copy):\s*/i);
      if (headerMatch) {
        cleaned = cleaned.substring(headerMatch.index + headerMatch[0].length);
      }
    }
  }

  // 2. Scan for appended evaluation metadata and discard
  const markers = [
    "word count",
    "wordcheck",
    "self-correction",
    "verification during",
    "output matches",
    "constraints met",
    "✅",
    "proceed. output"
  ];

  let lowestIndex = cleaned.length;
  const lowerCleaned = cleaned.toLowerCase();

  for (const marker of markers) {
    const idx = lowerCleaned.indexOf(marker);
    if (idx !== -1 && idx < lowestIndex) {
      lowestIndex = idx;
    }
  }

  cleaned = cleaned.slice(0, lowestIndex).trim();

  // 3. Remove leading/trailing quote wrapping
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned.trim();
};

// EXECUTE NODE: Performs database state updates, logs audits, and triggers notifications
const executeNode = async (state) => {
  const action = state.actionToTake;
  const reason = state.decisionReasoning;
  recoveryLogger.info(`[Recovery Agent] Node: Execute - Running action: ${action}`);

  const txn = await PaymentTransaction.findById(state.transactionId);
  if (!txn) return {};

  let messageSent = "";

  if (action === "SEND_NOW") {
    // Generate unique, personalized message context
    const messagePrompt = `You are a helpful customer success assistant for MockX.
A customer started buying the "${state.mockId.toUpperCase()}" test series but the payment failed.

IMPORTANT: The payment failed due to this reason: "${state.failureDetails?.description || state.failureDetails?.reason || "payment window closed or bank declined"}"
Write a friendly, personalized recovery message. DO NOT use generic template placeholders like "[Name]". Write the final copy directly.

CRITICAL FORMATTING RULES:
1. You MUST highlight the customer's name, product name, and price in **bold** using double asterisks (e.g. **${state.customerDetails?.name || "student"}**, **${state.mockId.toUpperCase()} Mock Test Series**, and **₹${state.amount}**).
2. Respond in JSON format with a single key "message". 
3. Make the message extremely clean, professional, concise, and under 50 words so it is easy to read. 
4. Do NOT include any introductory reasoning, deconstruction, explanation, or markdown headers.

Tone & Strategy:
- If this is the customer's FIRST failure (Attempt count: 1), write an encouraging reminder to click "Continue Payment".
- If this is a REPEATED failure (Attempt count > 1), start with an apology for the repeated interruption (e.g. "We're so sorry about the repeated payment issues!"), and convince them to complete the payment by trying an alternative payment method (like UPI, Netbanking, or another card). Reassure them that we've kept their mocks safe.

Context:
- Customer Name: ${state.customerDetails?.name || "student"}
- Exam Bundle: ${state.mockId.toUpperCase()} Mock Test Series
- Price: ₹${state.amount}
- Attempt count: Failed ${state.previousAttempts.length} times.

Example output:
{
  "message": "Hi **Chetan**, we are so sorry your checkout for the **IMUCET Mock Test Series** (for **₹499**) failed again. Please try using UPI, Netbanking, or a different card. Click \\"Continue Payment\\" to retry. We have saved your test progress!"
}`;

    try {
      const personalMessage = await SmartLLMProvider.call([
        { role: "user", content: "Generate the recovery message JSON." }
      ], {
        jsonMode: true,
        systemInstruction: messagePrompt
      });

      let parsedMessage = personalMessage;
      try {
        const parsed = JSON.parse(personalMessage);
        parsedMessage = parsed.message || parsed.response || personalMessage;
      } catch (e) {
        parsedMessage = cleanLlmResponse(personalMessage);
      }
      messageSent = cleanLlmResponse(parsedMessage);
      
      // Update transaction status
      txn.recovery.status = "CONTACTED";
      txn.recovery.attempts += 1;
      txn.recovery.lastAction = "SEND_NOTIFICATION";
      txn.recovery.lastActionAt = new Date();
      await txn.save();

      // Create Notification
      const notif = new Notification({
        userId: state.userId,
        title: "Complete Your Checkout ⚡",
        message: messageSent,
        type: "payment_failed",
        metadata: {
          mockId: state.mockId,
          amount: state.amount,
          orderId: txn.orderId,
          transactionId: txn._id.toString()
        }
      });
      await notif.save();

      // Audit Log
      await new RecoveryAuditLog({
        transactionId: state.transactionId,
        userId: state.userId,
        agentName: "RevenueRecoveryAgent",
        action: "NOTIFICATION_SENT",
        details: {
          reason,
          message: messageSent,
          attempts: txn.recovery.attempts
        }
      }).save();

    } catch (err) {
      recoveryLogger.error(`[Recovery Agent] Failed to generate/send recovery notification: ${err.message || err}`);
    }
  } else if (action === "WAIT_LATER") {
    txn.recovery.status = "REMIND_LATER";
    txn.recovery.lastAction = "WAIT_LATER";
    txn.recovery.lastActionAt = new Date();
    await txn.save();

    await new RecoveryAuditLog({
      transactionId: state.transactionId,
      userId: state.userId,
      agentName: "RevenueRecoveryAgent",
      action: "DECISION",
      details: {
        reason,
        action: "WAIT_LATER"
      }
    }).save();
  } else if (action === "STOP") {
    txn.recovery.status = "STOPPED";
    txn.recovery.lastAction = "STOPPED";
    txn.recovery.lastActionAt = new Date();
    await txn.save();

    await new RecoveryAuditLog({
      transactionId: state.transactionId,
      userId: state.userId,
      agentName: "RevenueRecoveryAgent",
      action: "STOPPED",
      details: {
        reason,
        action: "STOP"
      }
    }).save();
  } else if (action === "ESCALATE") {
    txn.recovery.status = "STOPPED";
    txn.recovery.lastAction = "ESCALATED";
    txn.recovery.lastActionAt = new Date();
    await txn.save();

    // Create alert notification to admin/support
    await new Notification({
      userId: state.userId, // Alert linked to customer
      title: "Support Escalate: Payment Failed Repeatedly ⚠️",
      message: `User ${state.customerDetails?.name || "Customer"} (${state.customerDetails?.email}) has failed checkouts for ${state.mockId.toUpperCase()} bundle. Recovery attempts reached maximum limit.`,
      type: "support",
      metadata: {
        mockId: state.mockId,
        transactionId: state.transactionId,
        amount: state.amount
      }
    }).save();

    await new RecoveryAuditLog({
      transactionId: state.transactionId,
      userId: state.userId,
      agentName: "RevenueRecoveryAgent",
      action: "ESCALATED",
      details: {
        reason,
        action: "ESCALATE_TO_ADMIN"
      }
    }).save();
  }

  // Emit socket event to notify frontend of updates
  emitToAll("db_changed", { type: "recovery" });
  emitToAll("db_changed", { type: "notifs" });

  return {
    personalizedMessage: messageSent
  };
};

// 3. Compile Graph Workflow
const workflow = new StateGraph(RecoveryState)
  .addNode("analyze", analyzeNode)
  .addNode("decide", decideNode)
  .addNode("execute", executeNode)
  .addEdge("__start__", "analyze")
  .addEdge("analyze", "decide")
  .addConditionalEdges("decide", (state) => {
    return state.actionToTake;
  }, {
    SEND_NOW: "execute",
    WAIT_LATER: "execute",
    STOP: "execute",
    ESCALATE: "execute"
  })
  .addEdge("execute", END);

const app = workflow.compile();

/**
 * Trigger AI Revenue Recovery Agent for a transaction background process
 * @param {string} transactionId 
 */
export const runRecoveryAgentForTransaction = async (transactionId) => {
  try {
    recoveryLogger.info(`[Recovery Agent] Triggering for transaction ${transactionId}`);
    
    // Log Trigger
    const tempTxn = await PaymentTransaction.findById(transactionId);
    if (!tempTxn) return;
    
    await new RecoveryAuditLog({
      transactionId,
      userId: tempTxn.userId,
      agentName: "RevenueRecoveryAgent",
      action: "TRIGGER",
      details: {
        message: `Recovery agent woke up automatically for status ${tempTxn.status} order.`
      }
    }).save();

    const finalState = await app.invoke({ transactionId });
    return finalState;
  } catch (err) {
    recoveryLogger.error(`[Recovery Agent] Error running agent for transaction ${transactionId}: ${err.message || err}`);
  }
};

/**
 * Periodically detects incomplete checkouts (PENDING transactions) older than 1 minute
 * and triggers the AI Recovery Agent.
 */
export const checkStalledCheckouts = async () => {
  try {
    const stalledTime = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago for new checkouts
    const reminderTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago for reminders
    
    // Find pending checkouts older than 1 minute, OR remind-later checkouts older than 15 minutes
    const stalledTransactions = await PaymentTransaction.find({
      $or: [
        {
          status: "PENDING",
          createdAt: { $lt: stalledTime },
          "recovery.status": "NOT_STARTED"
        },
        {
          "recovery.status": "REMIND_LATER",
          "recovery.lastActionAt": { $lt: reminderTime }
        }
      ]
    });

    if (stalledTransactions.length > 0) {
      recoveryLogger.info(`[Recovery Scheduler] Found ${stalledTransactions.length} incomplete checkouts.`);
    }

    for (const txn of stalledTransactions) {
      recoveryLogger.info(`[Recovery Scheduler] Waking up Recovery Agent for stalled order: ${txn.orderId}`);
      
      // Update state to ANALYZING to prevent concurrent pick-up
      txn.recovery.status = "ANALYZING";
      await txn.save();

      // Trigger recovery agent asynchronously
      runRecoveryAgentForTransaction(txn._id).catch(err => {
        recoveryLogger.error(`[Recovery Scheduler] Execution failed for order ${txn.orderId}: ${err.message || err}`);
      });
    }
  } catch (err) {
    recoveryLogger.error(`[Recovery Scheduler] Error checking stalled checkouts: ${err.message || err}`);
  }
};
