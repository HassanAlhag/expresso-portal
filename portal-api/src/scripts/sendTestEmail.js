// Send ONE test email through the configured SMTP account. Does not create,
// invite or reset any user.
//   node src/scripts/sendTestEmail.js you@yourcompany.com
import "dotenv/config";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const to = String(process.argv[2] || "").trim();
if (!to || !to.includes("@")) {
  console.log("Usage: node src/scripts/sendTestEmail.js <recipient@example.com>");
  process.exit(1);
}
if (!env.smtpHost || !env.smtpUser) {
  console.error("SMTP_HOST / SMTP_USER are not set — nothing to test.");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: { user: env.smtpUser, pass: env.smtpPass },
});

try {
  await transport.verify();
  console.log(`✅ Connected and authenticated to ${env.smtpHost}:${env.smtpPort}`);
  const info = await transport.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject: "Expresso Portal — SMTP test",
    text: `This is a test from the Expresso Portal API (${env.nodeEnv}). No action needed.`,
  });
  console.log(`✅ Sent. Message id: ${info.messageId}. Accepted: ${info.accepted.join(", ")}`);
} catch (e) {
  console.error(`❌ SMTP test failed: ${e.code || ""} ${e.message}`);
  process.exit(1);
}
