import mongoose from "mongoose";
import ProcurementRequest from "./request.model.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function oid(v) {
  return v && mongoose.Types.ObjectId.isValid(v) ? v : null;
}

const STATUS_TIMELINE_MAP = {
  assessing: "assessedAt",
  quoted: "quotedAt",
  approved: "approvedAt",
  ordered: "orderedAt",
  delivered: "deliveredAt",
  cancelled: "cancelledAt",
};

const POPULATE_LIST = [
  { path: "customerId", select: "companyName contactName" },
  { path: "categoryId", select: "name" },
  { path: "assignedTo", select: "firstName lastName email" },
  { path: "vendorId", select: "name" },
];

const POPULATE_DETAIL = [
  ...POPULATE_LIST,
  { path: "createdBy", select: "firstName lastName" },
];

// GET /api/procurement/requests/stats
export async function getDashboardStats(req, res) {
  try {
    const statuses = ["new", "assessing", "quoted", "approved", "ordered", "delivered", "cancelled"];
    const priorities = ["urgent", "high", "normal", "low"];

    const [total, ...statusCounts] = await Promise.all([
      ProcurementRequest.countDocuments(),
      ...statuses.map((s) => ProcurementRequest.countDocuments({ status: s })),
    ]);

    const priorityCounts = await Promise.all(
      priorities.map((p) => ProcurementRequest.countDocuments({ priority: p }))
    );

    const recentRequests = await ProcurementRequest.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate(POPULATE_LIST)
      .lean();

    const byStatus = Object.fromEntries(statuses.map((s, i) => [s, statusCounts[i]]));
    const byPriority = Object.fromEntries(priorities.map((p, i) => [p, priorityCounts[i]]));

    return res.json({ ok: true, total, byStatus, byPriority, recentRequests });
  } catch (e) {
    console.error("getDashboardStats:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/requests
export async function listRequests(req, res) {
  try {
    const {
      q = "",
      status = "",
      categoryId = "",
      customerId = "",
      assignedTo = "",
      priority = "",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (oid(categoryId)) filter.categoryId = categoryId;
    if (oid(customerId)) filter.customerId = customerId;
    if (oid(assignedTo)) filter.assignedTo = assignedTo;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ title: rx }, { ref: rx }];
    }

    const [total, items] = await Promise.all([
      ProcurementRequest.countDocuments(filter),
      ProcurementRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate(POPULATE_LIST)
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
    console.error("listRequests:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/requests/:id
export async function getRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await ProcurementRequest.findById(id)
      .populate(POPULATE_DETAIL)
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getRequest:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/procurement/requests
export async function createRequest(req, res) {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) {
      return res.status(400).json({ ok: false, message: "title is required" });
    }
    if (!oid(body.customerId)) {
      return res.status(400).json({ ok: false, message: "customerId is required" });
    }
    if (!oid(body.categoryId)) {
      return res.status(400).json({ ok: false, message: "categoryId is required" });
    }

    const doc = await ProcurementRequest.create({
      customerId: body.customerId,
      categoryId: body.categoryId,
      title,
      description: String(body.description || "").trim(),
      requirements: String(body.requirements || "").trim(),
      budget: body.budget != null ? Number(body.budget) : 0,
      currency: String(body.currency || "AED").trim(),
      priority: body.priority || "normal",
      status: "new",
      assignedTo: oid(body.assignedTo),
      vendorId: oid(body.vendorId),
      quotedAmount: body.quotedAmount != null ? Number(body.quotedAmount) : null,
      proposedDelivery: body.proposedDelivery ? new Date(body.proposedDelivery) : null,
      notes: String(body.notes || "").trim(),
      createdBy: req.user._id || req.user.id,
    });

    const populated = await doc.populate(POPULATE_DETAIL);
    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createRequest:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/requests/:id
export async function updateRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const existing = await ProcurementRequest.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });

    const body = req.body || {};

    if (typeof body.title !== "undefined") existing.title = String(body.title || "").trim();
    if (typeof body.description !== "undefined") existing.description = String(body.description || "").trim();
    if (typeof body.requirements !== "undefined") existing.requirements = String(body.requirements || "").trim();
    if (typeof body.budget !== "undefined") existing.budget = Number(body.budget);
    if (typeof body.currency !== "undefined") existing.currency = String(body.currency || "AED").trim();
    if (typeof body.priority !== "undefined") existing.priority = body.priority;
    if (typeof body.assignedTo !== "undefined") existing.assignedTo = oid(body.assignedTo);
    if (typeof body.vendorId !== "undefined") existing.vendorId = oid(body.vendorId);
    if (typeof body.quotedAmount !== "undefined") existing.quotedAmount = body.quotedAmount != null ? Number(body.quotedAmount) : null;
    if (typeof body.proposedDelivery !== "undefined") existing.proposedDelivery = body.proposedDelivery ? new Date(body.proposedDelivery) : null;
    if (typeof body.notes !== "undefined") existing.notes = String(body.notes || "").trim();
    if (typeof body.categoryId !== "undefined" && oid(body.categoryId)) existing.categoryId = body.categoryId;
    if (typeof body.customerId !== "undefined" && oid(body.customerId)) existing.customerId = body.customerId;

    // Handle status transition and timeline stamping
    if (body.status && body.status !== existing.status) {
      existing.status = body.status;
      const timelineField = STATUS_TIMELINE_MAP[body.status];
      if (timelineField) {
        existing.timeline[timelineField] = new Date();
      }
    }

    existing.updatedBy = req.user._id || req.user.id;

    await existing.save();
    await existing.populate(POPULATE_DETAIL);

    return res.json({ ok: true, item: existing.toObject() });
  } catch (e) {
    console.error("updateRequest:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// DELETE /api/procurement/requests/:id
export async function deleteRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const existing = await ProcurementRequest.findById(id).lean();
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });

    if (!["new", "cancelled"].includes(existing.status)) {
      return res.status(400).json({
        ok: false,
        message: "Cannot delete: only requests with status 'new' or 'cancelled' can be deleted.",
      });
    }

    await ProcurementRequest.findByIdAndDelete(id);
    return res.json({ ok: true, item: existing });
  } catch (e) {
    console.error("deleteRequest:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}
