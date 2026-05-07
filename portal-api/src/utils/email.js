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
    console.log(`[email] SMTP not configured — skipped: ${subject} → ${to}`);
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
