import mongoose from "mongoose";
import Invoice from "./invoice.model.js";

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
    "dueDate",
    "-dueDate",
    "total",
    "-total",
    "status",
    "-status",
  ]);
  if (!allowed.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

function canSeeAll(req) {
  const role = String(req.user?.role || "").toLowerCase();
  return ["super_admin", "admin", "staff"].includes(role);
}

// GET /api/billing/invoices
export async function listInvoices(req, res) {
  try {
    const {
      q = "",
      status = "",
      customerId = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    // CLIENT role: only invoices for their customerId (stored in req.user.clientId)
    if (!canSeeAll(req)) {
      if (!req.user?.clientId)
        return res.json({
          ok: true,
          items: [],
          page: 1,
          pages: 1,
          total: 0,
          limit: limitNum,
        });
      filter.customerId = req.user.clientId;
    } else if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    if (status) filter.status = status;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ number: rx }, { notes: rx }, { currency: rx }];
    }

    const sortObj = safeSort(sort);

    const [total, items] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("customerId", "companyName contactName primaryEmail")
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
    console.error("listInvoices:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/billing/invoices/:id
export async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Invoice.findById(id)
      .populate(
        "customerId",
        "companyName contactName primaryEmail phone country industry"
      )
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    // client guard
    if (!canSeeAll(req)) {
      const cid = String(req.user?.clientId || "");
      if (!cid || String(item.customerId?._id || item.customerId) !== cid)
        return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getInvoice:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices
export async function createInvoice(req, res) {
  try {
    // only staff/admin
    const role = String(req.user?.role || "").toLowerCase();
    if (!["super_admin", "admin", "staff"].includes(role))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const {
      customerId,
      currency = "AED",
      dueDate = null,
      notes = "",
      tax = 0,
      items = [],
      status = "draft",
      number,
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res
        .status(400)
        .json({ ok: false, message: "Valid customerId required" });

    const doc = await Invoice.create({
      customerId,
      currency: String(currency || "AED").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: String(notes || "").trim(),
      tax: Number(tax || 0),
      items: Array.isArray(items) ? items : [],
      status: ["draft", "sent", "paid", "overdue", "void"].includes(status)
        ? status
        : "draft",
      number: String(number || "").trim() || undefined,
      issuedAt: status === "sent" ? new Date() : null,
      paidAt: status === "paid" ? new Date() : null,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const item = await Invoice.findById(doc._id)
      .populate("customerId", "companyName contactName primaryEmail")
      .lean();

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createInvoice:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/billing/invoices/:id
export async function updateInvoice(req, res) {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!["super_admin", "admin", "staff"].includes(role))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    const editable = [
      "currency",
      "dueDate",
      "notes",
      "tax",
      "items",
      "status",
      "number",
      "uploads",
    ];
    for (const k of editable) {
      if (typeof body[k] !== "undefined") patch[k] = body[k];
    }

    if (typeof patch.dueDate !== "undefined") {
      patch.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
    }
    if (typeof patch.tax !== "undefined") patch.tax = Number(patch.tax || 0);
    if (typeof patch.currency !== "undefined")
      patch.currency = String(patch.currency || "AED").trim();
    if (typeof patch.notes !== "undefined")
      patch.notes = String(patch.notes || "").trim();
    if (typeof patch.number !== "undefined")
      patch.number = String(patch.number || "").trim() || undefined;

    // handle status timestamps
    if (typeof patch.status !== "undefined") {
      const s = String(patch.status || "draft");
      if (s === "sent") patch.issuedAt = new Date();
      if (s === "paid") patch.paidAt = new Date();
      if (s === "draft") {
        patch.issuedAt = null;
        patch.paidAt = null;
      }
      patch.status = ["draft", "sent", "paid", "overdue", "void"].includes(s)
        ? s
        : "draft";
    }

    let doc = await Invoice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    // apply patch and save (pre-save recalculates totals)
    Object.assign(doc, patch);
    await doc.save();

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateInvoice:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices/:id/mark-paid
export async function markInvoicePaid(req, res) {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!["super_admin", "admin", "staff"].includes(role))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Invoice.findByIdAndUpdate(
      id,
      { status: "paid", paidAt: new Date(), updatedBy: req.user?.id || null },
      { new: true }
    )
      .populate("customerId", "companyName contactName primaryEmail")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("markInvoicePaid:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices/:id/void
export async function voidInvoice(req, res) {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!["super_admin", "admin"].includes(role))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Invoice.findByIdAndUpdate(
      id,
      { status: "void", updatedBy: req.user?.id || null },
      { new: true }
    )
      .populate("customerId", "companyName contactName primaryEmail")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("voidInvoice:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
