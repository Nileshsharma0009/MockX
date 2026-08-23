import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { SmartLLMProvider } from "./llmProvider.js";
import * as dbTools from "./dbTools.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";

// 1. Define State Graph Channels for the Copilot
const CopilotState = Annotation.Root({
  messages: Annotation(),
  query: Annotation(),
  response: Annotation(),
  toolCalls: Annotation(), // Array of { name, args }
  toolResults: Annotation() // Object with tool result data
});

// 2. Nodes Implementation

// AGENT NODE: Analyzes prompt and decides if database queries are needed
const agentNode = async (state) => {
  console.log(`[Merchant Copilot] Node: Agent - Parsing query: "${state.query}"`);

  const systemPrompt = `You are the Merchant AI Copilot Planner for MockX.
Your task is to analyze the user query and decide if you need to fetch real-time database data to answer it.
You have access to the following tools:
- "getRevenueInfo": Call this for questions about total revenue, sales count, or general success rate.
- "getRecoveryMetrics": Call this for questions about recovery rate, recovered revenue, attempted recovery, unresolved cases, revenue at risk, or messages sent.
- "getPaymentTrends": Call this for payment activity over recent days, trend comparison, success vs failure over time.
- "getCustomerBehavior": Call this for questions about user conversion, total registered users, paid user ratio, or multiple retry checkouts.
- "getPopularProducts": Call this for best selling exam packs, mock tests rankings.
- "getPendingCheckouts": Call this to inspect active checkouts currently in a pending state.
- "getPeakTimes": Call this for peak purchase times, hourly or weekly volume trends.
- "getUnusualChanges": Call this for sudden changes in payment failures, anomalous behavior, or warning checks.
- "getUserDropOffAnalysis": Call this for questions about when users stop buying mocks, churn drop-off point, user dormancy intervals, purchase frequency distribution, repeat buyers lifetime.

If the user query is conversational or does not require any database data (e.g. "hello", "who are you"), set needsTool to false and toolCalls to empty.

You MUST respond ONLY with a JSON object in this format:
{
  "needsTool": true | false,
  "toolCalls": [
    {
      "name": "toolName",
      "args": {}
    }
  ]
}`;

  try {
    // Incorporate chat history if present
    const chatContext = state.messages || [];
    const promptInput = [...chatContext, { role: "user", content: state.query }];

    const response = await SmartLLMProvider.call(promptInput, {
      jsonMode: true,
      systemInstruction: systemPrompt
    });

    const parsed = JSON.parse(response);
    return {
      toolCalls: parsed.needsTool ? (parsed.toolCalls || []) : []
    };
  } catch (err) {
    console.error("[Merchant Copilot] Agent planning node error, defaulting to no tools.", err);
    return {
      toolCalls: []
    };
  }
};

// ACTION NODE: Runs the requested database tools
const actionNode = async (state) => {
  console.log(`[Merchant Copilot] Node: Action - Executing tools:`, state.toolCalls);
  const results = {};

  for (const call of state.toolCalls) {
    const toolName = call.name;
    const toolFn = dbTools[toolName];

    if (typeof toolFn === "function") {
      try {
        console.log(`[Merchant Copilot] Executing db tool: ${toolName}`);
        const data = await toolFn();
        results[toolName] = data;
      } catch (err) {
        console.error(`[Merchant Copilot] Tool ${toolName} execution error:`, err);
        results[toolName] = { error: err.message };
      }
    } else {
      console.warn(`[Merchant Copilot] Requested tool "${toolName}" is not defined.`);
    }
  }

  return {
    toolResults: results
  };
};

// GENERATE NODE: Standardizes markdown response based on query and tool data
const generateNode = async (state) => {
  console.log(`[Merchant Copilot] Node: Generate - Synthesizing final response...`);

  const systemPrompt = `You are the Merchant AI Copilot for MockX, an enterprise mock test platform.
Your goal is to answer the merchant's business queries with grounded, real-time database facts.

Real-time Database Context:
${JSON.stringify(state.toolResults || {}, null, 2)}

Instructions:
- Use clean formatting, bold metrics, and Markdown tables/lists to present trends and stats beautifully.
- If data is available, cite the specific numbers (e.g. ₹499 recovered revenue, 42.5% recovery rate) and explain their meaning clearly.
- If data is empty or errors occur, state the situation honestly. Do not invent any numbers.
- Give constructive business suggestions where appropriate based on the findings (e.g. "We have ₹1,500 revenue at risk due to stalled checkouts; we should run recovery notifications").
- Speak in a professional, concise, executive tone. Avoid excessive greetings.`;

  try {
    const chatContext = state.messages || [];
    const promptInput = [...chatContext, { role: "user", content: state.query }];

    const finalAnswer = await SmartLLMProvider.call(promptInput, {
      jsonMode: false,
      systemInstruction: systemPrompt
    });

    return {
      response: finalAnswer
    };
  } catch (err) {
    console.error("[Merchant Copilot] Generate response node error.", err);
    return {
      response: "I'm sorry, I encountered an issue pulling the business details. Please check connection and try again."
    };
  }
};

// 3. Compile Graph Workflow
const copilotWorkflow = new StateGraph(CopilotState)
  .addNode("agent", agentNode)
  .addNode("action", actionNode)
  .addNode("generate", generateNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", (state) => {
    return state.toolCalls && state.toolCalls.length > 0 ? "action" : "generate";
  }, {
    action: "action",
    generate: "generate"
  })
  .addEdge("action", "generate")
  .addEdge("generate", END);

const copilotApp = copilotWorkflow.compile();

/**
 * Execute Merchant AI Copilot Chat query
 * @param {string} query User message query
 * @param {Array<{role: string, content: string}>} messages Chat message history
 * @param {string} adminId Admin User ObjectId
 */
export const runMerchantCopilot = async (query, messages = [], adminId = null) => {
  try {
    console.log(`[Merchant Copilot] Query initiated by admin: ${query}`);

    // Log the interaction
    if (adminId) {
      // Find a recent recovery transaction to reference, or just write a general log
      // Let's create an audit entry with a mock transaction ID or query tracking
      await new RecoveryAuditLog({
        transactionId: "000000000000000000000000", // Placeholder for general admin queries
        userId: adminId,
        agentName: "MerchantCopilot",
        action: "TRIGGER",
        details: { query }
      }).save();
    }

    const result = await copilotApp.invoke({
      query,
      messages: messages.slice(-10), // Limit history context
      toolResults: {}
    });

    // Log the generated output decision / answer event
    if (adminId) {
      await new RecoveryAuditLog({
        transactionId: "000000000000000000000000",
        userId: adminId,
        agentName: "MerchantCopilot",
        action: "DECISION",
        details: {
          query,
          toolCalls: result.toolCalls,
          answerSummary: result.response.substring(0, 100) + "..."
        }
      }).save();
    }

    return result.response;
  } catch (err) {
    console.error("[Merchant Copilot] Query execution failed:", err);
    return "Failed to process chat query: " + err.message;
  }
};
