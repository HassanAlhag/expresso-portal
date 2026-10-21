export const BRAND = "#7F8AD1";

export const PROJECT_STATUS_OPTIONS = [
  { value: "", label: "All except archived" },
  { value: "draft", label: "Draft" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "in_review", label: "In review" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "cancelled", label: "Cancelled" },
];

export const PROJECT_CREATE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "in_review", label: "In review" },
  { value: "completed", label: "Completed" },
];

export const PROJECT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "delivery", label: "Delivery" },
  { value: "website", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "campaign", label: "Campaign" },
  { value: "branding", label: "Branding" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

export const PROJECT_CREATE_TYPE_OPTIONS = [
  { value: "delivery", label: "Delivery" },
  { value: "website", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "campaign", label: "Campaign" },
  { value: "branding", label: "Branding" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

export const PROJECT_PRIORITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PROJECT_CREATE_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PROJECT_SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "name", label: "Name A → Z" },
  { value: "-name", label: "Name Z → A" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "team", label: "Team" },
];

export const PROJECT_TABS = {
  OVERVIEW: "overview",
  SCOPE: "scope",
  JOBS: "jobs",
  FILES: "files",
  BILLING: "billing",
  ACTIVITY: "activity",
};
