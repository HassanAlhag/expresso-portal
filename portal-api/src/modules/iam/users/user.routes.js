import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import User from "./user.model.js";
import { forceLogoutUser } from "./user.controller.js";

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  setUserStatus,
  adminResetPassword,
  updateUserPermissions,
  getEffectivePermissions,
  deleteUser,
} from "./user.controller.js";

const router = express.Router();

// ── Self-service routes (any authenticated user) ──────────────────────────────

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("fullName email role isActive lastLoginAt createdAt clientId avatarUrl avatarMediaId team jobTitle phone notificationPreferences")
    .lean();
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });
  return res.json({ ok: true, user });
});

router.patch("/me", requireAuth, async (req, res) => {
  const ALLOWED = ["fullName", "phone", "jobTitle", "avatarUrl", "avatarMediaId"];
  const patch = {};
  ALLOWED.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user.id, patch, { new: true, runValidators: true })
    .select("fullName email role isActive team jobTitle phone avatarUrl");
  return res.json({ ok: true, user });
});

router.patch("/me/notifications", requireAuth, async (req, res) => {
  // Only known boolean keys are stored (the field previously did not exist in
  // the schema, so every save was silently discarded; audit B5).
  const KEYS = ["emailDigest", "projectUpdates", "ticketReplies", "billingAlerts", "securityAlerts", "teamActivity"];
  const input = req.body?.preferences || {};
  const set = {};
  for (const k of KEYS) {
    if (typeof input[k] === "boolean") set[`notificationPreferences.${k}`] = input[k];
  }
  const user = await User.findByIdAndUpdate(req.user.id, { $set: set }, { new: true })
    .select("notificationPreferences")
    .lean();
  return res.json({ ok: true, preferences: user?.notificationPreferences || {} });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get("/", requireAuth, requirePermission("iam.users.read"), listUsers);
router.post("/", requireAuth, requirePermission("iam.users.write"), createUser);

router.get("/:id", requireAuth, requirePermission("iam.users.read"), getUser);
router.get(
  "/:id/effective-permissions",
  requireAuth,
  requirePermission("iam.users.read"),
  getEffectivePermissions
);
router.patch(
  "/:id",
  requireAuth,
  requirePermission("iam.users.write"),
  updateUser
);

router.patch(
  "/:id/status",
  requireAuth,
  requirePermission("iam.users.write"),
  setUserStatus
);

router.post(
  "/:id/reset-password",
  requireAuth,
  requirePermission("iam.users.write"),
  adminResetPassword
);

router.post(
  "/:id/force-logout",
  requireAuth,
  requirePermission("iam.users.write"),
  forceLogoutUser
);

router.patch(
  "/:id/permissions",
  requireAuth,
  requirePermission("iam.users.write"),
  updateUserPermissions
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("iam.users.delete"),
  deleteUser
);

export default router;
