import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, RefreshCw, Send } from "lucide-react";

export default function SendNotificationModal({ dashboard }) {
  const { sendModalUser, setSendModalUser, messageTitle, setMessageTitle, messageBody, setMessageBody, messageType, setMessageType, sendingMessage, handleSendMessage } = dashboard;
  return (
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
                      onChange={(e) => setMessageTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 sm:text-xs sm:tracking-wider">
                      Notification Category
                    </label>

                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                    >
                      <option value="general">General Alert</option>
                      <option value="purchase">Purchase Log</option>
                      <option value="support">Support Response</option>
                      <option value="agent">Agent Recommendation</option>
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
                      onChange={(e) => setMessageBody(e.target.value)}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
                  <button
                    type="button"
                    onClick={() => setSendModalUser(null)}
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
  );
}
