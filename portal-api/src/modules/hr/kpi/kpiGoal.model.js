import mongoose from "mongoose";

export const KPI_SCOPES = ["individual", "team", "department", "company"];
export const KPI_PERIOD_TYPES = ["monthly", "quarterly", "annual"];
export const KPI_GOAL_STATUSES = ["active", "completed", "at_risk", "missed", "cancelled"];

export const DEPARTMENTS = [
  "management", "creative", "development", "marketing",
  "sales", "finance", "operations", "hr", "procurement", "other",
];

const KPIGoalSchema = new mongoose.Schema(
  {
    indicatorId: { type: mongoose.Schema.Types.ObjectId, ref: "KPIIndicator", required: true, index: true },

    // Who this goal applies to
    scope: { type: String, enum: KPI_SCOPES, required: true, default: "individual", index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "HRStaff", default: null, index: true },
    teamId: { type: String, trim: true, default: null },   // team name/id string
    department: { type: String, trim: true, default: null, index: true },

    // Period
    period: { type: String, trim: true, required: true, index: true }, // "2026-05", "2026-Q2", "2026"
    periodType: { type: String, enum: KPI_PERIOD_TYPES, default: "monthly" },

    // Values
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: null },

    // Progress (0-100, computed)
    progressPct: { type: Number, default: 0 },

    // Status — can be set manually or auto-derived
    status: { type: String, enum: KPI_GOAL_STATUSES, default: "active", index: true },

    notes: { type: String, trim: true, default: "" },
    lastSyncedAt: { type: Date, default: null }, // when autoSource last ran

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

KPIGoalSchema.index({ indicatorId: 1, period: 1 });
KPIGoalSchema.index({ staffId: 1, period: 1 });
KPIGoalSchema.index({ scope: 1, status: 1 });

export default mongoose.models.KPIGoal || mongoose.model("KPIGoal", KPIGoalSchema);
