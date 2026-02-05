/* ======================================================
   MockX Analysis Engine (Improved, Safe, Structured)
   ====================================================== */

const INTENTS = {
    WEAKNESS: ["weak", "weakness", "low", "problem", "bad", "poor"],
    PLAN: ["plan", "prepare", "strategy", "schedule", "study"],
    SUMMARY: ["summary", "analysis", "overall", "performance"],
    SCORE: ["score", "marks", "result"],
    HELP: ["help", "what can you do", "options"],
};

/* -------- HELPERS -------- */

const safeNumber = (val, fallback = 0) => {
    if (typeof val !== "number" || Number.isNaN(val)) return fallback;
    return val;
};

const accuracyStatus = (acc) => {
    if (acc >= 85) return { label: "Excellent", tone: "success" };
    if (acc >= 60) return { label: "Average", tone: "warning" };
    return { label: "Needs Improvement", tone: "danger" };
};

const scoreStatus = (score) => {
    if (score < 0) return { label: "Negative Score", tone: "danger" };
    if (score < 50) return { label: "Needs Improvement", tone: "warning" };
    return { label: "Good Score", tone: "success" };
};

/* -------- NEW HELPERS (SENIOR MENTOR) -------- */

const seriousnessLevel = (score, accuracy) => {
    if (accuracy < 50) return { label: "🚨 CRITICAL", tone: "danger", message: "Your accuracy is dangerously low. Stop taking mocks. Go back to textbooks." };
    if (accuracy < 75) return { label: "⚠️ WARNING", tone: "warning", message: "You are wasting attempts. Guesswork is killing your score." };
    return { label: "✅ ON TRACK", tone: "success", message: "Good stability. Now push for speed." };
};

const prepGuidance = (weakest, strongest) => {
    return {
        do: `Fix ${weakest.name} concepts immediately. 1 hour daily.`,
        dont: `Ignore ${weakest.name} hoping it will vanish. It won't.`
    };
};

/* -------- INTENT DETECTOR -------- */

const detectIntent = (text = "") => {
    const q = text.toLowerCase();
    for (const [intent, keys] of Object.entries(INTENTS)) {
        if (keys.some((k) => q.includes(k))) return intent;
    }
    return "UNKNOWN";
};

/* -------- SUBJECT STATS -------- */

const buildSubjectStats = (subjectStats = {}, subjectsMap = {}) => {
    return Object.entries(subjectStats)
        .map(([key, val]) => {
            const attempted = safeNumber(val.attempted);
            const correct = safeNumber(val.correct);
            const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

            return {
                key,
                name: subjectsMap[key]?.name || key.toUpperCase(),
                attempted,
                correct,
                accuracy,
            };
        })
        .filter((s) => s.attempted >= 0)
        .sort((a, b) => a.accuracy - b.accuracy);
};

/* -------- FALLBACKS -------- */

const noDataResponse = () => ({
    title: "No Analysis Available",
    points: ["Attempt a mock test to unlock insights"],
});

const unknownQueryResponse = () => ({
    title: "I analyze mock test performance",
    points: [
        "Weak area identification",
        "Preparation planning",
        "Score & accuracy summary",
    ],
    hint: "Try: show weak areas",
});

/* -------- MAIN ENGINE -------- */

export const analyzeQuery = ({ query, result, subjectsMap }) => {
    if (!result || !result.subjectStats) {
        return noDataResponse();
    }

    const intent = detectIntent(query);
    const stats = buildSubjectStats(result.subjectStats, subjectsMap);

    if (!stats.length) {
        return {
            title: "No Attempted Questions",
            points: ["Attempt questions to receive analysis"],
        };
    }

    const weakest = stats[0];
    const strongest = stats[stats.length - 1];

    const score = safeNumber(result.score);
    const accuracy = safeNumber(result.accuracy);
    const attempts = safeNumber(result.attempted);

    const scoreMeta = scoreStatus(score);
    const accMeta = accuracyStatus(accuracy);

    switch (intent) {
        case "SUMMARY": {
            const seniorView = seriousnessLevel(score, accuracy);
            const guidance = prepGuidance(weakest, strongest);

            return {
                title: "Senior Mentor Review",
                blocks: [
                    {
                        label: "Overall Status",
                        value: seniorView.label,
                        tone: seniorView.tone,
                    },
                    {
                        label: "Score",
                        value: score,
                        meta: scoreMeta.label,
                        tone: scoreMeta.tone,
                    },
                    {
                        label: "Accuracy",
                        value: `${Math.round(accuracy)}%`,
                        meta: accMeta.label,
                        tone: accMeta.tone,
                    },
                    {
                        label: "Attempts",
                        value: attempts,
                        tone: "neutral",
                    },
                ],
                sections: [
                    {
                        heading: "Subject Diagnosis",
                        items: [
                            {
                                label: "Critical Weakness",
                                value: `${weakest.name} (${Math.round(weakest.accuracy)}%)`,
                                tone: "danger",
                            },
                            {
                                label: "Reliable Strength",
                                value: `${strongest.name} (${Math.round(strongest.accuracy)}%)`,
                                tone: "success",
                            },
                        ],
                    },
                ],
                advice: seniorView.message,
                action:
                    accuracy < 60
                        ? `Do NOT attempt the next mock until ${weakest.name} basics are revised.`
                        : `Proceed with next mock after revising mistakes from ${weakest.name}.`,
                mentorNotes: {
                    do: guidance.do,
                    dont: guidance.dont,
                },
            };
        }

        case "WEAKNESS":
            return {
                title: "Critical Weak Area",
                blocks: [
                    {
                        label: weakest.name,
                        value: `${Math.round(weakest.accuracy)}% accuracy`,
                        tone: "danger",
                    },
                ],
                action: `Revise 5 key concepts from ${weakest.name} today.`,
            };

        case "PLAN":
            return {
                title: "14-Day Improvement Plan",
                points: [
                    `Days 1–5: Concept repair in ${weakest.name}`,
                    "Days 6–10: Sectional tests + error log",
                    "Days 11–14: Full mock with strict accuracy focus",
                ],
            };

        case "SCORE":
            return {
                title: "Score Breakdown",
                blocks: [
                    {
                        label: "Score",
                        value: score,
                        meta: scoreMeta.label,
                        tone: scoreMeta.tone,
                    },
                    {
                        label: "Accuracy",
                        value: `${Math.round(accuracy)}%`,
                        meta: accMeta.label,
                        tone: accMeta.tone,
                    },
                ],
            };

        default:
            return unknownQueryResponse();
    }
};
