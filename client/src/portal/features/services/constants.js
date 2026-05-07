export const BRAND = "#7F8AD1";

export const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export const TYPE_OPTIONS = [
  { value: "service", label: "Service" },
  { value: "package", label: "Package" },
  { value: "retainer", label: "Retainer" },
  { value: "project", label: "Project" },
];

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "name", label: "Name A → Z" },
  { value: "-name", label: "Name Z → A" },
  { value: "status", label: "Status A → Z" },
  { value: "-status", label: "Status Z → A" },
];

export const BILLING_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "one_time", label: "One-time" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const EXECUTION_MODE_OPTIONS = [
  { value: "recurring", label: "Recurring / Monthly" },
  { value: "phased_project", label: "Phased Project" },
  { value: "one_time", label: "One-time Simple" },
];

export const SLA_UNITS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

export const DEFAULT_TEMPLATE = {
  name: "",
  slug: "",
  status: "draft",
  summary: "",
  description: "",
  billingCycle: "monthly",
  price: undefined,
  executionMode: "recurring",

  scopeGroups: [],

  sla: {
    responseTime: 24,
    responseUnit: "hours",
    revisionRounds: 2,
    deliveryDays: 7,
    workingDaysOnly: true,
    supportWindow: "Mon–Fri, 9am–6pm",
    notes: "",
  },

  approvals: {
    required: true,
    steps: [],
    checklist: [],
  },

  files: {
    uploads: [],
    mediaRefs: [],
  },
};
