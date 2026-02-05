import React, { useRef, useEffect } from "react";
import AnalysisMessage from "./AnalysisMessage";

const AIChatPanel = ({
  isOpenDesktop = true,
  messages,
  input,
  setInput,
  onSend,
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
      className={`flex flex-col bg-white rounded-3xl border shadow-sm ${isOpenDesktop ? "h-[560px]" : "h-full max-h-[75vh]"
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
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
      <div className="border-t px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about weak areas or next plan..."
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs"
          />
          <button className="h-9 w-9 rounded-xl bg-slate-900 text-white">
            ⬆
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPanel;
