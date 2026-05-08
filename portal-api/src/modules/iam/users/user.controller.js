import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./user.model.js";
import Role from "../roles/role.model.js";
import { logAudit } from "../audit/audit.service.js";
import { VALID_PERMISSION_KEYS } from "../../../config/permissions.js";

function canManageRole(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();

  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  return false;
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "email",
    "-email",
    "fullName",
    "-fullName",
    "lastLoginAt",
    "-lastLoginAt",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

async function ensureRoleExists(roleKey) {
  const key = String(roleKey || "")
    .trim()
    .toLowerCase();
  if (!key) return false;

  const role = await Role.findOne({ key }).select("_id key").lean();
  return Boolean(role);
}

export async function listUsers(req, res) {
  try {
    const {
      q = "",
      role = "",
      team = "",
      isActive = "",
      sort = "-createdAt",
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};
    if (role) filter.role = String(role).trim().toLowerCase();
    if (team) filter.team = String(team).trim();
    if (isActive !== "") filter.isActive = String(isActive) === "true";

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { jobTitle: rx },
        { team: rx },
      ];
    }

    if (req.user?.role === "admin") {
      if (filter.role === "super_admin") {
        // admins cannot list super_admin users — return empty result immediately
        return res.json({ ok: true, users: [], page: pageNum, pages: 1, total: 0, limit: limitNum });
      }
      if (!filter.role) filter.role = { $ne: "super_admin" };
    }

    const sortObj = safeSort(sort);

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select(
          "fullName email role isActive jobTitle phone team avatarUrl avatarMediaId notes lastLoginAt createdAt updatedAt clientId"
        )
        .lean(),
    ]);

    return res.json({
      ok: true,
      users,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const user = await User.findById(id)
      .select(
        "fullName email role isActive jobTitle phone team avatarUrl avatarMediaId notes lastLoginAt passwordChangedAt createdAt updatedAt clientId"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("getUser error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createUser(req, res) {
  try {
    const {
      fullName,
      email,
      password,
      role = "client",
      isActive = true,
      clientId = null,
      jobTitle = "",
      phone = "",
      team = "",
      avatarUrl = "",
      avatarMediaId = null,
      notes = "",
    } = req.body || {};

    if (!fullName?.trim() || !email?.trim() || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "fullName, email, password required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role || "client")
      .trim()
      .toLowerCase();

    const roleExists = await ensureRoleExists(cleanRole);
    if (!roleExists) {
      return res.status(400).json({ ok: false, message: "Invalid role" });
    }

    if (!canManageRole(req.user?.role, cleanRole)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const exists = await User.findOne({ email: cleanEmail }).lean();
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ ok: false, message: "Password must be at least 8 characters" });
    }

    const hash = await bcrypt.hash(String(password), 12);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: cleanEmail,
      role: cleanRole,
      isActive: isActive !== false,
      clientId: clientId || null,
      passwordHash: hash,
      passwordChangedAt: new Date(),
      jobTitle: String(jobTitle || "").trim(),
      phone: String(phone || "").trim(),
      team: String(team || "").trim(),
      avatarUrl: String(avatarUrl || "").trim(),
      avatarMediaId:
        avatarMediaId && mongoose.Types.ObjectId.isValid(avatarMediaId)
          ? avatarMediaId
          : null,
      notes: String(notes || "").trim(),
    });

    await logAudit(req, {
      action: "user.created",
      targetUserId: user._id,
      meta: {
        role: user.role,
        isActive: user.isActive,
        clientId: user.clientId,
        team: user.team,
        jobTitle: user.jobTitle,
      },
    });

    return res.status(201).json({
      ok: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const target = await User.findById(id).select("role email").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const nextRole = String(req.body?.role || target.role || "")
      .trim()
      .toLowerCase();

    const roleExists = await ensureRoleExists(nextRole);
    if (!roleExists) {
      return res.status(400).json({ ok: false, message: "Invalid role" });
    }

    if (
      !canManageRole(req.user?.role, target.role) ||
      !canManageRole(req.user?.role, nextRole)
    ) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const patch = {};

    if (typeof req.body.fullName !== "undefined") {
      patch.fullName = String(req.body.fullName || "").trim();
    }

    if (typeof req.body.role !== "undefined") {
      patch.role = String(req.body.role || "")
        .trim()
        .toLowerCase();
    }

    if (typeof req.body.isActive !== "undefined") {
      patch.isActive = Boolean(req.body.isActive);
    }

    if (typeof req.body.clientId !== "undefined") {
      patch.clientId = req.body.clientId || null;
    }

    if (typeof req.body.email !== "undefined") {
      const cleanEmail = String(req.body.email || "")
        .trim()
        .toLowerCase();

      if (!cleanEmail) {
        return res
          .status(400)
          .json({ ok: false, message: "Email cannot be empty" });
      }

      const exists = await User.findOne({
        email: cleanEmail,
        _id: { $ne: id },
      }).lean();

      if (exists) {
        return res
          .status(409)
          .json({ ok: false, message: "Email already in use" });
      }

      patch.email = cleanEmail;
    }

    if (typeof req.body.jobTitle !== "undefined") {
      patch.jobTitle = String(req.body.jobTitle || "").trim();
    }

    if (typeof req.body.phone !== "undefined") {
      patch.phone = String(req.body.phone || "").trim();
    }

    if (typeof req.body.team !== "undefined") {
      patch.team = String(req.body.team || "").trim();
    }

    if (typeof req.body.avatarUrl !== "undefined") {
      patch.avatarUrl = String(req.body.avatarUrl || "").trim();
    }

    if (typeof req.body.avatarMediaId !== "undefined") {
      patch.avatarMediaId =
        req.body.avatarMediaId &&
        mongoose.Types.ObjectId.isValid(req.body.avatarMediaId)
          ? req.body.avatarMediaId
          : null;
    }

    if (typeof req.body.notes !== "undefined") {
      patch.notes = String(req.body.notes || "").trim();
    }

    const user = await User.findByIdAndUpdate(id, patch, { new: true })
      .select(
        "fullName email role isActive jobTitle phone team avatarUrl avatarMediaId notes lastLoginAt passwordChangedAt createdAt updatedAt clientId"
      )
      .lean();

    await logAudit(req, {
      action: "user.updated",
      targetUserId: id,
      meta: patch,
    });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function setUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, message: "isActive must be boolean" });
    }

    const target = await User.findById(id).select("role").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true })
      .select(
        "fullName email role isActive jobTitle phone team avatarUrl avatarMediaId notes lastLoginAt passwordChangedAt createdAt updatedAt clientId"
      )
      .lean();

    await logAudit(req, {
      action: isActive ? "user.activated" : "user.deactivated",
      targetUserId: id,
    });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("setUserStatus error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function adminResetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({
        ok: false,
        message: "newPassword must be at least 8 characters",
      });
    }

    const target = await User.findById(id).select("role").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const hash = await bcrypt.hash(String(newPassword), 12);

    await User.findByIdAndUpdate(id, {
      passwordHash: hash,
      passwordChangedAt: new Date(),
    });

    await logAudit(req, {
      action: "user.password_reset",
      targetUserId: id,
    });

    return res.json({ ok: true, message: "Password reset" });
  } catch (err) {
    console.error("adminResetPassword error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateUserPermissions(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const target = await User.findById(id).select("role").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const clean = (list) =>
      Array.isArray(list)
        ? [...new Set(list.map((x) => String(x || "").trim()).filter((k) => VALID_PERMISSION_KEYS.has(k)))]
        : [];

    const patch = {};
    if ("extraPermissions"   in req.body) patch.extraPermissions   = clean(req.body.extraPermissions);
    if ("revokedPermissions" in req.body) patch.revokedPermissions = clean(req.body.revokedPermissions);

    const user = await User.findByIdAndUpdate(id, patch, { new: true })
      .select("fullName email role extraPermissions revokedPermissions")
      .lean();

    await logAudit(req, { action: "user.permissions_updated", targetUserId: id });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("updateUserPermissions error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function forceLogoutUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const target = await User.findById(id).select("role").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    await User.findByIdAndUpdate(id, { passwordChangedAt: new Date() });

    await logAudit(req, {
      action: "user.force_logout",
      targetUserId: id,
    });

    return res.json({ ok: true, message: "Forced logout for all devices" });
  } catch (err) {
    console.error("forceLogoutUser error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
