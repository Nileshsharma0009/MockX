import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";
import resultRoutes from "./routes/result.routes.js";

const app = express();

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

app.use("/api/ai", aiRoutes);


app.get("/api/__ping", (req, res) => {
  res.json({ ok: true });
}); 
export default app;