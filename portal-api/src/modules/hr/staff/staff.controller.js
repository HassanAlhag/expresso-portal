import mongoose from "mongoose";
import Staff, {
  STAFF_EMPLOYMENT_TYPES,
  STAFF_STATUSES,
  STAFF_DEPARTMENTS,
} from "./staff.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeStatus(value) {
  const v = String(value || "active")
    .trim()
    .toLowerCase();
  return STAFF_STATUSES.includes(v) ? v : "active";
}

function safeEmploymentType(value) {
  const v = String(value || "full_time")
    .trim()
    .toLowerCase();
  return STAFF_EMPLOYMENT_TYPES.includes(v) ? v : "full_time";
}

function safeDepartment(value) {
  const v = String(value || "other")
    .trim()
    .toLowerCase();
  return STAFF_DEPARTMENTS.includes(v) ? v : "other";
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
    "department",
    "-department",
    "jobTitle",
    "-jobTitle",
    "status",
    "-status",
    "joiningDate",
    "-joiningDate",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;

  return { [key]: dir };
}

function staffPopulate(query) {
  return query
    .populate("linkedUserId", "fullName email role")
    .populate("managerStaffId", "fullName email jobTitle department")
    .populate("teamId", "label key");
}

export async function listStaff(req, res) {
  try {
    const {
      q = "",
      status = "",
      department = "",
      employmentType = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (status) filter.status = safeStatus(status);
    if (department) filter.department = safeDepartment(department);
    if (employmentType)
      filter.employmentType = safeEmploymentType(employmentType);

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { phone: rx },
        { jobTitle: rx },
        { department: rx },
        { notes: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Staff.countDocuments(filter),
      staffPopulate(
        Staff.find(filter)
          .sort(safeSort(sort))
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
      ).lean(),
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
    console.error("listStaff:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getStaff(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await staffPopulate(Staff.findById(id)).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Staff member not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getStaff:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createStaff(req, res) {
  try {
    const body = req.body || {};
    const fullName = String(body.fullName || "").trim();

    if (!fullName) {
      return res
        .status(400)
        .json({ ok: false, message: "Full name is required" });
    }

    const item = await Staff.create({
      fullName,
      email: String(body.email || "")
        .trim()
        .toLowerCase(),
      phone: String(body.phone || "").trim(),
      jobTitle: String(body.jobTitle || "").trim(),
      department: safeDepartment(body.department),
      employmentType: safeEmploymentType(body.employmentType),
      status: safeStatus(body.status),

      linkedUserId: validId(body.linkedUserId) ? body.linkedUserId : null,
      managerStaffId: validId(body.managerStaffId) ? body.managerStaffId : null,
      teamId: validId(body.teamId) ? body.teamId : null,

      joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,

      monthlySalary:
        body.monthlySalary === "" ||
        body.monthlySalary === null ||
        body.monthlySalary === undefined
          ? null
          : Number(body.monthlySalary),

      currency: String(body.currency || "AED")
        .trim()
        .toUpperCase(),
      country: String(body.country || "").trim(),
      city: String(body.city || "").trim(),
      address: String(body.address || "").trim(),
      emergencyContactName: String(body.emergencyContactName || "").trim(),
      emergencyContactPhone: String(body.emergencyContactPhone || "").trim(),
      notes: String(body.notes || "").trim(),

      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const populated = await staffPopulate(Staff.findById(item._id)).lean();

    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createStaff:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateStaff(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.fullName !== "undefined") {
      patch.fullName = String(body.fullName || "").trim();
    }

    if (typeof body.email !== "undefined") {
      patch.email = String(body.email || "")
        .trim()
        .toLowerCase();
    }

    if (typeof body.phone !== "undefined") {
      patch.phone = String(body.phone || "").trim();
    }

    if (typeof body.jobTitle !== "undefined") {
      patch.jobTitle = String(body.jobTitle || "").trim();
    }

    if (typeof body.department !== "undefined") {
      patch.department = safeDepartment(body.department);
    }

    if (typeof body.employmentType !== "undefined") {
      patch.employmentType = safeEmploymentType(body.employmentType);
    }

    if (typeof body.status !== "undefined") {
      patch.status = safeStatus(body.status);
    }

    if (typeof body.linkedUserId !== "undefined") {
      patch.linkedUserId = validId(body.linkedUserId)
        ? body.linkedUserId
        : null;
    }

    if (typeof body.managerStaffId !== "undefined") {
      patch.managerStaffId = validId(body.managerStaffId)
        ? body.managerStaffId
        : null;
    }

    if (typeof body.teamId !== "undefined") {
      patch.teamId = validId(body.teamId) ? body.teamId : null;
    }

    if (typeof body.joiningDate !== "undefined") {
      patch.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
    }

    if (typeof body.monthlySalary !== "undefined") {
      patch.monthlySalary =
        body.monthlySalary === "" || body.monthlySalary === null
          ? null
          : Number(body.monthlySalary);
    }

    if (typeof body.currency !== "undefined") {
      patch.currency = String(body.currency || "AED")
        .trim()
        .toUpperCase();
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

    if (typeof body.emergencyContactName !== "undefined") {
      patch.emergencyContactName = String(
        body.emergencyContactName || ""
      ).trim();
    }

    if (typeof body.emergencyContactPhone !== "undefined") {
      patch.emergencyContactPhone = String(
        body.emergencyContactPhone || ""
      ).trim();
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(id, patch, { new: true })
    ).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Staff member not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateStaff:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteStaff(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Staff.findByIdAndDelete(id).lean();

    if (!item) {
      return res
        .status(404)
        .json({ ok: false, message: "Staff member not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteStaff:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getStaffStats(req, res) {
  try {
    const [total, active, onLeave, inactive, byDepartment] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ status: "active" }),
      Staff.countDocuments({ status: "on_leave" }),
      Staff.countDocuments({ status: { $in: ["inactive", "terminated"] } }),
      Staff.aggregate([
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      ok: true,
      totals: {
        total,
        active,
        onLeave,
        inactive,
      },
      byDepartment: byDepartment.map((x) => ({
        department: x._id || "other",
        count: x.count,
      })),
    });
  } catch (e) {
    console.error("getStaffStats:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
