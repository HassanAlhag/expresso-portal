// Procurement display helpers (PUI-4). Labels and tones for the API's own
// values; statuses, transitions and R3 RFQ numbering are unchanged.

export const REQUEST_STATUSES = ["new", "assessing", "quoted", "approved", "ordered", "delivered", "cancelled"];
export const REQUEST_STATUS_LABEL = { new: "New", assessing: "Assessing", quoted: "Quoted", approved: "Approved", ordered: "Ordered", delivered: "Delivered", cancelled: "Cancelled" };
export const REQUEST_STATUS_TONE = { new: "warn", assessing: "info", quoted: "info", approved: "info", ordered: "info", delivered: "ok", cancelled: "idle" };
// Where each status is stamped in request.timeline (the API's STATUS_TIMELINE_MAP).
export const REQUEST_TIMELINE = [
  { status: "assessing", field: "assessedAt", label: "Assessing" },
  { status: "quoted", field: "quotedAt", label: "Quoted" },
  { status: "approved", field: "approvedAt", label: "Approved" },
  { status: "ordered", field: "orderedAt", label: "Ordered" },
  { status: "delivered", field: "deliveredAt", label: "Delivered" },
  { status: "cancelled", field: "cancelledAt", label: "Cancelled" },
];

export const PRIORITIES = ["urgent", "high", "normal", "low"];
export const PRIORITY_LABEL = { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" };
export const PRIORITY_TONE = { urgent: "bad", high: "warn", normal: "neutral", low: "idle" };

export const RFQ_STATUSES = ["draft", "published", "closed", "awarded"];
export const RFQ_STATUS_LABEL = { draft: "Draft", published: "Published", closed: "Closed", awarded: "Awarded" };
export const RFQ_STATUS_TONE = { draft: "outline", published: "info", closed: "idle", awarded: "ok" };

export const QUOTE_STATUS_LABEL = { submitted: "Submitted", under_review: "Under review", accepted: "Accepted", rejected: "Rejected" };
export const QUOTE_STATUS_TONE = { submitted: "warn", under_review: "info", accepted: "ok", rejected: "bad" };

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"];
export const APPLICATION_STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
export const APPLICATION_STATUS_TONE = { pending: "warn", approved: "ok", rejected: "bad" };

export const options = (values, labels) => values.map((v) => ({ value: v, label: labels[v] || v }));

export function money(amount, currency = "AED") {
  if (amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount))) return "";
  return `${currency || "AED"} ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function date(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const idOf = (v) => (v && typeof v === "object" ? v._id : v || "");
export const requestRef = (r) => r?.ref || (r?._id ? `PR-${String(r._id).slice(-4).toUpperCase()}` : "");
export const clientName = (r) => r?.customerId?.companyName || r?.customerId?.contactName || "";
// Web links only; anything else is shown as text.
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "");

// What deleting a request does (the API hard-deletes New and Cancelled ones only).
export const REQUEST_DELETE_DETAILS = ["The request is deleted permanently and can't be restored.", "Only New and Cancelled requests can be deleted. To stop work on one, cancel it instead."];
