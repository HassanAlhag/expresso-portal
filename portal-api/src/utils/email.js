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
    // No SMTP configured (local/dev) — dump the email to the console
    // instead of sending it, so links (invite/reset) are still usable.
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
