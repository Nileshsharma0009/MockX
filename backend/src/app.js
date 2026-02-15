import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import axios from "axios";

const app = express();

const url = `https://mockx-r65t.onrender.com/`;
const interval = 30000;

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


app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});


app.get("/test-gemini", async (req, res) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const r = await model.generateContent("Say OK");
  res.send(r.response.text());
});

app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/payments", paymentRoutes);


app.use("/api/ai", aiRoutes);


app.get("/api/__ping", (req, res) => {
  res.json({ ok: true });
});
export default app;