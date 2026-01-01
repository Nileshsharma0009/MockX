import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";

const app = express();

/* ===== CORS Configuration ===== */
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

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // In development, allow any localhost origin for flexibility
  if (isDevelopment && origin && origin.startsWith("http://localhost:")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (origin && allowedOrigins.includes(origin)) {
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

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

/* ===== ROOT ROUTE ===== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/* ===== API ROUTES ===== */
app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

export default app;
