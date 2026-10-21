import crypto from "crypto";
import mongoose from "mongoose";
import Invite from "./invite.model.js";
import Role from "../roles/role.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import AccessRequest from "../access-requests/accessRequest.model.js";
import Customer from "../../customers/customer.model.js";
import ProcurementVendor from "../../procurement/vendor.model.js";
import VendorApplication from "../../procurement/vendor-application.model.js";
import { logAudit } from "../audit/audit.service.js";
import { sendMail } from "../../../utils/email.js";
import { env } from "../../../config/env.js";
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

export function canManageRole(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();

  if (actor === "super_admin") return true;
  if (actor === "admin") return !["super_admin", "admin"].includes(target);
  return false;
}

export async function ensureRoleExists(roleKey) {
  const key = String(roleKey || "")
    .trim()
    .toLowerCase();
  if (!key) return false;
  const role = await Role.findOne({ key }).select("_id").lean();
  return Boolean(role || DEFAULT_ROLE_PERMISSIONS[key]);
}

export async function ensureTeamExists(teamLabel) {
  const label = String(teamLabel || "").trim();
  if (!label) return true;
  const team = await Team.findOne({ label, isActive: true })
    .select("_id")
    .lean();
  return Boolean(team);
}

export async function resolveClientId(clientId) {
  if (!clientId) return { ok: true, value: null };
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return { ok: false, message: "Invalid company/client" };
  }
  const customer = await Customer.findById(clientId).select("_id").lean();
  if (!customer) return { ok: false, message: "Company/client not found" };
  return { ok: true, value: clientId };
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function makeRawToken() {
  return crypto.randomBytes(32).toString("hex");
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

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

/**
 * Builds the invitation email. Vendor invitations name the Vendor Portal;
 * every other invitation keeps the Client Portal wording.
 */
export function buildInviteEmail({ fullName, acceptUrl, role }) {
  const isVendor = role === "vendor";
  const portalName = isVendor ? "Expresso Digital Vendor Portal" : "Expresso Digital Client Portal";
  const purpose = isVendor
    ? `<p>Your vendor application has been approved. You've been invited to activate your account on the <strong>${portalName}</strong>, where you can view requests for quotation in your approved categories and submit quotations.</p>`
    : `<p>You've been invited to activate your access to the <strong>${portalName}</strong>.</p>`;
  return {
    subject: `You're invited to the ${portalName}`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      ${purpose}
      <p>Click the link below to set your password and activate your account:</p>
      <p><a href="${acceptUrl}">${acceptUrl}</a></p>
      <p>This link will expire soon and can only be used once. If you weren't expecting this invitation, you can safely ignore this email.</p>
    `,
  };
}

export async function sendInviteEmail({ email, fullName, rawToken, role }) {
  const acceptUrl = `${env.frontendUrl}/portal/accept-invite?token=${rawToken}`;
  const { subject, html } = buildInviteEmail({ fullName, acceptUrl, role });
  await sendMail({ to: email, subject, html });
}

/**
 * Creates an Invite record without sending email. Returns the raw token, which
 * exists only in memory (only its hash is stored) and must only be emailed.
 */
export async function createInviteRecord({
  email,
  fullName = "",
  role,
  team = "",
  clientId = null,
  expiresInDays = 7,
  invitedBy = null,
  accessRequestId = null,
  vendorId = null,
}) {
  const days = Math.max(1, Math.min(30, Number(expiresInDays) || 7));
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const rawToken = makeRawToken();

  const invite = await Invite.create({
    email,
    fullName,
    role,
    team,
    clientId: clientId || null,
    accessRequestId: accessRequestId || null,
    vendorId: vendorId || null,
    status: "pending",
    tokenHash: hashToken(rawToken),
    expiresAt,
    invitedBy: invitedBy || null,
  });

  return { invite, rawToken };
}

/**
 * Creates an Invite record and sends the invitation email. Shared by the
 * direct admin "New invite" flow and the access-request approval flow.
 */
export async function issueInvite(options) {
  const { invite, rawToken } = await createInviteRecord(options);
  await sendInviteEmail({
    email: options.email,
    fullName: options.fullName || "",
    rawToken,
    role: options.role,
  });
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
        .populate("clientId", "companyName")
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
      clientId = null,
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

    const clientResolution = await resolveClientId(clientId);
    if (!clientResolution.ok) {
      return res.status(400).json({ ok: false, message: clientResolution.message });
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

    const invite = await issueInvite({
      email: cleanEmail,
      fullName: String(fullName || "").trim(),
      role: cleanRole,
      team: cleanTeam,
      clientId: clientResolution.value,
      expiresInDays,
      invitedBy: req.user?.id || req.user?._id || null,
    });

    await logAudit(req, {
      action: "invite.created",
      meta: { inviteId: invite._id, email: cleanEmail, role: cleanRole },
    });

    const populated = await Invite.findById(invite._id)
      .populate("invitedBy", "fullName email")
      .populate("clientId", "companyName")
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
      .populate("clientId", "companyName")
      .lean();

    await logAudit(req, {
      action: "invite.cancelled",
      meta: { inviteId: id, email: invite.email },
    });

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

    const rawToken = makeRawToken();

    const item = await Invite.findByIdAndUpdate(
      id,
      {
        status: "pending",
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        // Clear any abandoned acceptance claim. acceptedByUserId is kept so a
        // half-finished vendor acceptance resumes with the same account id.
        acceptedAt: null,
      },
      { new: true }
    )
      .populate("invitedBy", "fullName email")
      .populate("clientId", "companyName")
      .lean();

    await sendInviteEmail({
      email: item.email,
      fullName: item.fullName,
      rawToken,
      role: item.role,
    });

    await logAudit(req, {
      action: "invite.resent",
      meta: { inviteId: id, email: item.email },
    });

    return res.json({ ok: true, item: computeStatus(item) });
  } catch (err) {
    console.error("resendInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/invites/verify?token=... — public, read-only. Lets the frontend
// show invite context (email/role/company) before the recipient submits
// the activation form, without consuming the invite.
export async function verifyInvite(req, res) {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ ok: false, message: "Token is required" });
    }

    const invite = await Invite.findOne({ tokenHash: hashToken(token) })
      .select("+tokenHash")
      .populate("clientId", "companyName")
      .lean();

    if (!invite) {
      return res.status(404).json({ ok: false, message: "This invitation link is invalid" });
    }
    if (invite.status === "accepted") {
      return res.status(409).json({ ok: false, message: "This invitation has already been used" });
    }
    if (invite.status === "cancelled") {
      return res.status(400).json({ ok: false, message: "This invitation has been cancelled" });
    }
    if (invite.status !== "pending" || invite.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, message: "This invitation has expired" });
    }

    return res.json({
      ok: true,
      invite: {
        email: invite.email,
        fullName: invite.fullName || "",
        role: invite.role,
        team: invite.team || "",
        company: invite.clientId?.companyName || null,
      },
    });
  } catch (err) {
    console.error("verifyInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// An acceptance that started but did not finish (process stopped part-way)
// can be completed with the same link after this many milliseconds. Until
// then a second, concurrent submission is refused.
export const ACCEPT_CLAIM_STALE_MS = 2 * 60 * 1000;

// POST /api/invites/accept — public. Activates the invited account.
//
// Steps (each safe to repeat, so an interrupted acceptance can be completed):
//   1. Claim the invitation atomically (one request at a time; records the
//      account id that will be created).
//   2. Vendor invitations: link that account id to the approved vendor profile.
//      This happens before the account exists, so a failed link never leaves
//      a login behind.
//   3. Create the account with the reserved id (or, on a retry, finish it).
//   4. Mark the invitation accepted. From then on the link is spent.
export async function acceptInvite(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const fullName = String(req.body.fullName || "").trim();
    const password = String(req.body.password || "");

    if (!token || !password) {
      return res.status(400).json({ ok: false, message: "Token and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ ok: false, message: "Password must be at least 8 characters" });
    }

    const tokenHash = hashToken(token);
    const invite = await Invite.findOne({ tokenHash }).select("+tokenHash").lean();

    if (!invite) {
      return res.status(404).json({ ok: false, message: "This invitation link is invalid" });
    }
    if (invite.status === "accepted") {
      return res.status(409).json({ ok: false, message: "This invitation has already been used" });
    }
    if (invite.status === "cancelled") {
      return res.status(400).json({ ok: false, message: "This invitation has been cancelled" });
    }
    if (invite.status !== "pending" || invite.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, message: "This invitation has expired" });
    }

    // Always use the invited (server-side) email — never trust an email
    // submitted by the accept-invite form itself.
    const email = invite.email;

    // 1. Atomic claim. Reuses the account id reserved by an earlier,
    //    interrupted attempt so retries converge on one account.
    const now = new Date();
    const userId = invite.acceptedByUserId || new mongoose.Types.ObjectId();
    const claimed = await Invite.findOneAndUpdate(
      {
        _id: invite._id,
        tokenHash,
        status: "pending",
        expiresAt: { $gt: now },
        $or: [{ acceptedAt: null }, { acceptedAt: { $lt: new Date(now.getTime() - ACCEPT_CLAIM_STALE_MS) } }],
      },
      { $set: { acceptedAt: now, acceptedByUserId: userId } },
      { new: true }
    ).lean();
    if (!claimed) {
      return res.status(409).json({
        ok: false,
        message: "This invitation is already being used. If you did not just submit it, try again in a few minutes.",
      });
    }
    const releaseClaim = () =>
      Invite.updateOne({ _id: invite._id, status: "pending" }, { $set: { acceptedAt: null } });

    // An account with this email that is not the one reserved by this
    // invitation was created another way: do not touch it.
    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser && String(existingUser._id) !== String(userId)) {
      await Invite.updateOne(
        { _id: invite._id },
        { $set: { status: "cancelled", cancelledAt: new Date(), acceptedAt: null, acceptedByUserId: null } }
      );
      return res.status(409).json({
        ok: false,
        message:
          "An account already exists for this email. Please use the login or forgot-password page instead.",
      });
    }

    // 2. Vendor invitation: link the reserved account id to the approved,
    //    active vendor profile (idempotent for a retry with the same id).
    if (invite.vendorId) {
      const linked = await ProcurementVendor.updateOne(
        { _id: invite.vendorId, isActive: true, userId: { $in: [null, userId] } },
        { $set: { userId } }
      );
      if (!linked?.matchedCount && !linked?.modifiedCount) {
        // The profile was deactivated or belongs to another account: this
        // invitation can no longer be used. No account has been created.
        await Invite.updateOne(
          { _id: invite._id },
          { $set: { status: "cancelled", cancelledAt: new Date(), acceptedAt: null } }
        );
        console.error(`acceptInvite: vendor profile ${invite.vendorId} not linkable for invite ${invite._id}`);
        return res.status(409).json({
          ok: false,
          message: "This vendor invitation can no longer be used. Please contact Expresso.",
        });
      }
      await VendorApplication.updateOne({ vendorId: invite.vendorId }, { $set: { userId } });
    }

    // 3. Create the account with the reserved id, or finish the one an
    //    interrupted attempt created (the submitted password applies).
    const passwordHash = await User.hashPassword(password);
    try {
      if (existingUser) {
        await User.updateOne(
          { _id: userId },
          { $set: { passwordHash, passwordChangedAt: new Date(), isActive: true } }
        );
      } else {
        await User.create({
          _id: userId,
          fullName: fullName || invite.fullName || "",
          email,
          role: invite.role,
          isActive: true,
          clientId: invite.clientId || null,
          team: invite.team || "",
          passwordHash,
          passwordChangedAt: new Date(),
        });
      }
    } catch (createErr) {
      // Leave the claim retryable; the vendor link (if any) points at the
      // reserved id and is reused by the retry.
      try {
        await releaseClaim();
      } catch (releaseErr) {
        console.error(`acceptInvite: could not release claim on invite ${invite._id}:`, releaseErr.message);
      }
      throw createErr;
    }

    // 4. Spend the invitation.
    await Invite.updateOne(
      { _id: invite._id },
      { $set: { status: "accepted", acceptedAt: new Date(), acceptedByUserId: userId } }
    );

    if (invite.accessRequestId) {
      await AccessRequest.updateOne(
        { _id: invite.accessRequestId },
        { $set: { status: "invited" } }
      );
    }

    await logAudit(req, {
      action: "invite.accepted",
      targetUserId: userId,
      meta: { inviteId: invite._id, email, vendorId: invite.vendorId || null },
    });

    return res.status(201).json({
      ok: true,
      message: "Your account has been activated. You can now log in.",
    });
  } catch (err) {
    console.error("acceptInvite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
