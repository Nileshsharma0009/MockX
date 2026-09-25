import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, RefreshCw, Send, Sparkles, X } from "lucide-react";
import AIResponseRenderer from "./AIResponseRenderer.jsx";

const QUICK_PROMPTS = [
  "What is our revenue recovery rate?",
  "Show payment failure trends",
  "Which product is most popular?",
  "What are our peak purchase times?",
];

export default function AdminCopilotPanel({
  history,
  loading,
  query,
  setQuery,
  onSend,
  isOpen,
  setIsOpen,
}) {
  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="admin-copilot-trigger"
          aria-label="Open AI Copilot"
        >
          <Sparkles size={17} aria-hidden="true" />
          <span>Ask AI Copilot</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="admin-copilot-panel"
            aria-label="Merchant AI Copilot"
          >
            <header className="admin-copilot-header">
              <span className="admin-copilot-avatar" aria-hidden="true"></span>
              <div className="admin-copilot-title">
                <h5> AI Copilot</h5>
                {/* <p>Ask about revenue, payments, or recovery</p> */}
              </div>
              <span className="admin-copilot-badge">Razor-AI</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="admin-copilot-close"
                aria-label="Close AI Copilot"
              >
                <X size={18} />
              </button>
            </header>

            <div className="admin-copilot-messages" role="log" aria-live="polite" aria-relevant="additions text">
              {history.map((message, index) => (
                <motion.div
                  key={`${index}-${message.role}`}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`admin-copilot-message-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
                >
                  <div className="admin-copilot-message">
                    {message.role === "user" ? (
                      <p>{message.content}</p>
                    ) : (
                      <AIResponseRenderer content={message.content} />
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="admin-copilot-message-row is-assistant">
                  <div className="admin-copilot-loading">
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Checking the available data…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-copilot-prompts" aria-label="Suggested questions">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={(event) => onSend(event, prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="admin-copilot-form" onSubmit={onSend}>
              <label className="sr-only" htmlFor="admin-copilot-query">Message the AI Copilot</label>
              <input
                id="admin-copilot-query"
                type="text"
                placeholder="Ask about your payment data…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !query.trim()} aria-label="Send message">
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
