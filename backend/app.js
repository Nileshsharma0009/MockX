import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import resultRoutes from "./routes/result.routes.js";
import authRoutes from "./routes/auth.route.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";

const app = express();

// ✅ CORS FIRST
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mock-x.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

export default app;
