// src/scripts/seedUser.js
//
// Creates the first super_admin account. Insert-only (remediation P2-7):
// if an account with the email already exists, nothing is changed and the
// script exits with an error. To set a new password for an existing
// super_admin on purpose, re-run with --reset-password; that changes the
// password only (never the role, status or name) and signs out existing
// sessions. It never promotes another account to super_admin.
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import User from "../modules/iam/users/user.model.js";
import { assertSafeTarget } from "./_guard.js";

/**
 * Returns { outcome, ... } where outcome is "created", "password-reset",
 * "exists" (nothing changed), "not-super-admin" (nothing changed),
 * "not-found" (--reset-password for an email with no account; nothing
 * created) or "missing-config".
 */
export async function seedSuperAdmin({ email, password, fullName, resetPassword = false }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  if (!cleanEmail || !cleanPassword) return { outcome: "missing-config" };

  const existing = await User.findOne({ email: cleanEmail }).select("_id role").lean();

  // --reset-password only ever resets; it never creates an account.
  if (resetPassword && !existing) return { outcome: "not-found" };

  if (existing) {
    if (!resetPassword) return { outcome: "exists", id: String(existing._id) };
    if (existing.role !== "super_admin") return { outcome: "not-super-admin", id: String(existing._id) };
    const passwordHash = await User.hashPassword(cleanPassword);
    await User.updateOne(
      { _id: existing._id, role: "super_admin" },
      { $set: { passwordHash, passwordChangedAt: new Date() } }
    );
    return { outcome: "password-reset", id: String(existing._id) };
  }

  const passwordHash = await User.hashPassword(cleanPassword);
  try {
    const doc = await User.create({
      fullName: String(fullName || "Super Admin").trim(),
      email: cleanEmail,
      role: "super_admin",
      isActive: true,
      passwordHash,
      passwordChangedAt: new Date(),
    });
    return { outcome: "created", id: String(doc._id) };
  } catch (e) {
    // Another process created it between the check and the insert: the
    // unique email index refused the second account. Nothing was changed.
    if (e?.code === 11000) return { outcome: "exists" };
    throw e;
  }
}

const MESSAGES = {
  created: "✅ Created super_admin",
  "password-reset": "✅ Password reset for the existing super_admin (other details unchanged)",
  exists: "❌ An account with SUPER_ADMIN_EMAIL already exists. Nothing was changed.\n   To set a new password for that super_admin on purpose, re-run with --reset-password.",
  "not-super-admin": "❌ An account with SUPER_ADMIN_EMAIL exists but is not a super_admin. Nothing was changed.\n   Change roles from the portal; this script never promotes accounts.",
  "not-found": "❌ --reset-password was given but no account has SUPER_ADMIN_EMAIL. Nothing was created.\n   Run without --reset-password to create the first super_admin.",
  "missing-config": "❌ Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env",
};

async function run() {
  assertSafeTarget();
  await connectDB();
  const result = await seedSuperAdmin({
    email: env.superAdminEmail,
    password: env.superAdminPassword,
    fullName: env.superAdminName,
    resetPassword: process.argv.includes("--reset-password"),
  });
  console.log(MESSAGES[result.outcome], result.id ? `(id ${result.id})` : "");
  process.exit(result.outcome === "created" || result.outcome === "password-reset" ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch((e) => {
    console.error("❌ seedUser failed:", e);
    process.exit(1);
  });
}
