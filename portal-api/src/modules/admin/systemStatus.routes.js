import express from "express";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { dbHost } from "../../scripts/_guard.js";

// GET /api/admin/system-status — super admin only. Reports WHICH integrations
// are configured on this server (never their values), so production config
// can be verified without shell access.
const router = express.Router();

router.get("/system-status", requireAuth, requireRole("super_admin"), (_req, res) => {
  const host = dbHost(env.mongoUri);
  return res.json({
    ok: true,
    nodeEnv: env.nodeEnv,
    dbEnvironment: process.env.DB_ENVIRONMENT || "unset",
    database: {
      connected: mongoose.connection.readyState === 1,
      // host only, with the cluster id masked
      host: host ? host.replace(/^([^.]+)\.([^.]+)\./, "$1.****.") : "",
      name: mongoose.connection.name || "",
    },
    email: {
      smtpConfigured: Boolean(env.smtpHost && env.smtpUser && env.smtpPass),
      smtpHost: env.smtpHost || "",
      fromConfigured: Boolean(env.smtpFrom),
    },
    storage: {
      publicBucketConfigured: Boolean(process.env.AWS_S3_BUCKET),
      privateBucketConfigured: Boolean(process.env.AWS_S3_PRIVATE_BUCKET),
      privateUsesSeparateBucket:
        Boolean(process.env.AWS_S3_PRIVATE_BUCKET) &&
        process.env.AWS_S3_PRIVATE_BUCKET !== process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || "",
    },
    auth: {
      googleSignInConfigured: Boolean(env.googleClientId),
      jwtExpiresIn: env.jwtExpiresIn,
    },
    network: {
      trustProxy: env.trustProxy,
      frontendUrl: env.frontendUrl,
    },
  });
});

export default router;
