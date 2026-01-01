import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

/* ===== CORS Configuration for Vercel ===== */
const isDevelopment = process.env.NODE_ENV !== "production";

// Always include production URL in allowed origins
const defaultProductionOrigins = [
  "https://mock-x.vercel.app",
  "https://www.mock-x.vercel.app",
];

const defaultDevelopmentOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5175",
  ...defaultProductionOrigins, // Include production URLs in dev too
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : isDevelopment
  ? defaultDevelopmentOrigins
  : defaultProductionOrigins;

export default async function handler(req, res) {
  // 🔥 CORS Headers - MUST be set before any response
  const origin = req.headers.origin;

  // Check if origin is allowed
  const isOriginAllowed = origin && (
    allowedOrigins.includes(origin) ||
    (isDevelopment && origin.startsWith("http://localhost:"))
  );

  // Always set CORS headers (required for preflight)
  if (isOriginAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
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

  // Log CORS issues for debugging (only if origin not allowed)
  if (origin && !isOriginAllowed) {
    console.log("⚠️ CORS: Origin not allowed:", origin);
    console.log("⚠️ Allowed origins:", allowedOrigins);
    console.log("⚠️ NODE_ENV:", process.env.NODE_ENV);
    console.log("⚠️ isDevelopment:", isDevelopment);
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
