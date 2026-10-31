/**
 * Email sending (Nodemailer).
 *   smtp: real delivery through any SMTP server (Amazon SES SMTP, Zoho, GoDaddy, ...)
 *   log:  prints the email to the console. Used for local development.
 */
import nodemailer from 'nodemailer';

const headerSafe = (value) => String(value).replace(/[\r\n]+/g, ' ').trim();

export function createMailer(mail, { logger, isProd = false } = {}) {
  if (mail.transport === 'log') {
    return {
      transport: 'log',
      async send({ to, replyTo, subject, text }) {
        logger?.info('email_logged', { to, replyTo, subject });
        if (!isProd) {
          // Development only: show the body so you can see exactly what would be sent.
          console.log(`\n----- email (not sent: EMAIL_TRANSPORT=log) -----\nTo: ${to}\nReply-To: ${replyTo}\nSubject: ${subject}\n\n${text}\n-----\n`);
        }
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.secure, // true for port 465; STARTTLS is used automatically on 587
    auth: { user: mail.user, pass: mail.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return {
    transport: 'smtp',
    async send({ to, replyTo, fromName, subject, html, text }) {
      await transporter.sendMail({
        from: { name: headerSafe(fromName).replace(/"/g, ''), address: mail.fromEmail },
        to,
        replyTo,
        subject: headerSafe(subject),
        html,
        text,
      });
    },
  };
}
