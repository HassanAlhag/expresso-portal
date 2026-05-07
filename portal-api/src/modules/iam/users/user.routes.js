import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import User from "./user.model.js";
import { forceLogoutUser } from "./user.controller.js";

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  setUserStatus,
  adminResetPassword,
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

router.get("/", requireAuth, requireRole("super_admin", "admin"), listUsers);
router.post("/", requireAuth, requireRole("super_admin", "admin"), createUser);

router.get("/:id", requireAuth, requireRole("super_admin", "admin"), getUser);
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  updateUser
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("super_admin", "admin"),
  setUserStatus
);

router.post(
  "/:id/reset-password",
  requireAuth,
  requireRole("super_admin", "admin"),
  adminResetPassword
);

router.post(
  "/:id/force-logout",
  requireAuth,
  requireRole("super_admin", "admin"),
  forceLogoutUser
);

export default router;
