export const CRM_ROUTES = {
  DASHBOARD: "/portal/crm",
  LEADS: "/portal/crm/leads",
  DEALS: "/portal/crm/deals",
  ACCOUNTS: "/portal/crm/accounts",
  CONTACTS: "/portal/crm/contacts",
};

export const DEAL_PIPELINE_COLUMNS = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export const DEAL_STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const DEAL_FORM_STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
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
  const found = DEAL_FORM_STAGE_OPTIONS.find((x) => x.value === stage);
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
