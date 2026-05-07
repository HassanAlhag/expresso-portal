export const JOB_TYPES = [
  "post",
  "carousel",
  "story",
  "reel",
  "video",
  "photo",
  "design",
  "case_study",
  "other",
];

export const JOB_WORKFLOW_TYPES = ["design", "video", "photo"];

export const JOB_STATUSES = [
  "brief",
  "content_ready",
  "script",
  "pre_production",
  "designing",
  "shooting",
  "editing",
  "internal_review",
  "client_review",
  "approved",
  "scheduled",
  "published",
  "delivered",
  "archived",
  "on_hold",
];

export const JOB_PRIORITIES = ["low", "normal", "high", "urgent"];

export const JOB_PUBLISH_STATUSES = ["not_ready", "ready", "published"];

export function normalizeJobType(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();

  if (v === "static_post") return "post";
  if (v === "ugc") return "reel";
  if (JOB_TYPES.includes(v)) return v;

  return "other";
}

export function getWorkflowTypeFromJobType(type) {
  const t = normalizeJobType(type);

  if (["post", "carousel", "story", "design", "case_study"].includes(t)) {
    return "design";
  }

  if (["reel", "video"].includes(t)) {
    return "video";
  }

  if (t === "photo") {
    return "photo";
  }

  return "design";
}

export function normalizeJobStatus(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();

  if (v === "planned") return "brief";
  if (v === "shoot") return "shooting";
  if (v === "uploaded") return "editing";
  if (v === "review") return "internal_review";

  return v;
}

export function isValidJobStatus(value) {
  return JOB_STATUSES.includes(normalizeJobStatus(value));
}

export function isValidJobType(value) {
  return JOB_TYPES.includes(normalizeJobType(value));
}

export function isValidJobPriority(value) {
  return JOB_PRIORITIES.includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

export function isValidWorkflowType(value) {
  return JOB_WORKFLOW_TYPES.includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPublishStatus(value) {
  return JOB_PUBLISH_STATUSES.includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

export function safeJobSort(raw) {
  const value = String(raw || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "title",
    "-title",
    "status",
    "-status",
    "type",
    "-type",
    "priority",
    "-priority",
    "updatedAt",
    "-updatedAt",
    "dueDate",
    "-dueDate",
  ]);

  if (!allowed.has(value)) return { createdAt: -1 };

  const key = value.startsWith("-") ? value.slice(1) : value;
  const dir = value.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}
