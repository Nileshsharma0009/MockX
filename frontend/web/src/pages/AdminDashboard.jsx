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

    {/* =========================================================
        HEADER
    ========================================================= */}
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
  <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">

    {/* Left: Back + Title */}
    <div className="flex min-w-0 items-center gap-2">
      <button
        onClick={() => navigate("/v2/mock-tests")}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:h-8 sm:w-8"
        title="Back to Catalog"
      >
        <ArrowLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-600 sm:h-4 sm:w-4" />

          <h1 className="truncate text-xs font-medium tracking-tight text-slate-900 sm:text-base sm:font-semibold">
            Admin  Panel
          </h1>
        </div>

        <p className="hidden text-[3px] text-slate-500 sm:block sm:text-[10px]">
          Manage transactions, payments, and notifications
        </p>
      </div>
    </div>

    {/* Right: Actions */}
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

      <button
        onClick={() => navigate("/v2/admin/institutes")}
        className="flex h-8 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-2.5 text-[9px] text-white shadow-sm transition-all active:scale-95 hover:bg-indigo-500 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs"
      >
        <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

        <span className="hidden sm:inline">
          Institute Directory
        </span>

        <span className="sm:hidden">
          Institutes
        </span>
      </button>

      <button
        onClick={() => {
          if (activeTab === "transactions") loadTransactions(true);
          else if (activeTab === "users") loadUsers();
          else if (activeTab === "notifs") loadNotifications();
          else if (activeTab === "recovery") loadRecoveryData();
        }}
        disabled={
          refreshing ||
          usersLoading ||
          notifsLoading ||
          metricsLoading ||
          logsLoading
        }
        className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[9px] text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs"
      >
        <RefreshCw
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
            refreshing ||
            usersLoading ||
            notifsLoading ||
            metricsLoading ||
            logsLoading
              ? "animate-spin text-indigo-600"
              : ""
          }`}
        />

        <span className="hidden sm:inline">
          {refreshing ||
          usersLoading ||
          notifsLoading ||
          metricsLoading ||
          logsLoading
            ? "Refreshing..."
            : "Refresh logs"}
        </span>

        <span className="sm:hidden">
          {refreshing ||
          usersLoading ||
          notifsLoading ||
          metricsLoading ||
          logsLoading
            ? "..."
            : "Refresh"}
        </span>
      </button>
    </div>
  </div>
</header>

    {/* =========================================================
        MAIN CONTAINER
    ========================================================= */}
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">

      {/* =======================================================
          TABS
      ======================================================= */}
      <div className="mb-5 overflow-x-auto border-b border-slate-200 sm:mb-8">
        <div className="flex min-w-max gap-4 sm:gap-6">

          {[
            ["transactions", "Transactions & Revenue"],
            ["recovery", "AI Revenue Recovery & Copilot"],
            ["users", "User Messaging"],
            ["notifs", "Message Logs"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 whitespace-nowrap border-b-2 pb-2 text-[10px] transition-all sm:pb-3 sm:text-sm ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================
          TRANSACTIONS TAB
      ======================================================= */}
      {activeTab === "transactions" && (
        <div className="space-y-5 sm:space-y-8">

          {/* METRICS */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

            {/* Revenue */}
            <div className="stat-card-gsap group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                  Total Revenue
                </span>

                <h3 className="truncate text-base font-medium leading-tight text-slate-900 sm:text-3xl sm:font-semibold">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </h3>

                <p className="flex items-center gap-0.5 truncate text-[8px] text-emerald-600 sm:text-[10px] sm:font-medium">
                  <TrendingUp className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                  Live earnings logged
                </p>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                <DollarSign className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </div>
            </div>

            {/* Success */}
            <div className="stat-card-gsap group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                  Success Rate
                </span>

                <h3 className="text-base font-medium leading-tight text-slate-900 sm:text-3xl sm:font-semibold">
                  {successRate}%
                </h3>

                <p className="truncate text-[8px] text-slate-500 sm:text-[10px] sm:font-medium">
                  {successfulTxns.length} of {transactions.length} successful
                </p>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </div>
            </div>

            {/* Failed */}
            <div className="stat-card-gsap group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                  Failed Payments
                </span>

                <h3 className="text-base font-medium leading-tight text-rose-600 sm:text-3xl sm:font-semibold">
                  {failedTxns.length}
                </h3>

                <p className="truncate text-[8px] text-rose-500 sm:text-[10px] sm:font-medium">
                  Requires support attention
                </p>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                <XCircle className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </div>
            </div>

            {/* Pending */}
            <div className="stat-card-gsap group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                  Pending Checkout
                </span>

                <h3 className="text-base font-medium leading-tight text-amber-600 sm:text-3xl sm:font-semibold">
                  {pendingTxns.length}
                </h3>

                <p className="truncate text-[8px] text-slate-500 sm:text-[10px] sm:font-medium">
                  Awaiting gateway response
                </p>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                <AlertCircle className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* =================================================
              CHARTS
          ================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Revenue */}
            <div className="chart-card-gsap rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-[28px] sm:p-6">
              <div className="mb-2">
                <h3 className="text-xs font-medium text-slate-900 sm:text-sm sm:font-semibold">
                  Revenue Analytics
                </h3>

                <p className="mt-0.5 text-[8px] uppercase tracking-wide text-slate-400 sm:text-[10px] sm:font-medium sm:tracking-wider">
                  Gross Sales vs Loss Trend
                </p>
              </div>

              <div className="h-[190px] w-full sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getChartData()}
                    margin={{
                      top: 10,
                      right: 5,
                      left: -25,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorSuccess"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="colorFailed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={8}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke="#94a3b8"
                      fontSize={8}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      }}
                      labelStyle={{
                        fontWeight: "500",
                        fontSize: "10px",
                        color: "#1e293b",
                      }}
                      itemStyle={{
                        fontSize: "10px",
                        fontWeight: "500",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="Success"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                      name="Recovered/Paid"
                    />

                    <Area
                      type="monotone"
                      dataKey="Failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                      name="Failed Checkout"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mock performance */}
            <div className="chart-card-gsap rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-[28px] sm:p-6">
              <div className="mb-2">
                <h3 className="text-xs font-medium text-slate-900 sm:text-sm sm:font-semibold">
                  Exam Bundle Performance
                </h3>

                <p className="mt-0.5 text-[8px] uppercase tracking-wide text-slate-400 sm:text-[10px] sm:font-medium sm:tracking-wider">
                  Recovered vs Unresolved failed orders
                </p>
              </div>

              <div className="h-[190px] w-full sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getMockPerformanceData()}
                    margin={{
                      top: 10,
                      right: 5,
                      left: -25,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={8}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke="#94a3b8"
                      fontSize={8}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      }}
                      labelStyle={{
                        fontWeight: "500",
                        fontSize: "10px",
                        color: "#1e293b",
                      }}
                      itemStyle={{
                        fontSize: "10px",
                        fontWeight: "500",
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      height={28}
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{
                        fontSize: "8px",
                        fontWeight: "500",
                        textTransform: "uppercase",
                      }}
                    />

                    <Bar
                      dataKey="Recovered"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Recovered Mocks"
                    />

                    <Bar
                      dataKey="Unresolved"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      name="Unresolved Fails"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between sm:rounded-3xl sm:p-5">

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-3.5 sm:h-4 sm:w-4" />

              <input
                type="text"
                placeholder="Search by customer, email, order ID, payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-[10px] text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 sm:rounded-2xl sm:pl-10 sm:text-sm"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
              <span className="mr-1 flex shrink-0 items-center gap-1 text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Filter
              </span>

              {["ALL", "SUCCESS", "FAILED", "PENDING"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-medium shadow-sm transition-all sm:rounded-xl sm:px-4 sm:text-xs sm:font-semibold ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* =================================================
              TRANSACTION TABLE
          ================================================= */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">

            <div className="border-b border-slate-100 px-3 py-3.5 sm:px-6 sm:py-5">
              <h2 className="text-sm font-medium text-slate-900 sm:text-lg sm:font-semibold">
                Transaction History
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs sm:font-medium">
                Showing {filteredTransactions.length} records
              </p>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center">
                <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-300 sm:h-12 sm:w-12" />

                <p className="text-xs text-slate-500 sm:text-sm">
                  No transactions found matching your criteria
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400 sm:text-[10px] sm:tracking-wider">
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Customer Details
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Product Info
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Razorpay Reference IDs
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Amount
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Status
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Timestamp
                      </th>
                      <th className="px-3 py-3 text-right sm:px-6 sm:py-4">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredTransactions.map((txn) => (
                      <tr
                        key={txn._id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          {txn.userId ? (
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-slate-900 sm:text-sm sm:font-semibold">
                                {txn.userId.name}
                              </p>

                              <div className="flex items-center gap-1 text-[9px] text-slate-400 sm:text-[11px]">
                                <Mail className="h-3 w-3 shrink-0 text-slate-300" />
                                <span>{txn.userId.email}</span>
                              </div>

                              {txn.userId.phone && (
                                <div className="flex items-center gap-1 text-[9px] text-slate-400 sm:text-[11px]">
                                  <Phone className="h-3 w-3 shrink-0 text-slate-300" />
                                  <span>{txn.userId.phone}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              User account missing
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] uppercase tracking-wide text-indigo-700 sm:text-[10px] sm:font-medium">
                            {txn.mockId || "unknown"}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-mono text-[9px] sm:px-6 sm:py-4 sm:text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-8 shrink-0 text-[8px] uppercase tracking-wide text-slate-400">
                                Order
                              </span>
                              <span className="text-slate-600">
                                {txn.orderId || "N/A"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="w-8 shrink-0 text-[8px] uppercase tracking-wide text-slate-400">
                                Pay
                              </span>
                              <span className="text-slate-600">
                                {txn.paymentId || "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-900 sm:px-6 sm:py-4 sm:text-sm sm:font-semibold">
                          ₹{txn.amount || 0}
                        </td>

                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-medium sm:px-3 sm:text-xs ${
                              txn.status === "SUCCESS"
                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                : txn.status === "FAILED"
                                ? "border-rose-100 bg-rose-50 text-rose-700"
                                : "border-amber-100 bg-amber-50 text-amber-700"
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

                        <td className="whitespace-nowrap px-3 py-3 text-[9px] text-slate-500 sm:px-6 sm:py-4 sm:text-xs">
                          {formatDate(txn.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-right sm:px-6 sm:py-4">
                          <button
                            onClick={() => setSelectedTxn(txn)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800 sm:px-3 sm:text-xs sm:font-medium"
                          >
                            View
                            {txn.status === "FAILED" && (
                              <span className="text-rose-500">
                                (Diag)
                              </span>
                            )}
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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

      {/* =======================================================
          RECOVERY TAB
      ======================================================= */}
      {activeTab === "recovery" && (
        <div className="space-y-5 sm:space-y-8">

          {/* Metrics */}
          {metricsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-xl border border-slate-200 bg-white shadow-sm sm:h-28 sm:rounded-3xl"
                />
              ))}
            </div>
          ) : recoveryMetrics ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

              {/* Revenue Risk */}
              <div className="stat-card-gsap flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="min-w-0">
                  <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                    Revenue at Risk
                  </span>

                  <h3 className="mt-1 truncate text-base font-medium text-rose-500 sm:text-3xl sm:font-semibold">
                    ₹{recoveryMetrics.totalRevenueAtRisk.toLocaleString("en-IN")}
                  </h3>

                  <p className="mt-1 truncate text-[8px] text-slate-400 sm:text-[10px]">
                    Stalled or failed checkout value
                  </p>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
              </div>

              {/* Recovery Rate */}
              <div className="stat-card-gsap flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="min-w-0">
                  <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                    Recovery Rate
                  </span>

                  <h3 className="mt-1 text-base font-medium text-indigo-600 sm:text-3xl sm:font-semibold">
                    {recoveryMetrics.recoveryRate}%
                  </h3>

                  <p className="mt-1 flex items-center gap-0.5 truncate text-[8px] text-indigo-600 sm:text-[10px]">
                    <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                    {recoveryMetrics.successfulRecoveries} of{" "}
                    {recoveryMetrics.recoveriesAttempted} recovered
                  </p>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                  <Zap className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
              </div>

              {/* Recovered */}
              <div className="stat-card-gsap flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="min-w-0">
                  <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                    Recovered Amount
                  </span>

                  <h3 className="mt-1 truncate text-base font-medium text-emerald-600 sm:text-3xl sm:font-semibold">
                    ₹{recoveryMetrics.recoveredAmount.toLocaleString("en-IN")}
                  </h3>

                  <p className="mt-1 truncate text-[8px] text-emerald-500 sm:text-[10px]">
                    Successfully saved revenue
                  </p>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                  <DollarSign className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
              </div>

              {/* Interventions */}
              <div className="stat-card-gsap flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="min-w-0">
                  <span className="block truncate text-[8px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
                    Active Interventions
                  </span>

                  <h3 className="mt-1 text-base font-medium text-amber-600 sm:text-3xl sm:font-semibold">
                    {recoveryMetrics.unresolvedCases}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-400 sm:text-[10px]">
                    {recoveryMetrics.messagesSent} notification alerts sent |{" "}
                    {recoveryMetrics.ignoredUsers} opted out
                  </p>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 sm:h-12 sm:w-12 sm:rounded-2xl sm:p-3">
                  <Sparkles className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500 shadow-sm sm:rounded-3xl sm:p-6">
              Could not retrieve recovery metrics
            </div>
          )}

          {/* =================================================
              AUDIT LOGS
          ================================================= */}
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md sm:min-h-[550px] sm:rounded-3xl">

            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">

              <div className="min-w-0">
                <h3 className="text-xs font-medium text-slate-900 sm:text-sm sm:font-semibold">
                  Recovery Audit Logs
                </h3>

                <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                  Real-time decisions and interventions
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setLogViewMode("timeline")}
                    className={`rounded-lg px-2.5 py-1.5 text-[9px] uppercase tracking-wide transition-all sm:px-3 sm:text-[10px] ${
                      logViewMode === "timeline"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Timeline
                  </button>

                  <button
                    onClick={() => setLogViewMode("graph")}
                    className={`rounded-lg px-2.5 py-1.5 text-[9px] uppercase tracking-wide transition-all sm:px-3 sm:text-[10px] ${
                      logViewMode === "graph"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Graph
                  </button>
                </div>

                {logViewMode === "graph" && (
                  <select
                    value={selectedGraphTxn}
                    onChange={(e) =>
                      setSelectedGraphTxn(e.target.value)
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto sm:flex-none sm:text-xs"
                  >
                    <option value="">
                      Select Checkout Attempt...
                    </option>

                    {uniqueRecoveryTxns.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.userName} ({t.mockId.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setIsCopilotOpen(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] text-white transition-all hover:bg-indigo-700 sm:flex-none sm:px-4 sm:text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Open AI Copilot
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 sm:p-6">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 sm:h-7 sm:w-7" />
                  <span className="text-[10px] sm:text-xs">
                    Fetching recovery audit logs...
                  </span>
                </div>
              ) : logViewMode === "graph" ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
                  <div className="min-w-[600px]">
                    <RecoveryGraph
                      txnId={selectedGraphTxn}
                      logs={recoveryLogs}
                    />
                  </div>
                </div>
              ) : recoveryLogs.length === 0 ? (
                <div className="py-24 text-center text-[10px] text-slate-400 sm:text-xs">
                  No recovery audit logs recorded yet.
                </div>
              ) : (
                <div className="relative ml-2 max-w-4xl space-y-4 border-l border-slate-200 pl-4 sm:ml-2.5 sm:space-y-5 sm:pl-6">

                  {recoveryLogs.map((log) => {
                    let dotColor = "bg-indigo-500";
                    let titleColor =
                      "text-indigo-700 bg-indigo-50 border-indigo-100";

                    if (log.action === "TRIGGER") {
                      dotColor = "bg-slate-400 animate-pulse";
                      titleColor =
                        "text-slate-600 bg-slate-100 border-slate-200";
                    } else if (
                      log.action === "NOTIFICATION_SENT"
                    ) {
                      dotColor = "bg-purple-500";
                      titleColor =
                        "text-purple-700 bg-purple-50 border-purple-100";
                    } else if (
                      log.action === "PAYMENT_SUCCESS"
                    ) {
                      dotColor = "bg-emerald-500";
                      titleColor =
                        "text-emerald-700 bg-emerald-50 border-emerald-100";
                    } else if (
                      log.action === "CUSTOMER_ACTION"
                    ) {
                      dotColor = "bg-blue-500";
                      titleColor =
                        "text-blue-700 bg-blue-50 border-blue-100";
                    } else if (
                      log.action === "ESCALATED"
                    ) {
                      dotColor = "bg-rose-500";
                      titleColor =
                        "text-rose-700 bg-rose-50 border-rose-100";
                    } else if (
                      log.action === "STOPPED"
                    ) {
                      dotColor = "bg-rose-400";
                      titleColor =
                        "text-rose-700 bg-rose-50 border-rose-100";
                    }

                    return (
                      <div
                        key={log._id}
                        className="relative space-y-1 text-[10px] sm:text-xs"
                      >
                        <span
                          className={`absolute -left-[24px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white sm:-left-[30.5px] sm:top-1.5 sm:h-3 sm:w-3 ${dotColor}`}
                        />

                        <span className="text-[9px] text-slate-400 sm:text-[10px]">
                          {formatDate(log.createdAt)}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[8px] uppercase tracking-wide sm:px-2 sm:text-[9px] ${titleColor}`}
                          >
                            {log.action}
                          </span>

                          {log.userId && (
                            <span className="break-words text-[9px] text-slate-900 sm:text-[10px]">
                              ({log.userId.name})
                            </span>
                          )}
                        </div>

                        <div className="mt-1 rounded-xl border border-slate-200/80 bg-white p-2.5 leading-relaxed text-slate-600 shadow-sm sm:rounded-2xl sm:p-4">
                          <AIResponseRenderer
                            content={cleanAuditMessage(
                              log.details?.message ||
                              log.details?.reason ||
                              JSON.stringify(log.details)
                            )}
                          />

                          {log.details?.message &&
                            log.details?.reason && (
                              <div className="mt-2.5 border-t border-slate-100 pt-2 text-[9px] text-slate-400 sm:mt-3 sm:pt-2.5 sm:text-[10px]">
                                <strong className="text-slate-500">
                                  AI Reasoning:
                                </strong>{" "}
                                {log.details.reason}
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

          {/* Floating AI button */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-white shadow-2xl sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5 sm:text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
            Ask AI Copilot
          </button>

          {/* Copilot */}
          <AnimatePresence>
            {isCopilotOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-2 bottom-16 z-50 flex h-[calc(100dvh-5rem)] min-h-[420px] max-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-24 sm:right-6 sm:left-auto sm:h-[580px] sm:w-[420px] sm:rounded-3xl"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between bg-slate-900 px-3 py-3 text-white sm:px-5 sm:py-4">

                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 sm:h-9 sm:w-9 sm:rounded-xl">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-medium tracking-wide sm:text-sm sm:font-semibold">
                        Merchant AI Copilot
                      </h3>

                      <p className="flex items-center gap-1 truncate text-[8px] text-slate-300 sm:text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Grounded in live database records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="hidden rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[9px] text-slate-300 sm:block">
                      Razor-AI
                    </span>

                    <button
                      onClick={() => setIsCopilotOpen(false)}
                      className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3 sm:space-y-4 sm:p-5">
                  {copilotHistory.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{
                        opacity: 0,
                        scale: 0.98,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                      className={`flex ${
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-[10px] leading-relaxed sm:max-w-[85%] sm:px-5 sm:py-3.5 sm:text-xs ${
                          msg.role === "user"
                            ? "rounded-tr-none bg-slate-900 text-white"
                            : "rounded-tl-none border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : (
                          <AIResponseRenderer
                            content={msg.content}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {copilotLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        <span className="text-[9px] text-slate-500 sm:text-xs">
                          Querying database...
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick prompts */}
                <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2.5 sm:gap-2 sm:px-5 sm:py-3">
                  {[
                    "What is our revenue recovery rate?",
                    "Show payment failure trends",
                    "Which product is most popular?",
                    "What are our peak purchase times?",
                  ].map((promptText, i) => (
                    <button
                      key={i}
                      onClick={(e) =>
                        handleCopilotSend(e, promptText)
                      }
                      disabled={copilotLoading}
                      className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[8px] text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-[10px]"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleCopilotSend}
                  className="flex gap-2 border-t border-slate-200 bg-white p-3 sm:p-4"
                >
                  <input
                    type="text"
                    placeholder="Ask about sales trends..."
                    value={copilotQuery}
                    onChange={(e) =>
                      setCopilotQuery(e.target.value)
                    }
                    disabled={copilotLoading}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs"
                  />

                  <button
                    type="submit"
                    disabled={
                      copilotLoading ||
                      !copilotQuery.trim()
                    }
                    className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 text-[10px] text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 sm:rounded-2xl sm:px-5 sm:text-xs"
                  >
                    <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Send
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =======================================================
          USERS TAB
      ======================================================= */}
      {activeTab === "users" && (
        <div className="space-y-5 sm:space-y-6">

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between sm:rounded-3xl sm:p-5">

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-3.5 sm:h-4 sm:w-4" />

              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={userSearchQuery}
                onChange={(e) =>
                  setUserSearchQuery(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-[10px] text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 sm:rounded-2xl sm:pl-10 sm:text-sm"
              />

              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            <div className="text-[9px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
              Registered Users List
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20">
                <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
                <span className="text-[10px] text-slate-500 sm:text-sm">
                  Fetching registered users...
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                No registered users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400 sm:text-[10px]">
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        User Details
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Unique User ID
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Contact
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Purchased Exams
                      </th>
                      <th className="px-3 py-3 text-right sm:px-6 sm:py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {users
                      .filter(
                        (u) =>
                          u.name
                            ?.toLowerCase()
                            .includes(
                              userSearchQuery.toLowerCase()
                            ) ||
                          u.email
                            ?.toLowerCase()
                            .includes(
                              userSearchQuery.toLowerCase()
                            ) ||
                          u._id
                            ?.toLowerCase()
                            .includes(
                              userSearchQuery.toLowerCase()
                            )
                      )
                      .map((u) => (
                        <tr
                          key={u._id}
                          className="transition-colors hover:bg-slate-50/50"
                        >
                          <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-0.5">
                              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-900 sm:text-sm sm:font-semibold">
                                {u.name}

                                {u.role === "admin" && (
                                  <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[8px] text-indigo-700 sm:text-[9px]">
                                    ADMIN
                                  </span>
                                )}
                              </p>

                              <p className="text-[9px] text-slate-400 sm:text-xs">
                                {u.email}
                              </p>
                            </div>
                          </td>

                          <td className="px-3 py-3 font-mono text-[9px] sm:px-6 sm:py-4 sm:text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="select-all whitespace-nowrap rounded border border-slate-100 bg-slate-50 px-2 py-1 text-slate-600">
                                {u._id}
                              </span>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    u._id
                                  );
                                  toast.success(
                                    "ID copied to clipboard!"
                                  );
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                                title="Copy User ID"
                              >
                                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-[9px] text-slate-500 sm:px-6 sm:py-4 sm:text-xs">
                            {u.phone || (
                              <span className="text-slate-300">
                                None
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.purchasedExams &&
                              u.purchasedExams.length > 0 ? (
                                u.purchasedExams.map((ex) => (
                                  <span
                                    key={ex}
                                    className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[8px] uppercase text-emerald-700"
                                  >
                                    {ex}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[9px] text-slate-400">
                                  No bundles purchased
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-right sm:px-6 sm:py-4">
                            <button
                              onClick={() =>
                                setSendModalUser(u)
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] text-indigo-600 hover:bg-indigo-50 sm:px-3 sm:text-xs sm:font-medium"
                            >
                              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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

      {/* =======================================================
          NOTIFICATION LOGS
      ======================================================= */}
      {activeTab === "notifs" && (
        <div className="space-y-5 sm:space-y-6">

          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-5">
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-slate-900 sm:text-lg sm:font-semibold">
                Notification Logs
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-xs">
                History of all alerts sent to users
              </p>
            </div>

            <div className="text-[9px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">
              System Broadcast Log
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            {notifsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20">
                <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
                <span className="text-[10px] text-slate-500 sm:text-sm">
                  Fetching logs...
                </span>
              </div>
            ) : notificationsLog.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                No notifications recorded in logs
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400 sm:text-[10px]">
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Recipient
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Message Title & Details
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Type
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Status
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4">
                        Sent At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {notificationsLog.map((notif) => (
                      <tr
                        key={notif._id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          {notif.userId ? (
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-slate-950 sm:text-sm sm:font-semibold">
                                {notif.userId.name}
                              </p>

                              <p className="text-[9px] text-slate-400 sm:text-xs">
                                {notif.userId.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              User deleted
                            </span>
                          )}
                        </td>

                        <td className="max-w-sm px-3 py-3 sm:px-6 sm:py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium leading-tight text-slate-900 sm:text-sm sm:font-semibold">
                              {notif.title}
                            </p>

                            <p className="text-[9px] leading-4 text-slate-500 sm:text-xs">
                              {notif.message}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wide sm:px-2 sm:text-[10px] ${
                              notif.type === "purchase"
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : notif.type === "agent"
                                ? "border border-purple-100 bg-purple-50 text-purple-700"
                                : notif.type === "support"
                                ? "border border-amber-100 bg-amber-50 text-amber-700"
                                : "border border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {notif.type}
                          </span>
                        </td>

                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] sm:text-xs ${
                              notif.isRead
                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                : "border-indigo-100 bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                notif.isRead
                                  ? "bg-slate-400"
                                  : "animate-pulse bg-indigo-500"
                              }`}
                            />

                            {notif.isRead
                              ? "READ"
                              : "UNREAD"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-[9px] text-slate-500 sm:px-6 sm:py-4 sm:text-xs">
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

    {/* =========================================================
        SEND NOTIFICATION MODAL
    ========================================================= */}
    <AnimatePresence>
      {sendModalUser && (
        <div
          onClick={() => setSendModalUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 sm:text-lg sm:font-semibold">
                  <MessageSquare className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                  Send Notification
                </h3>

                <p className="mt-0.5 text-[9px] text-slate-500 sm:text-xs">
                  Deliver a message to this user's inbox
                </p>
              </div>

              <button
                onClick={() => setSendModalUser(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage}>
              <div className="space-y-4 p-4 sm:p-6">

                <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                  <span className="text-[8px] uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    Recipient Profile
                  </span>

                  <p className="text-sm text-slate-900 sm:text-base sm:font-semibold">
                    {sendModalUser.name}
                  </p>

                  <p className="break-all text-[10px] text-slate-500 sm:text-xs">
                    {sendModalUser.email}
                  </p>

                  <div className="mt-2 break-all font-mono text-[9px] text-slate-400 sm:text-[10px]">
                    Unique ID:{" "}
                    <span className="select-all text-slate-700">
                      {sendModalUser._id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 sm:text-xs sm:tracking-wider">
                    Notification Title
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Purchase Successful!"
                    value={messageTitle}
                    onChange={(e) =>
                      setMessageTitle(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 sm:text-xs sm:tracking-wider">
                    Notification Category
                  </label>

                  <select
                    value={messageType}
                    onChange={(e) =>
                      setMessageType(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                  >
                    <option value="general">
                      General Alert
                    </option>
                    <option value="purchase">
                      Purchase Log
                    </option>
                    <option value="support">
                      Support Response
                    </option>
                    <option value="agent">
                      Agent Recommendation
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 sm:text-xs sm:tracking-wider">
                    Message Details
                  </label>

                  <textarea
                    required
                    rows="4"
                    placeholder="Write your message..."
                    value={messageBody}
                    onChange={(e) =>
                      setMessageBody(e.target.value)
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() =>
                    setSendModalUser(null)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] text-slate-700 hover:bg-slate-100 sm:px-4 sm:text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 sm:px-4 sm:text-xs"
                >
                  {sendingMessage ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
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

    {/* =========================================================
        TRANSACTION DIAGNOSTIC MODAL
    ========================================================= */}
    <AnimatePresence>
      {selectedTxn && (
        <div
          onClick={() => setSelectedTxn(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-slate-900 sm:text-lg sm:font-semibold">
                  Transaction Diagnostic Panel
                </h3>

                <p className="mt-0.5 text-[9px] text-slate-500 sm:text-xs">
                  Detailed logs and gateway responses
                </p>
              </div>

              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[68vh] space-y-4 overflow-y-auto p-3 text-[10px] sm:p-5 sm:text-xs">

              {/* Meta */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 sm:gap-3 sm:p-3">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[8px] ${
                      selectedTxn.status === "SUCCESS"
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : selectedTxn.status === "FAILED"
                        ? "border-rose-100 bg-rose-50 text-rose-700"
                        : "border-amber-100 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedTxn.status}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 text-xs text-slate-900 sm:text-sm sm:font-medium">
                    ₹{selectedTxn.amount || 0}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                    Created At
                  </p>

                  <p className="mt-1 break-words text-[9px] text-slate-700 sm:text-[10px]">
                    {formatDate(selectedTxn.createdAt)}
                  </p>
                </div>
              </div>

              {/* IDs + Buyer */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                <div className="space-y-1.5">
                  <h4 className="text-[9px] uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    Identifiers
                  </h4>

                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 font-mono text-[9px] sm:text-[11px]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="shrink-0 text-slate-400">
                        Order:
                      </span>

                      <span
                        className="select-all break-all text-right text-slate-700"
                        title={selectedTxn.orderId}
                      >
                        {selectedTxn.orderId || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="shrink-0 text-slate-400">
                        Payment:
                      </span>

                      <span
                        className="select-all break-all text-right text-slate-700"
                        title={selectedTxn.paymentId}
                      >
                        {selectedTxn.paymentId || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="shrink-0 text-slate-400">
                        Mock ID:
                      </span>

                      <span className="break-all text-right text-indigo-700">
                        {selectedTxn.mockId || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTxn.userId && (
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] uppercase tracking-wide text-slate-400 sm:text-[10px]">
                      Buyer Profile
                    </h4>

                    <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[9px] text-slate-700 sm:text-[11px]">
                      <div className="flex items-start justify-between gap-2">
                        <span className="shrink-0 text-slate-400">
                          Name:
                        </span>

                        <span className="break-words text-right text-slate-900">
                          {selectedTxn.userId.name}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <span className="shrink-0 text-slate-400">
                          Email:
                        </span>

                        <span className="break-all text-right text-slate-700">
                          {selectedTxn.userId.email}
                        </span>
                      </div>

                      {selectedTxn.userId.phone && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="shrink-0 text-slate-400">
                            Phone:
                          </span>

                          <span className="text-right text-slate-700">
                            {selectedTxn.userId.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Failure Details */}
              {selectedTxn.status === "FAILED" && (
                <div className="space-y-1.5">

                  <h4 className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-rose-500 sm:text-[10px]">
                    <AlertCircle className="h-3 w-3" />
                    Failure Diagnostic Details
                  </h4>

                  <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3 text-[9px] text-rose-800 sm:text-[11px]">

                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <span className="block text-[8px] uppercase tracking-wide text-rose-400">
                          Error Code
                        </span>

                        <p className="break-all font-mono text-rose-900">
                          {selectedTxn.failureDetails?.code ||
                            "GENERIC_FAILURE"}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <span className="block text-[8px] uppercase tracking-wide text-rose-400">
                          Failed Step / Source
                        </span>

                        <p className="break-words text-rose-900">
                          {selectedTxn.failureDetails?.step ||
                            "unknown"}{" "}
                          (
                          {selectedTxn.failureDetails?.source ||
                            "unknown"}
                          )
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] uppercase tracking-wide text-rose-400">
                        Gateway Description
                      </span>

                      <p className="leading-relaxed text-rose-900">
                        {selectedTxn.failureDetails?.description ||
                          "No failure description provided."}
                      </p>
                    </div>

                    {selectedTxn.failureDetails?.reason && (
                      <div className="border-t border-rose-200/30 pt-1.5">
                        <span className="block text-[8px] uppercase tracking-wide text-rose-400">
                          AI Recovery Context
                        </span>

                        <p className="mt-0.5 leading-relaxed text-rose-900">
                          "{selectedTxn.failureDetails.reason}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-3 sm:px-6 sm:py-4">
              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-white shadow-sm transition hover:bg-slate-800 sm:px-4 sm:text-xs"
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
