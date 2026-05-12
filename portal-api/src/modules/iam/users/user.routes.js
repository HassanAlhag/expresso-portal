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
} from "./user.controller.js";

const router = express.Router();

// ── Self-service routes (any authenticated user) ──────────────────────────────

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("fullName email role isActive lastLoginAt createdAt clientId avatarUrl avatarMediaId team jobTitle phone")
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
  await User.findByIdAndUpdate(req.user.id, { notificationPreferences: req.body.preferences });
  return res.json({ ok: true });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get("/", requireAuth, requirePermission("iam.users.read"), listUsers);
router.post("/", requireAuth, requirePermission("iam.users.write"), createUser);

router.get("/:id", requireAuth, requirePermission("iam.users.read"), getUser);
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

export default router;
