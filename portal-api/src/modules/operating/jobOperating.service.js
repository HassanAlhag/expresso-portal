import Job from "../content/jobs/job.model.js";
import Project from "../projects/project.model.js";
import { runInTransaction } from "../../utils/transaction.js";
import { userHasPermission } from "../../middleware/auth.js";
import { assertActiveInternal, assertApprovalRoute } from "./operating.service.js";
import { insist, idOf, text, event, approvalsComplete } from "./operating.rules.js";

const actorId = (a) => a.id || a._id;
function requireOverride(actor, body) { insist(userHasPermission(actor, "delivery.override"), "Delivery override permission is required", 403); insist(text(body.reason), "An explicit override reason is required"); }
async function phaseGate(job, session) {
  if (!job.projectId || !job.phaseId) return;
  const project = await Project.findById(job.projectId).session(session);
  insist(project?.operatingModelVersion === 1 && project.status === "active", "Project must be active for delivery");
  // A write on the project serializes completion against acceptance/closure.
  project.operatingVersion += 1; await project.save({ session });
  const phase = project.phases.find((p) => p.id === job.phaseId);
  insist(phase, "Managed Job phase is missing");
  const predecessor = phase.predecessorId && project.phases.find((p) => p.id === phase.predecessorId);
  insist(!predecessor || predecessor.acceptedAt, "Accept the preceding phase before completing this work");
}
function resetSubmission(job, actor, why) {
  if (job.operating.submission?.submittedAt) {
    job.operating.events.push(event(actorId(actor), "submission_invalidated", why, { revision: job.operating.submission.revision }));
    job.operating.submission.submittedAt = null;
    if (["internal_review", "client_review", "approved", "scheduled", "published"].includes(job.status)) job.status = "in_progress";
    job.publishStatus = "not_ready"; job.websiteVisible = false;
  }
}
export async function jobCommand(id, command, body, actor) {
  const reqId = text(body.requestId); insist(reqId.length >= 8 && reqId.length <= 100, "A requestId of 8–100 characters is required");
  return runInTransaction(async (session) => {
    const job = await Job.findById(id).session(session);
    insist(job?.operatingModelVersion === 1, "Managed Job not found", 404);
    if (job.operating.events.some((e) => e.id === reqId)) return { item: job, repeated: true };
    insist(Number.isInteger(body.expectedVersion) && body.expectedVersion === job.operating.version, "Job changed; reload before this action", 409);
    const before = { status: job.status, disposition: job.operating.disposition, revision: job.operating.submission?.revision || 0 };
    const facts = { before };
    if (command === "submit") {
      insist(job.operating.disposition === "outstanding", "Reopen or restore this Job before submitting");
      insist(text(body.outputReference), "Provide the submitted output File/Media/reference");
      const route = job.operating.route.map((s) => s.toObject ? s.toObject() : s);
      await assertActiveInternal(route.map((s) => s.approverId), session);
      await assertApprovalRoute(route, session);
      const revision = (job.operating.submission?.revision || 0) + 1;
      job.operating.submission = { revision, submittedAt: new Date(), submittedBy: actorId(actor), outputReference: text(body.outputReference), route };
      job.status = route.find((s) => s.required)?.source === "CLIENT_EXTERNAL_RECORDED" ? "client_review" : "internal_review";
      job.publishStatus = "not_ready"; job.websiteVisible = false;
      facts.revision = revision; facts.outputReference = text(body.outputReference);
    } else if (command === "decide") {
      insist(userHasPermission(actor, "jobs.approve"), "Approval permission is required", 403);
      const submission = job.operating.submission;
      insist(submission?.submittedAt && body.revision === submission.revision, "Review the current submitted revision", 409);
      insist(["approved", "changes_requested"].includes(body.decision), "Choose approve or request changes");
      const step = submission.route.find((s) => s.id === body.stepId); insist(step, "Approval step not found");
      const decided = new Set(job.operating.decisions.filter((d) => d.revision === submission.revision && d.decision === "approved").map((d) => d.stepId));
      insist(!decided.has(step.id), "This step has already been approved", 409);
      insist(!submission.route.some((s) => s.required && s.order < step.order && !decided.has(s.id)), "Complete preceding required approval steps first");
      if (idOf(step.approverId) !== idOf(actorId(actor))) requireOverride(actor, body);
      if (body.override === true) requireOverride(actor, body);
      const external = step.source === "CLIENT_EXTERNAL_RECORDED";
      let clientApprovedAt = null;
      if (external) {
        clientApprovedAt = new Date(body.clientApprovedAt);
        insist(text(body.clientContact) && text(body.evidence) && !Number.isNaN(+clientApprovedAt) && +clientApprovedAt <= Date.now(), "Record client contact, decision date and evidence");
      }
      job.operating.decisions.push({ requestId: reqId, stepId: step.id, revision: submission.revision, actorId: actorId(actor), at: new Date(), decision: body.decision,
        note: text(body.note), evidence: text(body.evidence), clientContact: external ? text(body.clientContact) : "", clientApprovedAt });
      if (body.decision === "changes_requested") { resetSubmission(job, actor, text(body.note) || "Changes requested"); job.status = "in_progress"; }
      else {
        const done = approvalsComplete(job);
        const next = submission.route.find((s) => s.required && !job.operating.decisions.some((d) => d.revision === submission.revision && d.stepId === s.id && d.decision === "approved"));
        job.status = done ? "approved" : next?.source === "CLIENT_EXTERNAL_RECORDED" ? "client_review" : "internal_review";
        if (done) job.publishStatus = "ready";
      }
      Object.assign(facts, { stepId: step.id, revision: submission.revision, decision: body.decision, evidence: text(body.evidence), override: idOf(step.approverId) !== idOf(actorId(actor)) });
    } else if (command === "publish") {
      insist(job.operating.disposition === "outstanding" && approvalsComplete(job), "Complete required approvals before publication");
      insist(text(body.evidence) && /^https?:\/\//.test(text(body.externalPostUrl)), "Record publication evidence and an external publication URL");
      insist(!job.operating.blockers.some((b) => !b.endedAt), "End active blockers before publication");
      await phaseGate(job, session);
      job.status = "published"; job.publishStatus = "published"; job.publishedAt = new Date(); job.externalPostUrl = text(body.externalPostUrl);
      facts.evidence = text(body.evidence); facts.url = job.externalPostUrl;
    } else if (["complete", "exceptional-complete"].includes(command)) {
      insist(job.operating.disposition === "outstanding", "Only outstanding work can be completed");
      insist(text(body.evidence), "Record delivery evidence");
      if (command === "exceptional-complete") requireOverride(actor, body);
      else {
        insist(approvalsComplete(job), "Complete all required approvals for the current output first");
        insist(!job.operating.blockers.some((b) => !b.endedAt), "End active blockers before delivery");
        if (job.operating.completionCriterion === "published") insist(job.status === "published", "The agreed delivery criterion requires publication first");
        await phaseGate(job, session);
      }
      job.operating.disposition = "delivered"; job.status = "delivered"; job.deliveredAt = new Date();
      facts.evidence = text(body.evidence); facts.override = command === "exceptional-complete";
      job.operating.events.push(event(actorId(actor), "completed", text(body.reason), facts, reqId));
    } else if (["reopen", "restore"].includes(command)) {
      insist(text(body.reason), "Record why this work is reopening");
      if (job.operating.disposition === "waived") requireOverride(actor, body);
      insist(job.operating.disposition !== "outstanding", "This Job is already outstanding");
      job.operating.disposition = "outstanding"; job.status = "in_progress"; job.websiteVisible = false;
      resetSubmission(job, actor, body.reason); job.deliveredAt = null;
      if (job.projectId && job.phaseId) {
        const project = await Project.findById(job.projectId).session(session);
        if (project?.operatingModelVersion === 1) {
          project.operatingVersion += 1; project.status = "active";
          const phaseIndex = project.phases.findIndex((p) => p.id === job.phaseId);
          for (const phase of project.phases.slice(phaseIndex)) { phase.acceptedAt = null; phase.acceptedBy = null; phase.history.push(event(actorId(actor), "acceptance_invalidated", body.reason, { jobId: idOf(job._id) })); }
          await project.save({ session });
        }
      }
      job.operating.events.push(event(actorId(actor), "reopened", body.reason, facts, reqId));
    } else if (command === "waive") {
      requireOverride(actor, body); insist(job.operating.disposition === "outstanding", "Only outstanding work can be waived");
      job.operating.disposition = "waived"; facts.after = "waived";
      job.operating.events.push(event(actorId(actor), "waived", body.reason, facts, reqId));
    } else if (command === "start-blocker") {
      const b = body.blocker || {};
      insist(["CONTENT", "APPROVAL", "ACCESS", "FEEDBACK", "DEPENDENCY", "OTHER"].includes(b.reason), "Choose a blocker reason");
      insist(["CLIENT", "EXPRESSO", "THIRD_PARTY"].includes(b.responsibleParty), "Choose who is responsible for the blocker");
      insist(text(b.note) && text(b.nextAction), "Record the blocker and next action");
      if (b.nextActionOwnerId) await assertActiveInternal([b.nextActionOwnerId], session);
      job.operating.blockers.push({ id: reqId, reason: b.reason, responsibleParty: b.responsibleParty, startedAt: new Date(), recordedBy: actorId(actor),
        note: text(b.note), evidence: text(b.evidence), nextAction: text(b.nextAction), nextActionOwnerId: b.nextActionOwnerId || null });
      facts.blockerId = reqId;
    } else if (command === "end-blocker") {
      const blocker = job.operating.blockers.find((b) => b.id === body.blockerId); insist(blocker && !blocker.endedAt, "Active blocker not found");
      insist(text(body.reason), "Record how the blocker ended"); blocker.endedAt = new Date(); blocker.endedBy = actorId(actor); facts.blockerId = blocker.id;
    } else if (command === "delegate") {
      insist(body.approverId, "Choose a replacement internal approver");
      requireOverride(actor, body); await assertActiveInternal([body.approverId], session);
      const step = job.operating.route.find((s) => s.id === body.stepId); insist(step, "Approval step not found");
      facts.beforeApproverId = idOf(step.approverId); facts.afterApproverId = body.approverId;
      step.approverId = body.approverId; await assertApprovalRoute(job.operating.route, session); resetSubmission(job, actor, body.reason);
    } else insist(false, "Unknown managed Job command");
    if (!["complete", "exceptional-complete", "reopen", "restore", "waive"].includes(command)) job.operating.events.push(event(actorId(actor), command, text(body.reason), facts, reqId));
    job.operating.version += 1; job.updatedBy = actorId(actor); await job.save({ session }); return { item: job };
  });
}

// Used by every existing Job editor, including the Calendar and Productions.
export async function patchManagedJob(current, patch, actor) {
  return runInTransaction(async (session) => {
    const job = await Job.findById(current._id).session(session);
    insist(job.operating.version === current.operating.version, "Job changed; reload before editing", 409);
    insist(!("enrollmentId" in patch), "Managed obligation ownership cannot be changed through a Job edit");
    const nextStatus = patch.status || job.status;
    if (nextStatus !== job.status && ["internal_review", "client_review", "approved", "published", "delivered"].includes(nextStatus)) insist(false, "Use Submit, Approval or Delivery actions for managed work");
    if (patch.publishStatus === "published") insist(false, "Use the managed publication action");
    if (nextStatus === "scheduled" || patch.websiteVisible === true || patch.publishStatus === "ready") insist(approvalsComplete(job), "Required approvals are incomplete");
    if (patch.status && patch.status !== job.status && job.operating.disposition !== "outstanding") insist(patch.status === "archived", "Use Reopen before changing completed/waived work");
    const outputFields = ["finalMediaId", "draftMediaId", "posterMediaId", "caption", "script", "concept", "storyboard", "shotList", "deliverables"];
    const outputChanged = outputFields.some((f) => f in patch && JSON.stringify(job.toObject()[f]) !== JSON.stringify(patch[f]));
    insist(!outputChanged || job.operating.disposition === "outstanding", "Reopen delivered work before changing its output");
    const before = { status: job.status, dueDate: job.dueDate, assignees: job.assignees };
    Object.assign(job, patch);
    if (outputChanged) resetSubmission(job, actor, "Submitted output changed");
    if ("dueDate" in patch) insist(text(patch.operatingChangeReason), "Record a rescheduling reason");
    job.operating.events.push(event(actorId(actor), "edited", patch.operatingChangeReason || "Work updated", { before, after: { status: job.status, dueDate: job.dueDate, assignees: job.assignees }, outputChanged }));
    job.operating.version += 1; await job.save({ session }); return job;
  });
}

export async function publishManagedJob(current, patch, body, actor) {
  return runInTransaction(async (session) => {
    const job = await Job.findById(current._id).session(session);
    insist(job.operating.version === current.operating.version, "Job changed; reload before publishing", 409);
    insist(job.operating.disposition === "outstanding" && approvalsComplete(job), "Required approvals for current output are incomplete");
    insist(!job.operating.blockers.some((b) => !b.endedAt), "End active blockers before publication");
    insist(text(body.evidence || body.externalPostUrl || job.externalPostUrl), "Record publication evidence");
    for (const key of ["finalMediaId", "posterMediaId"]) if (patch[key]) insist(idOf(job[key]) === idOf(patch[key]), "Submit changed output for review before publishing");
    await phaseGate(job, session);
    Object.assign(job, patch); job.operating.version += 1;
    job.operating.events.push(event(actorId(actor), "published", "Publication recorded", { evidence: text(body.evidence || body.externalPostUrl || job.externalPostUrl), revision: job.operating.submission.revision }));
    await job.save({ session }); return job;
  });
}
