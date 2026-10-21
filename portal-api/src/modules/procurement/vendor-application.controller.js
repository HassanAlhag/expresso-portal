import mongoose from "mongoose";
import VendorApplication from "./vendor-application.model.js";
import ProcurementVendor from "./vendor.model.js";
import User from "../iam/users/user.model.js";
import Invite from "../iam/invites/invite.model.js";
import { createInviteRecord, sendInviteEmail } from "../iam/invites/invite.controller.js";
import { logAudit } from "../iam/audit/audit.service.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const POPULATE_SELECTIONS = [
  { path: "categorySelections.mainCategoryId", select: "name code" },
  { path: "categorySelections.categoryId", select: "name code" },
  { path: "categorySelections.subcategoryId", select: "name code" },
];

// POST /api/vendor-applications  — public, no auth
export async function registerVendorApplication(req, res) {
  try {
    const body = req.body || {};

    const companyName = String(body.companyName || "").trim();
    const contactName = String(body.contactName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!companyName || !contactName || !email) {
      return res.status(400).json({
        ok: false,
        message: "companyName, contactName, and email are required",
      });
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email address" });
    }

    const existing = await VendorApplication.findOne({ email, status: { $ne: "rejected" } }).lean();
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "An application with this email already exists",
      });
    }

    const selections = Array.isArray(body.categorySelections) ? body.categorySelections : [];
    if (selections.length < 1 || selections.length > 3) {
      return res.status(400).json({
        ok: false,
        message: "Select between 1 and 3 categories",
      });
    }

    for (const sel of selections) {
      if (!validId(sel.mainCategoryId) || !validId(sel.categoryId) || !validId(sel.subcategoryId)) {
        return res.status(400).json({
          ok: false,
          message: "Each category selection must include valid mainCategoryId, categoryId, and subcategoryId",
        });
      }
    }

    const doc = await VendorApplication.create({
      companyName,
      contactName,
      email,
      phone: String(body.phone || "").trim(),
      country: String(body.country || "UAE").trim(),
      website: String(body.website || "").trim(),
      categorySelections: selections,
      status: "pending",
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("registerVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// GET /api/vendor-applications  — admin/staff
export async function listVendorApplications(req, res) {
  try {
    const {
      status = "",
      q = "",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = status;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { companyName: rx },
        { contactName: rx },
        { email: rx },
        { country: rx },
      ];
    }

    const [total, items] = await Promise.all([
      VendorApplication.countDocuments(filter),
      VendorApplication.find(filter)
        .populate(POPULATE_SELECTIONS)
        .populate("approvedBy", "fullName email")
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
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
  } catch (e) {
    console.error("listVendorApplications:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// GET /api/vendor-applications/:id  — admin/staff
export async function getVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await VendorApplication.findById(id)
      .populate(POPULATE_SELECTIONS)
      .populate("approvedBy", "fullName email")
      .populate("userId", "fullName email")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Application not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// PATCH /api/vendor-applications/:id/approve  — admin
//
// Approval creates the vendor profile and an email invitation with an
// expiring, single-use token. The vendor sets their own password when
// accepting; no password is generated or shown to staff. The portal account is
// created on acceptance and linked to this vendor profile.
//
// The writes are ordered so a failure never leaves a half-approved vendor:
// profile, then invitation, then a conditional status change on the
// application. If any step fails, the records created by this request are
// removed again. The conditional update also stops two approvals racing: the
// losing request removes what it created and returns 409.
//
// If the process stops before the application is marked approved, an
// unlinked vendor profile (and possibly an undelivered invitation) remain
// while the application is still pending. Approving again resumes: the
// profile is reused and the undelivered invitation is cancelled and replaced,
// so there is still one profile and one active invitation.

// Leftover records younger than this may belong to an approval that is still
// running, so they are not reused yet.
export const LEFTOVER_STALE_MS = 2 * 60 * 1000;

export async function approveVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const application = await VendorApplication.findById(id).lean();
    if (!application) return res.status(404).json({ ok: false, message: "Application not found" });

    if (application.status === "approved") {
      return res.status(409).json({ ok: false, message: "Application already approved" });
    }

    const email = String(application.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: "Application has no email address" });

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: `A portal user already exists for ${email}`,
      });
    }

    // Records left by an earlier approval of this application that stopped
    // part-way (the application never became "approved"). They are reused or
    // replaced only once they are older than LEFTOVER_STALE_MS, so a second
    // click while the first approval is still running gets a 409 instead.
    const staleBefore = new Date(Date.now() - LEFTOVER_STALE_MS);
    const leftoverVendors = await ProcurementVendor.find({
      applicationId: application._id,
      userId: null,
    })
      .select("_id createdAt isActive")
      .sort({ createdAt: -1 })
      .lean();
    const leftoverIds = new Set(leftoverVendors.map((v) => String(v._id)));

    const pendingInvites = await Invite.find({
      email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .select("_id vendorId createdAt")
      .lean();
    const ownLeftoverInvites = [];
    for (const inv of pendingInvites) {
      if (!inv.vendorId || !leftoverIds.has(String(inv.vendorId))) {
        return res.status(409).json({
          ok: false,
          message: `A pending invitation already exists for ${email}`,
        });
      }
      ownLeftoverInvites.push(inv);
    }

    const inProgress =
      leftoverVendors.some((v) => !(v.createdAt < staleBefore)) ||
      ownLeftoverInvites.some((i) => !(i.createdAt < staleBefore));
    if (inProgress) {
      return res.status(409).json({
        ok: false,
        message: "This application is already being approved. Refresh the page in a few minutes.",
      });
    }

    const categoryIds = (application.categorySelections || []).map((s) => s.subcategoryId);
    const reusable = leftoverVendors.find((v) => v.isActive !== false) || null;
    if (leftoverVendors.length || ownLeftoverInvites.length) {
      console.warn(
        `approveVendorApplication: resuming interrupted approval of ${application._id}` +
          ` (leftover vendor profiles: ${leftoverVendors.map((v) => v._id).join(",") || "none"};` +
          ` leftover invitations: ${ownLeftoverInvites.map((i) => i._id).join(",") || "none"})`
      );
    }

    let vendor = null;
    let createdVendor = false;
    let invite = null;
    let rawToken = null;
    try {
      // Never-delivered invitations from the interrupted attempt are cancelled
      // (their links were never emailed) so only one active invitation exists.
      for (const inv of ownLeftoverInvites) {
        await Invite.updateOne(
          { _id: inv._id, status: "pending" },
          { $set: { status: "cancelled", cancelledAt: new Date() } }
        );
      }

      if (reusable) {
        await ProcurementVendor.updateOne(
          { _id: reusable._id, userId: null },
          {
            $set: {
              name: application.companyName,
              email,
              phone: application.phone || "",
              contactPerson: application.contactName,
              country: application.country || "UAE",
              website: application.website || "",
              categories: categoryIds,
              isActive: true,
            },
          }
        );
        vendor = { _id: reusable._id, name: application.companyName };
      } else {
        vendor = await ProcurementVendor.create({
          name: application.companyName,
          email,
          phone: application.phone || "",
          contactPerson: application.contactName,
          country: application.country || "UAE",
          website: application.website || "",
          categories: categoryIds,
          applicationId: application._id,
          userId: null,
          isActive: true,
        });
        createdVendor = true;
      }

      ({ invite, rawToken } = await createInviteRecord({
        email,
        fullName: application.contactName || "",
        role: "vendor",
        invitedBy: req.user?.id || null,
        vendorId: vendor._id,
      }));

      const updated = await VendorApplication.updateOne(
        { _id: application._id, status: { $ne: "approved" } },
        {
          $set: {
            status: "approved",
            approvedBy: req.user?.id || null,
            approvedAt: new Date(),
            vendorId: vendor._id,
          },
        }
      );
      if (!updated?.modifiedCount) {
        const conflict = new Error("Application already approved");
        conflict.status = 409;
        throw conflict;
      }
    } catch (err) {
      // Undo what this request created; nothing else is touched.
      try {
        if (invite?._id) await Invite.deleteOne({ _id: invite._id });
      } catch (cleanupErr) {
        console.error("approveVendorApplication: could not remove invitation:", cleanupErr?.message);
      }
      try {
        // Only a profile created by this request is removed. A reused leftover
        // stays (unlinked, application not approved) for the next retry.
        if (createdVendor && vendor?._id) await ProcurementVendor.deleteOne({ _id: vendor._id });
      } catch (cleanupErr) {
        console.error("approveVendorApplication: could not remove vendor profile:", cleanupErr?.message);
      }
      if (err.status === 409) return res.status(409).json({ ok: false, message: err.message });
      throw err;
    }

    // The approval is complete. If the email cannot be sent, staff can resend
    // the invitation from the Invites page (which issues a fresh token).
    let emailSent = true;
    try {
      await sendInviteEmail({
        email,
        fullName: application.contactName || "",
        rawToken,
        role: "vendor",
      });
    } catch (mailErr) {
      emailSent = false;
      console.error("approveVendorApplication: invitation email failed:", mailErr?.message);
    }

    await logAudit(req, {
      action: "vendor.approved",
      meta: {
        applicationId: application._id,
        vendorId: vendor._id,
        inviteId: invite._id,
        email,
        resumed: Boolean(leftoverVendors.length || ownLeftoverInvites.length),
        emailSent,
      },
    });

    const item = await VendorApplication.findById(application._id).lean();
    return res.json({
      ok: true,
      item,
      vendor: { _id: vendor._id, name: vendor.name },
      invitation: {
        email,
        expiresAt: invite.expiresAt,
        emailSent,
      },
    });
  } catch (e) {
    console.error("approveVendorApplication:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/vendor-applications/:id/reject  — admin
export async function rejectVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const application = await VendorApplication.findById(id);
    if (!application) return res.status(404).json({ ok: false, message: "Application not found" });

    if (application.status === "approved") {
      return res.status(409).json({ ok: false, message: "Cannot reject an already approved application" });
    }

    application.status = "rejected";
    application.rejectionReason = String(req.body?.reason || "").trim();
    await application.save();

    return res.json({ ok: true, item: application });
  } catch (e) {
    console.error("rejectVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}
