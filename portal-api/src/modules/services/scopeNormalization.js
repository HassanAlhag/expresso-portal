// Scope normalisation shared by service templates and enrollments (P3-7,
// R4-D). One implementation: the service-template behaviour, which keeps
// checklist ids. Pure functions; no schema or validation lives here. Each
// model's own schema still applies when the result is saved (the enrollment
// snapshot schema has no checklist id, so it continues to drop it).

export function normalizeChecklist(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || "").trim(),
      text: String(item?.text || "").trim(),
      required: item?.required !== false,
    }))
    .filter((item) => item.text);
}

export function normalizeScopeGroupJob(item = {}) {
  const startDays = Number(item?.startDays || 0);
  const dueDays = Number(item?.dueDays || 0);
  return {
    id: String(item?.id || "").trim(),
    title: String(item?.title || "").trim(),
    description: String(item?.description || "").trim(),
    type: String(item?.type || "task").trim(),
    quantity: Number(item?.quantity || 1),
    unit: String(item?.unit || "").trim(),
    priority: String(item?.priority || "").trim(),
    startDays,
    dueDays,
    durationDays: Number(item?.durationDays || Math.max(0, dueDays - startDays) || 0),
    timeEstimate: String(item?.timeEstimate || "").trim(),
    effort: String(item?.effort || "").trim(),
    assigneeName: String(item?.assigneeName || "").trim(),
    processOwner: String(item?.processOwner || "").trim(),
    dependencies: Array.isArray(item?.dependencies)
      ? item.dependencies.map((x) => String(x || "").trim()).filter(Boolean)
      : String(item?.dependencies || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
    seoBoardStatus: String(item?.seoBoardStatus || "").trim(),
    seoTaskType: String(item?.seoTaskType || "").trim(),
    seoTarget: String(item?.seoTarget || "").trim(),
    funnelStage: String(item?.funnelStage || "").trim(),
    contentPhase: String(item?.contentPhase || "").trim(),
    seoQuarter: String(item?.seoQuarter || "").trim(),
    executionPageUrl: String(item?.executionPageUrl || "").trim(),
    analyticsUrl: String(item?.analyticsUrl || "").trim(),
    parentGoalId: String(item?.parentGoalId || "").trim(),
    parentGoalName: String(item?.parentGoalName || "").trim(),
    parentGoalUrl: String(item?.parentGoalUrl || "").trim(),
    required: item?.required !== false,
    checklist: normalizeChecklist(item?.checklist || []),
  };
}

export function normalizeScopeGroup(item = {}, index = 0) {
  return {
    id: String(item?.id || "").trim(),
    title: String(item?.title || "").trim(),
    description: String(item?.description || "").trim(),
    type: String(item?.type || "deliverable_group").trim(),
    order: Number(item?.order ?? index + 1),
    dueDays: Number(item?.dueDays || 0),
    jobs: Array.isArray(item?.jobs)
      ? item.jobs.map(normalizeScopeGroupJob).filter((job) => job.title)
      : [],
  };
}
