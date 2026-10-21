// Display helpers for project records (PUI-2). Only fields the API returns.

export const STATUS_LABEL = {
  draft: "Draft",
  planned: "Planned",
  active: "Active",
  on_hold: "On hold",
  in_review: "In review",
  completed: "Completed",
  archived: "Archived",
  cancelled: "Cancelled",
};

// The one status system: ok / warn / bad / info / idle (+ outline for draft).
export const STATUS_TONE = {
  draft: "outline",
  planned: "idle",
  active: "info",
  on_hold: "warn",
  in_review: "warn",
  completed: "ok",
  archived: "idle",
  cancelled: "bad",
};

export const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
export const PRIORITY_TONE = { low: "idle", medium: "idle", high: "warn", urgent: "bad" };

export const MODE_LABEL = {
  pre_contract: "Pre-contract",
  contracted: "Contracted",
  custom: "Custom",
  internal: "Internal",
};

export const SOURCE_LABEL = {
  manual: "Manual",
  enrollment: "Service follow-up",
  sales: "Sales",
  internal: "Internal",
};

export function humanize(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  const s = String(value).replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function statusLabel(status) {
  return STATUS_LABEL[status] || humanize(status || "draft");
}

export function priorityLabel(priority) {
  return PRIORITY_LABEL[priority] || humanize(priority || "medium");
}

export function formatDate(value, { year = true } = {}) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
}

export function formatMoney(amount, currency = "AED") {
  if (amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount))) return "";
  return `${currency || "AED"} ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function initials(name) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

const DAY = 24 * 60 * 60 * 1000;

/** Due date status for an open project, from its real due date only. */
export function dueInfo(project, now = new Date()) {
  const due = project?.endDate ? new Date(project.endDate) : null;
  if (!due || Number.isNaN(due.getTime())) return null;
  if (["completed", "archived", "cancelled"].includes(project?.status)) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const days = Math.round((end - start) / DAY);
  if (days < 0) return { tone: "bad", text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, days };
  if (days === 0) return { tone: "warn", text: "Due today", days };
  if (days <= 14) return { tone: "warn", text: `Due in ${days} day${days === 1 ? "" : "s"}`, days };
  return { tone: "", text: `Due in ${days} days`, days };
}

export function customerOf(project) {
  const c = project?.customerId;
  return c && typeof c === "object" ? c : null;
}

export function projectSubline(project) {
  const c = customerOf(project);
  const who = project?.projectMode === "internal" ? "Internal project" : c?.companyName || "No client linked";
  return [who, project?.code].filter(Boolean).join(", ");
}

// Job statuses (jobs module) mapped onto the shared status tones.
export const JOB_STATUS_TONE = {
  brief: "outline",
  content_ready: "idle",
  script: "idle",
  pre_production: "info",
  designing: "info",
  shooting: "info",
  editing: "info",
  internal_review: "warn",
  client_review: "warn",
  approved: "ok",
  scheduled: "info",
  published: "ok",
  delivered: "ok",
  archived: "idle",
  on_hold: "warn",
  cancelled: "bad",
};

export const JOB_DONE = new Set(["approved", "published", "delivered", "archived", "cancelled"]);

/** Open jobs with a due date, soonest first. */
export function upcomingJobs(jobs = [], limit = 5) {
  return jobs
    .filter((j) => !JOB_DONE.has(j.status) && j.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, limit);
}
