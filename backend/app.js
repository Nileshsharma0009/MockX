import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";

const app = express();

/* ================= CORS (SIMPLE & HARD-CODED) ================= */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://mock-x.vercel.app");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

/* ================= HEALTH CHECK ================= */
app.get("/api/__ping", (req, res) => {
  res.json({ ok: true });
});

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.json({ status: "backend running" });
});

export default app;
