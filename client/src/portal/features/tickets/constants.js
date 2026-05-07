export const BRAND = "#6f7fd9";

export const TYPE_OPTIONS = [
  { value: "support",        label: "Support",         icon: "🎧" },
  { value: "change_request", label: "Change Request",  icon: "🔄" },
  { value: "internal",       label: "Internal",        icon: "🔒" },
  { value: "procurement",    label: "Procurement",     icon: "🛒" },
];

export const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.label]));

export const STATUS_OPTIONS = [
  { value: "",               label: "All statuses" },
  { value: "open",           label: "Open" },
  { value: "in_progress",    label: "In Progress" },
  { value: "waiting_client", label: "Waiting Client" },
  { value: "waiting_vendor", label: "Waiting Vendor" },
  { value: "in_review",      label: "In Review" },
  { value: "escalated",      label: "Escalated" },
  { value: "resolved",       label: "Resolved" },
  { value: "closed",         label: "Closed" },
];

export const ACTIVE_STATUSES = ["open", "in_progress", "waiting_client", "waiting_vendor", "in_review", "escalated"];
export const TERMINAL_STATUSES = ["resolved", "closed"];

export const CATEGORY_OPTIONS = [
  { value: "",             label: "All categories" },
  { value: "general",      label: "General" },
  { value: "design",       label: "Design" },
  { value: "development",  label: "Development" },
  { value: "seo",          label: "SEO" },
  { value: "ads",          label: "Ads" },
  { value: "billing",      label: "Billing" },
  { value: "hosting",      label: "Hosting" },
  { value: "content",      label: "Content" },
  { value: "social_media", label: "Social Media" },
  { value: "analytics",    label: "Analytics" },
  { value: "support",      label: "Support" },
  { value: "procurement",  label: "Procurement" },
];

export const PRIORITY_OPTIONS = [
  { value: "",       label: "All priorities" },
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const SLA_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "priority", label: "Priority" },
  { value: "critical", label: "Critical" },
];

export const SORT_OPTIONS = [
  { value: "-lastActivityAt", label: "Recent activity" },
  { value: "-createdAt",      label: "Newest first" },
  { value: "createdAt",       label: "Oldest first" },
  { value: "dueDate",         label: "Due date ↑" },
  { value: "-dueDate",        label: "Due date ↓" },
  { value: "-priority",       label: "Priority" },
];

// Kanban board columns shown in board view
export const BOARD_COLUMNS = [
  { status: "open",           label: "Open",            color: "emerald" },
  { status: "in_progress",    label: "In Progress",     color: "indigo" },
  { status: "waiting_client", label: "Waiting Client",  color: "orange" },
  { status: "waiting_vendor", label: "Waiting Vendor",  color: "amber" },
  { status: "in_review",      label: "In Review",       color: "violet" },
  { status: "escalated",      label: "Escalated",       color: "rose" },
  { status: "resolved",       label: "Resolved",        color: "slate" },
  { status: "closed",         label: "Closed",          color: "slate" },
];
