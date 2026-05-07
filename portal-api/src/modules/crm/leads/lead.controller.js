import mongoose from "mongoose";
import Lead from "./lead.model.js";
import Deal from "../deals/deal.model.js";

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
        { notes: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate("ownerUserId", "fullName email role")
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

    const item = await Lead.create({
      fullName,
      companyName: String(body.companyName || "").trim(),
      email: String(body.email || "")
        .trim()
        .toLowerCase(),
      phone: String(body.phone || "").trim(),
      source: String(body.source || "manual")
        .trim()
        .toLowerCase(),
      status: String(body.status || "new")
        .trim()
        .toLowerCase(),
      ownerUserId:
        body.ownerUserId && mongoose.Types.ObjectId.isValid(body.ownerUserId)
          ? body.ownerUserId
          : null,
      notes: String(body.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

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

    if (typeof body.source !== "undefined") {
      patch.source = String(body.source || "manual")
        .trim()
        .toLowerCase();
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

    if (!item) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

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

export async function convertLeadToDeal(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const lead = await Lead.findById(id).lean();
    if (!lead) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

    const existingDeal = await Deal.findOne({ leadId: lead._id })
      .select("_id")
      .lean();

    if (existingDeal) {
      return res.status(409).json({
        ok: false,
        message: "This lead is already linked to a deal",
      });
    }

    const item = await Deal.create({
      title:
        String(body.title || "").trim() ||
        (lead.companyName
          ? `${lead.companyName} Opportunity`
          : `${lead.fullName} Opportunity`),
      pipeline: "sales",
      stage: "discovery",
      status: "open",
      leadId: lead._id,
      value: Number(body.value || 0),
      currency: String(body.currency || "AED")
        .trim()
        .toUpperCase(),
      source: String(lead.source || "manual")
        .trim()
        .toLowerCase(),
      ownerUserId: lead.ownerUserId || null,
      notes: String(lead.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    await Lead.findByIdAndUpdate(lead._id, {
      status: "converted",
      convertedDealId: item._id,
      convertedAt: new Date(),
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Lead converted to deal successfully",
      item,
    });
  } catch (e) {
    console.error("convertLeadToDeal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
