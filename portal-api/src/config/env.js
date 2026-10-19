export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Optional — Google Sign-In (Step 4C). Must match the frontend's
  // REACT_APP_GOOGLE_CLIENT_ID exactly. When unset, /api/auth/google
  // responds with a graceful "not configured" error instead of crashing
  // the server or breaking normal email/password login.
  googleClientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),

  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase(),
  superAdminPassword: (process.env.SUPER_ADMIN_PASSWORD || "").trim(),
  superAdminName: (process.env.SUPER_ADMIN_NAME || "Super Admin").trim(),

  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
};

if (!env.mongoUri) {
  console.warn("⚠️  MONGO_URI is not set in environment variables.");
}

if (!env.jwtSecret) {
  throw new Error(
    "JWT_SECRET is not set. Set JWT_SECRET in your environment before starting the server (no insecure fallback is used)."
  );
}
