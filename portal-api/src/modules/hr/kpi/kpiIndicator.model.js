import mongoose from "mongoose";

export const KPI_CATEGORIES = [
  "performance",
  "productivity",
  "attendance",
  "financial",
  "development",
  "quality",
  "custom",
];

export const KPI_DIRECTIONS = ["higher_is_better", "lower_is_better", "on_target"];

export const KPI_FREQUENCIES = ["weekly", "monthly", "quarterly", "annual"];

export const KPI_AUTO_SOURCES = [
  "none",
  "leaves_taken",       // approved leave days from Leave model
  "expenses_total",     // sum of approved expenses from Expense model
  "scorecard_avg",      // avg rating from Staff.scorecards
  "learning_goals_completed", // count completed from Staff.learningGoals
];

const KPIIndicatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: { type: String, enum: KPI_CATEGORIES, default: "custom", index: true },
    unit: { type: String, trim: true, default: "count" }, // "calls", "%", "AED", "days", "count", "score"
    direction: { type: String, enum: KPI_DIRECTIONS, default: "higher_is_better" },
    frequency: { type: String, enum: KPI_FREQUENCIES, default: "monthly" },
    autoSource: { type: String, enum: KPI_AUTO_SOURCES, default: "none" },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

KPIIndicatorSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.KPIIndicator ||
  mongoose.model("KPIIndicator", KPIIndicatorSchema);
