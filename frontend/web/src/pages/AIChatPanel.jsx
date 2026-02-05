import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import AnalysisMessage from "./AnalysisMessage";

const AIChatPanel = ({
  isOpenDesktop = true,
  messages,
  input,
  setInput,
  onSend,
  onFocus,
  onBlur,
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  return (
    <div
      className={`flex flex-col bg-white ${isOpenDesktop ? "rounded-3xl border shadow-sm h-[560px]" : "flex-1 h-full"
        }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b flex gap-3 items-center">
        <div className="h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center">
          🤖
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            MockX Assistant
          </p>
          <p className="text-xs text-slate-500">
            Performance analysis & guidance
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isUser
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border text-slate-800"
                  }`}
              >
                {/* 🔥 FIX HERE */}
                {isUser ? (
                  m.content
                ) : (
                  <AnalysisMessage data={m.content} />
                )}

                <div className="mt-1 text-[10px] text-slate-400 text-right">
                  {new Date(m.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 bg-white" style={{ flexShrink: 0 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex gap-2 items-end"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask about weak areas or next plan..."
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs min-h-[44px] max-h-[120px] h-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPanel;
