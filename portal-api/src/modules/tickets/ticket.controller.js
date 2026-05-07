import mongoose from "mongoose";
import Ticket from "./ticket.model.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdmin(role) {
  return ["super_admin", "admin", "staff"].includes(role);
}

function safeSort(sort) {
  const raw = String(sort || "-lastActivityAt");
  const ALLOWED = new Set([
    "createdAt", "-createdAt",
    "updatedAt", "-updatedAt",
    "lastActivityAt", "-lastActivityAt",
    "priority", "-priority",
    "status", "-status",
    "dueDate", "-dueDate",
  ]);
  if (!ALLOWED.has(raw)) return { lastActivityAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  return { [key]: raw.startsWith("-") ? -1 : 1 };
}

function oid(v) {
  return v && mongoose.Types.ObjectId.isValid(v) ? v : null;
}

const ALLOWED_STATUSES = new Set([
  "open", "in_progress", "waiting_client", "waiting_vendor",
  "in_review", "escalated", "resolved", "closed",
]);

// GET /api/tickets/stats
export async function getTicketStats(req, res) {
  try {
    const baseFilter = {};
    if (!isAdmin(req.user.role)) baseFilter.clientId = req.user.id;

    const [byStatus, byPriority, byType, overdue] = await Promise.all([
      Ticket.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Ticket.countDocuments({
        ...baseFilter,
        dueDate: { $lt: new Date() },
        status: { $nin: ["resolved", "closed"] },
      }),
    ]);

    return res.json({
      ok: true,
      byStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
      byPriority: Object.fromEntries(byPriority.map((x) => [x._id, x.count])),
      byType: Object.fromEntries(byType.map((x) => [x._id, x.count])),
      overdue,
    });
  } catch (e) {
    console.error("getTicketStats:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/tickets
export async function listTickets(req, res) {
  try {
    const {
      q = "",
      status = "",
      category = "",
      priority = "",
      type = "",
      assigneeId = "",
      customerId = "",
      projectId = "",
      slaLevel = "",
      overdue = "",
      page = "1",
      limit = "20",
      sort = "-lastActivityAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const filter = {};

    if (!isAdmin(req.user.role)) filter.clientId = req.user.id;

    if (status && status !== "all") filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (slaLevel) filter.slaLevel = slaLevel;

    if (isAdmin(req.user.role)) {
      if (oid(customerId)) filter.customerId = customerId;
      if (oid(projectId)) filter.projectId = projectId;
      if (assigneeId === "unassigned") filter.assigneeId = null;
      else if (oid(assigneeId)) filter.assigneeId = assigneeId;
    }

    if (overdue === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ["resolved", "closed"] };
    }

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ title: rx }, { description: rx }, { ref: rx }, { tags: rx }];
    }

    const [total, items] = await Promise.all([
      Ticket.countDocuments(filter),
      Ticket.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select(
          "ref type title description status category priority slaLevel tags " +
          "clientId customerId projectId assigneeId dueDate estimatedHours estimatedCost " +
          "approvalStatus vendor budgetAmount firstResponseAt resolvedAt lastActivityAt createdAt updatedAt"
        )
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
    console.error("listTickets:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/tickets
export async function createTicket(req, res) {
  try {
    const {
      title,
      description,
      type = "support",
      category = "general",
      priority = "medium",
      slaLevel = "standard",
      customerId = null,
      projectId = null,
      assigneeId = null,
      dueDate = null,
      estimatedHours = null,
      estimatedCost = null,
      tags = [],
      vendor = null,
      vendorContact = null,
      budgetAmount = null,
      currency = "USD",
      purchaseOrderRef = null,
      deliveryDate = null,
    } = req.body || {};

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ ok: false, message: "title and description are required" });
    }

    const admin = isAdmin(req.user.role);

    const doc = await Ticket.create({
      clientId: req.user.id,
      customerId: oid(customerId),
      projectId: oid(projectId),
      assigneeId: admin ? oid(assigneeId) : null,
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      slaLevel,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours != null ? Number(estimatedHours) : null,
      estimatedCost: estimatedCost != null ? Number(estimatedCost) : null,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      approvalStatus: type === "change_request" ? "pending" : null,
      vendor: type === "procurement" ? vendor : null,
      vendorContact: type === "procurement" ? vendorContact : null,
      budgetAmount: type === "procurement" && budgetAmount != null ? Number(budgetAmount) : null,
      currency: type === "procurement" ? currency : "USD",
      purchaseOrderRef: type === "procurement" ? purchaseOrderRef : null,
      deliveryDate: type === "procurement" && deliveryDate ? new Date(deliveryDate) : null,
      status: "open",
      comments: [],
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("createTicket:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/tickets/:id
export async function getTicket(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const ticket = await Ticket.findById(id).lean();
    if (!ticket) return res.status(404).json({ ok: false, message: "Not found" });

    if (!isAdmin(req.user.role) && String(ticket.clientId) !== String(req.user.id))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    // Hide internal comments from clients
    if (!isAdmin(req.user.role)) {
      ticket.comments = (ticket.comments || []).filter((c) => c.visibility !== "internal");
    }

    return res.json({ ok: true, item: ticket });
  } catch (e) {
    console.error("getTicket:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/tickets/:id — edit ticket fields
export async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, message: "Not found" });

    const admin = isAdmin(req.user.role);
    if (!admin && String(ticket.clientId) !== String(req.user.id))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    const {
      title, description,
      // admin-only editable fields
      category, priority, type, slaLevel, assigneeId,
      dueDate, estimatedHours, actualHours, estimatedCost,
      tags, resolution,
      vendor, vendorContact, budgetAmount, currency, purchaseOrderRef, deliveryDate,
      satisfactionRating, satisfactionComment,
    } = req.body || {};

    if (title !== undefined) ticket.title = title.trim();
    if (description !== undefined) ticket.description = description.trim();
    if (tags !== undefined) ticket.tags = Array.isArray(tags) ? tags.slice(0, 10) : [];
    if (satisfactionRating !== undefined) ticket.satisfactionRating = satisfactionRating;
    if (satisfactionComment !== undefined) ticket.satisfactionComment = satisfactionComment;

    if (admin) {
      if (category !== undefined) ticket.category = category;
      if (priority !== undefined) ticket.priority = priority;
      if (type !== undefined) ticket.type = type;
      if (slaLevel !== undefined) ticket.slaLevel = slaLevel;
      if (assigneeId !== undefined) ticket.assigneeId = oid(assigneeId);
      if (dueDate !== undefined) ticket.dueDate = dueDate ? new Date(dueDate) : null;
      if (estimatedHours !== undefined) ticket.estimatedHours = estimatedHours != null ? Number(estimatedHours) : null;
      if (actualHours !== undefined) ticket.actualHours = actualHours != null ? Number(actualHours) : null;
      if (estimatedCost !== undefined) ticket.estimatedCost = estimatedCost != null ? Number(estimatedCost) : null;
      if (resolution !== undefined) ticket.resolution = resolution;
      if (vendor !== undefined) ticket.vendor = vendor;
      if (vendorContact !== undefined) ticket.vendorContact = vendorContact;
      if (budgetAmount !== undefined) ticket.budgetAmount = budgetAmount != null ? Number(budgetAmount) : null;
      if (currency !== undefined) ticket.currency = currency;
      if (purchaseOrderRef !== undefined) ticket.purchaseOrderRef = purchaseOrderRef;
      if (deliveryDate !== undefined) ticket.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    await ticket.save();
    return res.json({ ok: true, item: ticket.toObject() });
  } catch (e) {
    console.error("updateTicket:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/tickets/:id/comments
export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { body, visibility = "client" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });
    if (!body?.trim())
      return res.status(400).json({ ok: false, message: "body is required" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, message: "Not found" });

    const admin = isAdmin(req.user.role);
    if (!admin && String(ticket.clientId) !== String(req.user.id))
      return res.status(403).json({ ok: false, message: "Forbidden" });

    // Track first admin response time for SLA
    if (admin && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    ticket.comments.push({
      body: body.trim(),
      authorId: req.user.id,
      authorRole: admin ? "admin" : "client",
      visibility: admin ? visibility : "client",
    });

    await ticket.save();
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error("addComment:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/tickets/:id/status — admin only
export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body || {};

    if (!isAdmin(req.user.role))
      return res.status(403).json({ ok: false, message: "Forbidden" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });
    if (!ALLOWED_STATUSES.has(status))
      return res.status(400).json({ ok: false, message: "Invalid status" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, message: "Not found" });

    const prev = ticket.status;
    ticket.status = status;
    if (resolution) ticket.resolution = resolution;

    // Append activity event to thread
    ticket.comments.push({
      body: `Status changed from "${prev.replaceAll("_", " ")}" to "${status.replaceAll("_", " ")}"`,
      authorId: req.user.id,
      authorRole: "admin",
      visibility: "client",
      event: "status_changed",
      eventMeta: { from: prev, to: status },
    });

    await ticket.save();
    return res.json({ ok: true, item: ticket.toObject() });
  } catch (e) {
    console.error("updateStatus:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/tickets/:id/approve — admin only, Change Request workflow
export async function approveTicket(req, res) {
  try {
    const { id } = req.params;
    const { decision, note } = req.body || {};

    if (!isAdmin(req.user.role))
      return res.status(403).json({ ok: false, message: "Forbidden" });
    if (!["approved", "rejected"].includes(decision))
      return res.status(400).json({ ok: false, message: "decision must be approved or rejected" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, message: "Not found" });
    if (ticket.type !== "change_request")
      return res.status(400).json({ ok: false, message: "Not a change request" });

    ticket.approvalStatus = decision;
    ticket.approvedBy = req.user.id;
    ticket.approvedAt = new Date();
    if (decision === "approved") ticket.status = "in_progress";

    ticket.comments.push({
      body: note?.trim() || `Change request ${decision}.`,
      authorId: req.user.id,
      authorRole: "admin",
      visibility: "client",
      event: "cr_decision",
      eventMeta: { decision },
    });

    await ticket.save();
    return res.json({ ok: true, item: ticket.toObject() });
  } catch (e) {
    console.error("approveTicket:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
