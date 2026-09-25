import { API_BASE } from "../api/apiBase.js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import { fetchTransactions } from "../api/payment";
import { fetchUsers } from "../api/auth.api";
import { sendNotification, fetchAllNotifications } from "../api/notification";
import { fetchRecoveryMetrics, fetchRecoveryAuditLogs, postCopilotQuery } from "../api/paymentRecovery";
import "reactflow/dist/style.css";
import AdminTransactionsTab from "./admin/components/AdminTransactionsTab.jsx";
import AdminRecoveryTab from "./admin/components/AdminRecoveryTab.jsx";
import AdminUsersTab from "./admin/components/AdminUsersTab.jsx";
import AdminNotificationLogsTab from "./admin/components/AdminNotificationLogsTab.jsx";
import SendNotificationModal from "./admin/components/SendNotificationModal.jsx";
import TransactionDiagnosticModal from "./admin/components/TransactionDiagnosticModal.jsx";
import { Shield, ArrowLeft, RefreshCw } from "lucide-react";
import Loader from "../components/Loader";

const cleanAuditMessage = (text) => {
  if (!text) return "";
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "");
  const markers = [
    "word count",
    "wordcheck",
    "self-correction",
    "verification during",
    "output matches",
    "constraints met",
    "✅",
    "proceed. output",
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
  if (cleaned.startsWith('"') && cleaned.endsWith('"'))
    cleaned = cleaned.slice(1, -1);
  if (cleaned.startsWith("'") && cleaned.endsWith("'"))
    cleaned = cleaned.slice(1, -1);
  return cleaned.trim();
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
      content:
        "Hello! I am the **Merchant AI Copilot**. I have access to your live database records, sales trends, customer activity, and recovery metrics. Ask me anything about your business performance!",
    },
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
      if (isSilent !== "background")
        toast.error("Failed to fetch payment transaction logs");
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
      if (isSilent !== "background")
        toast.error("Failed to fetch registered users list");
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
      if (isSilent !== "background")
        toast.error("Failed to fetch notification logs");
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
      if (isSilent !== "background")
        toast.error("Failed to load recovery dashboard information");
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
    setCopilotHistory((prev) => [...prev, userMessage]);
    if (!customQuery) setCopilotQuery("");
    setCopilotLoading(true);

    try {
      const formattedHistory = copilotHistory.map((h) => ({
        role:
          h.role === "model"
            ? "assistant"
            : h.role === "assistant"
              ? "assistant"
              : "user",
        content: h.content,
      }));

      const res = await postCopilotQuery({
        query: queryToSend,
        history: formattedHistory,
      });

      if (res?.data?.success) {
        setCopilotHistory((prev) => [
          ...prev,
          { role: "model", content: res.data.response },
        ]);
      } else {
        toast.error("Copilot reasoning error");
        setCopilotHistory((prev) => [
          ...prev,
          {
            role: "model",
            content: "Error: Could not retrieve response from Copilot server.",
          },
        ]);
      }
    } catch (err) {
      console.error("Copilot chat query failed:", err);
      setCopilotHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: "Error: Network request failed while connecting to Copilot.",
        },
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
        type: messageType,
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
    } else if (
      activeTab === "recovery" &&
      (!recoveryLogs || recoveryLogs.length === 0)
    ) {
      loadRecoveryData();
    }
  }, [user, navigate, activeTab]);

  // Real-time socket listener for database updates
  useEffect(() => {
    const socketUrl = API_BASE;
    const socket = io(socketUrl, {
      withCredentials: true,
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
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
      },
    );
    // Stagger charts
    gsap.fromTo(
      ".chart-card-gsap",
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.15,
      },
    );
  }, [activeTab]);

  const getChartData = () => {
    const dataMap = {};
    transactions.forEach((txn) => {
      const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit",
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

  const totalRevenue = successfulTxns.reduce(
    (acc, t) => acc + (t.amount || 0),
    0,
  );
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
        .filter((log) => log.transactionId)
        .map((log) => {
          const tid = log.transactionId._id || log.transactionId;
          const mockId = log.transactionId.mockId || "unknown";
          const userName = log.userId?.name || "Customer";
          return [
            tid,
            {
              id: tid,
              mockId,
              userName,
            },
          ];
        }),
    ).values(),
  );

  const dashboard = {
    user,
    navigate,
    activeTab,
    transactions,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedTxn,
    setSelectedTxn,
    users,
    usersLoading,
    userSearchQuery,
    setUserSearchQuery,
    sendModalUser,
    setSendModalUser,
    messageTitle,
    setMessageTitle,
    messageBody,
    setMessageBody,
    messageType,
    setMessageType,
    sendingMessage,
    setSendingMessage,
    notificationsLog,
    notifsLoading,
    recoveryMetrics,
    recoveryLogs,
    metricsLoading,
    logsLoading,
    logViewMode,
    setLogViewMode,
    selectedGraphTxn,
    setSelectedGraphTxn,
    copilotHistory,
    copilotQuery,
    setCopilotQuery,
    copilotLoading,
    isCopilotOpen,
    setIsCopilotOpen,
    loadTransactions,
    loadUsers,
    loadNotifications,
    loadRecoveryData,
    handleCopilotSend,
    handleSendMessage,
    getChartData,
    getMockPerformanceData,
    successfulTxns,
    failedTxns,
    pendingTxns,
    totalRevenue,
    successRate,
    filteredTransactions,
    formatDate,
    uniqueRecoveryTxns,
    cleanAuditMessage,
  };

  if (loading && activeTab === "transactions") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* =========================================================
        HEADER
    ========================================================= */}
      <header className="mockx-site-header sticky top-0 z-30">
        <div className="mockx-site-header__inner mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
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
          

                <h3 className="truncate text-xs font-medium tracking-tight text-slate-900 sm:text-base sm:font-semibold">
                  MockX Admin Panel
                </h3>
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

              <span className="hidden sm:inline">Institute Directory</span>

              <span className="sm:hidden">Institutes</span>
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
        <AdminTransactionsTab
          active={activeTab === "transactions"}
          dashboard={dashboard}
        />

        {/* =======================================================
          RECOVERY TAB
      ======================================================= */}
        <AdminRecoveryTab
          active={activeTab === "recovery"}
          dashboard={dashboard}
        />

        {/* =======================================================
          USERS TAB
      ======================================================= */}
        <AdminUsersTab active={activeTab === "users"} dashboard={dashboard} />

        {/* =======================================================
          NOTIFICATION LOGS
      ======================================================= */}
        <AdminNotificationLogsTab
          active={activeTab === "notifs"}
          dashboard={dashboard}
        />
      </div>

      <SendNotificationModal dashboard={dashboard} />

      <TransactionDiagnosticModal dashboard={dashboard} />
    </div>
  );
};

export default AdminDashboard;
