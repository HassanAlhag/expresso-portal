import mongoose from "mongoose";
import Account from "./account.model.js";
import Deal from "../deals/deal.model.js";
import ProcurementRequest from "../../procurement/request.model.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "name",
    "-name",
    "industry",
    "-industry",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

export async function listAccounts(req, res) {
  try {
    const {
      q = "",
      status = "",
      industry = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = String(status).trim().toLowerCase();
    if (industry) filter.industry = String(industry).trim();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { name: rx },
        { legalName: rx },
        { industry: rx },
        { website: rx },
        { email: rx },
        { phone: rx },
        { country: rx },
        { city: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Account.countDocuments(filter),
      Account.find(filter)
        .populate("ownerUserId", "fullName email")
        .populate("customerId", "companyName contactName")
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
  } catch (e) {
    console.error("listAccounts:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getAccount(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Account.findById(id)
      .populate("ownerUserId", "fullName email")
      .populate("customerId", "companyName contactName primaryEmail phone")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Account not found" });
    }

    const [deals, procurementRequests] = await Promise.all([
      Deal.find({ accountId: item._id })
        .populate("ownerUserId", "fullName email")
        .populate("customerId", "companyName contactName")
        .sort({ createdAt: -1 })
        .lean(),
      item.customerId
        ? ProcurementRequest.find({ customerId: item.customerId._id || item.customerId })
            .populate("categoryId", "name")
            .populate("assignedTo", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        : [],
    ]);

    return res.json({
      ok: true,
      item,
      related: {
        deals,
        procurementRequests,
      },
    });
  } catch (e) {
    console.error("getAccount:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createAccount(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();

    if (!name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const item = await Account.create({
      name,
      legalName: String(body.legalName || "").trim(),
      industry: String(body.industry || "").trim(),
      website: String(body.website || "").trim(),
      phone: String(body.phone || "").trim(),
      email: String(body.email || "")
        .trim()
        .toLowerCase(),
      country: String(body.country || "").trim(),
      city: String(body.city || "").trim(),
      address: String(body.address || "").trim(),
      ownerUserId: validId(body.ownerUserId) ? body.ownerUserId : null,
      customerId: validId(body.customerId) ? body.customerId : null,
      status: String(body.status || "active")
        .trim()
        .toLowerCase(),
      notes: String(body.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createAccount:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.name !== "undefined") {
      patch.name = String(body.name || "").trim();
    }

    if (typeof body.legalName !== "undefined") {
      patch.legalName = String(body.legalName || "").trim();
    }

    if (typeof body.industry !== "undefined") {
      patch.industry = String(body.industry || "").trim();
    }

    if (typeof body.website !== "undefined") {
      patch.website = String(body.website || "").trim();
    }

    if (typeof body.phone !== "undefined") {
      patch.phone = String(body.phone || "").trim();
    }

    if (typeof body.email !== "undefined") {
      patch.email = String(body.email || "")
        .trim()
        .toLowerCase();
    }

    if (typeof body.country !== "undefined") {
      patch.country = String(body.country || "").trim();
    }

    if (typeof body.city !== "undefined") {
      patch.city = String(body.city || "").trim();
    }

    if (typeof body.address !== "undefined") {
      patch.address = String(body.address || "").trim();
    }

    if (typeof body.ownerUserId !== "undefined") {
      patch.ownerUserId = validId(body.ownerUserId) ? body.ownerUserId : null;
    }

    if (typeof body.customerId !== "undefined") {
      patch.customerId = validId(body.customerId) ? body.customerId : null;
    }

    if (typeof body.status !== "undefined") {
      patch.status = String(body.status || "active")
        .trim()
        .toLowerCase();
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Account.findByIdAndUpdate(id, patch, { new: true })
      .populate("ownerUserId", "fullName email")
      .populate("customerId", "companyName contactName")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Account not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateAccount:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteAccount(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Account.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Account not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteAccount:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
