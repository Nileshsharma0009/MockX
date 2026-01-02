import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  await resend.emails.send({
    from: "MockX <no-reply@mockx.dev>", // ✅ required for Resend free tier
    to: email,
    subject: "Your MockX verification code",
    html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>MockX OTP</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f6fb;
        font-family: Arial, Helvetica, sans-serif;
      }

      .container {
        max-width: 520px;
        margin: 24px auto;
        background: #ffffff;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
      }

      .header {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        padding: 22px;
        text-align: center;
        color: #ffffff;
      }

      .header h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 1px;
      }

      .header p {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .content {
        padding: 28px;
      }

      .content h2 {
        margin-top: 0;
        color: #111827;
        font-size: 20px;
      }

      .content p {
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
      }

      .otp-box {
        margin: 26px 0;
        padding: 18px;
        text-align: center;
        background: #eef2ff;
        border-radius: 12px;
        border: 1px dashed #4f46e5;
      }

      .otp {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: 6px;
        color: #4f46e5;
      }

      .note {
        font-size: 13px;
        color: #6b7280;
      }

      .footer {
        background: #f9fafb;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>MockX</h1>
        <p>Smart Mock Tests • Real Results</p>
      </div>

      <div class="content">
        <h2>Verify your email</h2>

        <p>
          You're almost ready to begin your mock-test journey.
          Use the OTP below to verify your email and unlock full access.
        </p>

        <div class="otp-box">
          <div class="otp">${otp}</div>
        </div>

        <p class="note">
          ⏱ <b>Valid for 10 minutes only.</b><br />
          Do not share this code with anyone.
        </p>
      </div>

      <div class="footer">
        Didn’t request this? You can safely ignore this email.<br />
        © ${new Date().getFullYear()} MockX. All rights reserved.
      </div>
    </div>
  </body>
</html>
    `,
  });
};
