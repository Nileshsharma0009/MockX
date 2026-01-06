import React, { useRef, useEffect } from "react";

const AIChatPanel = ({ isOpenDesktop = true, messages, input, setInput, onSend }) => {
  const textareaRef = useRef(null);

  // Auto-grow textarea when input changes
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 120); // cap at ~3–4 lines
    el.style.height = next + "px";
  }, [input]);

  return (
    <div
      className={`flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100 ${
        isOpenDesktop ? "max-h-[560px] h-[560px]" : "max-h-[75vh] h-full"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-slate-900 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              AI Performance Chat
            </p>
            <p className="text-xs text-slate-500">Chat with your personal mock coach.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 px-4 py-3 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "bg-slate-900 text-slate-50 rounded-br-sm"
                    : "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-sm"
                }`}
              >
                {m.content}
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
      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about weak topics, time management, or next mock strategy..."
                className="w-full max-h-[120px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-slate-900 text-slate-50 text-xs font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            ⬆
          </button>
        </form>
        <p className="mt-1 text-[10px] text-slate-400">
          AI suggestions are tailored to this mock’s performance.
        </p>
      </div>
    </div>
  );
};

export default AIChatPanel;
