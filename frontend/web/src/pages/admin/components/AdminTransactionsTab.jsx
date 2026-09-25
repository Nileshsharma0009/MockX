import React from "react";
import { Search, Filter, CheckCircle2, XCircle, AlertCircle, ChevronRight, TrendingUp, X, Mail, Phone, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function AdminTransactionsTab({ active, dashboard }) {
  const { transactions, searchQuery, setSearchQuery, statusFilter, setStatusFilter, setSelectedTxn, getChartData, getMockPerformanceData, successfulTxns, failedTxns, pendingTxns, totalRevenue, successRate, filteredTransactions, formatDate } = dashboard;
  if (!active) return null;

  return (
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
  );
}
