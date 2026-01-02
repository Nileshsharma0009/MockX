import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  const result = await resend.emails.send({
    from: "MockX <onboarding@resend.dev>", // ✅ FIX
    to: email,
    subject: "Your MockX verification code",
    html: `
      <h2>MockX Verification</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:6px;">${otp}</h1>
      <p>Valid for 10 minutes</p>
    `,
  });

  if (result.error) {
    console.error("RESEND ERROR:", result.error);
    throw new Error(result.error.message);
  }

  console.log("RESEND SUCCESS");
};
