import crypto from "crypto";
import mongoose from "mongoose";
import Invite from "./invite.model.js";
import Role from "../roles/role.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../../../config/permissions.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "expiresAt",
    "-expiresAt",
    "email",
    "-email",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

function canManageRole(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();

  if (actor === "super_admin") return true;
  if (actor === "admin") return !["super_admin", "admin"].includes(target);
  return false;
}

async function ensureRoleExists(roleKey) {
  const key = String(roleKey || "")
    .trim()
    .toLowerCase();
  if (!key) return false;
  const role = await Role.findOne({ key }).select("_id").lean();
  return Boolean(role || DEFAULT_ROLE_PERMISSIONS[key]);
}

async function ensureTeamExists(teamLabel) {
  const label = String(teamLabel || "").trim();
  if (!label) return true;
  const team = await Team.findOne({ label, isActive: true })
    .select("_id")
    .lean();
  return Boolean(team);
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function computeStatus(invite) {
  if (!invite) return invite;
  if (
    invite.status === "pending" &&
    invite.expiresAt &&
    invite.expiresAt < new Date()
  ) {
    return { ...invite, status: "expired" };
  }
  return invite;
}

export async function listInvites(req, res) {
  try {
    const {
      q = "",
      status = "",
      role = "",
      team = "",
      sort = "-createdAt",
      page = "1",
      limit = "20",
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = String(status).trim().toLowerCase();
    if (role) filter.role = String(role).trim().toLowerCase();
    if (team) filter.team = String(team).trim();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { email: rx },
        { fullName: rx },
        { team: rx },
        { role: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Invite.countDocuments(filter),
      Invite.find(filter)
        .populate("invitedBy", "fullName email")
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items: items.map(computeStatus),
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (err) {
    console.error("listInvites error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createInvite(req, res) {
  try {
    const {
      email,
      fullName = "",
      role = "client",
      team = "",
      expiresInDays = 7,
    } = req.body || {};

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanRole = String(role || "client")
      .trim()
      .toLowerCase();
    const cleanTeam = String(team || "").trim();

    if (!cleanEmail) {
      return res.status(400).json({ ok: false, message: "email is required" });
    }

    const roleExists = await ensureRoleExists(cleanRole);
    if (!roleExists) {
      return res.status(400).json({ ok: false, message: "Invalid role" });
    }

    const teamExists = await ensureTeamExists(cleanTeam);
    if (!teamExists) {
      return res.status(400).json({ ok: false, message: "Invalid team" });
    }

    if (!canManageRole(req.user?.role, cleanRole)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const existingUser = await User.findOne({ email: cleanEmail })
      .select("_id")
      .lean();
    if (existingUser) {
      return res
        .status(409)
        .json({ ok: false, message: "User already exists with this email" });
    }

    const existingPending = await Invite.findOne({
      email: cleanEmail,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (existingPending) {
      return res
        .status(409)
        .json({
          ok: false,
          message: "A pending invite already exists for this email",
        });
    }

    const days = Math.max(1, Math.min(30, Number(expiresInDays) || 7));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const item = await Invite.create({
      email: cleanEmail,
      fullName: String(fullName || "").trim(),
      role: cleanRole,
      team: cleanTeam,
      status: "pending",
      token: makeToken(),
      expiresAt,
      invitedBy: req.user?.id || req.user?._id || null,
    });

    const populated = await Invite.findById(item._id)
      .populate("invitedBy", "fullName email")
      .lean();

    return res.status(201).json({ ok: true, item: computeStatus(populated) });
  } catch (err) {
    console.error("createInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelInvite(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid invite id" });
    }

    const invite = await Invite.findById(id).lean();
    if (!invite) {
      return res.status(404).json({ ok: false, message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res
        .status(400)
        .json({ ok: false, message: "Only pending invites can be cancelled" });
    }

    const item = await Invite.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
      { new: true }
    )
      .populate("invitedBy", "fullName email")
      .lean();

    return res.json({ ok: true, item: computeStatus(item) });
  } catch (err) {
    console.error("cancelInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function resendInvite(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid invite id" });
    }

    const invite = await Invite.findById(id).lean();
    if (!invite) {
      return res.status(404).json({ ok: false, message: "Invite not found" });
    }

    if (!["pending", "expired", "cancelled"].includes(invite.status)) {
      return res
        .status(400)
        .json({ ok: false, message: "Invite cannot be resent" });
    }

    const item = await Invite.findByIdAndUpdate(
      id,
      {
        status: "pending",
        token: makeToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
      },
      { new: true }
    )
      .populate("invitedBy", "fullName email")
      .lean();

    return res.json({ ok: true, item: computeStatus(item) });
  } catch (err) {
    console.error("resendInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
