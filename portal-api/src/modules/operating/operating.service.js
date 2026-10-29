import mongoose from "mongoose";
import Enrollment from "../enrollments/enrollment.model.js";
import Project from "../projects/project.model.js";
import Job from "../content/jobs/job.model.js";
import Customer from "../customers/customer.model.js";
import User from "../iam/users/user.model.js";
import Role from "../iam/roles/role.model.js";
import Team from "../iam/teams/team.model.js";
import File from "../files/file.model.js";
import Deal from "../crm/deals/deal.model.js";
import ServiceTemplate from "../services/serviceTemplate.model.js";
import DeliveryPeriod from "./deliveryPeriod.model.js";
import { runInTransaction } from "../../utils/transaction.js";
import { isSystemInternalRole, resolveRoleContext } from "../../utils/roleRegistry.js";
import { userHasPermission } from "../../middleware/auth.js";
import { insist, idOf, text, uid, event, dateOnly, midnight, localDay, addDays, nextMonth, lines, normalizeScope, effectiveAgreement, buildManagedJobs, periodSummary, approvalsComplete } from "./operating.rules.js";

export const ownerModel = (kind) => kind === "enrollment" ? Enrollment : Project;
const validId = (id) => mongoose.isValidObjectId(id);
function requestId(body) { const id = text(body.requestId); insist(id.length >= 8 && id.length <= 100, "A requestId of 8–100 characters is required"); return id; }
function override(actor, reason) { insist(userHasPermission(actor, "delivery.override"), "Delivery override permission is required", 403); insist(text(reason), "An override reason is required"); }
function reason(body) { insist(text(body.reason), "A reason is required"); return text(body.reason); }
function actorId(actor) { return actor.id || actor._id; }
export async function assertActiveInternal(ids, session = null) {
  const unique = [...new Set(ids.filter(Boolean).map(idOf))];
  insist(unique.every(validId), "Invalid staff identifier");
  const users = await User.find({ _id: { $in: unique } }).select("role isActive").session(session).lean();
  insist(users.length === unique.length, "Selected staff member not found");
  for (const user of users) {
    const role = await Role.findOne({ key: user.role }).select("isInternal").session(session).lean();
    insist(user.isActive !== false && (user.role === "super_admin" || (typeof role?.isInternal === "boolean" ? role.isInternal : isSystemInternalRole(user.role))), "Selected people must be active internal users");
  }
}
export async function assertApprovalRoute(route, session = null) {
  const ids = [...new Set(route.map((s) => idOf(s.approverId)).filter(Boolean))];
  await assertActiveInternal(ids, session);
  const users = await User.find({ _id: { $in: ids } }).select("role extraPermissions revokedPermissions").session(session).lean();
  for (const user of users) {
    if (user.role === "super_admin") continue;
    const context = await resolveRoleContext(user.role, user.extraPermissions || [], user.revokedPermissions || []);
    insist(context.isInternal && context.permissions.includes("jobs.read") && context.permissions.includes("jobs.approve"), "Every resolved reviewer/recorder needs jobs.read and jobs.approve; grant these in IAM or choose another reviewer");
  }
}
async function ownerById(kind, id, session) {
  insist(validId(id), "Invalid record identifier");
  const owner = await ownerModel(kind).findById(id).session(session);
  insist(owner, "Record not found", 404); return owner;
}
async function lockOwner(owner, session) {
  owner.operatingVersion = (owner.operatingVersion || 0) + 1;
  await owner.save({ session }); // serializes opening/overlap checks for this owner
}
async function agreementFor(owner, kind, day, session) {
  if (kind === "project" && owner.enrollmentId) {
    const enrollment = await Enrollment.findById(owner.enrollmentId).session(session).lean();
    insist(enrollment && idOf(enrollment.customerId) === idOf(owner.customerId), "Linked service must belong to this client");
    return owner.linkedAgreementRevisionId ? enrollment.agreementRevisions.find((r) => r.id === owner.linkedAgreementRevisionId) : effectiveAgreement(enrollment, day);
  }
  return effectiveAgreement(owner, day);
}
async function runtimeAgreement(owner, kind, agreement, session) {
  const customer = await Customer.findById(owner.customerId).session(session).lean();
  const executionLeadId = (kind === "enrollment" ? owner.executionLeadId : owner.ownerUserId) || agreement.executionLeadId;
  const accountOwnerId = owner.accountOwnerId || customer?.accountManagerId || agreement.accountOwnerId;
  const teamId = owner.teamId;
  if (teamId) { const team = await Team.findById(teamId).session(session).lean(); insist(team?.isActive, "Assigned Team is inactive; confirm current ownership"); }
  return { ...(agreement.toObject?.() || agreement), executionLeadId, accountOwnerId, teamId,
    approvalRoute: agreement.approvalRoute.map((s) => ({ ...(s.toObject?.() || s), approverId: s.source === "EXECUTION_LEAD" ? executionLeadId : ["ACCOUNT_OWNER", "CLIENT_EXTERNAL_RECORDED"].includes(s.source) ? accountOwnerId : s.approverId })) };
}
async function validateAgreement(owner, kind, body, actor, session) {
  const scope = normalizeScope(body.scope);
  const startDate = dateOnly(body.startDate, "Agreement start"), endDate = dateOnly(body.endDate, "Agreement end");
  const effectiveDate = dateOnly(body.effectiveDate || startDate, "Effective date");
  insist(startDate <= effectiveDate && effectiveDate <= endDate, "Effective date must fall within the service term");
  const timezone = text(body.timezone) || "Asia/Dubai"; midnight(startDate, timezone); midnight(endDate, timezone);
  insist(kind !== "project" || scope.mode !== "recurring", "Recurring entitlement belongs to an Enrollment");
  insist(body.deliveryCadence === (scope.mode === "recurring" ? "monthly" : "once"), "Delivery cadence must match the delivery model");
  const customer = await Customer.findById(owner.customerId).session(session).lean();
  insist(customer, "A client is required");
  const executionLeadId = body.executionLeadId || (kind === "enrollment" ? owner.executionLeadId : owner.ownerUserId);
  const accountOwnerId = body.accountOwnerId || owner.accountOwnerId || customer.accountManagerId;
  insist(executionLeadId && accountOwnerId, "Confirm an Execution Lead and Account Manager");
  insist(Array.isArray(body.approvalRoute), "Approval steps must be a list");
  const approvalRoute = body.approvalRoute.map((s, i) => ({
    id: text(s.id) || uid(), order: i, purpose: text(s.purpose), required: s.required !== false, source: s.source,
    approverId: s.source === "EXECUTION_LEAD" ? executionLeadId : ["ACCOUNT_OWNER", "CLIENT_EXTERNAL_RECORDED"].includes(s.source) ? accountOwnerId : s.source === "EXPLICIT_INTERNAL_USER" ? s.approverId : null,
  }));
  insist(approvalRoute.length > 0 && approvalRoute.length <= 10, "Configure 1–10 approval steps");
  const stepIds = new Set();
  for (const step of approvalRoute) {
    insist(step.id && !stepIds.has(step.id) && step.purpose && ["EXECUTION_LEAD", "ACCOUNT_OWNER", "EXPLICIT_INTERNAL_USER", "CLIENT_EXTERNAL_RECORDED"].includes(step.source), "Invalid or duplicate approval step");
    stepIds.add(step.id);
    insist(step.source === "CLIENT_EXTERNAL_RECORDED" || step.approverId, "Resolve every internal approval step");
  }
  await assertActiveInternal([executionLeadId, accountOwnerId, ...approvalRoute.map((s) => s.approverId)], session);
  await assertApprovalRoute(approvalRoute, session);
  const teamId = body.teamId || null;
  insist(!body.teamRequired || teamId, "Select the required Team");
  if (teamId) { insist(validId(teamId), "Invalid Team"); const team = await Team.findById(teamId).session(session).lean(); insist(team?.isActive, "Select an active Team"); }
  insist(!body.fileIds || Array.isArray(body.fileIds), "Agreement Files must be a list");
  const fileIds = [...new Set(body.fileIds || [])];
  insist(fileIds.every(validId), "Invalid agreement File");
  if (fileIds.length) {
    const files = await File.find({ _id: { $in: fileIds } }).session(session).lean();
    insist(files.length === fileIds.length && files.every((f) => idOf(f.customerId) === idOf(owner.customerId) && f.isPrivate), "Agreement Files must be private files belonging to this client");
  }
  insist(text(body.reference) || fileIds.length, "Provide an agreement reference or private File");
  insist(text(body.clientContact), "Record the accepting client contact");
  const acceptedAt = new Date(body.acceptedAt); insist(!Number.isNaN(+acceptedAt) && +acceptedAt <= Date.now(), "Record a valid client acceptance date, not in the future");
  const price = body.price === null || body.price === "" ? null : Number(body.price);
  insist(price === null || (Number.isFinite(price) && price >= 0), "Agreed price must be non-negative");
  const currency = text(body.currency).toUpperCase(); insist(/^[A-Z]{3}$/.test(currency), "Confirm the three-letter currency");
  if (body.serviceTemplateId) { insist(validId(body.serviceTemplateId), "Invalid Service"); insist(await ServiceTemplate.exists({ _id: body.serviceTemplateId }).session(session), "Selected Service not found"); }
  if (body.sourceDealId) { insist(validId(body.sourceDealId), "Invalid source Deal"); const deal = await Deal.findById(body.sourceDealId).session(session).lean(); insist(deal && idOf(deal.customerId) === idOf(owner.customerId) && deal.stage === "won", "Source Deal must be Won and linked to this client"); }
  return { id: uid(), number: (owner.agreementRevisions?.length || 0) + 1, effectiveDate, startDate, endDate, timezone,
    scope, serviceTemplateId: owner.serviceTemplateId || body.serviceTemplateId || null, sourceDealId: body.sourceDealId || null,
    deliveryCadence: body.deliveryCadence, price, currency, billingCycle: text(body.billingCycle), executionLeadId, accountOwnerId, teamId,
    approvalRoute, reference: text(body.reference), fileIds, clientContact: text(body.clientContact), acceptedAt,
    reason: reason(body), recordedBy: actorId(actor), recordedAt: new Date() };
}
function phasesFor(agreement) {
  return agreement.scope.groups.map((g, i, all) => ({ id: g.id, name: g.title, order: i, predecessorId: i ? all[i - 1].id : "",
    plannedStart: midnight(agreement.startDate, agreement.timezone), plannedEnd: midnight(agreement.endDate, agreement.timezone),
    acceptanceRequirement: g.description || "Required work delivered and outcome accepted", acceptedAt: null, history: [] }));
}
async function confirmAgreement(owner, kind, body, actor, session) {
  const existing = owner.operatingModelVersion === 1;
  insist(!existing || !owner.enrollmentId, "Revise the linked Enrollment agreement, not this Project");
  let agreement;
  if (kind === "project" && owner.enrollmentId) {
    agreement = await agreementFor(owner, kind, dateOnly(body.effectiveDate || body.startDate), session);
    insist(agreement && agreement.scope.mode !== "recurring", "Confirm a non-recurring agreement on the linked Enrollment first");
    owner.linkedAgreementRevisionId = agreement.id;
    await assertActiveInternal([agreement.executionLeadId, agreement.accountOwnerId, ...agreement.approvalRoute.map((s) => s.approverId)], session);
  } else {
    agreement = await validateAgreement(owner, kind, body, actor, session);
    if (existing) {
      insist(!owner.activatedAt || kind === "enrollment", "Additional project scope requires a separate additional Project");
      const previous = owner.agreementRevisions[owner.agreementRevisions.length - 1];
      insist(body.previousRevisionId === previous.id, "Agreement changed; reload before revising", 409);
      insist(agreement.effectiveDate > previous.effectiveDate, "A revision must have a later effective date");
      insist(agreement.scope.mode === previous.scope.mode, "Use a separate Project for a different delivery model");
      if (agreement.scope.mode === "recurring") insist(agreement.effectiveDate.endsWith("-01") || (agreement.startDate === agreement.effectiveDate && agreement.startDate > previous.endDate), "Package changes take effect at a monthly boundary; use an explicit period adjustment for current extras");
      const overlaps = await DeliveryPeriod.exists({ enrollmentId: owner._id, periodEnd: { $gt: midnight(agreement.effectiveDate, agreement.timezone) } }).session(session);
      insist(!overlaps, "Revise after existing periods; use a period adjustment for current extras");
    }
    owner.agreementRevisions.push(agreement);
  }
  if (!existing) {
    const oldJobs = await Job.find({ [kind === "enrollment" ? "enrollmentId" : "projectId"]: owner._id }).session(session).lean();
    insist(!oldJobs.length || body.adoptionReviewed === true, "Review existing work and confirm adoption before accepting this record");
    const mappings = body.adoptionMappings || [];
    const keys = new Set(), jobIds = new Set();
    for (const m of mappings) {
      const line = lines(agreement.scope).find((l) => l.id === m.scopeLineId);
      const job = oldJobs.find((j) => idOf(j._id) === idOf(m.jobId));
      insist(line && Number.isInteger(m.scopeUnitOrdinal) && m.scopeUnitOrdinal > 0 && m.scopeUnitOrdinal <= line.quantity, "Invalid adoption unit");
      insist(job && idOf(job.customerId) === idOf(owner.customerId) && !job.managedObligationKey && !["published", "delivered", "archived"].includes(job.status), "Only reviewed outstanding legacy Jobs can be adopted");
      const key = `${m.scopeLineId}:${m.scopeUnitOrdinal}`;
      insist(!keys.has(key) && !jobIds.has(idOf(m.jobId)), "Duplicate adoption mapping"); keys.add(key); jobIds.add(idOf(m.jobId));
    }
    owner.adoptionMappings = mappings;
    owner.cutoverDate = dateOnly(body.cutoverDate || agreement.effectiveDate, "Cutover date");
    insist(owner.cutoverDate >= agreement.effectiveDate && owner.cutoverDate <= agreement.endDate, "Cutover must fall in the accepted term");
    owner.status = "draft";
  }
  owner.operatingModelVersion = 1; owner.teamId = agreement.teamId;
  if (kind === "enrollment") owner.agreementDraft = false;
  if (kind === "enrollment") {
    owner.finalScope = agreement.scope; owner.pricing = { price: agreement.price, currency: agreement.currency, billingCycle: agreement.billingCycle };
    owner.executionLeadId = agreement.executionLeadId; owner.accountOwnerId = agreement.accountOwnerId;
    owner.startDate = midnight(agreement.startDate, agreement.timezone); owner.endDate = new Date(+midnight(addDays(agreement.endDate, 1), agreement.timezone) - 1);
  } else { owner.ownerUserId = agreement.executionLeadId; if (!owner.activatedAt) owner.phases = phasesFor(agreement); }
  owner.operatingEvents.push(event(actorId(actor), existing ? "agreement_revised" : "agreement_confirmed", text(body.reason), { revisionId: agreement.id, previousRevisionId: body.previousRevisionId || null, cutoverDate: owner.cutoverDate, adoptionMappings: body.adoptionMappings || [] }, requestId(body)));
  await owner.save({ session });
  return { owner, agreement };
}
function periodPlan(owner, agreement, input = {}) {
  insist(agreement?.scope.mode === "recurring", "A recurring accepted agreement is required");
  const start = dateOnly(input.periodStart || owner.cutoverDate || agreement.effectiveDate, "Period start");
  const naturalEnd = nextMonth(start), termEnd = addDays(agreement.endDate, 1);
  const end = dateOnly(input.periodEnd || (naturalEnd < termEnd ? naturalEnd : termEnd), "Period end");
  insist(start >= agreement.startDate && start >= agreement.effectiveDate && start < end && end <= termEnd, "Period must fall within the effective service term");
  insist(end <= naturalEnd, "A monthly delivery period cannot extend beyond its calendar month");
  const partial = start.slice(-2) !== "01" || end !== naturalEnd;
  const quantities = Object.fromEntries(lines(agreement.scope).map((l) => [l.id, l.quantity]));
  if (partial && input.partialDecision) {
    insist(text(input.partialDecision.reason), "Explain the partial-period quantity decision");
    for (const l of lines(agreement.scope)) { const q = input.partialDecision.quantities?.[l.id]; insist(Number.isInteger(q) && q >= 0 && q <= 500, "Confirm every partial-period quantity"); quantities[l.id] = q; }
  }
  return { periodStart: midnight(start, agreement.timezone), periodEnd: midnight(end, agreement.timezone), timezone: agreement.timezone,
    requiresQuantityDecision: partial && !input.partialDecision, quantities, partialPeriodDecision: partial ? text(input.partialDecision?.reason) : "" };
}
async function persistJobs(jobs, owner, actor, session, adopt = false) {
  if (adopt) insist((owner.adoptionMappings || []).every((m) => jobs.some((j) => j.scopeLineId === m.scopeLineId && j.scopeUnitOrdinal === m.scopeUnitOrdinal)), "Reviewed adoption mappings must fit the explicitly agreed activation quantities");
  for (const generated of jobs) {
    const mapping = adopt && owner.adoptionMappings?.find((m) => m.scopeLineId === generated.scopeLineId && m.scopeUnitOrdinal === generated.scopeUnitOrdinal);
    if (mapping) {
      const job = await Job.findById(mapping.jobId).session(session);
      insist(job && !job.managedObligationKey && !["delivered", "published", "archived"].includes(job.status), "Adoption Job changed; review it again", 409);
      const before = { enrollmentId: idOf(job.enrollmentId), projectId: idOf(job.projectId), type: job.type, dueDate: job.dueDate, status: job.status, createdBy: idOf(job.createdBy) };
      const keep = { title: job.title, notes: job.notes, createdBy: job.createdBy, dueDate: job.dueDate || generated.dueDate, originalCommittedDueDate: job.dueDate || generated.originalCommittedDueDate, assignees: job.assignees.length ? job.assignees : generated.assignees };
      Object.assign(job, generated, keep);
      job.operating.events.push(event(actorId(actor), "adopted", "Explicit reviewed unit mapping", { legacyJobId: idOf(job._id), before, deadlineSource: before.dueDate ? "reviewed_legacy_due_date" : "accepted_cutover_scope" }));
      await job.save({ session });
    } else { await Job.create([generated], { session }); }
  }
}
async function openPeriod(owner, body, actor, session, activating = false) {
  const start = dateOnly(body.periodStart || owner.cutoverDate, "Period start");
  let agreement = effectiveAgreement(owner, start); insist(agreement, "No accepted agreement is effective for this date");
  agreement = await runtimeAgreement(owner, "enrollment", agreement, session);
  const plan = periodPlan(owner, agreement, { ...body, periodStart: start });
  const existing = await DeliveryPeriod.findOne({ enrollmentId: owner._id, periodStart: plan.periodStart }).session(session);
  if (existing) { insist(+existing.periodEnd === +plan.periodEnd, "This period already exists with a different end", 409); return { period: existing, repeated: true }; }
  insist(activating || owner.status === "active", "Only an active Enrollment can open a new period");
  insist(!plan.requiresQuantityDecision, "Explicit quantities and a reason are required for a partial first/last month");
  if (localDay(new Date(), agreement.timezone) > agreement.endDate) override(actor, body.missedPeriodReason);
  const overlap = await DeliveryPeriod.exists({ enrollmentId: owner._id, periodStart: { $lt: plan.periodEnd }, periodEnd: { $gt: plan.periodStart } }).session(session);
  insist(!overlap, "Delivery periods cannot overlap", 409);
  await assertActiveInternal([agreement.executionLeadId, agreement.accountOwnerId, ...agreement.approvalRoute.map((s) => s.approverId)], session);
  await assertApprovalRoute(agreement.approvalRoute, session);
  const [period] = await DeliveryPeriod.create([{ customerId: owner.customerId, enrollmentId: owner._id, ...plan,
    agreementRevisionId: agreement.id, scopeSnapshot: agreement.scope.groups,
    baseEntitlement: lines(agreement.scope).map((l) => ({ scopeLineId: l.id, title: l.title, type: l.type, unit: l.unit, quantity: plan.quantities[l.id] })),
    openedBy: actorId(actor), openedAt: new Date(), decisions: [event(actorId(actor), "period_opened", body.missedPeriodReason || "Confirmed delivery period", { agreementRevisionId: agreement.id }, requestId(body))] }], { session });
  const jobs = buildManagedJobs({ owner, kind: "enrollment", agreement, period, quantities: plan.quantities, actorId: actorId(actor) });
  await persistJobs(jobs, owner, actor, session, activating);
  return { period, count: jobs.length };
}
async function existingActivation(owner, kind, session) {
  const period = kind === "enrollment" ? await DeliveryPeriod.findOne({ enrollmentId: owner._id }).sort({ periodStart: 1 }).session(session) : null;
  const project = kind === "enrollment" && owner.projectId ? await Project.findById(owner.projectId).session(session) : null;
  const filter = period ? { originDeliveryPeriodId: period._id } : { [kind === "enrollment" ? "enrollmentId" : "projectId"]: owner._id };
  return { owner, period, project, count: await Job.countDocuments({ ...filter, operatingModelVersion: 1 }).session(session), repeated: true };
}
export async function ownerCommand(kind, id, command, body, actor) {
  const reqId = requestId(body);
  return runInTransaction(async (session) => {
    const owner = await ownerById(kind, id, session);
    if (command === "activate" && owner.activatedAt) return existingActivation(owner, kind, session);
    const seenRequest = owner.operatingEvents?.some((e) => e.id === reqId);
    if (seenRequest && command !== "open-period") return { owner, repeated: true };
    await lockOwner(owner, session);
    if (["confirm", "revise"].includes(command)) {
      insist(command !== "revise" || owner.operatingModelVersion === 1, "Confirm the agreement first");
      return confirmAgreement(owner, kind, body, actor, session);
    }
    insist(owner.operatingModelVersion === 1, "Confirm or adopt the agreement first");
    if (command === "activate") {
      const day = owner.cutoverDate;
      let agreement = await agreementFor(owner, kind, day, session); insist(agreement, "No accepted agreement is effective at cutover");
      agreement = await runtimeAgreement(owner, kind, agreement, session);
      await assertApprovalRoute(agreement.approvalRoute, session);
      let result;
      if (kind === "enrollment" && agreement.scope.mode === "recurring") {
        insist(!body.periodStart || body.periodStart === day, "Activation must open the first period at the confirmed cutover date");
        result = await openPeriod(owner, { ...body, periodStart: day }, actor, session, true);
      }
      else if (kind === "enrollment") {
        insist(!owner.projectId && !owner.adoptionMappings?.length, "Adopt existing phased work through its Project");
        await assertActiveInternal([agreement.executionLeadId, agreement.accountOwnerId, ...agreement.approvalRoute.map((s) => s.approverId)], session);
        const [project] = await Project.create([{ name: `Service delivery — ${agreement.reference}`, customerId: owner.customerId, enrollmentId: owner._id,
          operatingModelVersion: 1, linkedAgreementRevisionId: agreement.id, cutoverDate: day, phases: phasesFor(agreement),
          ownerUserId: agreement.executionLeadId, teamId: agreement.teamId, status: "active", source: "enrollment", projectMode: "contracted", activatedAt: new Date(),
          createdBy: actorId(actor), updatedBy: actorId(actor), operatingEvents: [event(actorId(actor), "activated", "Enrollment agreement", { revisionId: agreement.id })] }], { session });
        const jobs = buildManagedJobs({ owner: project, kind: "project", agreement, actorId: actorId(actor) });
        await persistJobs(jobs, project, actor, session); owner.projectId = project._id; result = { project, count: jobs.length };
      } else {
        insist(agreement.scope.mode !== "recurring", "Recurring services use Enrollment periods");
        await assertActiveInternal([agreement.executionLeadId, agreement.accountOwnerId, ...agreement.approvalRoute.map((s) => s.approverId)], session);
        const jobs = buildManagedJobs({ owner, kind, agreement, actorId: actorId(actor) });
        await persistJobs(jobs, owner, actor, session, true); result = { count: jobs.length };
      }
      owner.status = "active"; owner.activatedAt = new Date();
      owner.operatingEvents.push(event(actorId(actor), "activated", "Accepted delivery activated", {}, reqId));
      await owner.save({ session }); return { owner, ...result };
    }
    if (command === "open-period") {
      insist(kind === "enrollment", "Periods are only for recurring Enrollments");
      const result = await openPeriod(owner, body, actor, session);
      if (!seenRequest) owner.operatingEvents.push(event(actorId(actor), "period_open_requested", "Manual period opening", { periodId: idOf(result.period._id) }, reqId));
      await owner.save({ session }); return { owner, ...result };
    }
    if (command === "ownership") {
      const accountOwnerId = body.accountOwnerId || null;
      await assertActiveInternal([body.executionLeadId, accountOwnerId], session);
      insist(body.executionLeadId, "An Execution Lead is required");
      if (body.teamId) { insist(validId(body.teamId), "Invalid Team"); const team = await Team.findById(body.teamId).session(session).lean(); insist(team?.isActive, "Select an active Team"); }
      const before = { executionLeadId: kind === "enrollment" ? owner.executionLeadId : owner.ownerUserId, teamId: owner.teamId, accountOwnerId: owner.accountOwnerId };
      if (kind === "enrollment") { owner.executionLeadId = body.executionLeadId; owner.accountOwnerId = accountOwnerId; }
      else owner.ownerUserId = body.executionLeadId;
      owner.teamId = body.teamId || null;
      owner.operatingEvents.push(event(actorId(actor), "ownership_changed", reason(body), { before, after: { executionLeadId: body.executionLeadId, accountOwnerId, teamId: body.teamId || null } }, reqId));
    } else if (command === "state") {
      insist(["paused", "active", "completed"].includes(body.status), "Choose active, paused or completed"); reason(body);
      insist(owner.activatedAt, "Activate the accepted agreement first");
      if (body.status === "completed") {
        if (kind === "enrollment") {
          const lastTerm = owner.agreementRevisions[owner.agreementRevisions.length - 1];
          if (localDay(new Date(), lastTerm.timezone) <= lastTerm.endDate) {
            insist(body.endFutureEntitlement === true, "The agreement still promises future service. Record an agreed early termination through an authorized override, or pause it");
            override(actor, body.reason); insist(text(body.evidence), "Record client acceptance evidence for ending future entitlement");
          }
        }
        const pending = await Job.exists({ [kind === "enrollment" ? "enrollmentId" : "projectId"]: owner._id, operatingModelVersion: 1, "operating.disposition": "outstanding" }).session(session);
        insist(!pending, "Outstanding obligations must be delivered or explicitly waived before closure");
        if (kind === "project") insist(owner.phases.every((p) => p.acceptedAt), "Accept every phase before project closure");
      }
      const before = owner.status; owner.status = body.status;
      owner.operatingEvents.push(event(actorId(actor), "state_changed", body.reason, { before, after: body.status, endsFutureEntitlement: body.endFutureEntitlement === true, evidence: text(body.evidence) }, reqId));
    } else if (command === "plan-phase") {
      insist(kind === "project", "Phases belong to Projects");
      const phase = owner.phases.find((p) => p.id === body.phaseId); insist(phase && !phase.acceptedAt, "Choose a phase awaiting acceptance");
      const agreement = await agreementFor(owner, kind, owner.cutoverDate, session);
      const start = dateOnly(body.plannedStart), end = dateOnly(body.plannedEnd);
      insist(start <= end && start >= agreement.startDate && end <= agreement.endDate, "Phase dates must fall within the accepted term");
      const predecessor = body.predecessorId && owner.phases.find((p) => p.id === body.predecessorId);
      insist(!body.predecessorId || (predecessor && predecessor.order < phase.order), "A predecessor must be an earlier phase");
      const before = { plannedStart: phase.plannedStart, plannedEnd: phase.plannedEnd, predecessorId: phase.predecessorId };
      phase.plannedStart = midnight(start, agreement.timezone); phase.plannedEnd = midnight(end, agreement.timezone); phase.predecessorId = body.predecessorId || "";
      phase.history.push(event(actorId(actor), "phase_planned", reason(body), { before, after: { plannedStart: phase.plannedStart, plannedEnd: phase.plannedEnd, predecessorId: phase.predecessorId } }, reqId));
      owner.operatingEvents.push(event(actorId(actor), "phase_planned", body.reason, { phaseId: phase.id }, reqId));
    } else if (command === "accept-phase") {
      insist(kind === "project" && owner.activatedAt, "Activate the Project first");
      const phase = owner.phases.find((p) => p.id === body.phaseId); insist(phase, "Phase not found");
      const agreement = await agreementFor(owner, kind, owner.cutoverDate, session);
      insist(userHasPermission(actor, "jobs.approve"), "Approval permission is required", 403);
      if (idOf(owner.ownerUserId || agreement.executionLeadId) !== idOf(actorId(actor))) override(actor, body.reason);
      const predecessor = phase.predecessorId && owner.phases.find((p) => p.id === phase.predecessorId);
      insist(!predecessor || predecessor.acceptedAt, "Accept the preceding phase first");
      const pending = await Job.exists({ projectId: owner._id, phaseId: phase.id, operatingModelVersion: 1, "operating.disposition": "outstanding" }).session(session);
      insist(!pending, "Deliver required phase work before accepting the outcome"); reason(body);
      phase.acceptedAt = new Date(); phase.acceptedBy = actorId(actor);
      phase.history.push(event(actorId(actor), "phase_accepted", body.reason, { evidence: text(body.evidence) }, reqId));
      owner.operatingEvents.push(event(actorId(actor), "phase_accepted", body.reason, { phaseId: phase.id }, reqId));
    } else insist(false, "Unknown operating command");
    await owner.save({ session }); return { owner };
  });
}

export async function ownerOverview(kind, id, query = {}) {
  if (query.cutoff) insist(!Number.isNaN(+new Date(query.cutoff)), "Invalid historical cutoff");
  const owner = await ownerById(kind, id, null);
  const periods = kind === "enrollment" ? await DeliveryPeriod.find({ enrollmentId: owner._id }).sort({ periodStart: 1 }).lean() : [];
  const jobs = await Job.find({ [kind === "enrollment" ? "enrollmentId" : "projectId"]: owner._id }).sort({ createdAt: 1 }).lean();
  const summaries = periods.filter((p) => !query.cutoff || new Date(p.openedAt) <= new Date(query.cutoff)).map((period) => ({ ...period, summary: periodSummary(period, jobs, query.cutoff || null) }));
  const last = periods[periods.length - 1];
  let preview = null;
  const start = query.periodStart || (last ? localDay(last.periodEnd, last.timezone) : owner.cutoverDate);
  const agreement = start && await agreementFor(owner, kind, start, null);
  if (kind === "enrollment" && agreement?.scope.mode === "recurring") preview = periodPlan(owner, agreement, { periodStart: start });
  const outstanding = jobs.filter((j) => j.operatingModelVersion === 1 && j.operating?.disposition === "outstanding").length;
  const latest = owner.agreementRevisions?.[owner.agreementRevisions.length - 1];
  const today = latest && localDay(new Date(), latest.timezone);
  const currentTerm = latest && [...owner.agreementRevisions].filter((r) => r.effectiveDate <= today).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0] || latest;
  const expired = currentTerm && today > currentTerm.endDate;
  const linked = kind === "project" && owner.enrollmentId && owner.cutoverDate ? await agreementFor(owner, kind, owner.cutoverDate, null) : null;
  return { owner, periods: summaries, jobs, preview, outstanding, deliveryTimezone: linked?.timezone || latest?.timezone || "Asia/Dubai", displayState: expired ? outstanding ? "Expired — Pending Closure" : "Expired — Closed" : owner.status };
}

export async function periodCommand(enrollmentId, periodId, command, body, actor) {
  const reqId = requestId(body);
  return runInTransaction(async (session) => {
    const owner = await ownerById("enrollment", enrollmentId, session); await lockOwner(owner, session);
    insist(validId(periodId), "Invalid Delivery Period");
    const period = await DeliveryPeriod.findOne({ _id: periodId, enrollmentId: owner._id }).session(session);
    insist(period, "Delivery Period not found", 404);
    if (period.decisions.some((d) => d.id === reqId) || period.adjustments.some((a) => a.requestId === reqId)) return { period, repeated: true };
    period.operatingVersion += 1; reason(body);
    insist(body.expectedVersion === period.operatingVersion - 1, "Period changed; reload before reconciling or adjusting", 409);
    if (command === "adjust") {
      override(actor, body.reason);
      insist(Number.isInteger(body.quantity) && body.quantity > 0 && body.quantity <= 500, "Extra units must be a positive whole number up to 500");
      insist(text(body.evidence), "Record client acceptance evidence for extra scope");
      let agreement = owner.agreementRevisions.find((r) => r.id === period.agreementRevisionId);
      agreement = await runtimeAgreement(owner, "enrollment", agreement, session);
      await assertApprovalRoute(agreement.approvalRoute, session);
      const line = lines(agreement.scope).find((l) => l.id === body.scopeLineId); insist(line, "Choose an existing scope line for extra units");
      const quantities = Object.fromEntries(lines(agreement.scope).map((l) => [l.id, l.id === line.id ? body.quantity : 0]));
      const jobs = buildManagedJobs({ owner, kind: "enrollment", agreement, period, quantities, actorId: actorId(actor), adjustmentId: reqId });
      await persistJobs(jobs, owner, actor, session);
      period.adjustments.push({ requestId: reqId, scopeLineId: line.id, quantity: body.quantity, reason: body.reason, evidence: body.evidence, actorId: actorId(actor), at: new Date() });
    } else if (command === "reconcile") {
      const agreement = owner.agreementRevisions.find((r) => r.id === period.agreementRevisionId);
      const customer = await Customer.findById(owner.customerId).session(session).lean();
      insist(idOf(actorId(actor)) === idOf(owner.executionLeadId || agreement.executionLeadId) || idOf(actorId(actor)) === idOf(owner.accountOwnerId || customer?.accountManagerId || agreement.accountOwnerId) || userHasPermission(actor, "delivery.override"), "Reconciliation requires the lead, account owner or an authorized manager", 403);
      insist(Array.isArray(body.decisions) && body.decisions.length > 0, "Choose outstanding work to reconcile");
      const seen = new Set();
      for (const d of body.decisions) {
        insist(validId(d.jobId) && !seen.has(d.jobId), "Invalid or duplicate Job decision"); seen.add(d.jobId);
        const job = await Job.findById(d.jobId).session(session);
        insist(job && idOf(job.enrollmentId) === idOf(owner._id) && job.operatingModelVersion === 1 && (idOf(job.originDeliveryPeriodId) === idOf(period._id) || idOf(job.workDeliveryPeriodId) === idOf(period._id)), "Job does not belong to this period");
        insist(job.operating.disposition === "outstanding", "Only outstanding work can be reconciled");
        const before = { workPeriodId: idOf(job.workDeliveryPeriodId), dueDate: job.dueDate, disposition: job.operating.disposition };
        if (d.decision === "carry") {
          insist(validId(d.toPeriodId), "Select the carry destination period");
          const target = await DeliveryPeriod.findOne({ _id: d.toPeriodId, enrollmentId: owner._id }).session(session).lean();
          insist(target && +target.periodStart >= +period.periodEnd, "Carry destination must be a later period of the same Enrollment");
          const currentPeriod = await DeliveryPeriod.findById(job.workDeliveryPeriodId).session(session).lean();
          insist(currentPeriod && +target.periodStart >= +currentPeriod.periodEnd, "Carry destination must follow the Job's current work period");
          job.workDeliveryPeriodId = target._id;
          job.operating.events.push(event(actorId(actor), "carried", body.reason, { fromPeriodId: before.workPeriodId, toPeriodId: idOf(target._id) }, `${reqId}:${d.jobId}`));
        } else if (d.decision === "waive") {
          override(actor, body.reason); job.operating.disposition = "waived";
          job.operating.events.push(event(actorId(actor), "waived", body.reason, { before, after: "waived" }, `${reqId}:${d.jobId}`));
        } else if (d.decision === "reschedule") {
          const due = new Date(d.dueDate); insist(!Number.isNaN(+due), "A valid rescheduled deadline is required"); job.dueDate = due;
          job.operating.events.push(event(actorId(actor), "rescheduled", body.reason, { before: before.dueDate, after: due }, `${reqId}:${d.jobId}`));
        } else insist(d.decision === "outstanding", "Unknown reconciliation decision");
        job.operating.version += 1; await job.save({ session });
        period.decisions.push(event(actorId(actor), d.decision, body.reason, { jobId: d.jobId, before, after: { workPeriodId: idOf(job.workDeliveryPeriodId), disposition: job.operating.disposition, dueDate: job.dueDate } }, `${reqId}:${d.jobId}`));
      }
      period.reconciledAt = new Date(); period.reconciledBy = actorId(actor);
      period.decisions.push(event(actorId(actor), "reconciled", body.reason, {}, reqId));
    } else insist(false, "Unknown period command");
    await period.save({ session }); return { period };
  });
}
