import React from "react";
import { Rocket, CheckCircle2, XCircle } from "lucide-react";

/**
 * Helper to parse bold markdown (e.g. **text**) into JSX
 */
const parseBold = (text) => {
    if (typeof text !== "string") return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
};

const AnalysisMessage = ({ data }) => {
    // 1. Handle RAW STRING (Legacy/Fallback)
    if (typeof data === "string") {
        return (
            <div className="space-y-2">
                {data.split("\n").map((line, i) => (
                    <p key={i} className="min-h-[1em]">
                        {parseBold(line)}
                    </p>
                ))}
            </div>
        );
    }

    // 2. Handle STRUCTURED DATA (New Engine)
    if (!data || typeof data !== "object") return null;

    const { title, blocks, points, sections, hint, advice, action } = data;

    return (
        <div className="space-y-4 w-full">
            {/* Title */}
            {title && (
                <h3 className="font-semibold text-slate-900 text-sm border-b pb-2 mb-2">
                    {title}
                </h3>
            )}

            {/* Stats Blocks (Score, Accuracy, etc.) */}
            {blocks && (
                <div className="flex flex-wrap gap-2">
                    {blocks.map((b, i) => (
                        <div
                            key={i}
                            className={`flex-1 min-w-[100px] p-2 rounded-xl border ${b.tone === "danger"
                                ? "bg-red-50 border-red-100 text-red-700"
                                : b.tone === "success"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                    : b.tone === "warning"
                                        ? "bg-amber-50 border-amber-100 text-amber-700"
                                        : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                        >
                            <div className="text-[10px] uppercase tracking-wider opacity-70">
                                {b.label}
                            </div>
                            <div className="font-bold text-lg">{b.value}</div>
                            {b.meta && <div className="text-[10px] font-medium">{b.meta}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Bullet Points */}
            {points && (
                <ul className="space-y-2">
                    {points.map((p, i) => (
                        <li key={i} className="flex gap-2 items-start text-slate-700">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span className="flex-1">{parseBold(p)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Sections (e.g. Subject Diagnosis with internal items) */}
            {sections &&
                sections.map((sec, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border">
                        {sec.heading && (
                            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                {sec.heading}
                            </div>
                        )}
                        <div className="space-y-2">
                            {sec.items.map((item, j) => (
                                <div key={j} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">{item.label}</span>
                                    <span
                                        className={`font-medium ${item.tone === "danger"
                                            ? "text-red-600"
                                            : item.tone === "success"
                                                ? "text-emerald-600"
                                                : "text-slate-900"
                                            }`}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            {/* Advice / Actionable Insight */}
            {(advice || action) && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">
                    {advice && <p className="text-indigo-800 mb-2">{advice}</p>}
                    {action && (
                        <div className="flex gap-2 items-start font-medium text-indigo-900">
                            <Rocket className="w-5 h-5 flex-shrink-0 text-indigo-600" />
                            <span>{parseBold(action)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Mentor Notes (Senior Mentor) */}
            {data.mentorNotes && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs">
                        <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> DO
                        </div>
                        <p className="text-emerald-900">{parseBold(data.mentorNotes.do)}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs">
                        <div className="font-bold text-red-800 mb-1 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> DON'T
                        </div>
                        <p className="text-red-900">{parseBold(data.mentorNotes.dont)}</p>
                    </div>
                </div>
            )}

            {/* Hint */}
            {hint && (
                <p className="text-[10px] text-slate-400 italic text-center mt-2">
                    {hint}
                </p>
            )}
        </div>
    );
};

export default AnalysisMessage;
