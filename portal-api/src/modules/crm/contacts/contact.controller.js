import mongoose from "mongoose";
import Contact from "./contact.model.js";
import Activity from "../activities/activity.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

const ALLOWED_SORT = new Set([
  "createdAt", "-createdAt", "fullName", "-fullName",
  "email", "-email", "updatedAt", "-updatedAt",
]);

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  if (!ALLOWED_SORT.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  return { [key]: raw.startsWith("-") ? -1 : 1 };
}

export async function listContacts(req, res) {
  try {
    const {
      q = "",
      accountId = "",
      customerId = "",
      ownerUserId = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (validId(accountId)) filter.accountId = accountId;
    if (validId(customerId)) filter.customerId = customerId;
    if (validId(ownerUserId)) filter.ownerUserId = ownerUserId;

    const rx = safeRx(q);
    if (rx) {
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { phone: rx },
        { jobTitle: rx },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [total, items] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.find(filter)
        .populate("accountId", "name industry")
        .populate("customerId", "companyName contactName")
        .populate("ownerUserId", "fullName email")
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
    console.error("listContacts:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getContact(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Contact.findById(id)
      .populate("accountId", "name industry website phone email")
      .populate("customerId", "companyName contactName primaryEmail phone")
      .populate("ownerUserId", "fullName email avatarUrl")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Contact not found" });
    }

    const activities = await Activity.find({
      entityType: "contact",
      entityId: item._id,
    })
      .populate("assignedTo", "fullName email")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ ok: true, item, related: { activities } });
  } catch (e) {
    console.error("getContact:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createContact(req, res) {
  try {
    const body = req.body || {};

    const fullName = String(body.fullName || "").trim();
    if (!fullName) {
      return res.status(400).json({ ok: false, message: "fullName is required" });
    }

    const item = await Contact.create({
      fullName,
      jobTitle: String(body.jobTitle || "").trim(),
      email: String(body.email || "").trim().toLowerCase(),
      phone: String(body.phone || "").trim(),
      whatsapp: String(body.whatsapp || "").trim(),
      accountId: validId(body.accountId) ? body.accountId : null,
      customerId: validId(body.customerId) ? body.customerId : null,
      leadId: validId(body.leadId) ? body.leadId : null,
      ownerUserId: validId(body.ownerUserId) ? body.ownerUserId : req.user?.id || null,
      isPrimary: Boolean(body.isPrimary),
      source: String(body.source || "manual").trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: String(body.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const populated = await Contact.findById(item._id)
      .populate("accountId", "name industry")
      .populate("customerId", "companyName contactName")
      .populate("ownerUserId", "fullName email")
      .lean();

    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createContact:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.fullName !== "undefined") {
      patch.fullName = String(body.fullName || "").trim();
    }
    if (typeof body.jobTitle !== "undefined") {
      patch.jobTitle = String(body.jobTitle || "").trim();
    }
    if (typeof body.email !== "undefined") {
      patch.email = String(body.email || "").trim().toLowerCase();
    }
    if (typeof body.phone !== "undefined") {
      patch.phone = String(body.phone || "").trim();
    }
    if (typeof body.whatsapp !== "undefined") {
      patch.whatsapp = String(body.whatsapp || "").trim();
    }
    if (typeof body.accountId !== "undefined") {
      patch.accountId = validId(body.accountId) ? body.accountId : null;
    }
    if (typeof body.customerId !== "undefined") {
      patch.customerId = validId(body.customerId) ? body.customerId : null;
    }
    if (typeof body.ownerUserId !== "undefined") {
      patch.ownerUserId = validId(body.ownerUserId) ? body.ownerUserId : null;
    }
    if (typeof body.isPrimary !== "undefined") {
      patch.isPrimary = Boolean(body.isPrimary);
    }
    if (typeof body.source !== "undefined") {
      patch.source = String(body.source || "manual").trim();
    }
    if (typeof body.tags !== "undefined") {
      patch.tags = Array.isArray(body.tags) ? body.tags : [];
    }
    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Contact.findByIdAndUpdate(id, patch, { new: true })
      .populate("accountId", "name industry")
      .populate("customerId", "companyName contactName")
      .populate("ownerUserId", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Contact not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateContact:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Contact.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Contact not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteContact:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
