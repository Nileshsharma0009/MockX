import React from "react";
import { RefreshCw } from "lucide-react";

export default function AdminNotificationLogsTab({ active, dashboard }) {
  const { notificationsLog, notifsLoading, formatDate } = dashboard;
  if (!active) return null;

  return (
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
  );
}
