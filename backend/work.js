// import express from "express";
// import cookieParser from "cookie-parser";

// import authRoutes from "./routes/auth.routes.js";
// import mockRoutes from "./routes/mock.routes.js";
// import testRoutes from "./routes/test.routes.js";
// import resultRoutes from "./routes/result.routes.js";

// const app = express();

// /* ================= CORS CONFIG ================= */
// const isDevelopment = process.env.NODE_ENV !== "production";

// const allowedOrigins = (
//   process.env.ALLOWED_ORIGINS
//     ? process.env.ALLOWED_ORIGINS.split(",")
//     : isDevelopment
//     ? [
//         "http://localhost:3000",
//         "http://localhost:5173",
//         "http://localhost:5174",
//         "http://localhost:5175",
//         "https://mock-x.vercel.app",
//       ]
//     : [
//         "https://mock-x.vercel.app",
//       ]
// ).map(o => o.trim().replace(/\/$/, ""));

// app.use((req, res, next) => {
//   const origin = req.headers.origin?.replace(/\/$/, "");

//   // ✅ Allow origin if in list
//   if (
//     origin &&
//     (allowedOrigins.includes(origin) ||
//       (isDevelopment && origin.startsWith("http://localhost")))
//   ) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }

//   res.setHeader("Vary", "Origin");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE, OPTIONS"
//   );

//   // 🔥 Preflight
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

// /* ================= MIDDLEWARE ================= */
// app.use(express.json());
// app.use(cookieParser());

// /* ================= TEST ROUTE ================= */
// app.get("/api/health", (req, res) => {
//   res.json({ ok: true });
// });

// /* ================= API ROUTES ================= */
// app.use("/api/auth", authRoutes);
// app.use("/api/mocks", mockRoutes);
// app.use("/api/tests", testRoutes);
// app.use("/api/results", resultRoutes);


// app.get("/api/__ping", (req, res) => {
//   res.json({ ok: true });
// });


// /* ===== ROOT ROUTE ===== */
// app.get("/", (req, res) => {
//   res.status(200).json({
//     status: "success",
//     message: "Server is running 🚀",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//   });
// });

// export default app;


import nodemailer from "nodemailer";
import { Resend } from "resend";

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

await transporter.sendMail({
  from: `"MockX" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Your MockX verification code",
  html: `
  <style>
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  </style>

  <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6fb; padding:24px;">
    <div style="
      max-width:520px;
      margin:auto;
      background:#ffffff;
      border-radius:14px;
      box-shadow:0 12px 35px rgba(0,0,0,0.08);
      overflow:hidden;
    ">

      <!-- HEADER -->
      <div style="
        background:linear-gradient(135deg,#4f46e5,#6366f1);
        padding:22px;
        text-align:center;
        color:#ffffff;
      ">
        <h1 style="margin:0;font-size:22px;letter-spacing:1px;">MockX</h1>
        <p style="margin:6px 0 0;font-size:13px;">
          Smart Mock Tests • Real Results
        </p>
      </div>

      <!-- BODY -->
      <div style="padding:28px;">
        <h2 style="margin-top:0;color:#111827;">
          Verify your email
        </h2>

        <p style="font-size:14px;color:#374151;line-height:1.6;">
          You're almost ready to begin your mock-test journey.
          Use the OTP below to verify your email and unlock full access.
        </p>

        <!-- OTP BOX -->
        <div style="
          margin:26px 0;
          padding:18px;
          text-align:center;
          background:#eef2ff;
          border-radius:12px;
          border:1px dashed #4f46e5;
          animation:pulse 1.8s infinite;
        ">
          <div style="
            font-size:30px;
            font-weight:800;
            letter-spacing:6px;
            color:#4f46e5;
          ">
            ${otp}
          </div>
        </div>

        <p style="font-size:13px;color:#6b7280;">
          ⏱ Valid for <b>10 minutes</b> only.<br/>
          Do not share this code with anyone.
        </p>

        <!-- MOTIVATION -->
        <div style="
          margin-top:22px;
          padding:14px;
          background:#f9fafb;
          border-radius:10px;
          font-size:13px;
          color:#374151;
        ">
           <b>Why verify?</b><br/>
          Verified users get full mock tests, performance analytics,
          and instant scorecards.
        </div>
      </div>

      <!-- FOOTER -->
      <div style="
        background:#f9fafb;
        padding:16px;
        text-align:center;
        font-size:12px;
        color:#9ca3af;
      ">
        Didn’t request this? You can safely ignore this email.<br/>
        © ${new Date().getFullYear()} MockX. All rights reserved.
      </div>

    </div>
  </div>
  `,
});


};
