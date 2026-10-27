import mongoose from "mongoose";
import Lead from "./lead.model.js";
import Deal from "../deals/deal.model.js";
import User from "../../iam/users/user.model.js";
import {
  ensureAccountForLead,
  buildLeadPayload,
  ensureContactForLead,
  normalizeLeadSource,
  PLAN_BUILDER_SOURCE,
} from "./lead.service.js";
import { runInTransaction, TransactionUnsupportedError } from "../../../utils/transaction.js";

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
    "fullName",
    "-fullName",
    "companyName",
    "-companyName",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

export async function listLeadAssignees(_req, res) {
  try {
    const users = await User.find({
      isActive: true,
      role: {
        $in: [
          "super_admin",
          "admin",
          "operations_manager",
          "project_manager",
          "staff",
        ],
      },
    })
      .select("fullName email role team jobTitle avatarUrl")
      .sort({ fullName: 1, email: 1 })
      .limit(200)
      .lean();

    return res.json({ ok: true, items: users, users });
  } catch (e) {
    console.error("listLeadAssignees:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function listLeads(req, res) {
  try {
    const {
      q = "",
      status = "",
      source = "",
      includeConverted = "false",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    if (status) {
      filter.status = String(status).trim().toLowerCase();
    } else if (includeConverted !== "true") {
      filter.status = { $ne: "converted" };
    }

    if (source) filter.source = String(source).trim().toLowerCase();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { fullName: rx },
        { companyName: rx },
        { email: rx },
        { phone: rx },
        { service: rx },
        { notes: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate("ownerUserId", "fullName email role")
        .populate("convertedToAccountId", "name email phone status")
        .populate("convertedDealId", "title stage")
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (e) {
    console.error("listLeads:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getLeadById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Lead.findById(id)
      .populate("ownerUserId", "fullName email role")
      .populate("convertedToAccountId", "name email phone status")
      .populate("convertedDealId", "title stage value currency")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getLeadById:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createLead(req, res) {
  try {
    const body = req.body || {};

    const fullName = String(body.fullName || "").trim();
    if (!fullName) {
      return res
        .status(400)
        .json({ ok: false, message: "fullName is required" });
    }

    const created = await Lead.create(buildLeadPayload(body, req.user?.id));
    await ensureContactForLead(created, req.user?.id);

    const item = await Lead.findById(created._id)
      .populate("ownerUserId", "fullName email role")
      .lean();

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createLead:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateLead(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const existingLead = await Lead.findById(id).select("source").lean();

    if (!existingLead) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.fullName !== "undefined") {
      patch.fullName = String(body.fullName || "").trim();
    }

    if (typeof body.companyName !== "undefined") {
      patch.companyName = String(body.companyName || "").trim();
    }

    if (typeof body.email !== "undefined") {
      patch.email = String(body.email || "")
        .trim()
        .toLowerCase();
    }

    if (typeof body.phone !== "undefined") {
      patch.phone = String(body.phone || "").trim();
    }

    if (typeof body.service !== "undefined") {
      patch.service = String(body.service || "").trim();
    }

    if (typeof body.source !== "undefined") {
      patch.source =
        existingLead.source === PLAN_BUILDER_SOURCE
          ? PLAN_BUILDER_SOURCE
          : normalizeLeadSource(body.source);
    }

    if (typeof body.status !== "undefined") {
      patch.status = String(body.status || "new")
        .trim()
        .toLowerCase();
    }

    if (typeof body.ownerUserId !== "undefined") {
      patch.ownerUserId =
        body.ownerUserId && mongoose.Types.ObjectId.isValid(body.ownerUserId)
          ? body.ownerUserId
          : null;
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Lead.findByIdAndUpdate(id, patch, { new: true })
      .populate("ownerUserId", "fullName email role")
      .lean();

    await ensureContactForLead(item, req.user?.id);

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateLead:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteLead(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Lead.findByIdAndDelete(id).lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteLead:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// Thrown inside a conversion transaction when the lead's link changed between
// the read and the claim; the transaction is aborted (nothing saved).
class LeadConversionConflict extends Error {}

async function populatedDeal(id) {
  try {
    return await Deal.findById(id)
      .populate("ownerUserId", "fullName email role")
      .populate("accountId", "name email phone status")
      .populate("contactId", "fullName email phone")
      .populate("leadId", "fullName companyName email phone service source")
      .lean();
  } catch (e) {
    // The conversion is already committed; the response only loses display fields.
    console.warn("convertLeadToDeal: response population failed:", e?.message);
    return null;
  }
}

// POST /api/crm/leads/:id/convert (R4-C, P2-2)
// One transaction: claim the lead (convertedDealId set only if no deal is linked
// yet), find or create the account and contact, create the deal. A repeat or
// late retry returns the existing deal with alreadyConverted: true and writes
// nothing. convertedDealId is the canonical link; convertedToDealId (legacy) is
// read for older records but no longer written.
export async function convertLeadToDeal(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, message: "Invalid id" });
  }

  const actorId = req.user?.id || null;
  let outcome;
  try {
    outcome = await runInTransaction(async (session) => {
      const lead = await Lead.findById(id).session(session).lean();
      if (!lead) return { status: 404 };

      const linkedId = lead.convertedDealId || lead.convertedToDealId;
      let existing = linkedId ? await Deal.findById(linkedId).session(session).lean() : null;
      if (!existing) existing = await Deal.findOne({ leadId: lead._id }).session(session).lean();
      if (existing) return { status: 200, alreadyConverted: true, deal: existing };

      // Claim: only one conversion can link this lead. A simultaneous request
      // conflicts here and is retried by the driver, then finds the deal above.
      const dealId = new mongoose.Types.ObjectId();
      const claimed = await Lead.findOneAndUpdate(
        { _id: lead._id, convertedDealId: null, convertedToDealId: null },
        { $set: { status: "converted", convertedDealId: dealId, convertedAt: new Date(), updatedBy: actorId } },
        { new: true, session }
      ).lean();
      if (!claimed) throw new LeadConversionConflict();

      const account = await ensureAccountForLead(lead, actorId, { session });
      const contact = await ensureContactForLead(lead, actorId, { accountId: account?._id, session });

      const [deal] = await Deal.create(
        [
          {
            _id: dealId,
            title:
              String(body.title || "").trim() ||
              (lead.companyName ? `${lead.companyName} Opportunity` : `${lead.fullName} Opportunity`),
            pipeline: "sales",
            stage: "discovery",
            status: "open",
            leadId: lead._id,
            accountId: account?._id || null,
            contactId: contact?._id || null,
            value: Number(body.value || 0),
            currency: String(body.currency || "AED").trim().toUpperCase(),
            source: String(lead.source || "manual").trim().toLowerCase(),
            ownerUserId: lead.ownerUserId || null,
            notes: String(lead.notes || "").trim(),
            createdBy: actorId,
            updatedBy: actorId,
          },
        ],
        { session }
      );

      await Lead.updateOne(
        { _id: lead._id },
        { $set: { convertedToAccountId: account?._id || null } },
        { session }
      );

      return { status: 201, deal: deal.toObject(), account, contact };
    });
  } catch (e) {
    if (e instanceof TransactionUnsupportedError) {
      return res.status(503).json({
        ok: false,
        code: e.code,
        message: "Conversion is unavailable: the database does not support transactions. Nothing was changed.",
      });
    }
    if (e instanceof LeadConversionConflict) {
      return res.status(409).json({
        ok: false,
        message: "This lead's deal link changed during conversion. Refresh to see it; nothing was saved.",
      });
    }
    console.error("convertLeadToDeal:", e);
    return res.status(500).json({ ok: false, message: "The conversion didn't complete. Nothing was saved." });
  }

  if (outcome.status === 404) {
    return res.status(404).json({ ok: false, message: "Lead not found" });
  }

  const item = (await populatedDeal(outcome.deal._id)) || outcome.deal;
  if (outcome.alreadyConverted) {
    return res.status(200).json({ ok: true, message: "This lead is already converted", item, alreadyConverted: true });
  }
  return res.status(201).json({
    ok: true,
    message: "Lead converted to deal successfully",
    item,
    account: outcome.account,
    contact: outcome.contact,
  });
}
