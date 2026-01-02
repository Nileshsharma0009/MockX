import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  const response = await resend.emails.send({
    from: "MockX <no-reply@mockx.dev>",
    to: email,
    subject: "Your MockX verification code",
    html: `<h2>Your OTP: ${otp}</h2>`,
  });

  console.log("RESEND RESPONSE:", response);

  if (response.error) {
    console.error("RESEND ERROR:", response.error);
    throw new Error(response.error.message);
  }
};
