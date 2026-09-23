import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRecoveryRoutes from "./routes/paymentRecovery.routes.js";
import instituteRoutes from "./routes/institute.routes.js";
import instituteStudentRoutes from "./routes/instituteStudent.routes.js";
import morgan from "morgan";
import { httpLogger } from "./utils/logger.js";
import { createCorsOptions, startWebsitePing } from "./config/runtimeConfig.js";
import createCsrfProtection from "./middleware/csrf.middleware.js";

const app = express();

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
}
app.set("trust proxy", trustProxyHops);

// Wire up Morgan HTTP Logger
const morganStream = {
  write: (message) => {
    httpLogger.info(message.trim());
  },
};
app.use(morgan("combined", { stream: morganStream }));

startWebsitePing();

app.use(cors(createCorsOptions()));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(createCsrfProtection());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment-recovery", paymentRecoveryRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/institute-student", instituteStudentRoutes);

app.get("/api/__ping", (req, res) => {
  res.json({ ok: true });
});

export default app;