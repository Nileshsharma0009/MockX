import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

const isDevelopment = process.env.NODE_ENV !== "production";

/* ===== Allowed Origins ===== */
const productionOrigins = [
  "https://mock-x.vercel.app",
  "https://www.mock-x.vercel.app",
];

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  ...productionOrigins,
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : isDevelopment
  ? developmentOrigins
  : productionOrigins
).map(o => o.trim().replace(/\/$/, ""));

export default async function handler(req, res) {
  const origin = req.headers.origin?.replace(/\/$/, "");

  const isOriginAllowed =
    origin &&
    (allowedOrigins.includes(origin) ||
      (isDevelopment && origin.startsWith("http://localhost")));

  /* ===== CORS HEADERS ===== */
  if (isOriginAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  /* ===== Preflight ===== */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* ===== Debug (DEV only) ===== */
  if (isDevelopment && origin && !isOriginAllowed) {
    console.warn("⚠️ CORS blocked:", origin);
    console.warn("Allowed:", allowedOrigins);
  }

  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected");
    }

    return app.handle(req, res);
  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
