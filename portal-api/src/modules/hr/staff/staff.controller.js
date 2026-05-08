import mongoose from "mongoose";
import Staff, {
  STAFF_EMPLOYMENT_TYPES,
  STAFF_STATUSES,
  STAFF_DEPARTMENTS,
} from "./staff.model.js";
import Leave from "../leaves/leave.model.js";
import Expense from "../expenses/expense.model.js";

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

export async function updateSkills(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
    const raw = Array.isArray(req.body?.skills) ? req.body.skills : [];
    const skills = raw
      .filter((s) => String(s?.name || "").trim())
      .map((s) => ({
        name: String(s.name).trim(),
        level: LEVELS.includes(s.level) ? s.level : "beginner",
      }));

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(
        id,
        { $set: { skills, updatedBy: req.user?.id || null } },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateSkills:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function addScorecard(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: "Rating must be 1–5" });
    }

    const entry = {
      period: String(body.period || "").trim(),
      rating,
      notes: String(body.notes || "").trim(),
      reviewerName: String(body.reviewerName || "").trim(),
      createdAt: new Date(),
    };

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(
        id,
        { $push: { scorecards: entry }, $set: { updatedBy: req.user?.id || null } },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member not found" });
    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("addScorecard:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function removeScorecard(req, res) {
  try {
    const { id, scId } = req.params;
    if (!validId(id) || !validId(scId)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(
        id,
        {
          $pull: { scorecards: { _id: new mongoose.Types.ObjectId(scId) } },
          $set: { updatedBy: req.user?.id || null },
        },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("removeScorecard:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function addLearningGoal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ ok: false, message: "Title is required" });

    const STATUSES = ["active", "completed", "on_hold"];
    const entry = {
      title,
      description: String(body.description || "").trim(),
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      status: STATUSES.includes(body.status) ? body.status : "active",
      progress: Math.min(100, Math.max(0, Number(body.progress) || 0)),
      createdAt: new Date(),
    };

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(
        id,
        { $push: { learningGoals: entry }, $set: { updatedBy: req.user?.id || null } },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member not found" });
    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("addLearningGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateLearningGoal(req, res) {
  try {
    const { id, goalId } = req.params;
    if (!validId(id) || !validId(goalId)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const body = req.body || {};
    const STATUSES = ["active", "completed", "on_hold"];
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.title !== "undefined")
      patch["learningGoals.$.title"] = String(body.title || "").trim();
    if (typeof body.description !== "undefined")
      patch["learningGoals.$.description"] = String(body.description || "").trim();
    if (typeof body.targetDate !== "undefined")
      patch["learningGoals.$.targetDate"] = body.targetDate ? new Date(body.targetDate) : null;
    if (typeof body.status !== "undefined" && STATUSES.includes(body.status))
      patch["learningGoals.$.status"] = body.status;
    if (typeof body.progress !== "undefined")
      patch["learningGoals.$.progress"] = Math.min(100, Math.max(0, Number(body.progress) || 0));

    const item = await staffPopulate(
      Staff.findOneAndUpdate(
        { _id: id, "learningGoals._id": new mongoose.Types.ObjectId(goalId) },
        { $set: patch },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member or goal not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateLearningGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function removeLearningGoal(req, res) {
  try {
    const { id, goalId } = req.params;
    if (!validId(id) || !validId(goalId)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await staffPopulate(
      Staff.findByIdAndUpdate(
        id,
        {
          $pull: { learningGoals: { _id: new mongoose.Types.ObjectId(goalId) } },
          $set: { updatedBy: req.user?.id || null },
        },
        { new: true }
      )
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Staff member not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("removeLearningGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getDepartmentBenchmark(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const staff = await Staff.findById(id).lean();
    if (!staff) return res.status(404).json({ ok: false, message: "Staff member not found" });

    const { department, fullName, currency } = staff;

    const deptStaff = await Staff.find({ department }).select("fullName").lean();
    const staffNames = deptStaff.map((s) => s.fullName).filter(Boolean);
    const staffCount = staffNames.length;

    const [leavesAgg, expensesAgg] = await Promise.all([
      Leave.aggregate([
        { $match: { staffName: { $in: staffNames }, status: "approved" } },
        { $group: { _id: "$staffName", totalDays: { $sum: "$days" } } },
      ]),
      Expense.aggregate([
        { $match: { staffName: { $in: staffNames }, status: { $in: ["approved", "registered", "paid"] } } },
        { $group: { _id: "$staffName", totalAmount: { $sum: "$amount" } } },
      ]),
    ]);

    const sumLeave = leavesAgg.reduce((s, x) => s + x.totalDays, 0);
    const sumExpense = expensesAgg.reduce((s, x) => s + x.totalAmount, 0);

    const myLeave = leavesAgg.find((x) => x._id === fullName);
    const myExpense = expensesAgg.find((x) => x._id === fullName);

    return res.json({
      ok: true,
      department,
      staffCount,
      currency: currency || "AED",
      avg: {
        leaveDays: staffCount > 0 ? Math.round((sumLeave / staffCount) * 10) / 10 : 0,
        expenseAmount: staffCount > 0 ? Math.round(sumExpense / staffCount) : 0,
      },
      mine: {
        leaveDays: myLeave?.totalDays || 0,
        expenseAmount: myExpense?.totalAmount || 0,
      },
    });
  } catch (e) {
    console.error("getDepartmentBenchmark:", e);
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
