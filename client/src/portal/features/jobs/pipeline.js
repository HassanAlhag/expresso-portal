// Maps any backend status to its pipeline column key
const STATUS_TO_COLUMN = {
  brief:            "brief",
  content_ready:    "brief",
  script:           "scripting",
  pre_production:   "scripting",
  designing:        "production",
  shooting:         "production",
  editing:          "production",
  internal_review:  "review",
  client_review:    "review",
  approved:         "approved",
  scheduled:        "approved",
  published:        "published",
  delivered:        "done",
  on_hold:          "done",
  archived:         "done",
};

export function getColumnKey(status) {
  return STATUS_TO_COLUMN[status] || "brief";
}

// moveStatus = the backend status applied when moving a job INTO this column
export const JOB_STAGES = [
  { key: "brief",      label: "Brief",      moveStatus: "brief",           statuses: ["brief", "content_ready"] },
  { key: "scripting",  label: "Scripting",  moveStatus: "script",          statuses: ["script", "pre_production"] },
  { key: "production", label: "Production", moveStatus: "editing",         statuses: ["designing", "shooting", "editing"] },
  { key: "review",     label: "Review",     moveStatus: "internal_review", statuses: ["internal_review", "client_review"] },
  { key: "approved",   label: "Approved",   moveStatus: "approved",        statuses: ["approved", "scheduled"] },
  { key: "published",  label: "Published",  moveStatus: "published",       statuses: ["published"] },
  { key: "done",       label: "Done",       moveStatus: "delivered",       statuses: ["delivered", "on_hold", "archived"] },
];

const STAGE_IDX = Object.fromEntries(JOB_STAGES.map((s, i) => [s.key, i]));

export function canMove(fromStatus, toColumnKey) {
  const fromCol = getColumnKey(fromStatus);
  const a = STAGE_IDX[fromCol] ?? -1;
  const b = STAGE_IDX[toColumnKey] ?? -1;
  if (a === -1 || b === -1) return false;
  return Math.abs(a - b) <= 1;
}

export function nextStage(currentStatus) {
  const colKey = getColumnKey(currentStatus);
  const idx = STAGE_IDX[colKey] ?? 0;
  const next = JOB_STAGES[Math.min(idx + 1, JOB_STAGES.length - 1)];
  return next.moveStatus;
}

export function prevStage(currentStatus) {
  const colKey = getColumnKey(currentStatus);
  const idx = STAGE_IDX[colKey] ?? 0;
  const prev = JOB_STAGES[Math.max(idx - 1, 0)];
  return prev.moveStatus;
}
