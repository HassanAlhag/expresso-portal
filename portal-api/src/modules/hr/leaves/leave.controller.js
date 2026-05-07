import mongoose from "mongoose";
import Leave, { LEAVE_STATUSES, LEAVE_TYPES } from "./leave.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeType(value) {
  const v = String(value || "annual")
    .trim()
    .toLowerCase();
  return LEAVE_TYPES.includes(v) ? v : "annual";
}

function safeStatus(value) {
  const v = String(value || "submitted")
    .trim()
    .toLowerCase();
  return LEAVE_STATUSES.includes(v) ? v : "submitted";
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);

  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;

  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");

  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "startDate",
    "-startDate",
    "endDate",
    "-endDate",
    "staffName",
    "-staffName",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;

  return { [key]: dir };
}

export async function listLeaves(req, res) {
  try {
    const {
      q = "",
      status = "",
      leaveType = "",
      department = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (status) filter.status = safeStatus(status);
    if (leaveType) filter.leaveType = safeType(leaveType);
    if (department) filter.department = String(department).trim();

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { staffName: rx },
        { department: rx },
        { leaveType: rx },
        { reason: rx },
        { notes: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Leave.countDocuments(filter),
      Leave.find(filter)
        .populate("staffUserId", "fullName email role")
        .populate("approvedBy", "fullName email")
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
    console.error("listLeaves:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getLeave(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Leave.findById(id)
      .populate("staffUserId", "fullName email role")
      .populate("approvedBy", "fullName email")
      .lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createLeave(req, res) {
  try {
    const body = req.body || {};
    const staffName = String(body.staffName || "").trim();

    if (!staffName) {
      return res
        .status(400)
        .json({ ok: false, message: "Staff name is required" });
    }

    if (!body.startDate || !body.endDate) {
      return res.status(400).json({
        ok: false,
        message: "Start date and end date are required",
      });
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    const item = await Leave.create({
      staffName,
      staffUserId: validId(body.staffUserId) ? body.staffUserId : null,
      department: String(body.department || "").trim(),
      leaveType: safeType(body.leaveType),
      startDate,
      endDate,
      days: Number(body.days || daysBetween(startDate, endDate)),
      reason: String(body.reason || "").trim(),
      status: "submitted",
      notes: String(body.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateLeave(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Leave.findById(id).lean();

    if (!current) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    if (["approved", "rejected", "cancelled"].includes(current.status)) {
      return res.status(409).json({
        ok: false,
        message: "Finalized leave requests cannot be edited",
      });
    }

    const body = req.body || {};
    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.staffName !== "undefined") {
      patch.staffName = String(body.staffName || "").trim();
    }

    if (typeof body.staffUserId !== "undefined") {
      patch.staffUserId = validId(body.staffUserId) ? body.staffUserId : null;
    }

    if (typeof body.department !== "undefined") {
      patch.department = String(body.department || "").trim();
    }

    if (typeof body.leaveType !== "undefined") {
      patch.leaveType = safeType(body.leaveType);
    }

    if (typeof body.startDate !== "undefined") {
      patch.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (typeof body.endDate !== "undefined") {
      patch.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    if (typeof body.days !== "undefined") {
      patch.days = Number(body.days || 1);
    }

    if (typeof body.reason !== "undefined") {
      patch.reason = String(body.reason || "").trim();
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Leave.findByIdAndUpdate(id, patch, { new: true }).lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteLeave(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Leave.findById(id).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    if (["approved"].includes(item.status)) {
      return res.status(409).json({
        ok: false,
        message: "Approved leave requests cannot be deleted",
      });
    }

    await Leave.findByIdAndDelete(id);

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function approveLeave(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Leave.findByIdAndUpdate(
      id,
      {
        status: "approved",
        rejectionReason: "",
        approvedBy: req.user?.id || null,
        approvedAt: new Date(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("approveLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function rejectLeave(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Leave.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionReason: String(body.reason || "").trim(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("rejectLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelLeave(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Leave.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Leave request not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("cancelLeave:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getLeaveStats(req, res) {
  try {
    const [total, submitted, approved, rejected, cancelled, upcoming] =
      await Promise.all([
        Leave.countDocuments(),
        Leave.countDocuments({ status: "submitted" }),
        Leave.countDocuments({ status: "approved" }),
        Leave.countDocuments({ status: "rejected" }),
        Leave.countDocuments({ status: "cancelled" }),
        Leave.countDocuments({
          status: "approved",
          startDate: { $gte: new Date() },
        }),
      ]);

    return res.json({
      ok: true,
      totals: {
        total,
        submitted,
        approved,
        rejected,
        cancelled,
        upcoming,
      },
    });
  } catch (e) {
    console.error("getLeaveStats:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
