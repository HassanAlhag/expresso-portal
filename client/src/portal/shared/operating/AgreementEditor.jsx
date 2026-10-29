import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import { identity, requestId } from "./api";
import { listFiles } from "../../features/files/api";
import { useAccess } from "../hooks/useAccess";

const TYPES = ["task", "post", "carousel", "story", "reel", "video", "photo", "design", "page", "case_study", "other"];
export const fieldStyle = { display: "grid", gap: 5 };
export function Field({ label, value, onChange, type = "text", required = false, ...rest }) {
  return <label style={fieldStyle}><span>{label}</span><input className="px-input" type={type} value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)} {...rest} /></label>;
}
export function Choice({ label, value, onChange, children }) {
  return <label style={fieldStyle}><span>{label}</span><select className="px-input" value={value || ""} onChange={(e) => onChange(e.target.value)}>{children}</select></label>;
}
export default function AgreementEditor({ kind, owner, current, directory, legacyJobs = [], busy, onSave }) {
  const access = useAccess();
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState([]), [fileError, setFileError] = useState("");
  const customerId = identity(owner.customerId);
  const canReadFiles = access.can("files.read");
  useEffect(() => {
    if (canReadFiles && customerId) listFiles({ customerId, limit: 100 }).then((r) => setFiles((r.items || []).filter((f) => f.isPrivate))).catch(() => setFileError("Documents did not load; retry or use the agreement reference."));
  }, [canReadFiles, customerId]);
  useEffect(() => {
    const rev = current || owner.agreementRevisions?.[owner.agreementRevisions.length - 1];
    const today = new Date().toISOString().slice(0, 10);
    const suggested = rev?.scope || owner.finalScope || { mode: kind === "project" ? "phased_project" : "recurring", groups: [] };
    setForm({ startDate: rev?.startDate || owner.startDate?.slice(0, 10) || today, endDate: rev?.endDate || owner.endDate?.slice(0, 10) || "",
      effectiveDate: rev ? "" : owner.startDate?.slice(0, 10) || today, timezone: rev?.timezone || "Asia/Dubai",
      serviceTemplateId: identity(owner.selectedServiceTemplateId || owner.serviceTemplateId),
      scope: { ...suggested, groups: (suggested.groups || []).map((g) => ({ ...g, id: g.id || requestId(), jobs: (g.jobs || []).map((j) => ({ ...j, id: j.id || requestId() })) })) }, price: rev?.price ?? owner.pricing?.price ?? "", currency: rev?.currency || owner.pricing?.currency || "AED",
      billingCycle: rev?.billingCycle || owner.pricing?.billingCycle || "monthly", reference: rev?.reference || "", fileIds: (rev?.fileIds || []).map(identity),
      sourceDealId: identity(rev?.sourceDealId || owner.sourceDealId), executionLeadId: identity(rev?.executionLeadId || owner.executionLeadId || owner.ownerUserId),
      accountOwnerId: identity(rev?.accountOwnerId || owner.accountOwnerId || owner.customerId?.accountManagerId), teamId: identity(rev?.teamId || owner.teamId),
      clientContact: rev?.clientContact || owner.customerId?.contactName || "", acceptedAt: today, reason: "", adoptionReviewed: false, adoptionMappings: [],
      approvalRoute: rev?.approvalRoute?.map((s) => ({ ...s, approverId: identity(s.approverId) })) || [
        { id: requestId(), purpose: "Team Lead review", source: "EXECUTION_LEAD", required: true },
        { id: requestId(), purpose: "Client acceptance", source: "CLIENT_EXTERNAL_RECORDED", required: true },
      ] });
  }, [owner, current, kind]);
  if (!form) return null;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const groups = form.scope.groups || [];
  const updateGroup = (index, patch) => set("scope", { ...form.scope, groups: groups.map((g, i) => i === index ? { ...g, ...patch } : g) });
  const staff = (label, key) => <Choice label={label} value={form[key]} onChange={(v) => set(key, v)}><option value="">Select staff</option>{directory.users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>;
  const linked = kind === "project" && identity(owner.enrollmentId);
  return <form className="px-stack" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, price: form.price === "" ? null : Number(form.price), deliveryCadence: form.scope.mode === "recurring" ? "monthly" : "once", effectiveDate: form.effectiveDate || form.startDate, cutoverDate: form.effectiveDate || form.startDate, previousRevisionId: current?.id }); }}>
    {linked ? <p>This Project uses the accepted Enrollment agreement. Confirm its effective date below; commercial scope is edited on that Enrollment.</p> : <>
      <div className="px-form-grid">
        <Choice label="Delivery model" value={form.scope.mode} onChange={(v) => set("scope", { ...form.scope, mode: v })}>
          {kind === "enrollment" && <option value="recurring">Recurring monthly service</option>}<option value="phased_project">Phased project</option><option value="one_time">One-off work</option>
        </Choice>
        <Field label="Agreement start" type="date" value={form.startDate} onChange={(v) => set("startDate", v)} required />
        <Field label="Agreement end (inclusive)" type="date" value={form.endDate} onChange={(v) => set("endDate", v)} required />
        <Field label={current ? "Revision effective date" : "Effective cutover date"} type="date" value={form.effectiveDate} onChange={(v) => set("effectiveDate", v)} required />
        <Field label="Timezone" value={form.timezone} onChange={(v) => set("timezone", v)} required />
        <Field label="Agreed price" type="number" min="0" step="0.01" value={form.price} onChange={(v) => set("price", v)} />
        <Field label="Currency" value={form.currency} onChange={(v) => set("currency", v)} required />
        <Choice label="Billing cycle" value={form.billingCycle} onChange={(v) => set("billingCycle", v)}>{["monthly", "quarterly", "yearly", "one_time"].map((v) => <option key={v}>{v}</option>)}</Choice>
        {staff("Execution Lead", "executionLeadId")}{staff("Account responsibility (service override)", "accountOwnerId")}
        <Choice label="Assigned Team" value={form.teamId} onChange={(v) => set("teamId", v)}><option value="">No Team required</option>{directory.teams.map((t) => <option key={t._id} value={t._id}>{t.label}</option>)}</Choice>
        <Field label="Proposal / contract reference" value={form.reference} onChange={(v) => set("reference", v)} />
        <Field label="Accepting client contact" value={form.clientContact} onChange={(v) => set("clientContact", v)} required />
        <Field label="Client acceptance date" type="date" value={form.acceptedAt} onChange={(v) => set("acceptedAt", v)} required />
      </div>
      {canReadFiles && <label style={fieldStyle}><span>Supporting private agreement documents (upload in Files first)</span>
        <select className="px-input" multiple value={form.fileIds} onChange={(e) => set("fileIds", [...e.target.selectedOptions].map((o) => o.value))}>
          {files.map((f) => <option key={f._id} value={f._id}>{f.title || f.originalName}</option>)}
          {form.fileIds.filter((id) => !files.some((f) => f._id === id)).map((id, i) => <option key={id} value={id}>Existing agreement document {i + 1}</option>)}
        </select>
      </label>}
      {fileError && <p role="status">{fileError}</p>}
      <fieldset className="px-stack"><legend>Actual client scope</legend>
        {groups.map((g, gi) => <div className="px-stack" key={g.id || gi}>
          <Field label={`Group / phase ${gi + 1}`} value={g.title} onChange={(v) => updateGroup(gi, { title: v })} required />
          <Field label="Outcome / acceptance requirement" value={g.description} onChange={(v) => updateGroup(gi, { description: v })} />
          {(g.jobs || []).map((j, ji) => { const update = (p) => updateGroup(gi, { jobs: g.jobs.map((x, i) => i === ji ? { ...x, ...p } : x) }); return <div className="px-form-grid" key={j.id || ji}>
            <Field label={`Deliverable ${ji + 1}`} value={j.title} onChange={(v) => update({ title: v })} required />
            <Choice label="Job type" value={j.type} onChange={(v) => update({ type: v })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Choice>
            <Field label="Quantity" type="number" min="0" max="500" value={j.quantity} onChange={(v) => update({ quantity: Number(v) })} required />
            <Field label="Unit" value={j.unit || "items"} onChange={(v) => update({ unit: v })} />
            <Field label="Due days from start (0 = period/term end)" type="number" min="0" value={j.dueDays || 0} onChange={(v) => update({ dueDays: Number(v) })} />
            <Choice label="Delivery criterion" value={j.completionCriterion || "delivered"} onChange={(v) => update({ completionCriterion: v })}><option value="delivered">Delivered with evidence</option><option value="published">Publication then delivery</option></Choice>
            <Button type="button" variant="outline" onClick={() => updateGroup(gi, { jobs: g.jobs.filter((_, i) => i !== ji) })}>Remove deliverable</Button>
          </div>; })}
          <Button type="button" variant="outline" onClick={() => updateGroup(gi, { jobs: [...(g.jobs || []), { id: requestId(), title: "", type: "task", quantity: 1, unit: "items", dueDays: 0 }] })}>Add deliverable</Button>
          <Button type="button" variant="outline" onClick={() => set("scope", { ...form.scope, groups: groups.filter((_, i) => i !== gi) })}>Remove group</Button>
        </div>)}
        <Button type="button" variant="outline" onClick={() => set("scope", { ...form.scope, groups: [...groups, { id: requestId(), title: "", type: form.scope.mode === "phased_project" ? "phase" : "deliverable_group", jobs: [] }] })}>Add scope group / phase</Button>
      </fieldset>
      <fieldset className="px-stack"><legend>Ordered approval requirements</legend>
        {form.approvalRoute.map((s, i) => { const update = (p) => set("approvalRoute", form.approvalRoute.map((x, n) => n === i ? { ...x, ...p } : x)); return <div className="px-form-grid" key={s.id}>
          <Field label={`Step ${i + 1} purpose`} value={s.purpose} onChange={(v) => update({ purpose: v })} required />
          <Choice label="Approver source" value={s.source} onChange={(v) => update({ source: v })}>{["EXECUTION_LEAD", "ACCOUNT_OWNER", "EXPLICIT_INTERNAL_USER", "CLIENT_EXTERNAL_RECORDED"].map((v) => <option key={v}>{v}</option>)}</Choice>
          {s.source === "EXPLICIT_INTERNAL_USER" && <Choice label="Named approver" value={s.approverId} onChange={(v) => update({ approverId: v })}><option value="">Select staff</option>{directory.users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</Choice>}
          <label><input type="checkbox" checked={s.required} onChange={(e) => update({ required: e.target.checked })} /> Required</label>
          <Button type="button" variant="outline" onClick={() => set("approvalRoute", form.approvalRoute.filter((_, n) => n !== i))}>Remove step</Button>
        </div>; })}
        <Button type="button" variant="outline" onClick={() => set("approvalRoute", [...form.approvalRoute, { id: requestId(), purpose: "", source: "EXPLICIT_INTERNAL_USER", required: true }])}>Add approval step</Button>
      </fieldset>
    </>}
    {linked && <Field label="Effective cutover date" type="date" value={form.effectiveDate} onChange={(v) => set("effectiveDate", v)} required />}
    {!current && legacyJobs.length > 0 && <fieldset className="px-stack"><legend>Reviewed adoption</legend>
      <label><input type="checkbox" checked={form.adoptionReviewed} onChange={(e) => set("adoptionReviewed", e.target.checked)} /> I reviewed existing work; unmapped Jobs remain unallocated legacy work.</label>
      {legacyJobs.map((j) => { const mapping = form.adoptionMappings.find((m) => m.jobId === j._id); return <div className="px-form-grid" key={j._id}>
        <Choice label={`Adopt ${j.title}`} value={mapping?.scopeLineId || ""} onChange={(v) => set("adoptionMappings", [...form.adoptionMappings.filter((m) => m.jobId !== j._id), ...(v ? [{ jobId: j._id, scopeLineId: v, scopeUnitOrdinal: 1 }] : [])])}>
          <option value="">Leave unallocated</option>{groups.flatMap((g) => g.jobs || []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </Choice>
        {mapping && <Field label="Promised unit number" type="number" min="1" value={mapping.scopeUnitOrdinal} onChange={(v) => set("adoptionMappings", form.adoptionMappings.map((m) => m.jobId === j._id ? { ...m, scopeUnitOrdinal: Number(v) } : m))} />}
      </div>; })}
    </fieldset>}
    <Field label="Acceptance / revision reason" value={form.reason} onChange={(v) => set("reason", v)} required />
    <Button type="submit" disabled={busy}>{current ? "Accept agreement revision" : "Confirm delivery agreement"}</Button>
  </form>;
}
