import React from "react";
import { AlertCircle, RefreshCw, TrendingUp, DollarSign, Sparkles, Zap } from "lucide-react";
import AIResponseRenderer from "./AIResponseRenderer.jsx";
import RecoveryGraph from "./RecoveryGraph.jsx";
import AdminCopilotPanel from "./AdminCopilotPanel.jsx";

export default function AdminRecoveryTab({ active, dashboard }) {
  const { recoveryMetrics, recoveryLogs, metricsLoading, logsLoading, logViewMode, setLogViewMode, selectedGraphTxn, setSelectedGraphTxn, copilotHistory, copilotQuery, setCopilotQuery, copilotLoading, isCopilotOpen, setIsCopilotOpen, handleCopilotSend, formatDate, uniqueRecoveryTxns, cleanAuditMessage } = dashboard;
  if (!active) return null;

  return (
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
                      cleanAuditMessage={cleanAuditMessage}
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

          <AdminCopilotPanel
            history={copilotHistory}
            loading={copilotLoading}
            query={copilotQuery}
            setQuery={setCopilotQuery}
            onSend={handleCopilotSend}
            isOpen={isCopilotOpen}
            setIsOpen={setIsCopilotOpen}
          />
        </div>
  );
}
