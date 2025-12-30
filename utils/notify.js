/**
 * notify.js
 * - Sends SMS via Twilio if TWILIO_SID + TWILIO_TOKEN + TWILIO_FROM are set.
 * - Otherwise sends email via SendGrid if SENDGRID_API_KEY + SENDGRID_FROM set.
 * - Falls back to console.log if no provider configured.
 *
 * Usage:
 * await sendNotification({ toPhone, toEmail, subject, text });
 */
const Twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

async function sendNotification({ toPhone, toEmail, subject, text }) {
  // Try Twilio SMS first if configured and phone number present
  const twSid = process.env.TWILIO_SID;
  const twToken = process.env.TWILIO_TOKEN;
  const twFrom = process.env.TWILIO_FROM;

  if (twSid && twToken && twFrom && toPhone) {
    try {
      const client = Twilio(twSid, twToken);
      await client.messages.create({ body: text, from: twFrom, to: toPhone });
      return { ok: true, provider: 'twilio' };
    } catch (err) {
      console.error('Twilio send error:', err);
      // fallthrough to other providers
    }
  }

  // Try SendGrid email if configured and email present
  const sgKey = process.env.SENDGRID_API_KEY;
  const sgFrom = process.env.SENDGRID_FROM;
  if (sgKey && sgFrom && toEmail) {
    try {
      sgMail.setApiKey(sgKey);
      const msg = {
        to: toEmail,
        from: sgFrom,
        subject: subject || 'Your CallSync code',
        text: text,
      };
      await sgMail.send(msg);
      return { ok: true, provider: 'sendgrid' };
    } catch (err) {
      console.error('SendGrid send error:', err);
    }
  }

  // No provider configured or sends failed — log to console
  console.log('notify fallback — message:', { toPhone, toEmail, subject, text });
  return { ok: false, provider: 'console' };
}

module.exports = sendNotification;
