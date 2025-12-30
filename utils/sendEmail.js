const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,        // smtp.gmail.com
  port: Number(process.env.EMAIL_PORT),// 587
  secure: false,                       // MUST be false for port 587
  auth: {
    user: process.env.EMAIL_USER,      // sender gmail
    pass: process.env.EMAIL_PASS,      // app password (NO SPACES)
  },
  tls: {
    rejectUnauthorized: false,         // ✅ ADD THIS LINE (IMPORTANT FOR RENDER)
  },
});

// Optional but VERY useful for debugging
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verify Failed:", error);
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

module.exports = async function sendEmail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"CallSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err;
  }
};
