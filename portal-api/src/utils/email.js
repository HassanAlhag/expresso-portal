import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!env.smtpHost || !env.smtpUser) return null;
  _transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  return _transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    if (env.nodeEnv === "production") {
      // Never write invite/reset links to production logs: anyone with log
      // access could take over accounts (audit S12).
      console.error(`[email] SMTP not configured — email NOT sent: "${subject}"`);
      return;
    }
    // Local/dev only: print the email so invite/reset links are usable.
    console.log(`[email] SMTP not configured — not sent: "${subject}" → ${to}`);
    console.log(text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return;
  }
  await t.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""),
  });
}
