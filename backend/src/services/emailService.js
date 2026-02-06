
import SibApiV3Sdk from 'sib-api-v3-sdk';

const sendRegistrationEmail = async (userEmail, name, password) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || "mockxhelp@gmail.com",
      name: "MockX Team",
    };

    const receivers = [
      {
        email: userEmail,
      },
    ];

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MockX</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #334155;
        }
        .welcome-text {
          font-size: 18px;
          margin-bottom: 30px;
          color: #1e293b;
        }
        .credentials-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .credential-label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .credential-value {
            font-size: 20px;
            color: #0f172a;
            font-family: 'Courier New', monospace;
            font-weight: 700;
            margin-bottom: 20px;
            background: #fff;
            padding: 10px;
            border-radius: 4px;
            display: inline-block;
            min-width: 200px;
            border: 1px dashed #cbd5e1;
        }
        .credential-value:last-child {
            margin-bottom: 0;
        }
        .cta-button {
          display: block;
          width: 200px;
          margin: 30px auto 0;
          padding: 14px 20px;
          background-color: #2563eb;
          color: white !important;
          text-decoration: none;
          text-align: center;
          border-radius: 6px;
          font-weight: 600;
          transition: background-color 0.3s;
        }
        .cta-button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MockX! 🚀</h1>
        </div>
        <div class="content">
          <p class="welcome-text">Hello <strong>${name}</strong>,</p>
          <p>Thank you for joining MockX. We're excited to help you ace your exams!</p>
          
          <p>Your account has been successfully created. For your convenience, your password has been set to your registered phone number.</p>
          
          <div class="credentials-box">
             <div class="credential-label">Email / Username</div>
             <div class="credential-value">${userEmail}</div>
             
             <div class="credential-label">Password</div>
             <div class="credential-value">${password}</div>
          </div>

          <p>You can now log in to access your free mock tests and detailed performance analysis.</p>
          
          <a href="${process.env.FRONTEND_URL || '#'}/login" class="cta-button">Log In Now</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MockX Team. All rights reserved.</p>
          <p>Questions? Reply to this email or contact support.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await apiInstance.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Welcome to MockX - Your Login Credentials',
      htmlContent: htmlContent,
    });

    console.log('Registration email sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending registration email:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', error.response.text);
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    return false;
  }
};

export default sendRegistrationEmail;
