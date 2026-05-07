export const JOB_TYPES = [
  { value: "",           label: "All types" },
  { value: "post",       label: "Post" },
  { value: "story",      label: "Story" },
  { value: "carousel",   label: "Carousel" },
  { value: "design",     label: "Design" },
  { value: "photo",      label: "Photo" },
  { value: "case_study", label: "Case study" },
  { value: "event",      label: "Event" },
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

export const JOB_SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "title", label: "Title A → Z" },
  { value: "-title", label: "Title Z → A" },
  { value: "status", label: "Status A → Z" },
  { value: "-status", label: "Status Z → A" },
];

export const BRAND = "#7F8AD1";
