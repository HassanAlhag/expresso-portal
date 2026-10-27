import express from "express";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { publicBucket } from "../../utils/s3.js";

// GET /api/admin/system-status — super admin only.
// Configuration STATUS only: environment name, database connectivity and
// configured / not-configured flags. It must never return secret values,
// hostnames, usernames, bucket names, key fragments or connection strings.
const router = express.Router();

const configured = (...values) => values.every((v) => Boolean(String(v || "").trim()));

router.get("/system-status", requireAuth, requireRole("super_admin"), (_req, res) => {
  // The same public bucket resolution that uploads use (P3-7).
  const publicStorageBucket = publicBucket();
  return res.json({
    ok: true,
    environment: env.nodeEnv,
    dbEnvironment: process.env.DB_ENVIRONMENT || "unset",
    databaseConnected: mongoose.connection.readyState === 1,
    configured: {
      smtp: configured(env.smtpHost, env.smtpUser, env.smtpPass),
      smtpFromAddress: configured(env.smtpFrom),
      publicStorage: configured(publicStorageBucket),
      privateStorage: configured(process.env.AWS_S3_PRIVATE_BUCKET),
      privateStorageSeparateFromPublic:
        configured(process.env.AWS_S3_PRIVATE_BUCKET) &&
        process.env.AWS_S3_PRIVATE_BUCKET !== publicStorageBucket,
      storageCredentials: configured(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY),
      googleSignIn: configured(env.googleClientId),
      frontendUrl: configured(process.env.FRONTEND_URL),
      trustProxy: env.trustProxy > 0,
    },
  });
});

export default router;
