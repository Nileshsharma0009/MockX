import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

/* ===== CORS Configuration for Vercel ===== */
const isDevelopment = process.env.NODE_ENV !== "production";
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : isDevelopment
  ? [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://localhost:5175",
      "https://mock-x.vercel.app",
    ]
  : [
      "https://mock-x.vercel.app",
      "https://www.mock-x.vercel.app", // Include www variant if needed
    ];

export default async function handler(req, res) {
  // 🔥 CORS Headers - MUST be set before any response
  const origin = req.headers.origin;

  // Always set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (origin && isDevelopment && origin.startsWith("http://localhost:")) {
    // Allow any localhost in development
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (origin) {
    // Log for debugging in production to help troubleshoot
    if (!isDevelopment) {
      console.log("⚠️ CORS: Origin not allowed:", origin);
      console.log("⚠️ Allowed origins:", allowedOrigins);
    }
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );

  // Handle preflight requests - MUST return early
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected");
    }

    // 🔑 IMPORTANT - Pass to Express app
    app.handle(req, res);
  } catch (error) {
    console.error("❌ Server crash:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
