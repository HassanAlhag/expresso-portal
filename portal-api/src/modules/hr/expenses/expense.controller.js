import mongoose from "mongoose";
import Expense, {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
} from "./expense.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toMonth(value) {
  if (value) return String(value).slice(0, 7);

  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");

  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "expenseDate",
    "-expenseDate",
    "amount",
    "-amount",
    "title",
    "-title",
    "status",
    "-status",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;

  return { [key]: dir };
}

function sanitizeCategory(value) {
  const v = String(value || "other")
    .trim()
    .toLowerCase();

  return EXPENSE_CATEGORIES.includes(v) ? v : "other";
}

function sanitizeStatus(value) {
  const v = String(value || "submitted")
    .trim()
    .toLowerCase();

  return EXPENSE_STATUSES.includes(v) ? v : "submitted";
}

export async function listExpenses(req, res) {
  try {
    const {
      q = "",
      status = "",
      category = "",
      department = "",
      month = "",
      paymentStatus = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (status) filter.status = sanitizeStatus(status);
    if (category) filter.category = sanitizeCategory(category);
    if (department) filter.department = String(department).trim();
    if (month) filter.claimMonth = String(month).slice(0, 7);
    if (paymentStatus) {
      filter.paymentStatus = String(paymentStatus).trim().toLowerCase();
    }

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { title: rx },
        { staffName: rx },
        { department: rx },
        { category: rx },
        { description: rx },
        { notes: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter)
        .populate("staffUserId", "fullName email role")
        .populate("approvedBy", "fullName email")
        .populate("registeredBy", "fullName email")
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
    console.error("listExpenses:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getExpense(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Expense.findById(id)
      .populate("staffUserId", "fullName email role")
      .populate("approvedBy", "fullName email")
      .populate("registeredBy", "fullName email")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createExpense(req, res) {
  try {
    const body = req.body || {};

    const title = String(body.title || "").trim();
    const amount = Number(body.amount || 0);

    if (!title) {
      return res.status(400).json({ ok: false, message: "Title is required" });
    }

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Valid amount is required" });
    }

    const expenseDate = body.expenseDate
      ? new Date(body.expenseDate)
      : new Date();

    const item = await Expense.create({
      title,
      staffName: String(body.staffName || "").trim(),
      staffUserId: validId(body.staffUserId) ? body.staffUserId : null,
      department: String(body.department || "").trim(),
      category: sanitizeCategory(body.category),
      amount,
      currency: String(body.currency || "AED")
        .trim()
        .toUpperCase(),
      expenseDate,
      claimMonth: toMonth(body.claimMonth || expenseDate.toISOString()),
      description: String(body.description || "").trim(),
      receiptUrl: String(body.receiptUrl || "").trim(),
      receiptMediaId: validId(body.receiptMediaId) ? body.receiptMediaId : null,
      status: "submitted",
      paymentStatus: "unpaid",
      notes: String(body.notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateExpense(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Expense.findById(id).lean();

    if (!current) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    if (["registered", "paid"].includes(current.status)) {
      return res.status(409).json({
        ok: false,
        message: "Registered or paid expenses cannot be edited",
      });
    }

    const body = req.body || {};
    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.title !== "undefined") {
      patch.title = String(body.title || "").trim();
    }

    if (typeof body.staffName !== "undefined") {
      patch.staffName = String(body.staffName || "").trim();
    }

    if (typeof body.staffUserId !== "undefined") {
      patch.staffUserId = validId(body.staffUserId) ? body.staffUserId : null;
    }

    if (typeof body.department !== "undefined") {
      patch.department = String(body.department || "").trim();
    }

    if (typeof body.category !== "undefined") {
      patch.category = sanitizeCategory(body.category);
    }

    if (typeof body.amount !== "undefined") {
      patch.amount = Number(body.amount || 0);
    }

    if (typeof body.currency !== "undefined") {
      patch.currency = String(body.currency || "AED")
        .trim()
        .toUpperCase();
    }

    if (typeof body.expenseDate !== "undefined") {
      patch.expenseDate = body.expenseDate ? new Date(body.expenseDate) : null;
    }

    if (typeof body.claimMonth !== "undefined") {
      patch.claimMonth = toMonth(body.claimMonth);
    }

    if (typeof body.description !== "undefined") {
      patch.description = String(body.description || "").trim();
    }

    if (typeof body.receiptUrl !== "undefined") {
      patch.receiptUrl = String(body.receiptUrl || "").trim();
    }

    if (typeof body.receiptMediaId !== "undefined") {
      patch.receiptMediaId = validId(body.receiptMediaId)
        ? body.receiptMediaId
        : null;
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Expense.findByIdAndUpdate(id, patch, { new: true })
      .populate("staffUserId", "fullName email role")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Expense.findById(id).lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    if (["registered", "paid"].includes(item.status)) {
      return res.status(409).json({
        ok: false,
        message: "Registered or paid expenses cannot be deleted",
      });
    }

    await Expense.findByIdAndDelete(id);

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function approveExpense(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Expense.findByIdAndUpdate(
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
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("approveExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function rejectExpense(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Expense.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionReason: String(body.reason || "").trim(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("rejectExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function registerExpense(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Expense.findById(id).lean();

    if (!current) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    if (current.status !== "approved") {
      return res.status(409).json({
        ok: false,
        message: "Only approved expenses can be registered",
      });
    }

    const registeredMonth = toMonth(body.registeredMonth || current.claimMonth);

    const item = await Expense.findByIdAndUpdate(
      id,
      {
        status: "registered",
        registeredMonth,
        registeredBy: req.user?.id || null,
        registeredAt: new Date(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("registerExpense:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function markExpensePaid(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Expense.findByIdAndUpdate(
      id,
      {
        status: "paid",
        paymentStatus: "paid",
        paidAt: new Date(),
        updatedBy: req.user?.id || null,
      },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("markExpensePaid:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getExpenseStats(req, res) {
  try {
    const month = toMonth(req.query.month);

    const [
      total,
      pending,
      approved,
      registered,
      rejected,
      paid,
      monthRegisteredAgg,
      monthApprovedAgg,
    ] = await Promise.all([
      Expense.countDocuments(),
      Expense.countDocuments({ status: "submitted" }),
      Expense.countDocuments({ status: "approved" }),
      Expense.countDocuments({ status: "registered" }),
      Expense.countDocuments({ status: "rejected" }),
      Expense.countDocuments({ status: "paid" }),

      Expense.aggregate([
        {
          $match: {
            registeredMonth: month,
            status: { $in: ["registered", "paid"] },
          },
        },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),

      Expense.aggregate([
        { $match: { claimMonth: month, status: "approved" } },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),
    ]);

    return res.json({
      ok: true,
      month,
      totals: {
        total,
        pending,
        approved,
        registered,
        rejected,
        paid,
      },
      currentMonth: {
        registeredTotal: monthRegisteredAgg?.[0]?.total || 0,
        registeredCount: monthRegisteredAgg?.[0]?.count || 0,
        approvedTotal: monthApprovedAgg?.[0]?.total || 0,
        approvedCount: monthApprovedAgg?.[0]?.count || 0,
      },
    });
  } catch (e) {
    console.error("getExpenseStats:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMonthlyExpenses(req, res) {
  try {
    const rows = await Expense.aggregate([
      {
        $match: {
          status: { $in: ["registered", "paid"] },
          registeredMonth: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$registeredMonth",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0],
            },
          },
          unpaid: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return res.json({
      ok: true,
      items: rows.map((row) => ({
        month: row._id,
        total: row.total,
        count: row.count,
        paid: row.paid,
        unpaid: row.unpaid,
      })),
    });
  } catch (e) {
    console.error("getMonthlyExpenses:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMonthlyExpenseDetails(req, res) {
  try {
    const month = String(req.params.month || "").slice(0, 7);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ ok: false, message: "Invalid month" });
    }

    const match = {
      registeredMonth: month,
      status: { $in: ["registered", "paid"] },
    };

    const [summaryAgg, items, categoryRows, staffRows, departmentRows] =
      await Promise.all([
        Expense.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
              paid: {
                $sum: {
                  $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0],
                },
              },
              unpaid: {
                $sum: {
                  $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$amount", 0],
                },
              },
            },
          },
        ]),

        Expense.find(match)
          .populate("staffUserId", "fullName email role")
          .populate("approvedBy", "fullName email")
          .populate("registeredBy", "fullName email")
          .sort({ registeredAt: -1, createdAt: -1 })
          .lean(),

        Expense.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$category",
              category: { $first: "$category" },
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),

        Expense.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$staffName",
              staffName: { $first: "$staffName" },
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),

        Expense.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$department",
              department: { $first: "$department" },
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),
      ]);

    const summary = summaryAgg?.[0] || {
      total: 0,
      count: 0,
      paid: 0,
      unpaid: 0,
    };

    return res.json({
      ok: true,
      month,
      summary,
      items,
      categoryRows,
      staffRows,
      departmentRows,
    });
  } catch (e) {
    console.error("getMonthlyExpenseDetails:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
