// KPI labels (PUI-4), matching the API's own values.
import { HR_DEPARTMENT_OPTIONS } from "../constants/hr.constants";
import { humanize } from "../format";

export const KPI_STATUSES = ["active", "completed", "at_risk", "missed", "cancelled"];
export const KPI_STATUS_LABEL = { active: "Active", completed: "Completed", at_risk: "At risk", missed: "Missed", cancelled: "Cancelled" };
export const KPI_STATUS_TONE = { active: "info", completed: "ok", at_risk: "warn", missed: "bad", cancelled: "idle" };
export const KPI_SCOPES = ["individual", "team", "department", "company"];
export const KPI_PERIOD_TYPES = ["monthly", "quarterly", "annual"];
export const KPI_CATEGORIES = ["performance", "productivity", "attendance", "financial", "development", "quality", "custom"];
export const KPI_DIRECTIONS = [
  { value: "higher_is_better", label: "Higher is better" },
  { value: "lower_is_better", label: "Lower is better" },
  { value: "on_target", label: "On target" },
];
export const KPI_FREQUENCIES = ["weekly", "monthly", "quarterly", "annual"];
export const KPI_AUTO_SOURCES = [
  { value: "none", label: "None (entered by hand)" },
  { value: "leaves_taken", label: "Leave taken (approved days)" },
  { value: "expenses_total", label: "Expenses total (approved amounts)" },
  { value: "scorecard_avg", label: "Scorecard average rating" },
  { value: "learning_goals_completed", label: "Learning goals completed" },
];
export const KPI_DEPARTMENT_OPTIONS = HR_DEPARTMENT_OPTIONS.filter((o) => o.value);

export const options = (values) => values.map((v) => ({ value: v, label: humanize(v) }));
export const kpiStatusLabel = (s) => KPI_STATUS_LABEL[s] || humanize(s);
export const directionLabel = (d) => KPI_DIRECTIONS.find((o) => o.value === d)?.label || humanize(d);
export const autoSourceLabel = (s) => KPI_AUTO_SOURCES.find((o) => o.value === s)?.label || humanize(s);
export const hasAutoSource = (indicator) => Boolean(indicator?.autoSource && indicator.autoSource !== "none");
export const periodHint = (type) => (type === "annual" ? "For example 2026" : type === "quarterly" ? "For example 2026-Q2" : "For example 2026-05");
export const pct = (v) => `${Math.round(Number(v) || 0)}%`;

/** Who or what a goal is for, in words. */
export function goalOwner(goal) {
  if (goal?.scope === "individual") return goal.staffId?.fullName || "One person";
  if (goal?.scope === "team") return goal.teamId ? `Team: ${goal.teamId}` : "A team";
  if (goal?.scope === "department") return `${humanize(goal.department || "")} department`;
  return "Company";
}
