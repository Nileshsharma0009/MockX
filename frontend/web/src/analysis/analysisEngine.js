/* ======================================================
   MockX Analysis Engine (FINAL – Mentor Grade)
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
        "demotivated", "lost", "feeling low",
        "no improvement", "giving up",
        "can't do this", "will i clear", "can i crack"
    ],

    COMPARISON: [
        "rank", "cutoff", "selection", "chance",
        "safe score", "expected rank", "am i improving"
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
    apt: { name: "Aptitude", max: 40 },
    math: { name: "Mathematics", max: 40 },
    phy: { name: "Physics", max: 40 },
    chem: { name: "Chemistry", max: 20 },
    gk: { name: "General Knowledge", max: 20 },
};

/* ---------- SCORE BANDS ---------- */

const SCORE_BANDS = [
    {
        max: 25,
        label: "🚨 Very Weak",
        tone: "danger",
        msg: "Fundamentals are missing or unclear. Slow down, rebuild basics, and practice easy questions first."
    },
    {
        max: 50,
        label: "⚠️ Weak",
        tone: "warning",
        msg: "Partial understanding is visible. Revise core concepts and focus on accuracy over attempts."
    },
    {
        max: 70,
        label: "⚖️ Average",
        tone: "neutral",
        msg: "You are improving, but this is not exam-safe yet. Practice more and reduce careless mistakes."
    },
    {
        max: 85,
        label: "✅ Good",
        tone: "success",
        msg: "Solid understanding. Maintain consistency and gradually work on speed."
    },
    {
        max: 100,
        label: "🔥 Excellent",
        tone: "success",
        msg: "Strong scoring area. Stay confident and use this subject to maximize your score."
    },
];

/* ---------- HELPERS ---------- */

const safeNumber = (val, fallback = 0) => {
    const num = Number(val);
    return !Number.isNaN(num) ? Math.max(0, num) : fallback;
};

const detectIntent = (text = "") => {
    const q = text.toLowerCase();
    for (const [intent, keys] of Object.entries(INTENTS)) {
        if (keys.some((k) => q.includes(k))) return intent;
    }
    return "UNKNOWN";
};

/* ---------- SUBJECT SCORE EVALUATOR ---------- */

const evaluateSubjectScore = (stats, key) => {
    const subject = SUBJECT_CONFIG[key];
    if (!subject) return null;

    // Handle if stats is just a number (backwards compatibility) or an object
    let rawScore = stats;
    if (typeof stats === 'object' && stats !== null) {
        // Prefer explicit score, fallback to correct answers count
        rawScore = stats.score !== undefined ? stats.score : stats.correct;
    }

    if (rawScore === undefined || rawScore === null || rawScore === "") {
        return { subject: subject.name, status: "Not Attempted", tone: "neutral" };
    }

    const score = Number(rawScore);
    if (Number.isNaN(score)) {
        return { subject: subject.name, status: "Not Attempted", tone: "neutral" };
    }

    const capped = Math.min(Math.max(score, 0), subject.max);
    const percent = (capped / subject.max) * 100;
    const band = SCORE_BANDS.find(b => percent <= b.max) || SCORE_BANDS[SCORE_BANDS.length - 1];

    return {
        key,
        subject: subject.name,
        score: capped,
        max: subject.max,
        percent: Math.round(percent),
        label: band.label,
        tone: band.tone,
        message: band.msg,
    };
};

/* ---------- SERIOUSNESS ---------- */

const seriousnessLevel = (accuracy = 0, attempts = 0) => {
    if (accuracy < 40) {
        return {
            label: "🚨 CRITICAL",
            tone: "danger",
            message: "Very low accuracy. Pause mocks and rebuild fundamentals carefully.",
        };
    }

    if (accuracy < 60 && attempts > 50) {
        return {
            label: "⚠️ GUESSWORK ALERT",
            tone: "warning",
            message: "High attempts with low accuracy indicate guesswork. Slow down and choose questions wisely.",
        };
    }

    if (accuracy < 75) {
        return {
            label: "⚖️ STABLE",
            tone: "neutral",
            message: "You are improving. Focus on consistency and mistake analysis.",
        };
    }

    return {
        label: "✅ ON TRACK",
        tone: "success",
        message: "Good accuracy. Maintain this level and gradually improve speed.",
    };
};

/* ---------- FALLBACKS ---------- */

const noDataResponse = () => ({
    title: "No Test Data Yet",
    points: [
        "You haven’t attempted a mock test yet",
        "Take your first mock to unlock detailed analysis",
        "I’ll guide you once results are available",
    ],
});

const unknownQueryResponse = () => ({
    title: "This Is Outside My Scope",
    points: [
        "I can’t help with this request directly",
        "I specialize in mock test performance analysis",
        "I work with scores, accuracy, and test data",
    ],
    sections: [
        {
            heading: "What I Can Help You With",
            items: [
                "Overall mock test review",
                "Subject-wise performance analysis",
                "Weak & strong area identification",
                "Personalized improvement plans",
                "Accuracy and attempt strategy",
            ],
        },
    ],
    hint: "Try asking about your summary, weak areas, or a study plan.",
});

/* ---------- MAIN ENGINE ---------- */

export const analyzeQuery = ({ query = "", result }) => {
    if (!result) return noDataResponse();

    const intent = detectIntent(query);

    // Calculate totals from subject stats if missing in root result
    let calcAttempts = 0;
    let calcCorrect = 0;
    const subjectStats = result.subjectStats || {};

    Object.values(subjectStats).forEach(s => {
        if (s) {
            calcAttempts += Number(s.attempted) || 0;
            calcCorrect += Number(s.correct) || 0;
        }
    });



    // Use calculated attempts if raw is 0 but we have data
    const rawAttempts = safeNumber(result.attempted);
    const attempts = (rawAttempts === 0 && calcAttempts > 0) ? calcAttempts : rawAttempts;

    // Recalculate accuracy if missing/0
    const rawAccuracy = safeNumber(result.accuracy);
    let accuracy = rawAccuracy;
    if (accuracy === 0 && attempts > 0) {
        accuracy = (calcCorrect / attempts) * 100;
    }

    const subjectEvaluations = Object.entries(SUBJECT_CONFIG)
        .map(([key]) => evaluateSubjectScore(subjectStats?.[key], key));

    const attempted = subjectEvaluations.filter(s => s.score !== undefined);

    const weakest = attempted.sort((a, b) => a.percent - b.percent)[0];
    const strongest = attempted.sort((a, b) => b.percent - a.percent)[0];

    // Calculate total score with fallback
    const rawTotalScore = safeNumber(result.score);
    const calculatedTotalScore = attempted.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const totalScore = (rawTotalScore === 0 && calculatedTotalScore > 0) ? calculatedTotalScore : rawTotalScore;

    /* ---------- SUMMARY ---------- */

    if (intent === "SUMMARY") {
        const seniorView = seriousnessLevel(accuracy, attempts);

        return {
            title: "Senior Mentor Review",
            blocks: [
                { label: "Overall Standing", value: seniorView.label, tone: seniorView.tone },
                { label: "Total Score", value: totalScore },
                { label: "Accuracy", value: `${Math.round(accuracy)}%` },
                { label: "Questions Attempted", value: attempts },
            ],
            sections: [
                {
                    heading: "Subject-wise Performance",
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
                            label: "Needs Most Attention",
                            value: weakest ? `${weakest.subject} (${weakest.percent}%)` : "None",
                            tone: "danger",
                        },
                        {
                            label: "Most Reliable Area",
                            value: strongest ? `${strongest.subject} (${strongest.percent}%)` : "None",
                            tone: "success",
                        },
                    ],
                },
            ],
            advice: seniorView.message,
            action:
                accuracy < 60
                    ? `Pause mocks and revise ${weakest?.subject} before attempting again.`
                    : `Review mistakes and proceed with the next mock.`,
        };
    }

    /* ---------- WEAKNESS ---------- */

    if (intent === "WEAKNESS") {
        if (weakest) {
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
                action:
                    "Revise fundamentals, understand repeated mistakes, and practice until accuracy improves.",
            };
        } else {
            return {
                title: "No Weakness Detected Yet",
                points: [
                    "You haven't attempted enough questions to identify a weak area.",
                    "Complete a full mock text or sectional test first."
                ]
            };
        }
    }

    /* ---------- PLAN ---------- */

    if (intent === "PLAN") {
        if (weakest) {
            return {
                title: "14-Day Recovery Plan",
                points: [
                    `Days 1–5: Rebuild fundamentals in ${weakest.subject}`,
                    "Days 6–10: Sectional practice with detailed error analysis",
                    "Days 11–14: Full mocks with accuracy as the priority",
                ],
            };
        } else {
            return {
                title: "General Study Plan",
                points: [
                    "Since you haven't taken a test yet, start with a diagnostic mock.",
                    "Analyze your score, then focus on your weakest subject.",
                    "Maintain consistency: Study 2-3 hours daily."
                ]
            };
        }
    }

    /* ---------- SCORE ---------- */

    if (intent === "SCORE") {
        return {
            title: "Score Overview",
            blocks: [
                { label: "Total Score", value: rawTotalScore },
                { label: "Accuracy", value: `${Math.round(accuracy)}%` },
            ],
        };
    }

    /* ---------- HELP ---------- */

    if (intent === "HELP") {
        return {
            title: "How I Can Help You",
            points: [
                "Analyze mock test performance",
                "Identify weak and strong areas",
                "Guide preparation strategy",
                "Help improve accuracy and consistency",
            ],
        };
    }

    /* ---------- MOTIVATION ---------- */

    if (intent === "MOTIVATION") {
        return {
            title: "Stay Focused",
            points: [
                "Every aspirant faces setbacks",
                "Improvement comes from fixing weak areas",
                "Consistency matters more than one test",
            ],
            hint: "Ask for a recovery plan to move forward.",
        };
    }

    /* ---------- TIME PRESSURE ---------- */

    if (intent === "TIME_PRESSURE") {
        return {
            title: "When Time Is Limited",
            points: [
                "Focus on accuracy over coverage",
                "Strengthen strong areas first",
                "Avoid learning entirely new topics",
            ],
        };
    }

    /* ---------- COMPARISON ---------- */

    if (intent === "COMPARISON") {
        return {
            title: "About Rank & Cutoff",
            points: [
                "Rank improves with accuracy and consistency",
                "Fixing weak areas gives the fastest improvement",
            ],
        };
    }

    /* ---------- SUBJECT ---------- */

    if (intent === "SUBJECT") {
        return {
            title: "Subject-wise Guidance",
            points: [
                "Each subject is evaluated based on score and accuracy",
                "Weak subjects need concept repair",
                "Strong subjects should be scoring areas",
            ],
            hint: "Ask for a summary to see detailed subject analysis.",
        };
    }

    return unknownQueryResponse();
};
