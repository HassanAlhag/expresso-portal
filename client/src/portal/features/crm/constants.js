export const CRM_ROUTES = {
  DASHBOARD: "/portal/crm",
  LEADS: "/portal/crm/leads",
  DEALS: "/portal/crm/deals",
  ACCOUNTS: "/portal/crm/accounts",
  CONTACTS: "/portal/crm/contacts",
};

export const LEAD_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "website", label: "Website" },
  { value: "plan_builder", label: "Build Your Plan" },
  { value: "referral", label: "Referral" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "campaign", label: "Campaign" },
  { value: "other", label: "Other" },
];

export function leadSourceLabel(value) {
  const source = String(value || "manual").trim().toLowerCase();
  const found = LEAD_SOURCE_OPTIONS.find((item) => item.value === source);
  return found?.label || source.replaceAll("_", " ");
}

export const DEAL_PIPELINE_COLUMNS = [
  { key: "discovery", label: "Discovery" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "verbal_commitment", label: "Verbal Commitment" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export const DEAL_STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  { value: "discovery", label: "Discovery" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "verbal_commitment", label: "Verbal Commitment" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const DEAL_FORM_STAGE_OPTIONS = [
  { value: "discovery", label: "Discovery" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "verbal_commitment", label: "Verbal Commitment" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const DEAL_SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "-value", label: "Highest value" },
  { value: "value", label: "Lowest value" },
  { value: "name", label: "Name A → Z" },
];

export function stageLabel(stage) {
  const normalized = stage === "new" ? "discovery" : stage;
  const found = DEAL_FORM_STAGE_OPTIONS.find((x) => x.value === normalized);
  return found?.label || "Unknown";
}

export function formatMoney(value, currency = "AED") {
  const num = Number(value || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}
