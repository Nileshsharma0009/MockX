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
import axios from "axios";
import morgan from "morgan";
import { httpLogger } from "./utils/logger.js";

const app = express();

// Wire up Morgan HTTP Logger
const morganStream = {
  write: (message) => {
    httpLogger.info(message.trim());
  }
};
app.use(morgan("combined", { stream: morganStream }));


const url = process.env.WEBSITE_URL;
const interval = Number(process.env.RELOAD_INTERVAL) || 30000;


function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      console.log("website reloded");
    })
    .catch((error) => {
      // console.error(`Error : ${error.message}`);
    });
}

setInterval(reloadWebsite, interval);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mock-x.vercel.app",
    ],
    credentials: true,
  })
);


app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

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
