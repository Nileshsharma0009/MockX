
import dotenv from 'dotenv';
import SibApiV3Sdk from 'sib-api-v3-sdk';

dotenv.config();

const getEmailMode = () => (process.env.EMAIL_MODE || 'local-mock').toLowerCase();

const logLocalEmail = ({ to, subject, html, text, purpose, mockId, orderId }) => {
  console.log('[LOCAL_EMAIL_MODE] Email mocked for local testing');
  console.log({
    to,
    subject,
    purpose,
    mockId,
    orderId,
    htmlSnippet: html ? html.slice(0, 180) : text || '',
  });

  return {
    ok: true,
    mode: 'local-mock',
    provider: 'local-log-only',
    messageId: `local-${Date.now()}`,
  };
};

export const sendBrevoTestEmail = async (toEmail, subject = 'MockX Brevo Test') => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is missing');
    }

    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'mockxhelp@gmail.com',
      name: 'MockX Team',
    };

    const response = await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject,
      htmlContent: `
        <h2>MockX Email Test</h2>
        <p>This is a successful Brevo test email.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      textContent: 'MockX Email Test',
    });

    console.log('Brevo test email sent successfully to:', toEmail);
    return { ok: true, mode: 'brevo', response };
  } catch (error) {
    console.error('Error sending Brevo test email:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', error.response.text);
    }
    return { ok: false, mode: 'brevo', error };
  }
};

export const sendRecoveryEmail = async ({
  to,
  name,
  subject,
  html,
  text,
  purpose = 'payment_recovery',
  mockId,
  orderId,
}) => {
  const mode = getEmailMode();

  if (mode === 'local-mock') {
    return logLocalEmail({
      to,
      subject,
      html,
      text,
      purpose,
      mockId,
      orderId,
    });
  }

  if (mode === 'brevo') {
    try {
      if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY missing for brevo mode');
      }

      const client = SibApiV3Sdk.ApiClient.instance;
      const apiKey = client.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

      const response = await apiInstance.sendTransacEmail({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'mockxhelp@gmail.com',
          name: 'MockX Team',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html || `<p>Hello ${name || 'there'},</p>`,
        textContent: text || 'MockX notification',
      });

      return { ok: true, mode: 'brevo', response };
    } catch (error) {
      console.error('Brevo recovery email failed:', error);
      return { ok: false, mode: 'brevo', error };
    }
  }

  if (mode === 'resend') {
    console.warn('[EMAIL_MODE=resend] Resend is intentionally kept for future scope only. Local mock is active now.');
    return logLocalEmail({
      to,
      subject,
      html,
      text,
      purpose,
      mockId,
      orderId,
    });
  }

  return logLocalEmail({
    to,
    subject,
    html,
    text,
    purpose,
    mockId,
    orderId,
  });
};

const sendRegistrationEmail = async (userEmail, name, password) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MockX</title>
    </head>
    <body>
      <div style="max-width:600px;margin:40px auto;padding:24px;background:#fff;border-radius:12px;">
        <h1>Welcome to MockX! 🚀</h1>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Login here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login</p>
      </div>
    </body>
    </html>
  `;

  return sendRecoveryEmail({
    to: userEmail,
    name,
    subject: 'Welcome to MockX - Your Login Credentials',
    html: htmlContent,
    text: `Welcome to MockX. Your email is ${userEmail} and password is ${password}.`,
    purpose: 'registration',
  });
};

export default sendRegistrationEmail;
