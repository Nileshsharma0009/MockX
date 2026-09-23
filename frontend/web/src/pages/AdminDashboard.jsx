import { API_BASE } from "../api/apiBase.js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { fetchTransactions } from "../api/payment";
import { fetchUsers } from "../api/auth.api";
import { sendNotification, fetchAllNotifications } from "../api/notification";
import {
  fetchRecoveryMetrics,
  fetchRecoveryAuditLogs,
  postCopilotQuery
} from "../api/paymentRecovery";
import {
  Shield,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  CreditCard,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  X,
  Mail,
  Phone,
  DollarSign,
  Send,
  MessageSquare,
  Users,
  Copy,
  Sparkles,
  Clock,
  Activity,
  FileText,
  CheckCheck,
  UserCheck,
  Zap
} from "lucide-react";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";

const cleanAuditMessage = (text) => {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "");
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
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) cleaned = cleaned.slice(1, -1);
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) cleaned = cleaned.slice(1, -1);
  return cleaned.trim();
};

function RecoveryGraph({ txnId, logs }) {
  const txnLogs = logs
    .filter(log => {
      const logTxnId = log.transactionId?._id || log.transactionId;
      return logTxnId === txnId;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (!txnId) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-6 text-center">
        <Sparkles className="w-8 h-8 text-indigo-400 mb-2.5 animate-pulse animate-bounce" />
        <p className="text-slate-900 font-extrabold text-sm">No Sequence Selected</p>
        <p className="text-slate-400 font-semibold text-xs mt-1">Choose a customer payment failure attempt above to visualize the AI Agent's path.</p>
      </div>
    );
  }

  if (txnLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-slate-400 font-semibold text-xs">
        No logs found for this transaction to construct a decision path.
      </div>
    );
  }

  const nodes = [];
  const edges = [];
  
  let x = 250;
  let y = 30;

  nodes.push({
    id: "failed_checkout",
    type: "input",
    data: { 
      label: (
        <div className="p-3 text-center space-y-1">
          <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">STEP 1: TRIGGER</div>
          <div className="font-extrabold text-slate-900 text-xs">Payment Failed</div>
          <div className="text-[9px] text-slate-400 font-bold">Webhook detects failure</div>
        </div>
      ) 
    },
    position: { x, y },
    style: { background: "#fff", border: "2px solid #f43f5e", borderRadius: "16px", width: 220, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }
  });

  let prevNodeId = "failed_checkout";

  txnLogs.forEach((log, index) => {
    y += 130;
    const nodeId = `log_${log._id}`;
    let border = "1px solid #e2e8f0";
    let typeName = "STEP";
    let headerColor = "text-indigo-600";
    let title = log.action;
    let description = cleanAuditMessage(log.details?.message || log.details?.reason || "");

    if (log.action === "TRIGGER") {
      title = "AI Scheduler Alert";
      typeName = "STEP 2: COLLECT CONTEXT";
      headerColor = "text-slate-500";
      description = "AI collects customer profile, product details, amounts, and previous recovery notifications.";
    } else if (log.action === "NOTIFICATION_SENT") {
      title = "AI Sent Recovery Notification";
      typeName = "STEP 4: EXECUTE INTERVENTION";
      headerColor = "text-purple-600";
      border = "2px solid #a855f7";
    } else if (log.action === "DECISION") {
      title = `Decision: ${log.details?.action || "Remind Later"}`;
      typeName = "STEP 3: COGNITIVE ANALYSIS";
      headerColor = "text-blue-600";
      border = "2px solid #3b82f6";
      description = log.details?.reason || "AI decided wait cooldown.";
    } else if (log.action === "PAYMENT_SUCCESS") {
      title = "Payment Completed 🎉";
      typeName = "OUTCOME: RECOVERED";
      headerColor = "text-emerald-600";
      border = "3px solid #10b981";
      description = `Successfully recovered ₹${log.details?.amount || "unspecified"}!`;
    } else if (log.action === "CUSTOMER_ACTION") {
      title = `Customer Clicked: ${log.details?.action?.replace("_", " ") || "Remind Later"}`;
      typeName = "OUTCOME: PREFERENCE RECORDED";
      headerColor = "text-sky-600";
      border = "2px solid #0ea5e9";
    } else if (log.action === "ESCALATED") {
      title = "Support Escalated ⚠️";
      typeName = "OUTCOME: ESCALATED";
      headerColor = "text-rose-600";
      border = "2px solid #f43f5e";
    } else if (log.action === "STOPPED") {
      title = "Recovery Halted";
      typeName = "OUTCOME: ARCHIVED";
      headerColor = "text-slate-600";
    }

    nodes.push({
      id: nodeId,
      data: {
        label: (
          <div className="p-3 text-left space-y-1.5 max-w-[280px]">
            <div className={`text-[8px] font-black uppercase tracking-wider ${headerColor}`}>{typeName}</div>
            <div className="font-extrabold text-slate-900 text-xs flex items-center justify-between gap-1">
              <span className="truncate">{title}</span>
              <span className="text-[8px] text-slate-400 font-semibold shrink-0">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {description && (
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed border-t border-slate-100 pt-1">
                {description.substring(0, 100)}{description.length > 100 ? "..." : ""}
              </p>
            )}
          </div>
        )
      },
      position: { x: x - 30, y },
      style: { background: "#fff", border, borderRadius: "20px", width: 280, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)" }
    });

    edges.push({
      id: `edge_${prevNodeId}_${nodeId}`,
      source: prevNodeId,
      target: nodeId,
      animated: log.action === "PAYMENT_SUCCESS" || log.action === "TRIGGER",
      style: { stroke: log.action === "PAYMENT_SUCCESS" ? "#10b981" : "#818cf8", strokeWidth: log.action === "PAYMENT_SUCCESS" ? 3 : 2 }
    });

    prevNodeId = nodeId;
  });

  return (
    <div className="h-[450px] border border-slate-200 rounded-3xl bg-slate-50/50 relative overflow-hidden shadow-inner flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        Interactive Decision Flow
      </div>
      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attribPosition="bottom-left"
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * AI RESPONSE RENDERER HELPERS & COMPONENT
 * ------------------------------------------------------------- */
const parseInlineStyles = (text) => {
  if (typeof text !== "string") return text;
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitText = text.split(regex);
  
  return splitText.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-slate-100 text-indigo-600 font-mono px-1.5 py-0.5 rounded text-[10px] border border-slate-200">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const parseTable = (lines) => {
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/)) {
      continue;
    }
    const cells = line.split("|")
      .map(c => c.trim())
      .filter((c, i, arr) => {
        if (i === 0 && line.startsWith("|") && c === "") return false;
        if (i === arr.length - 1 && line.endsWith("|") && c === "") return false;
        return true;
      });
      
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return null;
  const headers = rows[0];
  const bodyRows = rows.slice(1);
  
  return (
    <div className="overflow-x-auto my-3.5 rounded-2xl border border-slate-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-slate-900 text-slate-100 border-b border-slate-800">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold tracking-wider uppercase text-[10px]">
                {parseInlineStyles(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2 text-slate-700 font-medium">
                  {parseInlineStyles(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const parseList = (lines) => {
  return (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-700 text-[11.5px]">
      {lines.map((line, idx) => {
        const cleanLine = line.replace(/^[\s*-+]\s*/, "");
        return (
          <li key={idx} className="leading-relaxed">
            {parseInlineStyles(cleanLine)}
          </li>
        );
      })}
    </ul>
  );
};

const AIResponseRenderer = ({ content }) => {
  if (!content) return null;

  // 1. Strip out thinking process tags (<think>...</think> or unclosed <think>...)
  let cleanContent = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();

  // 2. Handle if the response content is wrapped in JSON formatting
  if (cleanContent.startsWith("{") && cleanContent.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanContent);
      if (parsed.response) {
        cleanContent = parsed.response;
      } else if (parsed.message) {
        cleanContent = parsed.message;
      } else if (parsed.reason) {
        cleanContent = parsed.reason;
      } else if (parsed.text) {
        cleanContent = parsed.text;
      }
    } catch (e) {
      // Keep original text if JSON parsing fails
    }
  }

  if (!cleanContent) return null;

  const blocks = [];
  let currentBlock = [];
  let insideCode = false;
  let codeLang = "";
  
  const lines = cleanContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith("```")) {
      if (insideCode) {
        blocks.push({ type: "code", content: currentBlock.join("\n"), lang: codeLang });
        currentBlock = [];
        insideCode = false;
      } else {
        if (currentBlock.length > 0) {
          blocks.push({ type: "text", lines: currentBlock });
          currentBlock = [];
        }
        insideCode = true;
        codeLang = line.trim().slice(3);
      }
      continue;
    }
    
    if (insideCode) {
      currentBlock.push(line);
      continue;
    }
    
    if (line.trim().startsWith("|")) {
      if (currentBlock.length > 0 && !currentBlock[0].trim().startsWith("|")) {
        blocks.push({ type: "text", lines: currentBlock });
        currentBlock = [];
      }
      currentBlock.push(line);
      continue;
    }
    
    if (currentBlock.length > 0 && currentBlock[0].trim().startsWith("|") && !line.trim().startsWith("|")) {
      blocks.push({ type: "table", lines: currentBlock });
      currentBlock = [];
    }
    
    if (line.trim() === "") {
      if (currentBlock.length > 0) {
        blocks.push({ type: "text", lines: currentBlock });
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  
  if (currentBlock.length > 0) {
    if (currentBlock[0].trim().startsWith("|")) {
      blocks.push({ type: "table", lines: currentBlock });
    } else if (insideCode) {
      blocks.push({ type: "code", content: currentBlock.join("\n"), lang: codeLang });
    } else {
      blocks.push({ type: "text", lines: currentBlock });
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        let renderedContent = null;
        
        if (block.type === "code") {
          renderedContent = (
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner my-2">
              <code>{block.content}</code>
            </pre>
          );
        } else if (block.type === "table") {
          renderedContent = parseTable(block.lines);
        } else {
          const firstLine = block.lines[0].trim();
          if (firstLine.startsWith("- ") || firstLine.startsWith("* ") || firstLine.match(/^\d+\.\s/)) {
            renderedContent = parseList(block.lines);
          } else if (firstLine.startsWith(">")) {
            const quoteContent = block.lines.map(l => l.replace(/^>\s?/, "")).join(" ");
            renderedContent = (
              <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-2 bg-indigo-50/20 text-slate-700 italic rounded-r-2xl text-[11px]">
                {parseInlineStyles(quoteContent)}
              </blockquote>
            );
          } else {
            renderedContent = (
              <div className="space-y-1.5 text-[11.5px]">
                {block.lines.map((line, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {parseInlineStyles(line)}
                  </p>
                ))}
              </div>
            );
          }
        }
        
        return (
          <motion.div
            key={bIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: bIdx * 0.05 }}
          >
            {renderedContent}
          </motion.div>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // Custom Notification Modal State
  const [sendModalUser, setSendModalUser] = useState(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageType, setMessageType] = useState("general");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Notifications Log State
  const [notificationsLog, setNotificationsLog] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // AI Recovery States
  const [recoveryMetrics, setRecoveryMetrics] = useState(null);
  const [recoveryLogs, setRecoveryLogs] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Graph View States for Recovery Audit Logs
  const [logViewMode, setLogViewMode] = useState("timeline"); // "timeline" | "graph"
  const [selectedGraphTxn, setSelectedGraphTxn] = useState("");

  // Copilot Chat States
  const [copilotHistory, setCopilotHistory] = useState([
    {
      role: "model",
      content: "Hello! I am the **Merchant AI Copilot**. I have access to your live database records, sales trends, customer activity, and recovery metrics. Ask me anything about your business performance!"
    }
  ]);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const loadTransactions = async (isSilent = false) => {
    if (isSilent === "background") {
      // Background poll: do not set loading spinners
    } else if (!isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await fetchTransactions();
      if (res?.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
      if (isSilent !== "background") toast.error("Failed to fetch payment transaction logs");
    } finally {
      if (isSilent !== "background") {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const loadUsers = async (isSilent = false) => {
    if (isSilent !== "background") setUsersLoading(true);
    try {
      const res = await fetchUsers();
      if (res?.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      if (isSilent !== "background") toast.error("Failed to fetch registered users list");
    } finally {
      if (isSilent !== "background") setUsersLoading(false);
    }
  };

  const loadNotifications = async (isSilent = false) => {
    if (isSilent !== "background") setNotifsLoading(true);
    try {
      const res = await fetchAllNotifications();
      if (res?.data) {
        setNotificationsLog(res.data);
      }
    } catch (err) {
      console.error("Failed to load notifications log:", err);
      if (isSilent !== "background") toast.error("Failed to fetch notification logs");
    } finally {
      if (isSilent !== "background") setNotifsLoading(false);
    }
  };

  const loadRecoveryData = async (isSilent = false) => {
    if (isSilent !== "background") {
      setMetricsLoading(true);
      setLogsLoading(true);
    }
    try {
      const mRes = await fetchRecoveryMetrics();
      if (mRes?.data) setRecoveryMetrics(mRes.data);
      
      const lRes = await fetchRecoveryAuditLogs();
      if (lRes?.data) setRecoveryLogs(lRes.data);
    } catch (err) {
      console.error("Failed to load recovery data:", err);
      if (isSilent !== "background") toast.error("Failed to load recovery dashboard information");
    } finally {
      if (isSilent !== "background") {
        setMetricsLoading(false);
        setLogsLoading(false);
      }
    }
  };

  const handleCopilotSend = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || copilotQuery;
    if (!queryToSend.trim()) return;

    const userMessage = { role: "user", content: queryToSend };
    setCopilotHistory(prev => [...prev, userMessage]);
    if (!customQuery) setCopilotQuery("");
    setCopilotLoading(true);

    try {
      const formattedHistory = copilotHistory.map(h => ({
        role: h.role === "model" ? "assistant" : h.role === "assistant" ? "assistant" : "user",
        content: h.content
      }));

      const res = await postCopilotQuery({
        query: queryToSend,
        history: formattedHistory
      });

      if (res?.data?.success) {
        setCopilotHistory(prev => [
          ...prev,
          { role: "model", content: res.data.response }
        ]);
      } else {
        toast.error("Copilot reasoning error");
        setCopilotHistory(prev => [
          ...prev,
          { role: "model", content: "Error: Could not retrieve response from Copilot server." }
        ]);
      }
    } catch (err) {
      console.error("Copilot chat query failed:", err);
      setCopilotHistory(prev => [
        ...prev,
        { role: "model", content: "Error: Network request failed while connecting to Copilot." }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!sendModalUser || !messageTitle || !messageBody) {
      toast.error("All fields are required");
      return;
    }

    setSendingMessage(true);
    try {
      await sendNotification({
        targetUserId: sendModalUser._id,
        title: messageTitle,
        message: messageBody,
        type: messageType
      });
      toast.success(`Message sent successfully to ${sendModalUser.name}!`);
      setSendModalUser(null);
      setMessageTitle("");
      setMessageBody("");
      setMessageType("general");
      if (activeTab === "notifs") {
        loadNotifications();
      }
    } catch (err) {
      console.error("Failed to send notification:", err);
      toast.error("Failed to send message/notification");
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      toast.error("Access denied. Super Admins only.");
      navigate("/v2");
      return;
    }

    if (activeTab === "transactions" && transactions.length === 0) {
      loadTransactions();
    } else if (activeTab === "users" && users.length === 0) {
      loadUsers();
    } else if (activeTab === "notifs" && notificationsLog.length === 0) {
      loadNotifications();
    } else if (activeTab === "recovery" && (!recoveryLogs || recoveryLogs.length === 0)) {
      loadRecoveryData();
    }
  }, [user, navigate, activeTab]);

  // Real-time socket listener for database updates
  useEffect(() => {
    const socketUrl = API_BASE;
    const socket = io(socketUrl, {
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to real-time sync server via WebSockets");
    });

    socket.on("db_changed", (data) => {
      console.log(`🔔 Real-time change received for: ${data.type}`);
      // Refresh matching logs in the background instantly
      if (data.type === "transactions") {
        loadTransactions("background");
      } else if (data.type === "recovery") {
        loadRecoveryData("background");
      } else if (data.type === "notifs") {
        loadNotifications("background");
      } else if (data.type === "users") {
        loadUsers("background");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from real-time sync server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Background polling to fetch updates (fallback liveness check every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "transactions") {
        loadTransactions("background");
      } else if (activeTab === "users") {
        loadUsers("background");
      } else if (activeTab === "notifs") {
        loadNotifications("background");
      } else if (activeTab === "recovery") {
        loadRecoveryData("background");
      }
    }, 30000); // 30 seconds fallback interval

    return () => clearInterval(interval);
  }, [activeTab]);

  // GSAP Tab Change Cards Stagger Animation
  useEffect(() => {
    // Stagger metric cards
    gsap.fromTo(
      ".stat-card-gsap",
      { opacity: 0, y: 15, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" }
    );
    // Stagger charts
    gsap.fromTo(
      ".chart-card-gsap",
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.15 }
    );
  }, [activeTab]);

  const getChartData = () => {
    const dataMap = {};
    transactions.forEach((txn) => {
      const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit"
      });
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { date: dateStr, Success: 0, Failed: 0, Total: 0 };
      }
      if (txn.status === "SUCCESS") {
        dataMap[dateStr].Success += txn.amount || 0;
      } else if (txn.status === "FAILED") {
        dataMap[dateStr].Failed += txn.amount || 0;
      }
      dataMap[dateStr].Total += txn.amount || 0;
    });

    return Object.values(dataMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);
  };

  const getMockPerformanceData = () => {
    const performance = {};
    transactions.forEach((txn) => {
      const mockName = (txn.mockId || "unknown").toUpperCase();
      if (!performance[mockName]) {
        performance[mockName] = { name: mockName, Recovered: 0, Unresolved: 0 };
      }
      if (txn.status === "SUCCESS") {
        performance[mockName].Recovered += 1;
      } else if (txn.status === "FAILED") {
        performance[mockName].Unresolved += 1;
      }
    });
    return Object.values(performance);
  };

  // Calculations for Metrics
  const successfulTxns = transactions.filter((t) => t.status === "SUCCESS");
  const failedTxns = transactions.filter((t) => t.status === "FAILED");
  const pendingTxns = transactions.filter((t) => t.status === "PENDING");

  const totalRevenue = successfulTxns.reduce((acc, t) => acc + (t.amount || 0), 0);
  const successRate = transactions.length 
    ? Math.round((successfulTxns.length / transactions.length) * 100) 
    : 0;

  // Filtered transactions
  const filteredTransactions = transactions.filter((txn) => {
    // Search filter
    const matchesSearch = 
      txn.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.paymentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.mockId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "ALL" || txn.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get unique transactions with logs for decision graph visualization
  const uniqueRecoveryTxns = Array.from(
    new Map(
      recoveryLogs
        .filter(log => log.transactionId)
        .map(log => {
          const tid = log.transactionId._id || log.transactionId;
          const mockId = log.transactionId.mockId || "unknown";
          const userName = log.userId?.name || "Customer";
          return [
            tid,
            {
              id: tid,
              mockId,
              userName
            }
          ];
        })
    ).values()
  );

  if (loading && activeTab === "transactions") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/v2/mock-tests")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Control Panel</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">Manage transactions, payments, and notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate("/v2/admin/institutes")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Shield className="w-4 h-4" />
              Institute Directory
            </button>
            <button
              onClick={() => {
                if (activeTab === "transactions") loadTransactions(true);
                else if (activeTab === "users") loadUsers();
                else if (activeTab === "notifs") loadNotifications();
                else if (activeTab === "recovery") loadRecoveryData();
              }}
              disabled={refreshing || usersLoading || notifsLoading || metricsLoading || logsLoading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${(refreshing || usersLoading || notifsLoading || metricsLoading || logsLoading) ? "animate-spin text-indigo-600" : ""}`} />
              {(refreshing || usersLoading || notifsLoading || metricsLoading || logsLoading) ? "Refreshing..." : "Refresh logs"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === "transactions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Transactions & Revenue
          </button>
          <button
            onClick={() => setActiveTab("recovery")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === "recovery"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            AI Revenue Recovery & Copilot
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            User Messaging
          </button>
          <button
            onClick={() => setActiveTab("notifs")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === "notifs"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Message Logs
          </button>
        </div>

        {activeTab === "transactions" && (
          <>
            {/* METRICS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Revenue */}
              <div
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <h3 className="text-3xl font-extrabold text-slate-900">₹{totalRevenue.toLocaleString("en-IN")}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Live earnings logged
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Success Rate */}
              <div
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success Rate</span>
                  <h3 className="text-3xl font-extrabold text-slate-900">{successRate}%</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {successfulTxns.length} of {transactions.length} successful
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Failed Payments */}
              <div
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed Payments</span>
                  <h3 className="text-3xl font-extrabold text-rose-600">{failedTxns.length}</h3>
                  <p className="text-[10px] text-rose-500 font-bold">Requires support attention</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Pending Orders */}
              <div
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Checkout</span>
                  <h3 className="text-3xl font-extrabold text-amber-600">{pendingTxns.length}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Awaiting gateway response</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* CHARTS GRAPH GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Revenue Trend Area Chart */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4 chart-card-gsap">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Revenue Analytics</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gross Sales vs Loss Trend</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                        labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#1e293b" }}
                        itemStyle={{ fontSize: "11px", fontWeight: "600" }}
                      />
                      <Area type="monotone" dataKey="Success" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" name="Recovered/Paid" />
                      <Area type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" name="Failed Checkout" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion by Mock ID Bar Chart */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4 chart-card-gsap">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Exam Bundle Performance</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recovered vs Unresolved failed orders</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getMockPerformanceData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                        labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#1e293b" }}
                        itemStyle={{ fontSize: "11px", fontWeight: "600" }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase" }} />
                      <Bar dataKey="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} name="Recovered Mocks" />
                      <Bar dataKey="Unresolved" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Unresolved Fails" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

        {/* CONTROLS (SEARCH & FILTER) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by customer, email, order ID, payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter Status
            </span>
            {["ALL", "SUCCESS", "FAILED", "PENDING"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* LOG LISTING */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-400 font-medium">Showing {filteredTransactions.length} records</p>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No transactions found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-6 py-4">Customer Details</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Razorpay Reference IDs</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Customer Info */}
                      <td className="px-6 py-4.5">
                        {txn.userId ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{txn.userId.name}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span>{txn.userId.email}</span>
                            </div>
                            {txn.userId.phone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <Phone className="w-3 h-3 text-slate-300" />
                                <span>{txn.userId.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">User account missing</span>
                        )}
                      </td>

                      {/* Product details */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          <span className="uppercase text-[10px] tracking-wider font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {txn.mockId || "unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Reference IDs */}
                      <td className="px-6 py-4.5 font-mono text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold select-none text-[9px] uppercase tracking-wider w-8">Order</span>
                            <span className="text-slate-600">{txn.orderId || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold select-none text-[9px] uppercase tracking-wider w-8">Pay</span>
                            <span className="text-slate-600">{txn.paymentId || <span className="text-slate-300 italic">—</span>}</span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4.5 font-bold text-slate-900">
                        ₹{txn.amount || 0}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            txn.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : txn.status === "FAILED"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              txn.status === "SUCCESS"
                                ? "bg-emerald-500"
                                : txn.status === "FAILED"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {txn.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                        {formatDate(txn.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right">
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                        >
                          View {txn.status === "FAILED" && <span className="text-rose-500">(Diag)</span>}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )}

        {/* TAB: AI REVENUE RECOVERY */}
        {activeTab === "recovery" && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* METRICS SUMMARY */}
            {metricsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white h-28 rounded-3xl border border-slate-200 shadow-sm" />
                ))}
              </div>
            ) : recoveryMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1: Revenue at Risk */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue at Risk</span>
                    <h3 className="text-3xl font-extrabold text-rose-500">₹{recoveryMetrics.totalRevenueAtRisk.toLocaleString("en-IN")}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Stalled or failed checkout value</p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 2: Recovery Rate */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recovery Rate</span>
                    <h3 className="text-3xl font-extrabold text-indigo-600">{recoveryMetrics.recoveryRate}%</h3>
                    <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {recoveryMetrics.successfulRecoveries} of {recoveryMetrics.recoveriesAttempted} recovered
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 3: Recovered Amount */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recovered Amount</span>
                    <h3 className="text-3xl font-extrabold text-emerald-600">₹{recoveryMetrics.recoveredAmount.toLocaleString("en-IN")}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold">Successfully saved revenue</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 4: Messages Sent / Unresolved */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between stat-card-gsap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Interventions</span>
                    <h3 className="text-3xl font-extrabold text-amber-600">{recoveryMetrics.unresolvedCases}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {recoveryMetrics.messagesSent} notification alerts sent | {recoveryMetrics.ignoredUsers} opted out
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-slate-500 font-medium shadow-sm">
                Could not retrieve recovery metrics
              </div>
            )}

            {/* AUDIT TIMELINE (Full Width) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col min-h-[550px] overflow-hidden">
              {/* Timeline Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Recovery Audit Logs</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Real-time decisions and interventions</p>
                </div>
                
                {/* View Mode Toggle & Transaction Selector */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setLogViewMode("timeline")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider ${
                        logViewMode === "timeline"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Timeline List
                    </button>
                    <button
                      onClick={() => setLogViewMode("graph")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider ${
                        logViewMode === "graph"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Decision Graph
                    </button>
                  </div>

                  {logViewMode === "graph" && (
                    <select
                      value={selectedGraphTxn}
                      onChange={(e) => setSelectedGraphTxn(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Checkout Attempt...</option>
                      {uniqueRecoveryTxns.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.userName} ({t.mockId.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Inline Copilot Open Button */}
                  <button
                    onClick={() => setIsCopilotOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Open AI Copilot
                  </button>
                </div>
              </div>

              {/* Timeline Scroll Box */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-indigo-500" />
                    <span className="text-xs font-medium">Fetching recovery audit logs...</span>
                  </div>
                ) : logViewMode === "graph" ? (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <RecoveryGraph txnId={selectedGraphTxn} logs={recoveryLogs} />
                  </div>
                ) : recoveryLogs.length === 0 ? (
                  <div className="text-center py-24 text-slate-400 font-medium text-xs">
                    No recovery audit logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-5 relative border-l border-slate-200 ml-2.5 pl-6 max-w-4xl">
                    {recoveryLogs.map((log) => {
                      let dotColor = "bg-indigo-500";
                      let titleColor = "text-indigo-700 bg-indigo-50 border-indigo-100";
                      if (log.action === "TRIGGER") {
                        dotColor = "bg-slate-400 animate-pulse";
                        titleColor = "text-slate-600 bg-slate-100 border-slate-200";
                      } else if (log.action === "NOTIFICATION_SENT") {
                        dotColor = "bg-purple-500";
                        titleColor = "text-purple-700 bg-purple-50 border-purple-100";
                      } else if (log.action === "PAYMENT_SUCCESS") {
                        dotColor = "bg-emerald-500";
                        titleColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                      } else if (log.action === "CUSTOMER_ACTION") {
                        dotColor = "bg-blue-500";
                        titleColor = "text-blue-700 bg-blue-50 border-blue-100";
                      } else if (log.action === "ESCALATED") {
                        dotColor = "bg-rose-500";
                        titleColor = "text-rose-700 bg-rose-50 border-rose-100";
                      } else if (log.action === "STOPPED") {
                        dotColor = "bg-rose-400";
                        titleColor = "text-rose-700 bg-rose-50 border-rose-100";
                      }

                      return (
                        <div key={log._id} className="relative space-y-1 text-xs">
                          {/* Dot marker */}
                          <span className={`absolute -left-[30.5px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${dotColor}`} />
                          
                          {/* Time */}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {formatDate(log.createdAt)}
                          </span>

                          {/* Heading */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] border ${titleColor}`}>
                              {log.action}
                            </span>
                            {log.userId && (
                              <span className="font-bold text-slate-900 text-[10px]">
                                ({log.userId.name})
                              </span>
                            )}
                          </div>

                          {/* Details text */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-slate-600 leading-relaxed mt-1 max-w-2xl">
                            <AIResponseRenderer content={cleanAuditMessage(log.details?.message || log.details?.reason || JSON.stringify(log.details))} />
                            {log.details?.message && log.details?.reason && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 italic">
                                <strong className="text-slate-500 font-bold not-italic">AI Reasoning:</strong> {log.details.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Floating Merchant Copilot Trigger Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="fixed bottom-6 right-6 z-40 bg-slate-950 hover:bg-indigo-600 border border-slate-800 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all font-bold text-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Ask AI Copilot
            </button>

            {/* Merchant AI Copilot Floating Window */}
            <AnimatePresence>
              {isCopilotOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 30 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="fixed bottom-24 right-6 w-full max-w-[420px] h-[580px] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-40"
                >
                  {/* Chat Header */}
                  <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-600 rounded-xl text-white">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm tracking-wide">Merchant AI Copilot</h3>
                        <p className="text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Grounded in live database records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                        Razor-AI
                      </span>
                      <button
                        onClick={() => setIsCopilotOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Box */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                    {copilotHistory.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                            msg.role === "user"
                              ? "bg-slate-900 text-white rounded-tr-none"
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          {/* Render rich animated Markdown, lists, and tables */}
                          {msg.role === "user" ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            <AIResponseRenderer content={msg.content} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {copilotLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                          <span className="text-xs font-semibold text-slate-500">Querying database aggregations...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Prompts Suggestions */}
                  <div className="px-6 py-3 border-t border-slate-100 bg-white flex flex-wrap gap-2">
                    {[
                      "What is our revenue recovery rate?",
                      "Show payment failure trends",
                      "Which product is most popular?",
                      "What are our peak purchase times?"
                    ].map((promptText, i) => (
                      <button
                        key={i}
                        onClick={(e) => handleCopilotSend(e, promptText)}
                        disabled={copilotLoading}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>

                  {/* Chat Form Input */}
                  <form onSubmit={handleCopilotSend} className="p-4 border-t border-slate-200 flex gap-2.5 bg-white">
                    <input
                      type="text"
                      placeholder="Ask about sales trends, conversions, recovery metrics, peak times..."
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      disabled={copilotLoading}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs focus:bg-white bg-slate-50 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      disabled={copilotLoading || !copilotQuery.trim()}
                      className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 2: USER MESSAGING */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {userSearchQuery && (
                  <button 
                    onClick={() => setUserSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Registered Users List
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Fetching registered users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                  No registered users found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <th className="px-6 py-4">User Details</th>
                        <th className="px-6 py-4">Unique User ID (ObjectId)</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Purchased Exams</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {users
                        .filter(u => 
                          u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u._id?.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .map(u => (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {u.name}
                                  {u.role === "admin" && (
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                      ADMIN
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 select-all">{u._id}</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(u._id);
                                    toast.success("ID copied to clipboard!");
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                  title="Copy User ID"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                              {u.phone || <span className="text-slate-300 italic">None</span>}
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex flex-wrap gap-1">
                                {u.purchasedExams && u.purchasedExams.length > 0 ? (
                                  u.purchasedExams.map(ex => (
                                    <span key={ex} className="uppercase text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                      {ex}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No bundles purchased</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <button
                                onClick={() => setSendModalUser(u)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Send Message
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGE LOGS */}
        {activeTab === "notifs" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Notification Logs</h2>
                <p className="text-xs text-slate-400 font-medium">History of all alerts sent to users</p>
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                System Broadcast Log
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {notifsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Fetching logs...</span>
                </div>
              ) : notificationsLog.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                  No notifications recorded in logs
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <th className="px-6 py-4">Recipient</th>
                        <th className="px-6 py-4">Message Title & Details</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Sent At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {notificationsLog.map((notif) => (
                        <tr key={notif._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4.5">
                            {notif.userId ? (
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-950">{notif.userId.name}</p>
                                <p className="text-xs text-slate-400 font-medium">{notif.userId.email}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">User deleted</span>
                            )}
                          </td>
                          <td className="px-6 py-4.5 max-w-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 leading-tight">{notif.title}</p>
                              <p className="text-xs text-slate-500 leading-normal">{notif.message}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              notif.type === "purchase"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : notif.type === "agent"
                                ? "bg-purple-50 text-purple-700 border border-purple-100"
                                : notif.type === "support"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {notif.type}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              notif.isRead 
                                ? "bg-slate-100 text-slate-600 border border-slate-200" 
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${notif.isRead ? "bg-slate-400" : "bg-indigo-500 animate-pulse"}`} />
                              {notif.isRead ? "READ" : "UNREAD"}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                            {formatDate(notif.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* COMPOSE NOTIFICATION MODAL */}
      <AnimatePresence>
        {sendModalUser && (
          <div 
            onClick={() => setSendModalUser(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Send Notification
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Deliver a message to this user's inbox</p>
                </div>
                <button
                  onClick={() => setSendModalUser(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="p-6 space-y-4">
                  {/* Recipient Details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Profile</span>
                    <p className="font-extrabold text-slate-900">{sendModalUser.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{sendModalUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-slate-400">
                      <span>Unique ID:</span>
                      <span className="text-slate-700 select-all font-bold">{sendModalUser._id}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Notification Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purchase Successful! 🎉"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm animate-none"
                    />
                  </div>

                  {/* Message Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Notification Category</label>
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="general">General Alert</option>
                      <option value="purchase">Purchase Log</option>
                      <option value="support">Support Response</option>
                      <option value="agent">Agent Recommendation</option>
                    </select>
                  </div>

                  {/* Body Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Message Details</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Write your email/notification details here..."
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSendModalUser(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {sendingMessage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY DIAGNOSTIC DETAIL MODAL */}
      <AnimatePresence>
        {selectedTxn && (
          <div 
            onClick={() => setSelectedTxn(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transaction Diagnostic Panel</h3>
                  <p className="text-xs text-slate-500 font-medium">Detailed logs and gateway responses</p>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Meta details */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTxn.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : selectedTxn.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {selectedTxn.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Amount</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">₹{selectedTxn.amount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Created At</p>
                    <p className="text-slate-700 font-bold mt-0.5">{formatDate(selectedTxn.createdAt)}</p>
                  </div>
                </div>

                {/* 2-Column Grid for System Identifiers and Buyer Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* References */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Identifiers</h4>
                    <div className="space-y-1.5 font-mono text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order:</span>
                        <span className="text-slate-755 select-all font-bold truncate max-w-[110px]" title={selectedTxn.orderId}>{selectedTxn.orderId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment:</span>
                        <span className="text-slate-755 select-all font-bold truncate max-w-[110px]" title={selectedTxn.paymentId}>{selectedTxn.paymentId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mock ID:</span>
                        <span className="text-indigo-700 select-all font-sans font-black uppercase">{selectedTxn.mockId || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* User info */}
                  {selectedTxn.userId && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyer Profile</h4>
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-700 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Name:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[110px]">{selectedTxn.userId.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email:</span>
                          <span className="font-mono text-slate-700 truncate max-w-[110px]" title={selectedTxn.userId.email}>{selectedTxn.userId.email}</span>
                        </div>
                        {selectedTxn.userId.phone && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone:</span>
                            <span className="font-mono text-slate-700">{selectedTxn.userId.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Failure diagnostics */}
                {selectedTxn.status === "FAILED" && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Failure Diagnostic Details
                    </h4>
                    <div className="bg-rose-50/40 p-3 rounded-2xl border border-rose-100 text-rose-800 space-y-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[9px] text-rose-400 block">Error Code</span>
                          <p className="font-mono font-bold text-rose-900">{selectedTxn.failureDetails?.code || "GENERIC_FAILURE"}</p>
                        </div>
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[9px] text-rose-400 block">Failed Step / Source</span>
                          <p className="font-bold text-rose-955 capitalize">{selectedTxn.failureDetails?.step || "unknown"} ({selectedTxn.failureDetails?.source || "unknown"})</p>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[9px] text-rose-400 block">Gateway Description</span>
                        <p className="text-rose-900 font-medium leading-normal">{selectedTxn.failureDetails?.description || "No failure description provided."}</p>
                      </div>
                      {selectedTxn.failureDetails?.reason && (
                        <div className="pt-1.5 border-t border-rose-200/30">
                          <span className="font-bold uppercase tracking-wider text-[9px] text-rose-400 block">AI Recovery Context</span>
                          <p className="text-rose-900 font-medium italic mt-0.5">"{selectedTxn.failureDetails.reason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  Close Diagnostic
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
