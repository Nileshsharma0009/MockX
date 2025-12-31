// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import resultRoutes from "./routes/result.routes.js";
// import authRoutes from "./routes/auth.route.js";
// import mockRoutes from "./routes/mock.routes.js";
// import testRoutes from "./routes/test.routes.js";

// const app = express();

// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true,
// }));
// app.use(express.json());
// app.use(cookieParser());

// app.use("/api/auth", authRoutes);
// app.use("/api/mocks", mockRoutes);
// app.use("/api/tests", testRoutes);
// app.use("/api/results", resultRoutes);
// app.use("/api/mocks", mockRoutes);
// export default app;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import resultRoutes from "./routes/result.routes.js";
import authRoutes from "./routes/auth.route.js";
import mockRoutes from "./routes/mock.routes.js";
import testRoutes from "./routes/test.routes.js";

const app = express();

// ✅ CORS
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://mock-x-frontend.vercel.app", // 👈 HARD-CODE THIS
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// ); 


app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://mock-x-frontend.vercel.app",
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 THIS IS MANDATORY
app.options("*", cors());


// 🔥 REQUIRED FOR OTP (preflight)
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

export default app;
