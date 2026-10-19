import mongoose from "mongoose";
import AccessRequest from "./accessRequest.model.js";
import User from "../users/user.model.js";
import { logAudit } from "../audit/audit.service.js";
import {
  issueInvite,
  ensureRoleExists,
  ensureTeamExists,
  resolveClientId,
  canManageRole,
} from "../invites/invite.controller.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set(["createdAt", "-createdAt", "status", "-status"]);
  if (!allowed.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

const GENERIC_ACK =
  "Your request has been received. Our team will review it and contact you regarding portal access.";

// POST /api/auth/request-access — public.
export async function createAccessRequest(req, res) {
  try {
    const fullName = String(req.body.fullName || "").trim().slice(0, 120);
    const workEmail = String(req.body.workEmail || "").trim().toLowerCase().slice(0, 190);
    const company = String(req.body.company || "").trim().slice(0, 160);
    const phone = String(req.body.phone || "").trim().slice(0, 40);
    const message = String(req.body.message || "").trim().slice(0, 1000);

    if (!fullName || !workEmail || !company) {
      return res.status(400).json({
        ok: false,
        message: "Full name, work email, and company are required",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(workEmail)) {
      return res.status(400).json({ ok: false, message: "Enter a valid work email" });
    }

    // Never reveal whether this email already belongs to a portal User, or
    // whether a pending request already exists — always the same generic
    // acknowledgement, and no request duplication for an email that's
    // already pending review.
    const existingPending = await AccessRequest.findOne({
      workEmail,
      status: "pending",
    }).select("_id").lean();

    if (!existingPending) {
      await AccessRequest.create({
        fullName,
        workEmail,
        company,
        phone,
        message,
        status: "pending",
      });
    }

    return res.status(201).json({ ok: true, message: GENERIC_ACK });
  } catch (err) {
    console.error("createAccessRequest error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/access-requests — admin.
export async function listAccessRequests(req, res) {
  try {
    const {
      q = "",
      status = "",
      sort = "-createdAt",
      page = "1",
      limit = "20",
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = String(status).trim().toLowerCase();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ fullName: rx }, { workEmail: rx }, { company: rx }];
    }

    const [total, items] = await Promise.all([
      AccessRequest.countDocuments(filter),
      AccessRequest.find(filter)
        .populate("reviewedBy", "fullName email")
        .populate("inviteId", "status expiresAt")
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (err) {
    console.error("listAccessRequests error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/access-requests/:id/approve — admin. Lightweight triage
// decision; does not create a User, Customer, or Invite by itself.
export async function approveAccessRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid request id" });
    }

    const request = await AccessRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, message: "Access request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ ok: false, message: "Only pending requests can be approved" });
    }

    request.status = "approved";
    request.reviewedBy = req.user?.id || req.user?._id || null;
    request.reviewedAt = new Date();
    await request.save();

    await logAudit(req, {
      action: "access_request.approved",
      meta: { accessRequestId: id, workEmail: request.workEmail },
    });

    return res.json({ ok: true, item: request });
  } catch (err) {
    console.error("approveAccessRequest error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/access-requests/:id/reject — admin.
export async function rejectAccessRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid request id" });
    }

    const request = await AccessRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, message: "Access request not found" });
    }
    if (!["pending", "approved"].includes(request.status)) {
      return res.status(400).json({ ok: false, message: "This request cannot be rejected" });
    }

    request.status = "rejected";
    request.reviewedBy = req.user?.id || req.user?._id || null;
    request.reviewedAt = new Date();
    await request.save();

    await logAudit(req, {
      action: "access_request.rejected",
      meta: { accessRequestId: id, workEmail: request.workEmail },
    });

    return res.json({ ok: true, item: request });
  } catch (err) {
    console.error("rejectAccessRequest error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/access-requests/:id/invite — admin. The only path that turns
// a request into portal access: creates a real Invite (email + accept
// flow), it does NOT create a User, Customer, or session directly.
export async function inviteFromAccessRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid request id" });
    }

    const { role, team = "", clientId = null, expiresInDays = 7 } = req.body || {};

    const request = await AccessRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, message: "Access request not found" });
    }
    if (!["pending", "approved"].includes(request.status)) {
      return res.status(400).json({ ok: false, message: "This request cannot be invited" });
    }

    const cleanRole = String(role || "").trim().toLowerCase();
    if (!cleanRole) {
      return res.status(400).json({ ok: false, message: "role is required" });
    }

    const roleExists = await ensureRoleExists(cleanRole);
    if (!roleExists) {
      return res.status(400).json({ ok: false, message: "Invalid role" });
    }

    const cleanTeam = String(team || "").trim();
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

    const existingUser = await User.findOne({ email: request.workEmail }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "A portal user already exists with this email",
      });
    }

    const invite = await issueInvite({
      email: request.workEmail,
      fullName: request.fullName,
      role: cleanRole,
      team: cleanTeam,
      clientId: clientResolution.value,
      expiresInDays,
      invitedBy: req.user?.id || req.user?._id || null,
      accessRequestId: request._id,
    });

    request.status = "invited";
    request.reviewedBy = request.reviewedBy || req.user?.id || req.user?._id || null;
    request.reviewedAt = request.reviewedAt || new Date();
    request.inviteId = invite._id;
    await request.save();

    await logAudit(req, {
      action: "access_request.invited",
      meta: {
        accessRequestId: id,
        inviteId: invite._id,
        workEmail: request.workEmail,
        role: cleanRole,
      },
    });

    return res.json({ ok: true, item: request });
  } catch (err) {
    console.error("inviteFromAccessRequest error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
