import mongoose from "mongoose";
import KPIIndicator from "./kpiIndicator.model.js";
import KPIGoal from "./kpiGoal.model.js";
import KPICheckin from "./kpiCheckin.model.js";
import Staff from "../staff/staff.model.js";
import Expense from "../expenses/expense.model.js";
import Leave from "../leaves/leave.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function computeProgress(current, target, direction) {
  if (target === 0 || current === null || current === undefined) return 0;
  if (direction === "lower_is_better") {
    return Math.min(100, Math.round((target / Math.max(current, 0.01)) * 100));
  }
  if (direction === "on_target") {
    const variance = Math.abs(Number(current) - Number(target));
    return Math.max(0, Math.min(100, Math.round(100 - (variance / Math.max(Math.abs(target), 1)) * 100)));
  }
  return Math.min(100, Math.round((current / target) * 100));
}

function deriveStatus(progressPct, status) {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  if (progressPct >= 100) return "completed";
  if (progressPct >= 70) return "active";
  if (progressPct >= 40) return "at_risk";
  if (progressPct > 0) return "at_risk";
  return status === "missed" ? "missed" : "active";
}

// Parse "2026-05" → { start, end } for that calendar month
// Parse "2026-Q2"  → { start, end } for that quarter
// Parse "2026"     → { start, end } for that year
function periodToDates(period) {
  if (!period) return null;
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const [year, q] = period.split("-Q");
    const qNum = parseInt(q, 10);
    const startMonth = (qNum - 1) * 3; // 0-indexed
    const start = new Date(Date.UTC(parseInt(year, 10), startMonth, 1));
    const end = new Date(Date.UTC(parseInt(year, 10), startMonth + 3, 1));
    return { start, end };
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { start, end };
  }
  if (/^\d{4}$/.test(period)) {
    const year = parseInt(period, 10);
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    return { start, end };
  }
  return null;
}

// ─── Auto-sync a goal from system data ───────────────────────────────────────

async function autoSyncGoal(goal, indicator) {
  if (!indicator || indicator.autoSource === "none") return null;

  const range = periodToDates(goal.period);
  if (!range) return null;

  let value = null;

  // LEAVES_TAKEN — approved leave days for staff in period
  if (indicator.autoSource === "leaves_taken") {
    if (goal.scope === "individual" && goal.staffId) {
      const staff = await Staff.findById(goal.staffId).select("fullName").lean();
      if (staff) {
        const leaves = await Leave.find({
          staffName: { $regex: new RegExp(`^${escapeRegex(staff.fullName)}$`, "i") },
          status: "approved",
          startDate: { $gte: range.start, $lt: range.end },
        }).lean();
        value = leaves.reduce((s, l) => s + (l.days || 0), 0);
      }
    } else if (goal.scope === "department" && goal.department) {
      const leaves = await Leave.find({
        department: goal.department,
        status: "approved",
        startDate: { $gte: range.start, $lt: range.end },
      }).lean();
      value = leaves.reduce((s, l) => s + (l.days || 0), 0);
    }
  }

  // EXPENSES_TOTAL — sum of approved expenses for staff in period
  if (indicator.autoSource === "expenses_total") {
    if (goal.scope === "individual" && goal.staffId) {
      const staff = await Staff.findById(goal.staffId).select("fullName").lean();
      if (staff) {
        const exps = await Expense.find({
          staffName: { $regex: new RegExp(`^${escapeRegex(staff.fullName)}$`, "i") },
          status: { $in: ["approved", "registered", "paid"] },
          expenseDate: { $gte: range.start, $lt: range.end },
        }).lean();
        value = exps.reduce((s, e) => s + (e.amount || 0), 0);
      }
    } else if (goal.scope === "department" && goal.department) {
      // Get all staff in department, sum their expenses
      const staffList = await Staff.find({ department: goal.department }).select("fullName").lean();
      const names = staffList.map((s) => s.fullName);
      const exps = await Expense.find({
        staffName: { $in: names },
        status: { $in: ["approved", "registered", "paid"] },
        expenseDate: { $gte: range.start, $lt: range.end },
      }).lean();
      value = exps.reduce((s, e) => s + (e.amount || 0), 0);
    }
  }

  // SCORECARD_AVG — average scorecard rating for staff
  if (indicator.autoSource === "scorecard_avg") {
    if (goal.scope === "individual" && goal.staffId) {
      const staff = await Staff.findById(goal.staffId).select("scorecards").lean();
      if (staff && Array.isArray(staff.scorecards) && staff.scorecards.length) {
        // Filter by period if scorecard has createdAt
        const relevant = staff.scorecards.filter((sc) => {
          if (!range || !sc.createdAt) return true;
          const d = new Date(sc.createdAt);
          return d >= range.start && d < range.end;
        });
        const pool = relevant.length ? relevant : staff.scorecards;
        const avg = pool.reduce((s, sc) => s + (sc.rating || 0), 0) / pool.length;
        value = Math.round(avg * 10) / 10;
      }
    }
  }

  // LEARNING_GOALS_COMPLETED — count of completed learning goals
  if (indicator.autoSource === "learning_goals_completed") {
    if (goal.scope === "individual" && goal.staffId) {
      const staff = await Staff.findById(goal.staffId).select("learningGoals").lean();
      if (staff && Array.isArray(staff.learningGoals)) {
        value = staff.learningGoals.filter((g) => g.status === "completed").length;
      }
    } else if (goal.scope === "department" && goal.department) {
      const staffList = await Staff.find({ department: goal.department }).select("learningGoals").lean();
      value = staffList.reduce((s, st) => {
        return s + (st.learningGoals || []).filter((g) => g.status === "completed").length;
      }, 0);
    }
  }

  return value;
}

// ─── Indicators ───────────────────────────────────────────────────────────────

export async function listIndicators(req, res) {
  try {
    const { includeInactive } = req.query;
    const filter = {};
    if (String(includeInactive) !== "true") filter.isActive = true;
    const items = await KPIIndicator.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listIndicators:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createIndicator(req, res) {
  try {
    const { name, description, category, unit, direction, frequency, autoSource, order } = req.body || {};
    if (!String(name || "").trim()) return res.status(400).json({ ok: false, message: "name is required" });
    const item = await KPIIndicator.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      category: category || "custom",
      unit: String(unit || "count").trim(),
      direction: direction || "higher_is_better",
      frequency: frequency || "monthly",
      autoSource: autoSource || "none",
      order: Number(order) || 0,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });
    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createIndicator:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateIndicator(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };
    if (body.name !== undefined) patch.name = String(body.name || "").trim();
    if (body.description !== undefined) patch.description = String(body.description || "").trim();
    if (body.category !== undefined) patch.category = body.category;
    if (body.unit !== undefined) patch.unit = String(body.unit || "").trim();
    if (body.direction !== undefined) patch.direction = body.direction;
    if (body.frequency !== undefined) patch.frequency = body.frequency;
    if (body.autoSource !== undefined) patch.autoSource = body.autoSource;
    if (body.order !== undefined) patch.order = Number(body.order) || 0;
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
    const item = await KPIIndicator.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateIndicator:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteIndicator(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const item = await KPIIndicator.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    // Cascade-delete goals + checkins
    const goals = await KPIGoal.find({ indicatorId: id }).select("_id").lean();
    const goalIds = goals.map((g) => g._id);
    if (goalIds.length) {
      await KPICheckin.deleteMany({ goalId: { $in: goalIds } });
      await KPIGoal.deleteMany({ indicatorId: id });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteIndicator:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function listGoals(req, res) {
  try {
    const { scope, staffId, department, teamId, period, status, indicatorId } = req.query;
    const filter = {};
    if (scope) filter.scope = scope;
    if (staffId && validId(staffId)) filter.staffId = staffId;
    if (department) filter.department = department;
    if (teamId) filter.teamId = teamId;
    if (period) filter.period = period;
    if (status) filter.status = status;
    if (indicatorId && validId(indicatorId)) filter.indicatorId = indicatorId;

    const goals = await KPIGoal.find(filter)
      .populate("indicatorId", "name category unit direction frequency autoSource")
      .populate("staffId", "fullName jobTitle department")
      .sort({ period: -1, createdAt: -1 })
      .lean();

    return res.json({ ok: true, items: goals });
  } catch (e) {
    console.error("listGoals:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getGoal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const goal = await KPIGoal.findById(id)
      .populate("indicatorId", "name category unit direction frequency autoSource")
      .populate("staffId", "fullName jobTitle department")
      .lean();
    if (!goal) return res.status(404).json({ ok: false, message: "Not found" });

    // Include recent check-ins
    const checkins = await KPICheckin.find({ goalId: id }).sort({ date: -1 }).limit(20).lean();
    return res.json({ ok: true, item: { ...goal, checkins } });
  } catch (e) {
    console.error("getGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createGoal(req, res) {
  try {
    const {
      indicatorId, scope, staffId, teamId, department,
      period, periodType, targetValue, notes,
    } = req.body || {};

    if (!validId(indicatorId)) return res.status(400).json({ ok: false, message: "indicatorId is required" });
    if (!scope) return res.status(400).json({ ok: false, message: "scope is required" });
    if (!period) return res.status(400).json({ ok: false, message: "period is required" });
    if (targetValue === undefined || targetValue === null) return res.status(400).json({ ok: false, message: "targetValue is required" });

    const item = await KPIGoal.create({
      indicatorId,
      scope,
      staffId: scope === "individual" && validId(staffId) ? staffId : null,
      teamId: scope === "team" ? String(teamId || "").trim() || null : null,
      department: scope === "department" ? String(department || "").trim() || null : null,
      period: String(period).trim(),
      periodType: periodType || "monthly",
      targetValue: Number(targetValue),
      notes: String(notes || "").trim(),
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const populated = await KPIGoal.findById(item._id)
      .populate("indicatorId", "name category unit direction frequency autoSource")
      .populate("staffId", "fullName jobTitle department")
      .lean();

    return res.status(201).json({ ok: true, item: populated });
  } catch (e) {
    console.error("createGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateGoal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };
    if (body.targetValue !== undefined) patch.targetValue = Number(body.targetValue);
    if (body.currentValue !== undefined) {
      patch.currentValue = Number(body.currentValue);
      // Recalculate progress
      const goal = await KPIGoal.findById(id).populate("indicatorId", "direction").lean();
      const dir = goal?.indicatorId?.direction || "higher_is_better";
      patch.progressPct = computeProgress(patch.currentValue, body.targetValue ?? goal?.targetValue, dir);
      patch.status = deriveStatus(patch.progressPct, body.status ?? goal?.status);
    }
    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = String(body.notes || "").trim();
    if (body.period !== undefined) patch.period = String(body.period).trim();
    if (body.periodType !== undefined) patch.periodType = body.periodType;

    const item = await KPIGoal.findByIdAndUpdate(id, patch, { new: true })
      .populate("indicatorId", "name category unit direction frequency autoSource")
      .populate("staffId", "fullName jobTitle department")
      .lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const item = await KPIGoal.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    await KPICheckin.deleteMany({ goalId: id });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// Auto-sync a single goal from system data
export async function syncGoal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const goal = await KPIGoal.findById(id).lean();
    if (!goal) return res.status(404).json({ ok: false, message: "Not found" });
    const indicator = await KPIIndicator.findById(goal.indicatorId).lean();

    const value = await autoSyncGoal(goal, indicator);
    if (value === null) return res.json({ ok: true, synced: false, message: "No auto-source configured or no data found" });

    const dir = indicator?.direction || "higher_is_better";
    const progressPct = computeProgress(value, goal.targetValue, dir);
    const status = deriveStatus(progressPct, goal.status);

    const updated = await KPIGoal.findByIdAndUpdate(
      id,
      { currentValue: value, progressPct, status, lastSyncedAt: new Date(), updatedBy: req.user?.id || null },
      { new: true }
    )
      .populate("indicatorId", "name category unit direction frequency autoSource")
      .populate("staffId", "fullName jobTitle department")
      .lean();

    // Log a check-in for history
    await KPICheckin.create({
      goalId: id,
      date: new Date(),
      value,
      notes: "Auto-synced from system data",
      source: "auto",
      createdBy: req.user?.id || null,
    });

    return res.json({ ok: true, synced: true, item: updated });
  } catch (e) {
    console.error("syncGoal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function listCheckins(req, res) {
  try {
    const { goalId } = req.query;
    const filter = {};
    if (goalId && validId(goalId)) filter.goalId = goalId;
    const items = await KPICheckin.find(filter).sort({ date: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listCheckins:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createCheckin(req, res) {
  try {
    const { goalId, date, value, notes } = req.body || {};
    if (!validId(goalId)) return res.status(400).json({ ok: false, message: "goalId is required" });
    if (value === undefined || value === null) return res.status(400).json({ ok: false, message: "value is required" });

    const goal = await KPIGoal.findById(goalId).populate("indicatorId", "direction").lean();
    if (!goal) return res.status(404).json({ ok: false, message: "Goal not found" });

    const item = await KPICheckin.create({
      goalId,
      date: date ? new Date(date) : new Date(),
      value: Number(value),
      notes: String(notes || "").trim(),
      source: "manual",
      createdBy: req.user?.id || null,
    });

    // Update the goal's currentValue to this latest check-in
    const dir = goal?.indicatorId?.direction || "higher_is_better";
    const progressPct = computeProgress(Number(value), goal.targetValue, dir);
    const status = deriveStatus(progressPct, goal.status);

    await KPIGoal.findByIdAndUpdate(goalId, {
      currentValue: Number(value),
      progressPct,
      status,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createCheckin:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteCheckin(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const item = await KPICheckin.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteCheckin:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(req, res) {
  try {
    const { period } = req.query;

    const filter = {};
    if (period) filter.period = period;

    const allGoals = await KPIGoal.find(filter)
      .populate("indicatorId", "name category unit direction")
      .populate("staffId", "fullName jobTitle department")
      .lean();

    const total = allGoals.length;
    const completed = allGoals.filter((g) => g.status === "completed").length;
    const atRisk = allGoals.filter((g) => g.status === "at_risk").length;
    const missed = allGoals.filter((g) => g.status === "missed").length;
    const active = allGoals.filter((g) => g.status === "active").length;
    const cancelled = allGoals.filter((g) => g.status === "cancelled").length;

    // Average progress across all active + completed goals
    const measuredGoals = allGoals.filter((g) => g.currentValue !== null && g.status !== "cancelled");
    const avgProgress = measuredGoals.length
      ? Math.round(measuredGoals.reduce((s, g) => s + (g.progressPct || 0), 0) / measuredGoals.length)
      : 0;

    // By category
    const byCategory = {};
    for (const g of allGoals) {
      const cat = g.indicatorId?.category || "custom";
      if (!byCategory[cat]) byCategory[cat] = { total: 0, completed: 0, atRisk: 0, avgProgress: 0, sum: 0 };
      byCategory[cat].total++;
      if (g.status === "completed") byCategory[cat].completed++;
      if (g.status === "at_risk") byCategory[cat].atRisk++;
      byCategory[cat].sum += g.progressPct || 0;
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].avgProgress = Math.round(byCategory[cat].sum / byCategory[cat].total);
      delete byCategory[cat].sum;
    }

    // By department
    const byDepartment = {};
    for (const g of allGoals) {
      const dept = g.staffId?.department || g.department || "company";
      if (!byDepartment[dept]) byDepartment[dept] = { total: 0, completed: 0, atRisk: 0, sum: 0 };
      byDepartment[dept].total++;
      if (g.status === "completed") byDepartment[dept].completed++;
      if (g.status === "at_risk") byDepartment[dept].atRisk++;
      byDepartment[dept].sum += g.progressPct || 0;
    }
    for (const dept of Object.keys(byDepartment)) {
      byDepartment[dept].avgProgress = Math.round(byDepartment[dept].sum / byDepartment[dept].total);
      delete byDepartment[dept].sum;
    }

    // Top 5 at-risk goals
    const topAtRisk = allGoals
      .filter((g) => g.status === "at_risk" || (g.status === "active" && (g.progressPct || 0) < 40))
      .sort((a, b) => (a.progressPct || 0) - (b.progressPct || 0))
      .slice(0, 5);

    const byCategoryArr = Object.entries(byCategory).map(([_id, v]) => ({ _id, ...v }));
    const byDepartmentArr = Object.entries(byDepartment).map(([_id, v]) => ({ _id, ...v }));

    return res.json({
      ok: true,
      stats: { total, completed, atRisk, missed, active, cancelled, avgProgress },
      byCategory: byCategoryArr,
      byDepartment: byDepartmentArr,
      topAtRisk,
      allGoals,
    });
  } catch (e) {
    console.error("getDashboard:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
