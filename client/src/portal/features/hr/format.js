// HR display helpers (PUI-4). Labels and tones only; HR records, statuses and
// rules are unchanged. Ownership mirrors the API (utils/ownership.js): a record
// is the user's own when staffUserId or createdBy is their user id.
import {
  EXPENSE_CATEGORY_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  STAFF_EMPLOYMENT_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
} from "./constants/hr.constants";

const labelFrom = (options) => (value) => options.find((o) => o.value === value)?.label || humanize(value);

export function humanize(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  const s = String(value).replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const leaveTypeLabel = labelFrom(LEAVE_TYPE_OPTIONS);
export const expenseCategoryLabel = labelFrom(EXPENSE_CATEGORY_OPTIONS);
export const staffStatusLabel = labelFrom(STAFF_STATUS_OPTIONS);
export const employmentTypeLabel = labelFrom(STAFF_EMPLOYMENT_TYPE_OPTIONS);

export const LEAVE_STATUS_LABEL = { submitted: "Submitted", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" };
export const LEAVE_STATUS_TONE = { submitted: "warn", approved: "ok", rejected: "bad", cancelled: "idle" };

export const EXPENSE_STATUS_LABEL = { submitted: "Submitted", approved: "Approved", rejected: "Rejected", registered: "Registered", paid: "Paid" };
export const EXPENSE_STATUS_TONE = { submitted: "warn", approved: "info", rejected: "bad", registered: "info", paid: "ok" };

export const STAFF_STATUS_TONE = { active: "ok", probation: "info", on_leave: "warn", inactive: "idle", terminated: "bad" };

export function date(value, { year = true } = {}) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
}

export function monthLabel(ym) {
  if (!ym) return "";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return String(ym);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function money(amount, currency = "AED") {
  if (amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount))) return "—";
  return `${currency || "AED"} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const idOf = (v) => (v && typeof v === "object" ? v._id : v || "");

/** The signed-in user's own HR record (same rule as the API). */
export function isOwnRecord(access, record) {
  const me = String(access?.user?._id || access?.user?.id || "");
  if (!me || !record) return false;
  return String(idOf(record.staffUserId)) === me || String(idOf(record.createdBy)) === me;
}

/**
 * Whether the user may take an approver action on a record: they need the
 * permission, and only super_admin may decide their own request (API rule).
 */
export function canDecide(access, perm, record) {
  if (!access.can(perm)) return false;
  return access.role === "super_admin" || !isOwnRecord(access, record);
}

/** Inclusive day count, as the leave form has always computed it. */
export function daysBetween(start, end) {
  if (!start || !end) return 1;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}
