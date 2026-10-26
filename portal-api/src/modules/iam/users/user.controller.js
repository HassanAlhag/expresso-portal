import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./user.model.js";
import Role from "../roles/role.model.js";
import Customer from "../../customers/customer.model.js";
import { logAudit } from "../audit/audit.service.js";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
  VALID_PERMISSION_KEYS,
} from "../../../config/permissions.js";
import { externalDeniedIn, resolveRoleContext } from "../../../utils/roleRegistry.js";

function canManageRole(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();

  if (actor === "super_admin") return true;
  if (actor === "admin") return !["super_admin", "admin"].includes(target);
  return false;
}

/**
 * True when the change would leave no active super admin: the target is an
 * active super admin and is being deleted, deactivated or given another role,
 * and no other active super admin exists. Without one, nobody can manage
 * access and recovery needs server access.
 */
async function wouldRemoveLastSuperAdmin(target, id, { deleting = false, nextRole, nextActive } = {}) {
  if (String(target?.role || "").toLowerCase() !== "super_admin") return false;
  if (target.isActive === false) return false;
  const staysSuperAdmin =
    !deleting &&
    String(nextRole ?? "super_admin").toLowerCase() === "super_admin" &&
    nextActive !== false;
  if (staysSuperAdmin) return false;
  const others = await User.countDocuments({
    role: "super_admin",
    isActive: { $ne: false },
    _id: { $ne: id },
  });
  return others === 0;
}

const LAST_SUPER_ADMIN = {
  ok: false,
  message: "Cannot remove the last active super admin",
};

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
  return Boolean(role || DEFAULT_ROLE_PERMISSIONS[key]);
}

export async function listUsers(req, res) {
  try {
    const {
      q = "",
      role = "",
      team = "",
      isActive = "",
      clientId = "",
      isInternal = "",
      sort = "-createdAt",
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const CLIENT_ROLES = ["client", "staff_client", "client_admin", "procurement_client"];

    const filter = {};
    if (role) filter.role = String(role).trim().toLowerCase();
    if (team) filter.team = String(team).trim();
    if (isActive !== "") filter.isActive = String(isActive) === "true";
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = clientId;
    }
    if (isInternal === "true") {
      filter.role = { $nin: CLIENT_ROLES };
    }

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
        return res.json({ ok: true, users: [], page: pageNum, pages: 1, total: 0, limit: limitNum });
      }
      if (!filter.role) {
        filter.role = { $ne: "super_admin" };
      } else if (filter.role.$nin) {
        filter.role.$nin = [...new Set([...filter.role.$nin, "super_admin"])];
      }
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
        .populate("clientId", "companyName")
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

    const target = await User.findById(id).select("role email isActive").lean();
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

    if (
      await wouldRemoveLastSuperAdmin(target, id, {
        nextRole,
        nextActive:
          typeof req.body?.isActive !== "undefined" ? Boolean(req.body.isActive) : undefined,
      })
    ) {
      return res.status(409).json(LAST_SUPER_ADMIN);
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

    const target = await User.findById(id).select("role isActive").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    if (await wouldRemoveLastSuperAdmin(target, id, { nextActive: isActive })) {
      return res.status(409).json(LAST_SUPER_ADMIN);
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

    const target = await User.findById(id)
      .select("role extraPermissions revokedPermissions")
      .lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const isSuper = req.user?.role === "super_admin";
    if (!isSuper && String(id) === String(req.user?.id)) {
      return res
        .status(403)
        .json({ ok: false, message: "You cannot change your own permissions" });
    }
    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const clean = (list) =>
      Array.isArray(list)
        ? [...new Set(list.map((x) => String(x || "").trim()).filter((k) => VALID_PERMISSION_KEYS.has(k)))]
        : [];

    const patch = {};
    if ("extraPermissions"   in req.body) patch.extraPermissions   = clean(req.body.extraPermissions);
    if ("revokedPermissions" in req.body) patch.revokedPermissions = clean(req.body.revokedPermissions);

    if (!isSuper && patch.extraPermissions) {
      const held = new Set(req.user?.permissions || []);
      const already = new Set(target.extraPermissions || []);
      const beyond = patch.extraPermissions.filter((p) => !held.has(p) && !already.has(p));
      if (beyond.length > 0) {
        return res.status(403).json({
          ok: false,
          message: "You cannot grant permissions you do not hold",
          missing: beyond,
        });
      }
    }

    // Client and vendor users can never be granted internal-only permissions
    // individually either (they would be stripped at sign-in anyway).
    if (patch.extraPermissions) {
      const { isInternal } = await resolveRoleContext(target.role);
      if (!isInternal) {
        const already = new Set(target.extraPermissions || []);
        const denied = externalDeniedIn(patch.extraPermissions.filter((p) => !already.has(p)));
        if (denied.length > 0) {
          return res.status(400).json({
            ok: false,
            message: "Client and vendor users cannot hold these permissions",
            denied,
          });
        }
      }
    }

    const user = await User.findByIdAndUpdate(id, patch, { new: true })
      .select("fullName email role extraPermissions revokedPermissions")
      .lean();

    await logAudit(req, {
      action: "user.permissions_updated",
      targetUserId: id,
      meta: {
        extraPermissions: patch.extraPermissions,
        revokedPermissions: patch.revokedPermissions,
      },
    });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("updateUserPermissions error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * GET /api/users/:id/effective-permissions
 * What the API will actually grant this user, computed by the same function
 * used at sign-in (role registry). The portal shows this instead of guessing
 * from a copy of the role defaults.
 */
export async function getEffectivePermissions(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }
    const target = await User.findById(id)
      .select("role extraPermissions revokedPermissions")
      .lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const extraPermissions = target.extraPermissions || [];
    const revokedPermissions = target.revokedPermissions || [];
    const role = String(target.role || "").toLowerCase();

    if (role === "super_admin") {
      return res.json({
        ok: true,
        role,
        isInternal: true,
        bypass: true,
        roleSource: "built-in",
        rolePermissions: ALL_PERMISSION_KEYS,
        extraPermissions,
        revokedPermissions,
        effective: ALL_PERMISSION_KEYS,
      });
    }

    const ctx = await resolveRoleContext(role, extraPermissions, revokedPermissions);
    return res.json({
      ok: true,
      role,
      isInternal: ctx.isInternal,
      bypass: false,
      roleSource: ctx.roleSource,
      rolePermissions: [...ctx.rolePermissions].sort(),
      extraPermissions,
      revokedPermissions,
      effective: [...ctx.permissions].sort(),
    });
  } catch (err) {
    console.error("getEffectivePermissions error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const target = await User.findById(id).select("role email clientId isActive").lean();
    if (!target) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!canManageRole(req.user?.role, target.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden — cannot delete this role" });
    }

    // Prevent self-deletion (requireAuth sets req.user.id, not _id).
    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({ ok: false, message: "Cannot delete your own account" });
    }

    if (await wouldRemoveLastSuperAdmin(target, id, { deleting: true })) {
      return res.status(409).json(LAST_SUPER_ADMIN);
    }

    await User.findByIdAndDelete(id);

    // The account is gone from here on: report success even if the follow-up
    // clean-up fails, so the admin is not told a completed delete failed.
    const meta = { email: target.email };

    // If this client user was their company's owner (ownerUserId), unlink it.
    if (target.clientId) {
      try {
        await Customer.updateOne({ ownerUserId: id }, { $unset: { ownerUserId: "" } });
      } catch (cleanupErr) {
        console.error("deleteUser customer unlink failed:", cleanupErr);
        meta.customerUnlinkFailed = true;
      }
    }

    await logAudit(req, { action: "user.deleted", targetUserId: id, meta });

    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteUser error:", err);
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
