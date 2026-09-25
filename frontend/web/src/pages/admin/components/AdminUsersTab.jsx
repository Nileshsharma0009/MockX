import React from "react";
import { Search, RefreshCw, X, Send, Users, Copy } from "lucide-react";

export default function AdminUsersTab({ active, dashboard }) {
  const { users, usersLoading, userSearchQuery, setUserSearchQuery, setSendModalUser } = dashboard;
  if (!active) return null;

  return (
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
  );
}
