// /* ======================================================
//    MockX Analysis Engine (Improved, Safe, Structured)
//    ====================================================== */

// const INTENTS = {
//     WEAKNESS: ["weak", "weakness", "low", "problem", "bad", "poor"],
//     PLAN: ["plan", "prepare", "strategy", "schedule", "study"],
//     SUMMARY: ["summary", "analysis", "overall", "performance"],
//     SCORE: ["score", "marks", "result"],
//     HELP: ["help", "what can you do", "options"],
// };

// /* -------- HELPERS -------- */

// const safeNumber = (val, fallback = 0) => {
//     if (typeof val !== "number" || Number.isNaN(val)) return fallback;
//     return Math.max(0, val); // Ensure non-negative
// };

// const accuracyStatus = (acc) => {
//     if (acc >= 85) return { label: "Excellent", tone: "success" };
//     if (acc >= 60) return { label: "Average", tone: "warning" };
//     return { label: "Needs Improvement", tone: "danger" };
// };

// const scoreStatus = (score) => {
//     if (score < 0) return { label: "Negative Score", tone: "danger" };
//     if (score < 50) return { label: "Needs Improvement", tone: "warning" };
//     return { label: "Good Score", tone: "success" };
// };

// /* -------- NEW HELPERS (SENIOR MENTOR) -------- */

// const seriousnessLevel = (score, accuracy) => {
//     if (accuracy < 50) return { label: "🚨 CRITICAL", tone: "danger", message: "Your accuracy is dangerously low. Stop taking mocks. Go back to textbooks." };
//     if (accuracy < 75) return { label: "⚠️ WARNING", tone: "warning", message: "You are wasting attempts. Guesswork is killing your score." };
//     return { label: "✅ ON TRACK", tone: "success", message: "Good stability. Now push for speed." };
// };

// const prepGuidance = (weakest, strongest) => {
//     return {
//         do: `Fix ${weakest.name} concepts immediately. 1 hour daily.`,
//         dont: `Ignore ${weakest.name} hoping it will vanish. It won't.`
//     };
// };

// /* -------- INTENT DETECTOR -------- */

// const detectIntent = (text = "") => {
//     const q = text.toLowerCase();
//     for (const [intent, keys] of Object.entries(INTENTS)) {
//         if (keys.some((k) => q.includes(k))) return intent;
//     }
//     return "UNKNOWN";
// };

// /* -------- SUBJECT STATS -------- */

// const buildSubjectStats = (subjectStats = {}, subjectsMap = {}) => {
//     return Object.entries(subjectStats)
//         .map(([key, val]) => {
//             const attempted = safeNumber(val.attempted);
//             const correct = safeNumber(val.correct);
//             const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

//             return {
//                 key,
//                 name: subjectsMap[key]?.name || key.toUpperCase(),
//                 attempted,
//                 correct,
//                 accuracy,
//             };
//         })
//         .filter((s) => s.attempted >= 0)
//         .sort((a, b) => a.accuracy - b.accuracy);
// };

// /* -------- FALLBACKS -------- */

// const noDataResponse = () => ({
//     title: "No Analysis Available",
//     points: ["Attempt a mock test to unlock insights"],
// });

// const unknownQueryResponse = () => ({
//     title: "I analyze mock test performance",
//     points: [
//         "Weak area identification",
//         "Preparation planning",
//         "Score & accuracy summary",
//     ],
//     hint: "Try: show weak areas",
// });

// /* -------- MAIN ENGINE -------- */

// export const analyzeQuery = ({ query, result, subjectsMap }) => {
//     if (!result || !result.subjectStats) {
//         return noDataResponse();
//     }

//     const intent = detectIntent(query);
//     const stats = buildSubjectStats(result.subjectStats, subjectsMap);

//     if (!stats.length) {
//         return {
//             title: "No Attempted Questions",
//             points: ["Attempt questions to receive analysis"],
//         };
//     }

//     const weakest = stats[0];
//     const strongest = stats[stats.length - 1];

//     const score = safeNumber(result.score);
//     const accuracy = safeNumber(result.accuracy);
//     const attempts = safeNumber(result.attempted);

//     const scoreMeta = scoreStatus(score);
//     const accMeta = accuracyStatus(accuracy);

//     switch (intent) {
//         case "SUMMARY": {
//             const seniorView = seriousnessLevel(score, accuracy);
//             const guidance = prepGuidance(weakest, strongest);

//             return {
//                 title: "Senior Mentor Review",
//                 blocks: [
//                     {
//                         label: "Overall Status",
//                         value: seniorView.label,
//                         tone: seniorView.tone,
//                     },
//                     {
//                         label: "Score",
//                         value: score,
//                         meta: scoreMeta.label,
//                         tone: scoreMeta.tone,
//                     },
//                     {
//                         label: "Accuracy",
//                         value: `${Math.round(accuracy)}%`,
//                         meta: accMeta.label,
//                         tone: accMeta.tone,
//                     },
//                     {
//                         label: "Attempts",
//                         value: attempts,
//                         tone: "neutral",
//                     },
//                 ],
//                 sections: [
//                     {
//                         heading: "Subject Diagnosis",
//                         items: [
//                             {
//                                 label: "Critical Weakness",
//                                 value: `${weakest.name} (${Math.round(weakest.accuracy)}%)`,
//                                 tone: "danger",
//                             },
//                             {
//                                 label: "Reliable Strength",
//                                 value: `${strongest.name} (${Math.round(strongest.accuracy)}%)`,
//                                 tone: "success",
//                             },
//                         ],
//                     },
//                 ],
//                 advice: seniorView.message,
//                 action:
//                     accuracy < 60
//                         ? `Do NOT attempt the next mock until ${weakest.name} basics are revised.`
//                         : `Proceed with next mock after revising mistakes from ${weakest.name}.`,
//                 mentorNotes: {
//                     do: guidance.do,
//                     dont: guidance.dont,
//                 },
//             };
//         }

//         case "WEAKNESS":
//             return {
//                 title: "Critical Weak Area",
//                 blocks: [
//                     {
//                         label: weakest.name,
//                         value: `${Math.round(weakest.accuracy)}% accuracy`,
//                         tone: "danger",
//                     },
//                 ],
//                 action: `Revise 5 key concepts from ${weakest.name} today.`,
//             };

//         case "PLAN":
//             return {
//                 title: "14-Day Improvement Plan",
//                 points: [
//                     `Days 1–5: Concept repair in ${weakest.name}`,
//                     "Days 6–10: Sectional tests + error log",
//                     "Days 11–14: Full mock with strict accuracy focus",
//                 ],
//             };

//         case "SCORE":
//             return {
//                 title: "Score Breakdown",
//                 blocks: [
//                     {
//                         label: "Score",
//                         value: score,
//                         meta: scoreMeta.label,
//                         tone: scoreMeta.tone,
//                     },
//                     {
//                         label: "Accuracy",
//                         value: `${Math.round(accuracy)}%`,
//                         meta: accMeta.label,
//                         tone: accMeta.tone,
//                     },
//                 ],
//             };

//         case "HELP":
//             return {
//                 title: "How I Can Help",
//                 points: [
//                     "Ask for 'summary' to get an overall performance review.",
//                     "Ask for 'weak areas' to identify critical topics.",
//                     "Ask for a 'study plan' to get a schedule.",
//                     "Ask 'score' or 'marks' for quick stats."
//                 ],
//                 hint: "Try asking: 'What is my improved plan?'"
//             };

//         default:
//             return unknownQueryResponse();
//     }
// };

/* ======================================================
   MockX Analysis Engine (FINAL – Subject-wise, Scalable)
   ====================================================== */

/* ---------- INTENTS ---------- */

const INTENTS = {
    WEAKNESS: [
        "weak", "weakness", "low", "problem", "bad", "poor",
        "struggling", "difficulty", "confused", "not good",
        "can't understand", "getting wrong", "mistakes",
        "why am i bad", "where am i losing", "which subject is weak"
    ],

    PLAN: [
        "plan", "prepare", "preparation", "strategy", "schedule", "study",
        "how to study", "what should i do", "next steps",
        "how to improve", "how can i improve", "improvement",
        "what now", "what next", "guidance", "roadmap"
    ],

    SUMMARY: [
        "summary", "analysis", "overall", "performance",
        "how did i do", "how was my test", "review",
        "full analysis", "complete analysis", "overall review",
        "mentor review", "test review"
    ],

    SCORE: [
        "score", "marks", "result", "total",
        "how much i got", "my marks", "final score",
        "what is my score", "kitna score", "kitne marks"
    ],

    SUBJECT: [
        "subject", "section",
        "english", "eng",
        "math", "maths", "mathematics",
        "physics", "phy",
        "chemistry", "chem",
        "gk", "general knowledge",
        "aptitude", "apti", "reasoning"
    ],

    HELP: [
        "help", "what can you do", "what do you do",
        "options", "features", "how to use",
        "guide me", "assist", "support"
    ],

    MOTIVATION: [
        "demotivated", "lost", "feeling low", "depressed",
        "no improvement", "giving up", "can't do this",
        "is this possible", "will i clear", "can i crack"
    ],

    COMPARISON: [
        "rank", "cutoff", "selection", "chance",
        "will i clear", "safe score", "expected rank",
        "how far am i", "am i improving"
    ],

    TIME_PRESSURE: [
        "less time", "few days left", "time management",
        "running out of time", "exam is near",
        "last days", "final days", "revision strategy"
    ],
};


/* ---------- SUBJECT CONFIG ---------- */

const SUBJECT_CONFIG = {
    eng: { name: "English", max: 40 },
    aptitude: { name: "Aptitude", max: 40 },
    maths: { name: "Mathematics", max: 40 },
    physics: { name: "Physics", max: 40 },
    chemistry: { name: "Chemistry", max: 20 },
    gk: { name: "General Knowledge", max: 20 },
};

/* ---------- SCORE BANDS (PERCENT BASED) ---------- */
const SCORE_BANDS = [
    {
        max: 25,
        label: "🚨 Very Weak",
        tone: "danger",
        msg: "Fundamentals are missing or unclear. Stop rushing into tests. Rebuild concepts slowly, understand basics, and practice very easy questions first."
    },
    {
        max: 50,
        label: "⚠️ Weak",
        tone: "warning",
        msg: "Partial understanding is visible, but mistakes are frequent. Revise core concepts, analyze errors carefully, and focus on accuracy over attempts."
    },
    {
        max: 70,
        label: "⚖️ Average",
        tone: "neutral",
        msg: "You are on the right track, but this level is not exam-safe. Increase practice, reduce silly mistakes, and aim for consistency."
    },
    {
        max: 85,
        label: "✅ Good",
        tone: "success",
        msg: "Your understanding is solid. Maintain regular practice, polish weak spots, and gradually work on speed without hurting accuracy."
    },
    {
        max: 100,
        label: "🔥 Excellent",
        tone: "success",
        msg: "This is a strong scoring area for you. Maintain confidence, avoid overthinking, and use this subject to maximize your overall score."
    },
];

/* ---------- HELPERS ---------- */

const safeNumber = (val, fallback = 0) =>
    typeof val === "number" && !Number.isNaN(val) ? Math.max(0, val) : fallback;

const detectIntent = (text = "") => {
    const q = text.toLowerCase();
    for (const [intent, keys] of Object.entries(INTENTS)) {
        if (keys.some(k => q.includes(k))) return intent;
    }
    return "UNKNOWN";
};

/* ---------- SUBJECT SCORE EVALUATOR ---------- */

const evaluateSubjectScore = (score, key) => {
    const subject = SUBJECT_CONFIG[key];
    if (!subject) return null;

    if (score == null)
        return {
            subject: subject.name,
            status: "Not Attempted",
            tone: "neutral",
        };

    const cappedScore = Math.max(0, Math.min(score, subject.max));
    const percent = (cappedScore / subject.max) * 100;

    const band = SCORE_BANDS.find(b => percent <= b.max);

    return {
        key,
        subject: subject.name,
        score: cappedScore,
        max: subject.max,
        percent: Math.round(percent),
        label: band.label,
        tone: band.tone,
        message: band.msg,
    };
};

/* ---------- SERIOUSNESS CHECK ---------- */
const seriousnessLevel = (accuracy = 0, attempts = 0) => {
    if (accuracy < 40) {
        return {
            label: "🚨 CRITICAL",
            tone: "danger",
            message:
                "Very low accuracy suggests weak fundamentals. Slow down, revise concepts, and attempt fewer questions with better understanding.",
        };
    }

    if (accuracy < 60 && attempts > 50) {
        return {
            label: "⚠️ GUESSWORK ALERT",
            tone: "warning",
            message:
                "High attempts with low accuracy indicate guesswork. Reduce attempts and focus on question selection.",
        };
    }

    if (accuracy < 75) {
        return {
            label: "⚖️ STABLE",
            tone: "neutral",
            message:
                "You’re improving, but consistency is key. Analyze mistakes carefully and avoid rushing.",
        };
    }

    return {
        label: "✅ ON TRACK",
        tone: "success",
        message:
            "Strong accuracy. Continue practicing and work on improving speed while maintaining this accuracy.",
    };
};


/* ---------- FALLBACKS ---------- */

const noDataResponse = () => ({
    title: "No Analysis Available",
    points: ["Attempt a mock test to unlock insights"],
});

const unknownQueryResponse = () => ({
    title: "I analyze mock test performance",
    points: [
        "Subject-wise score analysis",
        "Weak & strong areas",
        "Personalized study plan",
    ],
    hint: "Try: show overall analysis",
});

/* ---------- MAIN ENGINE ---------- */

export const analyzeQuery = ({ query, result }) => {
    if (!result) return noDataResponse();

    const intent = detectIntent(query);

    const totalScore = safeNumber(result.score);
    const accuracy = safeNumber(result.accuracy);
    const attempts = safeNumber(result.attempted);

    const subjectEvaluations = Object.entries(SUBJECT_CONFIG)
        .map(([key]) =>
            evaluateSubjectScore(result.subjectScores?.[key], key)
        );

    const attemptedSubjects = subjectEvaluations.filter(
        s => s.score !== undefined
    );

    const weakest = attemptedSubjects
        .slice()
        .sort((a, b) => a.percent - b.percent)[0];

    const strongest = attemptedSubjects
        .slice()
        .sort((a, b) => b.percent - a.percent)[0];

    /* ---------- SUMMARY ---------- */

    if (intent === "SUMMARY") {
        const seniorView = seriousnessLevel(accuracy);

        return {
            title: "Senior Mentor Review",
            blocks: [
                {
                    label: "Overall Standing",
                    value: seniorView.label,
                    tone: seniorView.tone,
                },
                {
                    label: "Total Score",
                    value: totalScore,
                },
                {
                    label: "Accuracy",
                    value: `${Math.round(accuracy)}%`,
                },
                {
                    label: "Questions Attempted",
                    value: attempts,
                },
            ],
            sections: [
                {
                    heading: "How You Performed Across Subjects",
                    items: subjectEvaluations.map(s => ({
                        label: s.subject,
                        value: s.score !== undefined
                            ? `${s.score}/${s.max} (${s.percent}%)`
                            : "Not Attempted",
                        meta: s.label,
                        tone: s.tone,
                        note: s.message,
                    })),
                },
                {
                    heading: "Key Observations",
                    items: [
                        {
                            label: "Area That Needs the Most Attention",
                            value: weakest
                                ? `${weakest.subject} (${weakest.percent}%)`
                                : "No major weakness detected",
                            tone: "danger",
                        },
                        {
                            label: "Most Reliable Area",
                            value: strongest
                                ? `${strongest.subject} (${strongest.percent}%)`
                                : "No strong area identified yet",
                            tone: "success",
                        },
                    ],
                },
            ],
            advice: seniorView.message,
            action:
                accuracy < 60
                    ? `Pause before taking the next mock. Spend time revising ${weakest?.subject}, especially the basics and repeated mistakes.`
                    : `You’re ready to move forward. Review your errors carefully and attempt the next mock with a focus on accuracy.`,
        };
    }



    /* ---------- WEAKNESS ---------- */

    if (intent === "WEAKNESS" && weakest) {
        return {
            title: "Your Weakest Area Right Now",
            blocks: [
                {
                    label: weakest.subject,
                    value: `${weakest.score}/${weakest.max}`,
                    meta: weakest.label,
                    tone: weakest.tone,
                },
            ],
            action: `Focus on this subject in three steps: revise fundamentals, understand why mistakes are happening, and practice until accuracy improves.`,

        };
    }

    /* ---------- PLAN ---------- */

    if (intent === "PLAN" && weakest) {
        return {
            title: "14-Day Recovery Plan (Follow This Seriously)",
            points: [
                `Days 1–5: Repair concepts in ${weakest.subject}. No shortcuts. If basics are weak, mocks are useless.`,
                "Days 6–10: Take sectional tests daily. Maintain an error log and revise mistakes the same day.",
                "Days 11–14: Attempt full mocks under exam conditions. Your only goal: accuracy first, speed later.",
            ],

        };
    }

    /* ---------- SCORE ---------- */

    if (intent === "SCORE") {
        return {
            title: "Score Overview",
            blocks: [
                { label: "Total Score", value: totalScore },
                { label: "Accuracy", value: `${Math.round(accuracy)}%` },
            ],
        };
    }

    /* ---------- HELP ---------- */

    if (intent === "HELP") {
        return {
            title: "How I Can Help",
            points: [
                "Ask 'summary' for performance review.",
                "Ask 'weak areas' to find where to improve.",
                "Ask 'plan' for a study schedule.",
                "Ask 'score' for quick stats."
            ],
            hint: "Try: 'Make a study plan for me'"
        };
    }

    /* ---------- MOTIVATION ---------- */

    if (intent === "MOTIVATION") {
        return {
            title: "Stay Focused!",
            points: [
                "Consistency beats intensity.",
                "Every mistake is a learning opportunity.",
                "Focus on the process, results will follow."
            ],
            hint: "Ask for a 'plan' to get back on track."
        };
    }

    /* ---------- TIME PRESSURE ---------- */

    if (intent === "TIME_PRESSURE") {
        return {
            title: "Time Management Tips",
            points: [
                "Skip difficult questions initially.",
                "Focus on accuracy, not just attempts.",
                "Stick to your strong subjects first."
            ]
        };
    }

    /* ---------- COMPARISON ---------- */

    if (intent === "COMPARISON") {
        return {
            title: "Focus on Yourself",
            points: [
                "Your main competition is your past performance.",
                "Improve your accuracy to boost your rank automatically."
            ]
        };
    }

    if (intent === "SUBJECT") {
        return {
            title: "Subject Analysis",
            points: [
                "Check the 'Summary' for a detailed breakdown of each subject.",
                "Ask for 'weak areas' to see your critical subjects."
            ]
        };
    }

    return unknownQueryResponse();
};


