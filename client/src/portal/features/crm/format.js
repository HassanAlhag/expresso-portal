// Display helpers for CRM records (PUI-3). Labels and tones only; the CRM
// model (statuses, stages, sources) is unchanged.
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from "./constants";

export { leadSourceLabel };

export const LEAD_STATUSES = ["new", "contacted", "qualified", "unqualified", "converted"];
export const LEAD_STATUS_LABEL = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};
export const LEAD_STATUS_TONE = { new: "info", contacted: "idle", qualified: "ok", unqualified: "outline", converted: "ok" };

export const DEAL_STAGES = ["discovery", "qualified", "proposal", "negotiation", "verbal_commitment", "won", "lost"];
export const OPEN_DEAL_STAGES = DEAL_STAGES.filter((s) => s !== "won" && s !== "lost");
export const DEAL_STAGE_LABEL = {
  discovery: "Discovery",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  verbal_commitment: "Verbal commitment",
  won: "Won",
  lost: "Lost",
};
export const DEAL_STAGE_TONE = {
  discovery: "idle",
  qualified: "info",
  proposal: "info",
  negotiation: "warn",
  verbal_commitment: "warn",
  won: "ok",
  lost: "bad",
};

export function normalizeStage(stage) {
  return stage === "new" ? "discovery" : stage || "discovery";
}

export const ACCOUNT_STATUSES = ["active", "prospect", "inactive"];
export const ACCOUNT_STATUS_LABEL = { active: "Active", prospect: "Prospect", inactive: "Inactive" };
export const ACCOUNT_STATUS_TONE = { active: "ok", prospect: "info", inactive: "idle" };

export const ACTIVITY_TYPE_LABEL = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  task: "Task",
  whatsapp: "WhatsApp",
  other: "Other",
};

export const SOURCE_OPTIONS = LEAD_SOURCE_OPTIONS;

/** Where a CRM activity's record lives, for links. */
export function entityPath(entityType, entityId) {
  if (!entityId) return "";
  const base = {
    lead: "/portal/crm/leads",
    deal: "/portal/crm/deals",
    account: "/portal/crm/accounts",
    contact: "/portal/crm/contacts",
    customer: "/portal/customers",
  }[entityType];
  return base ? `${base}/${entityId}` : "";
}

export function money(value, currency = "AED") {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  return `${currency || "AED"} ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function compactMoney(value, currency = "AED") {
  const v = Number(value || 0);
  let s;
  if (Math.abs(v) >= 1_000_000) s = `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  else if (Math.abs(v) >= 1_000) s = `${(v / 1_000).toFixed(v >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  else s = String(Math.round(v));
  return `${currency || "AED"} ${s}`;
}

export function ownerName(item) {
  return item?.ownerUserId?.fullName || item?.ownerUserId?.email || "";
}

export function idOf(v) {
  return v && typeof v === "object" ? v._id : v || "";
}
