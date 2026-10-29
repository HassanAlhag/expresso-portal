import { randomUUID } from "node:crypto";
import { JOB_TYPES, getWorkflowTypeFromJobType } from "../content/jobs/job.constants.js";

export class OperatingError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function insist(condition, message, status = 400) { if (!condition) throw new OperatingError(message, status); }
export const idOf = (x) => String(x?._id || x || "");
export const plain = (x) => x?.toObject ? x.toObject() : x;
export const text = (x) => String(x || "").trim();
export const uid = () => randomUUID();
export function event(actorId, action, reason = "", facts = {}, id = uid()) { return { id, actorId, action, reason, facts, at: new Date() }; }
export function dateOnly(value, name = "Date") {
  const v = text(value);
  insist(/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, `${name} must be YYYY-MM-DD`);
  return v;
}
export function addDays(day, n) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function localDay(value, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`;
}
export function midnight(day, timezone) {
  dateOnly(day);
  let fmt; try { fmt = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); } catch { throw new OperatingError("Invalid timezone"); }
  const wanted = Date.parse(`${day}T00:00:00Z`); let ms = wanted;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
    const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    ms += wanted - shown;
  }
  insist(localDay(ms, timezone) === day, "This date has no valid local midnight"); return new Date(ms);
}
export function nextMonth(day) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10); }
export function lines(scope) { return (scope?.groups || []).flatMap((g) => (g.jobs || []).map((j) => ({ ...plain(j), phaseId: g.id }))); }
export function normalizeScope(input) {
  insist(["recurring", "phased_project", "one_time"].includes(input?.mode), "Choose a delivery model");
  insist(Array.isArray(input.groups), "Scope groups must be a list");
  const ids = new Set();
  const groups = (input.groups || []).map((g, gi) => {
    insist(Array.isArray(g.jobs), "Each group needs a deliverables list");
    const groupId = text(g.id) || uid(); insist(!ids.has(groupId), "Duplicate scope identifier"); ids.add(groupId);
    const jobs = (g.jobs || []).map((j) => {
      const id = text(j.id) || uid(); insist(!ids.has(id), "Duplicate scope identifier"); ids.add(id);
      insist(text(j.title) && JOB_TYPES.includes(j.type), "Each scope line needs a title and valid Job type");
      insist(!j.completionCriterion || ["delivered", "published"].includes(j.completionCriterion), "Choose a valid delivery criterion");
      insist(Number.isInteger(j.quantity) && j.quantity >= 0 && j.quantity <= 500, "Scope quantities must be whole numbers from 0 to 500");
      insist(Number.isInteger(Number(j.dueDays || 0)) && Number(j.dueDays || 0) >= 0, "Due-day offsets must be non-negative whole numbers");
      return { ...j, id, title: text(j.title), type: j.type, quantity: j.quantity, unit: text(j.unit) || "items", dueDays: Number(j.dueDays || 0) };
    });
    insist(text(g.title), "Each scope group needs a title");
    return { ...g, id: groupId, title: text(g.title), order: gi, jobs };
  });
  const scope = { mode: input.mode, groups };
  const total = lines(scope).reduce((n, l) => n + l.quantity, 0);
  insist(total > 0 && total <= 1000, "Accepted scope must contain 1–1000 deliverable units"); return scope;
}
export function effectiveAgreement(owner, day) {
  return [...(owner.agreementRevisions || [])].filter((r) => r.effectiveDate <= day && r.startDate <= day && r.endDate >= day).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.number - a.number)[0];
}
export function approvalsComplete(job) {
  const s = job.operating?.submission;
  return Boolean(s?.submittedAt) && (s.route || []).filter((x) => x.required).every((step) =>
    (job.operating.decisions || []).some((d) => d.revision === s.revision && d.stepId === step.id && d.decision === "approved"));
}
export function buildManagedJobs({ owner, kind, agreement, period, quantities, actorId, adjustmentId = "", offset = 0 }) {
  const scopeLines = lines(agreement.scope);
  const anchor = period?.periodStart || midnight(agreement.startDate, agreement.timezone);
  const result = [];
  for (const line of scopeLines) {
    const quantity = quantities?.[line.id] ?? line.quantity;
    for (let i = 1; i <= quantity; i++) {
      const due = line.dueDays ? midnight(addDays(localDay(anchor, agreement.timezone), line.dueDays), agreement.timezone)
        : period ? new Date(new Date(period.periodEnd).getTime() - 1) : new Date(midnight(addDays(agreement.endDate, 1), agreement.timezone).getTime() - 1);
      const key = `${kind}:${idOf(period?._id || owner._id)}:${adjustmentId || "base"}:${line.id}:${i + offset}`;
      result.push({ customerId: owner.customerId, enrollmentId: kind === "enrollment" ? owner._id : owner.enrollmentId || null,
        projectId: kind === "project" ? owner._id : owner.projectId || null,
        operatingModelVersion: 1, originDeliveryPeriodId: period?._id || null, workDeliveryPeriodId: period?._id || null,
        agreementRevisionId: agreement.id, scopeLineId: line.id, scopeUnitOrdinal: i + offset, managedObligationKey: key,
        phaseId: kind === "project" ? line.phaseId : "", originalCommittedDueDate: due, dueDate: due,
        startDate: anchor, title: `${line.title} #${i + offset}`, type: line.type, workflowType: getWorkflowTypeFromJobType(line.type),
        assignees: [agreement.executionLeadId], notes: line.description || "", status: "brief", publishStatus: "not_ready",
        operating: { version: 0, completionCriterion: line.completionCriterion || "delivered", route: agreement.approvalRoute, disposition: "outstanding",
          events: [event(actorId, "created", "Accepted scope", { key, agreementRevisionId: agreement.id })] }, createdBy: actorId, updatedBy: actorId,
      });
    }
  }
  return result;
}
export function periodSummary(period, jobs, cutoff = null) {
  const totals = {};
  const ensure = (line) => totals[line.scopeLineId] ||= { scopeLineId: line.scopeLineId, title: line.title, type: line.type, base: 0, extras: 0, completed: 0, waived: 0, outstanding: 0, carryIn: 0, workload: 0 };
  for (const l of period.baseEntitlement || []) ensure(l).base += l.quantity;
  for (const a of period.adjustments || []) if (!cutoff || new Date(a.at) <= new Date(cutoff)) { const row = totals[a.scopeLineId]; if (row) row.extras += a.quantity; }
  for (const job of jobs) {
    let row = totals[job.scopeLineId];
    const events = (job.operating?.events || []).filter((e) => !cutoff || new Date(e.at) <= new Date(cutoff));
    let disposition = "outstanding", workPeriod = idOf(job.originDeliveryPeriodId);
    for (const e of events) {
      if (e.action === "completed") disposition = "delivered";
      if (e.action === "waived") disposition = "waived";
      if (["reopened", "scope_restored"].includes(e.action)) disposition = "outstanding";
      if (e.action === "carried") workPeriod = e.facts.toPeriodId;
    }
    if (!row && workPeriod === idOf(period._id) && idOf(job.originDeliveryPeriodId) !== idOf(period._id)) row = ensure({ scopeLineId: job.scopeLineId, title: job.title.replace(/ #\d+$/, ""), type: job.type });
    if (!row) continue;
    if (idOf(job.originDeliveryPeriodId) === idOf(period._id)) { if (disposition === "delivered") row.completed++; if (disposition === "waived") row.waived++; }
    else if (workPeriod === idOf(period._id)) row.carryIn++;
  }
  for (const row of Object.values(totals)) { row.outstanding = row.base + row.extras - row.completed - row.waived; row.workload = row.base + row.extras + row.carryIn; }
  return Object.values(totals);
}
