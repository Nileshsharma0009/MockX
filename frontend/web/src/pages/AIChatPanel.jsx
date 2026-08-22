import React from "react";
import { Bot } from "lucide-react";

const getWeakestSubject = (subjectStats = {}, subjectsMap = {}) => {
  const entries = Object.entries(subjectStats).filter(
    ([, stats]) => (stats?.attempted || 0) > 0
  );

  if (!entries.length) return null;

  const [key, stats] = entries.sort((a, b) => {
    const aAccuracy = a[1].attempted
      ? Math.round((a[1].correct / a[1].attempted) * 100)
      : 0;
    const bAccuracy = b[1].attempted
      ? Math.round((b[1].correct / b[1].attempted) * 100)
      : 0;

    return aAccuracy - bAccuracy;
  })[0];

  const accuracy = stats.attempted
    ? Math.round((stats.correct / stats.attempted) * 100)
    : 0;

  return {
    name: subjectsMap[key]?.name || key.toUpperCase(),
    accuracy,
    attempted: stats.attempted || 0,
    correct: stats.correct || 0,
  };
};

const AIChatPanel = ({ isOpenDesktop = true, selected, subjectsMap = {} }) => {
  const weakestSubject = getWeakestSubject(selected?.subjectStats, subjectsMap);

  const summaryRows = [
    {
      label: "Mock",
      value: selected?.mockId || "Not available",
    },
    {
      label: "Score",
      value:
        selected?.score != null && selected?.total != null
          ? `${selected.score}/${selected.total}`
          : "Not available",
    },
    {
      label: "Weakest subject",
      value: weakestSubject
        ? `${weakestSubject.name} (${weakestSubject.accuracy}%)`
        : "Not available",
    },
  ];

  return (
    <div
      className={`flex flex-col bg-white ${
        isOpenDesktop ? "rounded-3xl border shadow-sm h-[560px]" : "flex-1 h-full"
      }`}
    >
      <div className="px-5 py-4 border-b flex gap-3 items-center">
        <div className="h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Performance Summary
          </p>
          <p className="text-xs text-slate-500">
            RAG bot logic has been removed from this panel
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="rounded-2xl border bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Current result snapshot
          </p>
          <div className="mt-3 space-y-2">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-slate-500">{row.label}</span>
                <span className="font-medium text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            What is still shown
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Your mock selection and subject cards</li>
            <li>The current score and weakest visible subject</li>
            <li>The mobile and desktop sidebar layout</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          AI chat, local analysis responses, and RAG-style assistant logic are no
          longer active here.
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
