import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../ui/Panel";
import Button from "../ui/Button";
import { useAccess } from "../hooks/useAccess";
import { listServiceTemplates } from "../../features/services/api";
import AgreementEditor, { Field, Choice } from "./AgreementEditor";
import { overview, options, ownerAction, periodAction, errorMessage, localDate, identity } from "./api";

export default function AgreementPanel({ kind, owner, onChanged }) {
  const access = useAccess(), domain = kind === "enrollment" ? "enrollments" : "projects";
  const canWrite = access.can(`${domain}.write`), canGenerate = canWrite && access.can("jobs.write");
  const [expanded, setExpanded] = useState(owner.operatingModelVersion === 1 || owner.status === "draft");
  const [data, setData] = useState(null), [directory, setDirectory] = useState({ users: [], teams: [] });
  const [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [reason, setReason] = useState(""), [selectedJobs, setSelectedJobs] = useState([]), [toPeriodId, setToPeriodId] = useState("");
  const [decision, setDecision] = useState("carry"), [rescheduledDate, setRescheduledDate] = useState("");
  const [partialConfirmed, setPartialConfirmed] = useState(false), [partialQuantities, setPartialQuantities] = useState({});
  const [extraLine, setExtraLine] = useState(""), [extraQuantity, setExtraQuantity] = useState(1), [extraEvidence, setExtraEvidence] = useState("");
  const [services, setServices] = useState([]), [selectedService, setSelectedService] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [ownership, setOwnership] = useState({ executionLeadId: "", accountOwnerId: "", teamId: "" });
  const [phasePlans, setPhasePlans] = useState({});
  const [endFuture, setEndFuture] = useState(false), [terminationEvidence, setTerminationEvidence] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await overview(kind, owner._id, periodStart ? { periodStart } : {}); setData(result);
      setOwnership({ executionLeadId: identity(result.owner.executionLeadId || result.owner.ownerUserId), accountOwnerId: identity(result.owner.accountOwnerId), teamId: identity(result.owner.teamId) });
      if (canWrite) setDirectory(await options(kind, owner._id));
      setError("");
    } catch (e) { setError(errorMessage(e)); }
  }, [kind, owner._id, canWrite, periodStart]);
  useEffect(() => { if (expanded) load(); }, [expanded, load]);
  useEffect(() => {
    if (expanded && kind === "project" && canWrite && access.can("services.read")) listServiceTemplates({ status: "active", limit: 100 }).then((r) => setServices(r.items || [])).catch(() => {});
  // Permission set is refreshed by useAccess; a directory failure never grants access.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, kind, canWrite]);
  const run = async (work, message) => {
    setBusy(true); setError(""); setNotice("");
    try { await work(); setNotice(message); setEditing(false); setSelectedJobs([]); await load(); await onChanged?.(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const currentOwner = data?.owner || owner;
  const latest = currentOwner.agreementRevisions?.[currentOwner.agreementRevisions.length - 1];
  const managed = currentOwner.operatingModelVersion === 1;
  const service = services.find((s) => s._id === selectedService);
  const editorOwner = { ...owner, ...currentOwner, customerId: owner.customerId, serviceTemplateId: owner.serviceTemplateId,
    ...(service ? { finalScope: { mode: service.executionMode, groups: service.scopeGroups }, selectedServiceTemplateId: service._id } : {}) };
  const preview = data?.preview;
  const periodPayload = preview ? { periodStart: localDate(preview.periodStart, preview.timezone), periodEnd: localDate(preview.periodEnd, preview.timezone),
    ...(preview.requiresQuantityDecision && partialConfirmed ? { partialDecision: { reason, quantities: { ...preview.quantities, ...partialQuantities } } } : {}) } : {};
  const jobs = data?.jobs || [];
  return <Panel title="Delivery agreement and operations" sub={data?.displayState || "Accepted client scope, ownership and delivery"}>
    {!expanded ? <Button variant="outline" onClick={() => setExpanded(true)}>Confirm delivery agreement / review adoption</Button> : <div className="px-stack">
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      {!data ? <p>Loading delivery operations…</p> : <>
        {currentOwner.projectId && kind === "enrollment" && <Link to={`/portal/projects/${identity(currentOwner.projectId)}`}>Open linked delivery Project</Link>}
        {managed && <>
          <p>Agreement revision {latest?.number || "from linked Enrollment"}. Outstanding managed work: {data.outstanding}. {latest && `${latest.startDate} to ${latest.endDate} (${latest.timezone})`}</p>
          {canWrite && !currentOwner.enrollmentId && (!currentOwner.activatedAt || kind === "enrollment") && <Button variant="outline" onClick={() => setEditing(!editing)}>Revise accepted agreement</Button>}
          <ol>{(latest?.approvalRoute || []).map((s) => <li key={s.id}>{s.purpose} — {s.source}{s.required ? " (required)" : ""}</li>)}</ol>
        </>}
        {canWrite && (!managed || editing) && <>
          {!managed && services.length > 0 && <Choice label="Service defaults (optional)" value={selectedService} onChange={setSelectedService}><option value="">Custom scope</option>{services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</Choice>}
          <AgreementEditor kind={kind} owner={editorOwner} current={managed ? latest : null} directory={directory} legacyJobs={jobs.filter((j) => !j.operatingModelVersion)} busy={busy}
            onSave={(body) => run(() => ownerAction(kind, owner._id, managed ? "revise" : "confirm", { ...body, serviceTemplateId: selectedService || body.serviceTemplateId }), "Agreement accepted. Historical obligations were preserved.")} />
        </>}
        {managed && canWrite && <>
          <Field label="Action / exception reason" value={reason} onChange={setReason} />
          <details><summary>Change operational ownership</summary><div className="px-form-grid">
            <Choice label="New Execution Lead" value={ownership.executionLeadId} onChange={(v) => setOwnership({ ...ownership, executionLeadId: v })}><option value="">Select staff</option>{directory.users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>
            {kind === "enrollment" && <Choice label="Account responsibility override" value={ownership.accountOwnerId} onChange={(v) => setOwnership({ ...ownership, accountOwnerId: v })}><option value="">Use client Account Manager</option>{directory.users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>}
            <Choice label="Delivery Team" value={ownership.teamId} onChange={(v) => setOwnership({ ...ownership, teamId: v })}><option value="">No Team required</option>{directory.teams.map((t) => <option key={t._id} value={t._id}>{t.label}</option>)}</Choice>
            <Button disabled={busy} onClick={() => run(() => ownerAction(kind, owner._id, "ownership", { ...ownership, reason }), "Ownership updated. Existing submitted approval routes retain their recorded reviewers; delegate explicitly when needed.")}>Save delivery ownership</Button>
          </div></details>
          {!currentOwner.activatedAt && canGenerate && <Button disabled={busy || (preview?.requiresQuantityDecision && !partialConfirmed)} onClick={() => run(() => ownerAction(kind, owner._id, "activate", { ...periodPayload, reason }), "Delivery activated.")}>Activate accepted delivery</Button>}
          {currentOwner.activatedAt && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="outline" disabled={busy} onClick={() => run(() => ownerAction(kind, owner._id, "state", { status: currentOwner.status === "paused" ? "active" : "paused", reason }), "Service state saved.")}>{currentOwner.status === "paused" ? "Resume delivery" : "Pause delivery"}</Button>
            <Button variant="outline" disabled={busy} onClick={() => run(() => ownerAction(kind, owner._id, "state", { status: "completed", reason, endFutureEntitlement: endFuture, evidence: terminationEvidence }), "Delivery closed.")}>Close completed delivery</Button>
          </div>}
          {kind === "enrollment" && access.can("delivery.override") && <details><summary>Agreed early termination</summary><label><input type="checkbox" checked={endFuture} onChange={(e) => setEndFuture(e.target.checked)} /> Client agreed to end future entitlement; existing obligations must still be resolved.</label><Field label="Early termination acceptance evidence" value={terminationEvidence} onChange={setTerminationEvidence} /></details>}
        </>}
        {managed && kind === "enrollment" && canGenerate && <Field label="Preview period start / missed month" type="date" value={periodStart} onChange={(v) => { setPeriodStart(v); setPartialConfirmed(false); }} />}
        {preview && <section className="px-stack" aria-label="Next period preview">
          <b>Preview next period: {localDate(preview.periodStart, preview.timezone)} → {localDate(preview.periodEnd, preview.timezone)} (end exclusive)</b>
          {preview.requiresQuantityDecision && <>
            <p>This is a partial month. Confirm quantities explicitly; no automatic proration applies.</p>
            {Object.entries(preview.quantities).map(([id, q]) => <Field key={id} label={latest?.scope.groups.flatMap((g) => g.jobs).find((l) => l.id === id)?.title || id} type="number" min="0" value={partialQuantities[id] ?? q} onChange={(v) => setPartialQuantities({ ...partialQuantities, [id]: Number(v) })} />)}
            <label><input type="checkbox" checked={partialConfirmed} onChange={(e) => setPartialConfirmed(e.target.checked)} /> These are the agreed partial-period quantities (explain above).</label>
          </>}
          {canGenerate && currentOwner.activatedAt && <Button disabled={busy || (preview.requiresQuantityDecision && !partialConfirmed)} onClick={() => run(() => ownerAction(kind, owner._id, "open-period", { ...periodPayload, missedPeriodReason: reason }), "Period opened; required Jobs are available.")}>Open previewed period</Button>}
        </section>}
        {(data.periods || []).map((p) => <section className="px-stack" key={p._id} aria-label={`Period ${localDate(p.periodStart, p.timezone)}`}>
          <h3>{localDate(p.periodStart, p.timezone)} — {localDate(p.periodEnd, p.timezone)}</h3>
          <table className="px-table"><thead><tr>{["Deliverable", "New entitlement", "Extras", "Carry-in", "Total workload", "Delivered from origin", "Waived", "Outstanding from origin"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{p.summary.map((r) => <tr key={r.scopeLineId}><td>{r.title}</td>{[r.base, r.extras, r.carryIn, r.workload, r.completed, r.waived, r.outstanding].map((n, i) => <td key={i}>{n}</td>)}</tr>)}</tbody></table>
          {canGenerate && <>
            <fieldset><legend>Outstanding work to reconcile</legend>
              {jobs.filter((j) => j.operating?.disposition === "outstanding" && (identity(j.originDeliveryPeriodId) === p._id || identity(j.workDeliveryPeriodId) === p._id)).map((j) => <label key={j._id} style={{ display: "block" }}><input type="checkbox" checked={selectedJobs.includes(j._id)} onChange={(e) => setSelectedJobs(e.target.checked ? [...selectedJobs, j._id] : selectedJobs.filter((x) => x !== j._id))} /> {j.title}</label>)}
            </fieldset>
            <div className="px-form-grid">
              <Choice label="Reconciliation decision" value={decision} onChange={setDecision}><option value="carry">Carry forward</option><option value="reschedule">Reschedule</option><option value="outstanding">Leave outstanding</option>{access.can("delivery.override") && <option value="waive">Waive (never delivered)</option>}</Choice>
              {decision === "carry" && <Choice label="Carry destination (open it first)" value={toPeriodId} onChange={setToPeriodId}><option value="">Select later period</option>{data.periods.filter((t) => new Date(t.periodStart) >= new Date(p.periodEnd)).map((t) => <option key={t._id} value={t._id}>{localDate(t.periodStart, t.timezone)}</option>)}</Choice>}
              {decision === "reschedule" && <Field label="New scheduled deadline" type="date" value={rescheduledDate} onChange={setRescheduledDate} />}
            </div>
            <Button disabled={busy || !selectedJobs.length} onClick={() => run(() => periodAction(owner._id, p._id, "reconcile", { expectedVersion: p.operatingVersion, reason, decisions: selectedJobs.map((jobId) => ({ jobId, decision, toPeriodId, dueDate: rescheduledDate })) }), "Period reconciled; original obligations preserved.")}>Record reconciliation</Button>
            {access.can("delivery.override") && <div className="px-form-grid">
              <Choice label="Extra scope line" value={extraLine} onChange={setExtraLine}><option value="">Select deliverable</option>{p.baseEntitlement.map((l) => <option key={l.scopeLineId} value={l.scopeLineId}>{l.title}</option>)}</Choice>
              <Field label="Extra units this period" type="number" min="1" value={extraQuantity} onChange={(v) => setExtraQuantity(Number(v))} />
              <Field label="Client agreement evidence for extras" value={extraEvidence} onChange={setExtraEvidence} />
              <Button disabled={busy} onClick={() => run(() => periodAction(owner._id, p._id, "adjust", { expectedVersion: p.operatingVersion, scopeLineId: extraLine, quantity: extraQuantity, reason, evidence: extraEvidence }), "Extra scope added without changing base entitlement.")}>Approve and create extra units</Button>
            </div>}
          </>}
        </section>)}
        {managed && currentOwner.phases?.length > 0 && <section aria-label="Project phases"><h3>Delivery phases</h3>
          {currentOwner.phases.map((p) => <div className="px-stack" key={p.id}><b>{p.order + 1}. {p.name}</b><span>{p.acceptanceRequirement} — {p.acceptedAt ? "Accepted" : "Pending acceptance"}</span>
            {canWrite && !p.acceptedAt && <details><summary>Plan {p.name}</summary><div className="px-form-grid">
              <Field label={`${p.name} planned start`} type="date" value={phasePlans[p.id]?.plannedStart || localDate(p.plannedStart, data.deliveryTimezone || latest?.timezone)} onChange={(v) => setPhasePlans({ ...phasePlans, [p.id]: { ...phasePlans[p.id], plannedStart: v } })} />
              <Field label={`${p.name} planned end`} type="date" value={phasePlans[p.id]?.plannedEnd || localDate(p.plannedEnd, data.deliveryTimezone || latest?.timezone)} onChange={(v) => setPhasePlans({ ...phasePlans, [p.id]: { ...phasePlans[p.id], plannedEnd: v } })} />
              <Choice label={`${p.name} predecessor`} value={phasePlans[p.id]?.predecessorId ?? p.predecessorId} onChange={(v) => setPhasePlans({ ...phasePlans, [p.id]: { ...phasePlans[p.id], predecessorId: v } })}><option value="">No predecessor</option>{currentOwner.phases.filter((x) => x.order < p.order).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Choice>
              <Button disabled={busy} onClick={() => run(() => ownerAction(kind, owner._id, "plan-phase", { phaseId: p.id, plannedStart: phasePlans[p.id]?.plannedStart || localDate(p.plannedStart, data.deliveryTimezone || latest?.timezone), plannedEnd: phasePlans[p.id]?.plannedEnd || localDate(p.plannedEnd, data.deliveryTimezone || latest?.timezone), predecessorId: phasePlans[p.id]?.predecessorId ?? p.predecessorId, reason }), "Phase plan recorded.")}>Save {p.name} plan</Button>
            </div></details>}
            {canWrite && access.can("jobs.approve") && !p.acceptedAt && <Button variant="outline" disabled={busy} onClick={() => run(() => ownerAction(kind, owner._id, "accept-phase", { phaseId: p.id, reason }), "Phase outcome accepted.")}>Accept {p.name}</Button>}
          </div>)}
        </section>}
        <section aria-label="Delivery work"><h3>Jobs</h3><ul>{jobs.map((j) => <li key={j._id}><Link to={`/portal/jobs/${j._id}`}>{j.title}</Link> — {j.operatingModelVersion === 1 ? j.operating.disposition : "Unallocated legacy work"} {j.phaseId && `· phase ${currentOwner.phases?.find((p) => p.id === j.phaseId)?.name || j.phaseId}`}</li>)}</ul></section>
      </>}
    </div>}
  </Panel>;
}
