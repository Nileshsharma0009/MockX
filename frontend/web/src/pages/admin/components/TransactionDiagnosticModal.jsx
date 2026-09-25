import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

export default function TransactionDiagnosticModal({ dashboard }) {
  const { selectedTxn, setSelectedTxn, formatDate } = dashboard;
  return (
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
                        <span className="shrink-0 text-slate-400">Order:</span>

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
                          <span className="shrink-0 text-slate-400">Name:</span>

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
                            {selectedTxn.failureDetails?.step || "unknown"} (
                            {selectedTxn.failureDetails?.source || "unknown"})
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
  );
}
