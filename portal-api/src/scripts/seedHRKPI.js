import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../modules/iam/users/user.model.js";
import Staff from "../modules/hr/staff/staff.model.js";
import KPIIndicator from "../modules/hr/kpi/kpiIndicator.model.js";
import KPIGoal from "../modules/hr/kpi/kpiGoal.model.js";
import KPICheckin from "../modules/hr/kpi/kpiCheckin.model.js";

const PERIOD =
  process.argv.find((arg) => arg.startsWith("--period="))?.split("=")[1] ||
  new Date().toISOString().slice(0, 7);

const SEED_TAG = "Seeded by HR KPI expert dataset";

const STAFF_SEED = [
  {
    fullName: "Aisha Rahman",
    email: "aisha.rahman@expresso.local",
    jobTitle: "Creative Lead",
    department: "creative",
    monthlySalary: 18000,
    skills: [
      { name: "Creative Direction", level: "expert" },
      { name: "Brand Systems", level: "advanced" },
    ],
  },
  {
    fullName: "Omar Farooq",
    email: "omar.farooq@expresso.local",
    jobTitle: "Senior Full Stack Developer",
    department: "development",
    monthlySalary: 22000,
    skills: [
      { name: "React", level: "expert" },
      { name: "Node.js", level: "advanced" },
    ],
  },
  {
    fullName: "Maya Haddad",
    email: "maya.haddad@expresso.local",
    jobTitle: "Performance Marketing Manager",
    department: "marketing",
    monthlySalary: 19500,
    skills: [
      { name: "Paid Media", level: "expert" },
      { name: "Analytics", level: "advanced" },
    ],
  },
  {
    fullName: "Khalid Nasser",
    email: "khalid.nasser@expresso.local",
    jobTitle: "Project Manager",
    department: "operations",
    monthlySalary: 18500,
    skills: [
      { name: "Delivery Planning", level: "expert" },
      { name: "Client Communication", level: "advanced" },
    ],
  },
  {
    fullName: "Sara Malik",
    email: "sara.malik@expresso.local",
    jobTitle: "Finance Officer",
    department: "finance",
    monthlySalary: 15000,
    skills: [
      { name: "Budget Control", level: "advanced" },
      { name: "Expense Review", level: "advanced" },
    ],
  },
  {
    fullName: "Nour Alami",
    email: "nour.alami@expresso.local",
    jobTitle: "HR Specialist",
    department: "hr",
    monthlySalary: 14500,
    skills: [
      { name: "People Operations", level: "advanced" },
      { name: "Performance Reviews", level: "advanced" },
    ],
  },
];

const INDICATORS = [
  {
    name: "Delivery SLA Adherence",
    description: "Percentage of committed deliverables completed on or before the agreed due date.",
    category: "performance",
    unit: "%",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 10,
  },
  {
    name: "Output Quality Score",
    description: "Average quality rating from manager review, client feedback, and rework outcome.",
    category: "quality",
    unit: "score",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "scorecard_avg",
    order: 20,
  },
  {
    name: "Utilization Rate",
    description: "Healthy productive utilization target; over-utilization is also a risk.",
    category: "productivity",
    unit: "%",
    direction: "on_target",
    frequency: "monthly",
    autoSource: "none",
    order: 30,
  },
  {
    name: "Rework Rate",
    description: "Percentage of work requiring material rework after internal or client review.",
    category: "quality",
    unit: "%",
    direction: "lower_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 40,
  },
  {
    name: "Attendance Reliability",
    description: "Attendance reliability after planned leave, remote work, and punctuality exceptions.",
    category: "attendance",
    unit: "%",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 50,
  },
  {
    name: "Approved Leave Days",
    description: "Approved leave days consumed in the KPI period.",
    category: "attendance",
    unit: "days",
    direction: "lower_is_better",
    frequency: "monthly",
    autoSource: "leaves_taken",
    order: 60,
  },
  {
    name: "Learning Goals Completed",
    description: "Completed professional development goals aligned to role growth.",
    category: "development",
    unit: "count",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "learning_goals_completed",
    order: 70,
  },
  {
    name: "Expense Discipline",
    description: "Approved business expenses against agreed department budget guardrails.",
    category: "financial",
    unit: "AED",
    direction: "lower_is_better",
    frequency: "monthly",
    autoSource: "expenses_total",
    order: 80,
  },
  {
    name: "Client Satisfaction Score",
    description: "Average client sentiment from delivery interactions, approvals, and service reviews.",
    category: "performance",
    unit: "score",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 90,
  },
  {
    name: "HR Service SLA",
    description: "HR requests handled within the agreed internal service window.",
    category: "performance",
    unit: "%",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 100,
  },
  {
    name: "Employee Engagement Pulse",
    description: "Monthly employee engagement pulse score across confidence, clarity, and workload.",
    category: "development",
    unit: "score",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 110,
  },
  {
    name: "Hiring Pipeline Velocity",
    description: "Percentage of priority hiring steps completed on schedule.",
    category: "productivity",
    unit: "%",
    direction: "higher_is_better",
    frequency: "monthly",
    autoSource: "none",
    order: 120,
  },
];

const DEPARTMENT_GOALS = [
  { department: "creative", indicator: "Delivery SLA Adherence", target: 92, values: [74, 84, 94], notes: "Creative work is on track with final proofs moving faster." },
  { department: "development", indicator: "Delivery SLA Adherence", target: 90, values: [68, 77, 83], notes: "Development delivery improved, but two integration items remain at risk." },
  { department: "marketing", indicator: "Client Satisfaction Score", target: 4.5, values: [4.1, 4.3, 4.6], notes: "Campaign reporting clarity increased client sentiment." },
  { department: "operations", indicator: "Rework Rate", target: 8, values: [13, 10, 7], notes: "Review checklist reduced handoff rework." },
  { department: "finance", indicator: "Expense Discipline", target: 18000, values: [15600, 16900, 17450], notes: "Within operating budget guardrail." },
  { department: "hr", indicator: "HR Service SLA", target: 95, values: [82, 91, 96], notes: "Request triage and onboarding follow-up are now within SLA." },
];

const COMPANY_GOALS = [
  { indicator: "Employee Engagement Pulse", target: 4.2, values: [3.8, 4.0, 4.3], notes: "Pulse improved after workload balancing and clearer weekly priorities." },
  { indicator: "Hiring Pipeline Velocity", target: 88, values: [58, 73, 84], notes: "Candidate screening is moving, final interviews need tighter scheduling." },
  { indicator: "Delivery SLA Adherence", target: 91, values: [72, 82, 89], notes: "Company-wide delivery rhythm is improving but not fully at target yet." },
];

function computeProgress(current, target, direction) {
  if (target === 0 || current === null || current === undefined) return 0;
  if (direction === "lower_is_better") {
    return Math.min(100, Math.round((target / Math.max(current, 0.01)) * 100));
  }
  if (direction === "on_target") {
    const variance = Math.abs(Number(current) - Number(target));
    return Math.max(
      0,
      Math.min(100, Math.round(100 - (variance / Math.max(Math.abs(target), 1)) * 100))
    );
  }
  return Math.min(100, Math.round((current / target) * 100));
}

function deriveStatus(progressPct, currentStatus = "active") {
  if (currentStatus === "cancelled") return "cancelled";
  if (currentStatus === "completed") return "completed";
  if (progressPct >= 100) return "completed";
  if (progressPct >= 70) return "active";
  if (progressPct > 0) return "at_risk";
  return "active";
}

function dateForPeriodDay(period, day) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return new Date();
  return new Date(Date.UTC(year, month - 1, day, 10, 0, 0));
}

async function getSeedUserId() {
  const user = await User.findOne({
    role: { $in: ["super_admin", "admin", "hr_management"] },
    isActive: true,
  })
    .sort({ role: -1, createdAt: 1 })
    .select("_id")
    .lean();
  return user?._id || null;
}

async function ensureStaff(createdBy) {
  for (const item of STAFF_SEED) {
    await Staff.findOneAndUpdate(
      { email: item.email },
      {
        $setOnInsert: {
          ...item,
          status: "active",
          employmentType: "full_time",
          currency: "AED",
          country: "UAE",
          city: "Dubai",
          notes: `${SEED_TAG}. Expert HR KPI demo profile.`,
          createdBy,
        },
        $set: {
          updatedBy: createdBy,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const staff = await Staff.find({ status: { $in: ["active", "probation"] } })
    .sort({ department: 1, fullName: 1 })
    .limit(12)
    .lean();

  for (const [index, member] of staff.entries()) {
    const score = [4.6, 4.2, 4.4, 3.9, 4.7, 4.1][index % 6];
    const completedLearning = index % 3 === 0 ? 2 : 1;
    await Staff.findByIdAndUpdate(member._id, {
      $set: {
        scorecards: [
          {
            period: PERIOD,
            rating: score,
            notes: "Seeded KPI baseline review for dashboard demonstration.",
            reviewerName: "HR Management",
            createdAt: dateForPeriodDay(PERIOD, 15),
          },
        ],
        learningGoals: [
          {
            title: "Role mastery improvement plan",
            description: "Focused monthly development action aligned with KPI outcomes.",
            targetDate: dateForPeriodDay(PERIOD, 26),
            status: "completed",
            progress: 100,
            createdAt: dateForPeriodDay(PERIOD, 3),
          },
          {
            title: "Cross-functional delivery improvement",
            description: "Improve collaboration with another department.",
            targetDate: dateForPeriodDay(PERIOD, 28),
            status: completedLearning > 1 ? "completed" : "active",
            progress: completedLearning > 1 ? 100 : 65,
            createdAt: dateForPeriodDay(PERIOD, 5),
          },
        ],
      },
    });
  }

  return Staff.find({ status: { $in: ["active", "probation"] } })
    .sort({ department: 1, fullName: 1 })
    .limit(12)
    .lean();
}

async function ensureIndicators(createdBy) {
  const map = new Map();
  for (const item of INDICATORS) {
    const doc = await KPIIndicator.findOneAndUpdate(
      { name: item.name },
      {
        $set: {
          ...item,
          isActive: true,
          updatedBy: createdBy,
        },
        $setOnInsert: {
          createdBy,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    map.set(doc.name, doc);
  }
  return map;
}

async function resetCheckins(goalId, values, notePrefix, createdBy) {
  await KPICheckin.deleteMany({ goalId, notes: { $regex: /^Seeded expert KPI check-in/ } });

  const days = [7, 15, 22];
  const docs = values.map((value, index) => ({
    goalId,
    date: dateForPeriodDay(PERIOD, days[index] || 22),
    value,
    notes: `Seeded expert KPI check-in: ${notePrefix}`,
    source: "manual",
    createdBy,
  }));
  await KPICheckin.insertMany(docs);
}

async function upsertGoal({ indicator, scope, staffId = null, department = null, teamId = null, target, values, notes }, createdBy) {
  const currentValue = values[values.length - 1];
  const progressPct = computeProgress(currentValue, target, indicator.direction);
  const status = deriveStatus(progressPct);
  const filter = {
    indicatorId: indicator._id,
    scope,
    period: PERIOD,
    ...(staffId ? { staffId } : {}),
    ...(department ? { department } : {}),
    ...(teamId ? { teamId } : {}),
  };

  const doc = await KPIGoal.findOneAndUpdate(
    filter,
    {
      $set: {
        indicatorId: indicator._id,
        scope,
        staffId: staffId || null,
        department: department || null,
        teamId: teamId || null,
        period: PERIOD,
        periodType: "monthly",
        targetValue: target,
        currentValue,
        progressPct,
        status,
        notes: `${notes} ${SEED_TAG}.`,
        updatedBy: createdBy,
      },
      $setOnInsert: {
        createdBy,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await resetCheckins(doc._id, values, notes, createdBy);
  return doc;
}

function individualGoalPlan(staff, index) {
  const role = `${staff.jobTitle || ""} ${staff.department || ""}`.toLowerCase();
  const isDelivery = /creative|development|marketing|operations|project|developer|designer|manager/.test(role);
  const qualityTarget = isDelivery ? 4.4 : 4.2;
  const utilizationTarget = staff.department === "finance" || staff.department === "hr" ? 78 : 85;
  const attendanceTarget = 98;
  const learningTarget = index % 3 === 0 ? 2 : 1;

  return [
    {
      indicator: "Output Quality Score",
      target: qualityTarget,
      values: [qualityTarget - 0.5, qualityTarget - 0.2, qualityTarget + (index % 2 ? -0.1 : 0.2)],
      notes: `${staff.fullName} quality trend`,
    },
    {
      indicator: "Utilization Rate",
      target: utilizationTarget,
      values: [utilizationTarget - 9, utilizationTarget - 2, utilizationTarget + (index % 4 === 0 ? 6 : 1)],
      notes: `${staff.fullName} utilization balance`,
    },
    {
      indicator: "Attendance Reliability",
      target: attendanceTarget,
      values: [94 + (index % 3), 96 + (index % 2), 98 - (index % 4 === 0 ? 2 : 0)],
      notes: `${staff.fullName} attendance reliability`,
    },
    {
      indicator: "Learning Goals Completed",
      target: learningTarget,
      values: [0, Math.min(1, learningTarget), learningTarget],
      notes: `${staff.fullName} learning progression`,
    },
  ];
}

async function run() {
  await connectDB();
  const createdBy = await getSeedUserId();
  const staff = await ensureStaff(createdBy);
  const indicators = await ensureIndicators(createdBy);

  let goalCount = 0;

  for (const [index, member] of staff.entries()) {
    for (const item of individualGoalPlan(member, index)) {
      const indicator = indicators.get(item.indicator);
      if (!indicator) continue;
      await upsertGoal(
        {
          indicator,
          scope: "individual",
          staffId: member._id,
          target: item.target,
          values: item.values,
          notes: item.notes,
        },
        createdBy
      );
      goalCount += 1;
    }
  }

  for (const item of DEPARTMENT_GOALS) {
    const indicator = indicators.get(item.indicator);
    if (!indicator) continue;
    await upsertGoal(
      {
        indicator,
        scope: "department",
        department: item.department,
        target: item.target,
        values: item.values,
        notes: item.notes,
      },
      createdBy
    );
    goalCount += 1;
  }

  for (const item of COMPANY_GOALS) {
    const indicator = indicators.get(item.indicator);
    if (!indicator) continue;
    await upsertGoal(
      {
        indicator,
        scope: "company",
        target: item.target,
        values: item.values,
        notes: item.notes,
      },
      createdBy
    );
    goalCount += 1;
  }

  const [indicatorCount, totalGoals, totalCheckins] = await Promise.all([
    KPIIndicator.countDocuments({ name: { $in: INDICATORS.map((item) => item.name) } }),
    KPIGoal.countDocuments({ period: PERIOD }),
    KPICheckin.countDocuments({ notes: { $regex: /^Seeded expert KPI check-in/ } }),
  ]);

  console.log("✅ HR KPI expert seed complete");
  console.log({
    period: PERIOD,
    staffUsed: staff.length,
    indicatorsSeeded: indicatorCount,
    goalsTouched: goalCount,
    goalsInPeriod: totalGoals,
    seededCheckins: totalCheckins,
  });

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error("❌ seedHRKPI failed:", err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close failure
  }
  process.exit(1);
});
