// Support request display helpers (PUI-5), in the client's language. The
// ticket model and its statuses are unchanged.

export const TICKET_STATUS_LABEL = {
  open: "Open",
  in_progress: "In progress",
  waiting_client: "Waiting for you",
  waiting_vendor: "Waiting on a supplier",
  in_review: "In review",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};
export const TICKET_STATUS_TONE = {
  open: "info",
  in_progress: "info",
  waiting_client: "warn",
  waiting_vendor: "idle",
  in_review: "info",
  escalated: "bad",
  resolved: "ok",
  closed: "idle",
};
export const ACTIVE_TICKET_STATUSES = ["open", "in_progress", "waiting_client", "waiting_vendor", "in_review", "escalated"];
export const TERMINAL_TICKET_STATUSES = ["resolved", "closed"];

// Types an external user can file (the API turns anything else into support).
export const EXTERNAL_TICKET_TYPES = [
  { value: "support", label: "Support", hint: "Something isn't working, or you have a question" },
  { value: "change_request", label: "Change request", hint: "Ask for a change to agreed work" },
  { value: "procurement", label: "Procurement", hint: "Ask Expresso to source something" },
];
export const TICKET_TYPE_LABEL = { support: "Support", change_request: "Change request", procurement: "Procurement", internal: "Internal" };
export const TICKET_PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
export const TICKET_PRIORITY_TONE = { low: "idle", medium: "neutral", high: "warn", urgent: "bad" };
export const APPROVAL_LABEL = { pending: "Waiting for Expresso's decision", approved: "Approved", rejected: "Not approved" };

export const ticketStatusLabel = (s) => TICKET_STATUS_LABEL[s] || String(s || "").replaceAll("_", " ");

export function date(value, { time = false } = {}) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) });
}

/** Sum of the stats endpoint's counts for the given statuses. */
export const countStatuses = (byStatus = {}, statuses = ACTIVE_TICKET_STATUSES) => statuses.reduce((n, s) => n + Number(byStatus?.[s] || 0), 0);
