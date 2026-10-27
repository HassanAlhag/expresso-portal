// Display helpers for jobs (PI tail). Labels come from constants.js and the
// board columns from pipeline.js, so there is no second status list here.
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, JOB_TYPE_LABEL, JOB_PRIORITIES } from "./constants";
import { JOB_STAGES, getColumnKey } from "./pipeline";

export const idOf = (x) => String(x && typeof x === "object" ? x._id || "" : x || "");

export function humanize(value) {
  const s = String(value || "").replace(/_/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export const jobStatusLabel = (status) => JOB_STATUS_LABEL[status] || humanize(status) || "No status";
export const jobStatusTone = (status) => JOB_STATUS_TONE[status] || "idle";
export const jobTypeLabel = (type) => JOB_TYPE_LABEL[type] || humanize(type) || "Job";
export const jobPriorityLabel = (p) => JOB_PRIORITIES.find((o) => o.value === p)?.label || humanize(p);

/** The board column a status belongs to (on_hold and archived sit in Done). */
export function jobStage(status) {
  const key = getColumnKey(status);
  return JOB_STAGES.find((s) => s.key === key) || JOB_STAGES[0];
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** yyyy-mm-dd for a date input. */
export function dateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

const CLOSED = new Set(["approved", "scheduled", "published", "delivered", "archived"]);
/** Due-date note for open jobs: overdue / due today / due soon. */
export function dueNote(job, now = new Date()) {
  if (!job?.dueDate || CLOSED.has(job.status)) return null;
  const due = new Date(job.dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const days = Math.round((new Date(due.toDateString()) - new Date(now.toDateString())) / 86400000);
  if (days < 0) return { text: `${-days} day${days === -1 ? "" : "s"} overdue`, tone: "bad" };
  if (days === 0) return { text: "Due today", tone: "warn" };
  if (days <= 3) return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "warn" };
  return null;
}

export const customerName = (job) => (job?.customerId && typeof job.customerId === "object" ? job.customerId.companyName || "" : "");
export const projectName = (job) => (job?.projectId && typeof job.projectId === "object" ? job.projectId.name || "" : "");

export function personName(u) {
  if (!u || typeof u !== "object") return "";
  return u.fullName || u.name || u.email || "";
}

export function initials(name = "") {
  return String(name).split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}
