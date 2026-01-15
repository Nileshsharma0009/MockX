// backend/src/index.js
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => { 
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();





// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendOTPEmail = async (email, otp) => {
//   await resend.emails.send({
//     from: "MockX <no-reply@mockx.dev>", // works without custom domain
//     to: email,
//     subject: "Your MockX verification code",
//     html: `
//       <style>
//         @keyframes pulse {
//           0% { transform: scale(1); }
//           50% { transform: scale(1.05); }
//           100% { transform: scale(1); }
//         }
//       </style>

//       <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6fb; padding:24px;">
//         <div style="
//           max-width:520px;
//           margin:auto;
//           background:#ffffff;
//           border-radius:14px;
//           box-shadow:0 12px 35px rgba(0,0,0,0.08);
//           overflow:hidden;
//         ">

//           <div style="
//             background:linear-gradient(135deg,#4f46e5,#6366f1);
//             padding:22px;
//             text-align:center;
//             color:#ffffff;
//           ">
//             <h1 style="margin:0;font-size:22px;">MockX</h1>
//             <p style="margin:6px 0 0;font-size:13px;">
//               Smart Mock Tests • Real Results
//             </p>
//           </div>

//           <div style="padding:28px;">
//             <h2 style="margin-top:0;color:#111827;">Verify your email</h2>

//             <p style="font-size:14px;color:#374151;line-height:1.6;">
//               Use the OTP below to verify your email.
//             </p>

//             <div style="
//               margin:26px 0;
//               padding:18px;
//               text-align:center;
//               background:#eef2ff;
//               border-radius:12px;
//               border:1px dashed #4f46e5;
//               animation:pulse 1.8s infinite;
//             ">
//               <div style="
//                 font-size:30px;
//                 font-weight:800;
//                 letter-spacing:6px;
//                 color:#4f46e5;
//               ">
//                 ${otp}
//               </div>
//             </div>

//             <p style="font-size:13px;color:#6b7280;">
//               ⏱ Valid for <b>10 minutes</b>. Do not share this code.
//             </p>
//           </div>

//           <div style="
//             background:#f9fafb;
//             padding:16px;
//             text-align:center;
//             font-size:12px;
//             color:#9ca3af;
//           ">
//             © ${new Date().getFullYear()} MockX. All rights reserved.
//           </div>

//         </div>
//       </div>
//     `,
//   });
// };
