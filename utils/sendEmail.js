const postmark = require("postmark");

const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

module.exports = async function sendEmail({ to, subject, text }) {
  try {
    const info = await client.sendEmail({
      From: process.env.EMAIL_USER,  // your verified sender
      To: to,
      Subject: subject,
      TextBody: text,
    });
    console.log("📧 Email sent:", info.MessageID);
    return info;
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err;
  }
};
