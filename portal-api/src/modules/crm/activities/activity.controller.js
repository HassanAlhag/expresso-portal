import mongoose from "mongoose";
import Activity from "./activity.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

const ALLOWED_SORT = new Set([
  "createdAt", "-createdAt", "dueAt", "-dueAt", "type", "-type",
]);

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  if (!ALLOWED_SORT.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  return { [key]: raw.startsWith("-") ? -1 : 1 };
}

export async function listActivities(req, res) {
  try {
    const {
      entityType = "",
      entityId = "",
      type = "",
      status = "",
      assignedTo = "",
      page = "1",
      limit = "50",
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (entityType) filter.entityType = String(entityType).trim().toLowerCase();
    if (validId(entityId)) filter.entityId = entityId;
    if (type) filter.type = String(type).trim().toLowerCase();
    if (status) filter.status = String(status).trim().toLowerCase();
    if (validId(assignedTo)) filter.assignedTo = assignedTo;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const [total, items] = await Promise.all([
      Activity.countDocuments(filter),
      Activity.find(filter)
        .populate("assignedTo", "fullName email avatarUrl")
        .populate("createdBy", "fullName email")
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
    console.error("listActivities:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getActivity(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Activity.findById(id)
      .populate("assignedTo", "fullName email avatarUrl")
      .populate("createdBy", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Activity not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getActivity:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createActivity(req, res) {
  try {
    const body = req.body || {};

    const type = String(body.type || "").trim().toLowerCase();
    if (!type) {
      return res.status(400).json({ ok: false, message: "type is required" });
    }

    const subject = String(body.subject || "").trim();
    if (!subject) {
      return res.status(400).json({ ok: false, message: "subject is required" });
    }

    const entityType = String(body.entityType || "").trim().toLowerCase();
    if (!entityType) {
      return res.status(400).json({ ok: false, message: "entityType is required" });
    }

    if (!validId(body.entityId)) {
      return res.status(400).json({ ok: false, message: "entityId is required" });
    }

    const status = String(body.status || "done").trim().toLowerCase();

    const item = await Activity.create({
      type,
      subject,
      body: String(body.body || "").trim(),
      outcome: String(body.outcome || "").trim(),
      status,
      dueAt: body.dueAt || null,
      completedAt: status === "done" ? (body.completedAt || new Date()) : null,
      entityType,
      entityId: body.entityId,
      assignedTo: validId(body.assignedTo) ? body.assignedTo : req.user?.id || null,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const populated = await Activity.findById(item._id)
      .populate("assignedTo", "fullName email avatarUrl")
      .populate("createdBy", "fullName email")
      .lean();

    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createActivity:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateActivity(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.type !== "undefined") {
      patch.type = String(body.type).trim().toLowerCase();
    }
    if (typeof body.subject !== "undefined") {
      patch.subject = String(body.subject).trim();
    }
    if (typeof body.body !== "undefined") {
      patch.body = String(body.body).trim();
    }
    if (typeof body.outcome !== "undefined") {
      patch.outcome = String(body.outcome).trim();
    }
    if (typeof body.status !== "undefined") {
      const s = String(body.status).trim().toLowerCase();
      patch.status = s;
      if (s === "done") patch.completedAt = new Date();
      if (s !== "done") patch.completedAt = null;
    }
    if (typeof body.dueAt !== "undefined") {
      patch.dueAt = body.dueAt || null;
    }
    if (typeof body.assignedTo !== "undefined") {
      patch.assignedTo = validId(body.assignedTo) ? body.assignedTo : null;
    }

    const item = await Activity.findByIdAndUpdate(id, patch, { new: true })
      .populate("assignedTo", "fullName email avatarUrl")
      .populate("createdBy", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Activity not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateActivity:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteActivity(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Activity.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Activity not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteActivity:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
