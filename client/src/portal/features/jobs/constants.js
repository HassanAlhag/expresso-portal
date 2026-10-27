// Job vocabulary on the client. The API (portal-api job.constants.js) is
// authoritative for status and type values; docs/architecture/validate.cjs
// checks that every API status has a label here and that nothing here is
// unknown to the API. Keep this file free of imports (the validator reads it).

// Type filter. Only values the API accepts (PI tail: "Event" removed, the API
// has no such type and saved it as "Other").
export const JOB_TYPES = [
  { value: "",           label: "All types" },
  { value: "task",       label: "Task" },
  { value: "post",       label: "Post" },
  { value: "story",      label: "Story" },
  { value: "carousel",   label: "Carousel" },
  { value: "design",     label: "Design" },
  { value: "page",       label: "Page" },
  { value: "photo",      label: "Photo" },
  { value: "case_study", label: "Case study" },
  { value: "other",      label: "Other" },
];

export const JOB_CREATE_TYPES = [
  { value: "video", label: "Video" },
  { value: "photo", label: "Photo" },
  { value: "design", label: "Design" },
];

export const JOB_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "brief", label: "Brief" },
  { value: "content_ready", label: "Content ready" },
  { value: "script", label: "Scripting" },
  { value: "pre_production", label: "Pre-production" },
  { value: "designing", label: "Designing" },
  { value: "shooting", label: "Shooting" },
  { value: "editing", label: "Editing" },
  { value: "internal_review", label: "Internal review" },
  { value: "client_review", label: "Client review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "delivered", label: "Delivered" },
  { value: "on_hold", label: "On hold" },
  { value: "archived", label: "Archived" },
];

export const JOB_STATUS_LABEL = Object.fromEntries(JOB_STATUSES.filter((o) => o.value).map((o) => [o.value, o.label]));
export const JOB_TYPE_LABEL = Object.fromEntries(JOB_TYPES.filter((o) => o.value).map((o) => [o.value, o.label]).concat([["video", "Video"], ["reel", "Reel"]]));

// Status groups the list can filter by (the API accepts a comma-separated
// status list). Used by the metrics and by dashboard links.
export const JOB_STATUS_GROUPS = {
  review: { label: "In review (internal or client)", statuses: ["internal_review", "client_review"] },
  production: { label: "In production (design, shoot or edit)", statuses: ["designing", "shooting", "editing"] },
};

export const JOB_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const JOB_PLATFORMS = [
  { value: "", label: "Not set" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
];

export const JOB_SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "dueDate", label: "Due date, soonest" },
  { value: "-updatedAt", label: "Recently updated" },
  { value: "title", label: "Title A → Z" },
  { value: "-title", label: "Title Z → A" },
  { value: "status", label: "Status A → Z" },
  { value: "-status", label: "Status Z → A" },
];

// Status → badge tone (one status system, PUI-1).
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
  on_hold: "warn",
  archived: "idle",
};

export const BRAND = "#7F8AD1";
