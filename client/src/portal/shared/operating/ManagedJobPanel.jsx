import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../ui/Panel";
import Button from "../ui/Button";
import { useAccess } from "../hooks/useAccess";
import { updateJob } from "../../features/jobs/api";
import { jobAction, identity, errorMessage, options, localDate } from "./api";
import { Field, Choice } from "./AgreementEditor";

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value), pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ManagedJobPanel({ job, onChanged }) {
  const access = useAccess();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [outputReference, setOutput] = useState(job.operating?.submission?.outputReference || ""), [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState(""), [clientContact, setClient] = useState(""), [clientDate, setClientDate] = useState("");
  const [blocker, setBlocker] = useState({ reason: "CONTENT", responsibleParty: "CLIENT", note: "", evidence: "", nextAction: "" });
  const [publicationDate, setPublicationDate] = useState(localDateTime(job.scheduledPublicationDate));
  const [deadline, setDeadline] = useState(job.dueDate?.slice(0, 10) || "");
  const [delegateId, setDelegate] = useState("");
  const [directory, setDirectory] = useState([]);
  const [staffIds, setStaffIds] = useState((job.assignees || []).map(identity));
  useEffect(() => { if (access.can("jobs.write")) options("job", job._id).then((r) => setDirectory(r.users)).catch((e) => setError(errorMessage(e))); }, [access, job._id]);
  if (job.operatingModelVersion !== 1) return null;
  const canWrite = access.can("jobs.write"), canApprove = access.can("jobs.approve"), canOverride = access.can("delivery.override");
  const op = job.operating, submission = op.submission;
  const approvedSteps = new Set(op.decisions.filter((d) => d.revision === submission?.revision && d.decision === "approved").map((d) => d.stepId));
  const currentStep = submission?.submittedAt && submission.route.find((s) => s.required && !approvedSteps.has(s.id));
  const assigned = currentStep && identity(currentStep.approverId) === identity(access.user.id || access.user._id);
  const run = async (work, message) => { setBusy(true); setError(""); setNotice(""); try { await work(); setNotice(message); await onChanged?.(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  const act = (command, body = {}) => run(() => jobAction(job, command, { reason, ...body }), "Delivery action recorded.");
  const periodName = (p) => p?.periodStart ? localDate(p.periodStart, p.timezone) : identity(p) ? "Linked service period" : "Project engagement";
  return <Panel title="Managed delivery" sub={`Fulfillment: ${op.disposition} · accepted agreement scope`}>
    <div className="px-stack">
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <p>Origin period: {periodName(job.originDeliveryPeriodId)}. Work period: {periodName(job.workDeliveryPeriodId)}. {identity(job.originDeliveryPeriodId) !== identity(job.workDeliveryPeriodId) && "Carried from the original period."}</p>
      <p>Original committed deadline: {job.originalCommittedDueDate ? new Date(job.originalCommittedDueDate).toLocaleString() : "Not set"}. Current deadline: {job.dueDate ? new Date(job.dueDate).toLocaleString() : "Not set"}.</p>
      {job.projectId && <Link to={`/portal/projects/${identity(job.projectId)}`}>Open phase delivery</Link>}
      {job.enrollmentId && <Link to={`/portal/enrollments/${identity(job.enrollmentId)}`}>Open agreement and periods</Link>}
      <ol>{(submission?.submittedAt ? submission.route : op.route).map((s) => <li key={s.id}>{s.purpose}: {submission?.submittedAt && approvedSteps.has(s.id) ? "Approved" : "Pending"} — {s.source}</li>)}</ol>
      {(canWrite || canApprove) && <Field label="Action reason / review feedback" value={reason} onChange={setReason} />}
      {canWrite && op.disposition === "outstanding" && <>
        <label style={{ display: "grid", gap: 6 }}>Assigned staff<select className="px-input" multiple value={staffIds} onChange={(e) => setStaffIds([...e.target.selectedOptions].map((o) => o.value))}>
          {directory.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
          {(job.assignees || []).filter((u) => !directory.some((p) => identity(p) === identity(u))).map((u) => <option key={identity(u)} value={identity(u)}>{u.fullName || "Current staff member"}</option>)}
        </select></label>
        <Button variant="outline" disabled={busy} onClick={() => run(() => updateJob(job._id, { assignees: staffIds }), "Staff assignment recorded.")}>Save assigned staff</Button>
        <Button variant="outline" disabled={busy} onClick={() => run(() => updateJob(job._id, { status: "in_progress" }), "Work started.")}>Start / resume work</Button>
        <Field label="Submitted output reference (File, Media, link or handover reference)" value={outputReference} onChange={setOutput} />
        <Button disabled={busy} onClick={() => act("submit", { outputReference })}>Submit output for review</Button>
        <div className="px-form-grid">
          <Field label="Scheduled publication date" type="datetime-local" value={publicationDate} onChange={setPublicationDate} />
          <Button variant="outline" disabled={busy} onClick={() => run(() => updateJob(job._id, { scheduledPublicationDate: publicationDate ? new Date(publicationDate).toISOString() : null }), "Publication schedule saved; contractual origin preserved.")}>Save publication schedule</Button>
          <Field label="Rescheduled deadline" type="date" value={deadline} onChange={setDeadline} />
          <Button variant="outline" disabled={busy} onClick={() => run(() => updateJob(job._id, { dueDate: deadline, operatingChangeReason: reason }), "Deadline change recorded; original commitment preserved.")}>Record rescheduling</Button>
        </div>
      </>}
      {currentStep && canApprove && (assigned || canOverride) && <fieldset className="px-stack"><legend>Decide: {currentStep.purpose}</legend>
        {currentStep.source === "CLIENT_EXTERNAL_RECORDED" && <>
          <p>You are recording the client’s external decision. Your staff identity remains the recorder.</p>
          <Field label="Client contact" value={clientContact} onChange={setClient} />
          <Field label="Client decision date" type="date" value={clientDate} onChange={setClientDate} />
        </>}
        <Field label="Approval evidence / reference" value={evidence} onChange={setEvidence} />
        <div style={{ display: "flex", gap: 8 }}>
          <Button disabled={busy} onClick={() => act("decide", { stepId: currentStep.id, revision: submission.revision, decision: "approved", note: reason, evidence, clientContact, clientApprovedAt: clientDate })}>{currentStep.source === "CLIENT_EXTERNAL_RECORDED" ? "Record external client approval" : "Approve assigned step"}</Button>
          <Button variant="outline" disabled={busy} onClick={() => act("decide", { stepId: currentStep.id, revision: submission.revision, decision: "changes_requested", note: reason, evidence, clientContact, clientApprovedAt: clientDate })}>Request changes</Button>
        </div>
      </fieldset>}
      {canWrite && <>
        <Field label="Delivery / publication evidence" value={evidence} onChange={setEvidence} />
        {op.disposition === "outstanding" ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button disabled={busy} onClick={() => act("complete", { evidence })}>Record delivered work</Button>
          <Button variant="outline" disabled={busy} onClick={() => act("publish", { evidence, externalPostUrl: evidence })}>Record external publication</Button>
          {canOverride && <><Button variant="outline" disabled={busy} onClick={() => act("waive")}>Waive obligation</Button><Button variant="outline" disabled={busy} onClick={() => act("exceptional-complete", { evidence })}>Exceptional completion with override</Button></>}
        </div> : <Button variant="outline" disabled={busy} onClick={() => act("reopen")}>Reopen / restore obligation</Button>}
        <fieldset className="px-stack"><legend>Blocker — separate from workflow stage</legend>
          <div className="px-form-grid">
            <Choice label="Blocker reason" value={blocker.reason} onChange={(v) => setBlocker({ ...blocker, reason: v })}>{["CONTENT", "APPROVAL", "ACCESS", "FEEDBACK", "DEPENDENCY", "OTHER"].map((v) => <option key={v}>{v}</option>)}</Choice>
            <Choice label="Responsible party" value={blocker.responsibleParty} onChange={(v) => setBlocker({ ...blocker, responsibleParty: v })}>{["CLIENT", "EXPRESSO", "THIRD_PARTY"].map((v) => <option key={v}>{v}</option>)}</Choice>
            <Field label="Blocker note / evidence" value={blocker.note} onChange={(v) => setBlocker({ ...blocker, note: v })} />
            <Field label="Next action" value={blocker.nextAction} onChange={(v) => setBlocker({ ...blocker, nextAction: v })} />
            <Choice label="Next action owner" value={blocker.nextActionOwnerId} onChange={(v) => setBlocker({ ...blocker, nextActionOwnerId: v })}><option value="">Not assigned</option>{directory.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>
          </div>
          <Button variant="outline" disabled={busy} onClick={() => act("start-blocker", { blocker })}>Record blocker</Button>
          {op.blockers.map((b) => <p key={b.id}>{b.reason} / {b.responsibleParty}: {b.note} — {b.endedAt ? "Ended" : <Button size="sm" variant="outline" disabled={busy} onClick={() => act("end-blocker", { blockerId: b.id })}>End blocker</Button>}</p>)}
        </fieldset>
        {canOverride && <fieldset className="px-stack"><legend>Audited approver delegation</legend>
          <Choice label="Replacement internal approver" value={delegateId} onChange={setDelegate}><option value="">Select staff</option>{directory.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>
          {op.route.map((s) => <Button key={s.id} variant="outline" disabled={busy} onClick={() => act("delegate", { stepId: s.id, approverId: delegateId })}>Delegate {s.purpose} (invalidates submitted review)</Button>)}
        </fieldset>}
      </>}
      <details><summary>Delivery and decision history</summary><ol>{op.events.map((e) => <li key={e.id}>{new Date(e.at).toLocaleString()} — {e.action}: {e.reason}</li>)}</ol>
        <ol>{op.decisions.map((d) => <li key={d.requestId}>Revision {d.revision}: {d.decision}; recorded by {d.actorId?.fullName || "authorized staff"} {d.clientContact && `for ${d.clientContact}, client decision ${new Date(d.clientApprovedAt).toLocaleDateString()}`} — {d.evidence}</li>)}</ol>
      </details>
    </div>
  </Panel>;
}
