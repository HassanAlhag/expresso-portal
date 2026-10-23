import mongoose from "mongoose";
import Invoice from "./invoice.model.js";
import { canSeeAllTenantRecords } from "../../utils/accessControl.js";
import { nextNumber, highestInUse, raiseCounter, isDuplicateKey, parseNumber } from "../../utils/sequence.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt", "-createdAt",
    "updatedAt", "-updatedAt",
    "dueDate", "-dueDate",
    "total", "-total",
    "status", "-status",
    "balance", "-balance",
  ]);
  if (!allowed.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

function canSeeAll(req) {
  return canSeeAllTenantRecords(req);
}

// Invoice numbers stay INV-YYYY-NNNN and unique (unique index on `number`).
// They now come from an atomic counter, so simultaneous creations no longer
// compute the same number and fail (remediation P2-3).
export function nextInvoiceNumber(year) {
  return nextNumber({ Model: Invoice, field: "number", label: "INV", key: "invoice", year });
}

// A number typed by hand in the standard format moves that year's counter
// past it, so automatic numbering never runs into it later.
async function keepCounterAbove(number) {
  const parsed = parseNumber(number, { label: "INV", key: "invoice" });
  if (parsed) await raiseCounter(parsed.counterKey, parsed.seq);
}

const ALLOCATION_FAILED = "Could not allocate an invoice number right now. Nothing was created. Please try again.";

const MAX_NUMBER_ATTEMPTS = 5;

const VALID_STATUSES = ["draft", "sent", "paid", "overdue", "void"];
const VALID_METHODS = ["bank_transfer", "cash", "card", "cheque", "online", "other"];

// GET /api/billing/invoices
export async function listInvoices(req, res) {
  try {
    const {
      q = "",
      status = "",
      customerId = "",
      projectId = "",
      enrollmentId = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};

    if (!canSeeAll(req)) {
      if (!req.user?.clientId)
        return res.json({ ok: true, items: [], page: 1, pages: 1, total: 0, limit: limitNum });
      filter.customerId = req.user.clientId;
    } else {
      if (customerId && mongoose.Types.ObjectId.isValid(customerId))
        filter.customerId = customerId;
      if (projectId && mongoose.Types.ObjectId.isValid(projectId))
        filter.projectId = projectId;
      if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId))
        filter.enrollmentId = enrollmentId;
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
        .populate("projectId", "name title")
        .populate("enrollmentId", "name title")
        .lean(),
    ]);

    return res.json({
      ok: true,
      items: canSeeAll(req) ? items : items.map(withoutRecorder),
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

// Who recorded a payment is internal staff information: client users get
// their payments without it (PUI-5).
function withoutRecorder(item) {
  if (!item || !Array.isArray(item.payments)) return item;
  return { ...item, payments: item.payments.map(({ recordedBy, ...p }) => p) };
}

// GET /api/billing/invoices/:id
export async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail phone country industry")
      .populate("projectId", "name title _id")
      .populate("enrollmentId", "name title _id")
      .populate("payments.recordedBy", "name email")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    if (!canSeeAll(req)) {
      const cid = String(req.user?.clientId || "");
      if (!cid || String(item.customerId?._id || item.customerId) !== cid)
        return res.status(403).json({ ok: false, message: "Forbidden" });
      return res.json({ ok: true, item: withoutRecorder(item) });
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
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const {
      customerId,
      currency = "AED",
      dueDate = null,
      notes = "",
      tax = 0,
      taxRate = 0,
      discount = 0,
      items = [],
      status = "draft",
      number,
      projectId,
      enrollmentId,
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ ok: false, message: "Valid customerId required" });

    const manualNumber = number?.trim() || "";
    const fields = {
      customerId,
      currency: String(currency || "AED").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: String(notes || "").trim(),
      tax: Number(tax || 0),
      taxRate: Number(taxRate || 0),
      discount: Number(discount || 0),
      items: Array.isArray(items) ? items : [],
      status: VALID_STATUSES.includes(status) ? status : "draft",
      issuedAt: status === "sent" ? new Date() : null,
      paidAt: status === "paid" ? new Date() : null,
      projectId: projectId && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
      enrollmentId: enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId) ? enrollmentId : null,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    };

    // One write per attempt, so a failed attempt leaves nothing behind.
    let doc = null;
    for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS && !doc; attempt += 1) {
      let allocated = null;
      if (!manualNumber) {
        try {
          allocated = await nextInvoiceNumber();
        } catch (allocErr) {
          console.error("createInvoice: number allocation failed:", allocErr?.message);
          return res.status(503).json({ ok: false, message: ALLOCATION_FAILED });
        }
      }
      try {
        doc = await Invoice.create({ ...fields, number: manualNumber || allocated.value });
      } catch (e) {
        if (!isDuplicateKey(e, "number")) throw e;
        if (manualNumber) {
          return res.status(409).json({ ok: false, message: `Invoice number ${manualNumber} is already in use` });
        }
        // The counter is behind a number entered by hand: move it past the
        // highest stored number and try again.
        await raiseCounter(allocated.counterKey, await highestInUse(Invoice, "number", allocated.prefix));
      }
    }
    if (!doc) {
      return res.status(409).json({ ok: false, message: "Could not allocate an invoice number. Please try again." });
    }
    if (manualNumber) await keepCounterAbove(manualNumber).catch((e) => console.error("createInvoice: counter update failed:", e?.message));

    const item = await Invoice.findById(doc._id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("projectId", "name title _id")
      .populate("enrollmentId", "name title _id")
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
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    const editable = [
      "currency", "dueDate", "notes", "tax", "taxRate", "discount",
      "items", "status", "number", "uploads", "projectId", "enrollmentId",
    ];
    for (const k of editable) {
      if (typeof body[k] !== "undefined") patch[k] = body[k];
    }

    if (typeof patch.dueDate !== "undefined")
      patch.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
    if (typeof patch.tax !== "undefined") patch.tax = Number(patch.tax || 0);
    if (typeof patch.taxRate !== "undefined") patch.taxRate = Number(patch.taxRate || 0);
    if (typeof patch.discount !== "undefined") patch.discount = Number(patch.discount || 0);
    if (typeof patch.currency !== "undefined")
      patch.currency = String(patch.currency || "AED").trim();
    if (typeof patch.notes !== "undefined")
      patch.notes = String(patch.notes || "").trim();
    if (typeof patch.number !== "undefined")
      patch.number = String(patch.number || "").trim() || undefined;
    if (typeof patch.projectId !== "undefined")
      patch.projectId = patch.projectId && mongoose.Types.ObjectId.isValid(patch.projectId) ? patch.projectId : null;
    if (typeof patch.enrollmentId !== "undefined")
      patch.enrollmentId = patch.enrollmentId && mongoose.Types.ObjectId.isValid(patch.enrollmentId) ? patch.enrollmentId : null;

    if (typeof patch.status !== "undefined") {
      const s = String(patch.status || "draft");
      if (s === "sent") patch.issuedAt = new Date();
      if (s === "paid") patch.paidAt = new Date();
      if (s === "draft") { patch.issuedAt = null; patch.paidAt = null; }
      patch.status = VALID_STATUSES.includes(s) ? s : "draft";
    }

    const doc = await Invoice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    Object.assign(doc, patch);
    await doc.save();
    if (patch.number) await keepCounterAbove(patch.number).catch((e) => console.error("updateInvoice: counter update failed:", e?.message));

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("projectId", "name title _id")
      .populate("enrollmentId", "name title _id")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    if (isDuplicateKey(e, "number")) {
      return res.status(409).json({ ok: false, message: "That invoice number is already in use" });
    }
    console.error("updateInvoice:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices/:id/mark-paid
export async function markInvoicePaid(req, res) {
  try {
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    // Record the outstanding balance as a payment so amountPaid/balance stay
    // consistent with the status (previously only the status changed; B6).
    const doc = await Invoice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    if (doc.status === "void") {
      return res.status(409).json({ ok: false, message: "A void invoice cannot be marked paid" });
    }

    const outstanding = Math.max(0, Number(doc.total || 0) - Number(doc.amountPaid || 0));
    if (outstanding > 0) {
      const METHODS = ["bank_transfer", "cash", "card", "cheque", "online", "other"];
      const method = METHODS.includes(req.body?.method) ? req.body.method : "other";
      doc.payments.push({
        amount: outstanding,
        method,
        note: String(req.body?.note || "Marked as paid").trim(),
        paidAt: new Date(),
        recordedBy: req.user?.id || null,
      });
    }
    doc.status = "paid";
    doc.paidAt = new Date();
    doc.updatedBy = req.user?.id || null;
    await doc.save(); // pre-save recomputes amountPaid and balance

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .lean();
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("markInvoicePaid:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices/:id/void
export async function voidInvoice(req, res) {
  try {
    if (!canSeeAll(req))
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

// POST /api/billing/invoices/:id/payments
export async function recordPayment(req, res) {
  try {
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const { amount, method = "bank_transfer", note = "", paidAt } = req.body || {};
    const amt = Number(amount || 0);
    if (amt <= 0)
      return res.status(400).json({ ok: false, message: "Amount must be positive" });

    const doc = await Invoice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    if (doc.status === "void")
      return res.status(400).json({ ok: false, message: "Cannot add payment to voided invoice" });

    doc.payments.push({
      amount: amt,
      method: VALID_METHODS.includes(method) ? method : "bank_transfer",
      note: String(note || "").trim(),
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      recordedBy: req.user?.id || null,
    });
    doc.updatedBy = req.user?.id || null;
    await doc.save(); // pre-save computes amountPaid and balance

    // auto-promote to paid when fully settled
    if (doc.balance <= 0 && !["paid", "void"].includes(doc.status)) {
      doc.status = "paid";
      doc.paidAt = new Date();
      await doc.save();
    }

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("payments.recordedBy", "name email")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("recordPayment:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// DELETE /api/billing/invoices/:id/payments/:payId
export async function deletePayment(req, res) {
  try {
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const { id, payId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(payId))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const doc = await Invoice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    const before = doc.payments.length;
    doc.payments = doc.payments.filter((p) => String(p._id) !== payId);
    if (doc.payments.length === before)
      return res.status(404).json({ ok: false, message: "Payment not found" });

    doc.updatedBy = req.user?.id || null;
    await doc.save();

    const item = await Invoice.findById(id)
      .populate("customerId", "companyName contactName primaryEmail")
      .populate("payments.recordedBy", "name email")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("deletePayment:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/billing/invoices/mark-overdue
export async function markOverdueInvoices(req, res) {
  try {
    if (!canSeeAll(req))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const result = await Invoice.updateMany(
      { status: "sent", dueDate: { $lt: new Date(), $ne: null } },
      { $set: { status: "overdue" } }
    );

    return res.json({ ok: true, updated: result.modifiedCount });
  } catch (e) {
    console.error("markOverdueInvoices:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
