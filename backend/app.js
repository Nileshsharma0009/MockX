import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";

const app = express();

/* ================= CORS CONFIG ================= */
const isDevelopment = process.env.NODE_ENV !== "production";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : isDevelopment
    ? [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://mock-x.vercel.app",
      ]
    : [
        "https://mock-x.vercel.app",
        "https://www.mock-x.vercel.app",
      ]
).map(o => o.trim().replace(/\/$/, ""));

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, "");

  // ✅ Allow origin if in list
  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      (isDevelopment && origin.startsWith("http://localhost")))
  ) {
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

  // 🔥 Preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

/* ================= TEST ROUTE ================= */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* ================= API ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

/* ===== ROOT ROUTE ===== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

export default app;
