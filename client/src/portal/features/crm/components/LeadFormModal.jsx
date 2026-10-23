import React, { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { listLeadAssignees } from "../api";
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from "../constants";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
];

// Lead form (PUI-3). Same fields and payload as before. "Converted" is set by
// conversion only; a converted lead keeps showing it. Leads from Build Your
// Plan keep their source.
export default function LeadFormModal({ open, mode = "create", initial = null, busy = false, onClose, onSubmit }) {
  const [f, setF] = useState({});
  const [assignees, setAssignees] = useState([]);
  const [assigneesState, setAssigneesState] = useState("idle");

  useEffect(() => {
    if (!open) return;
    setF({
      fullName: initial?.fullName || "",
      companyName: initial?.companyName || "",
      email: initial?.email || "",
      phone: initial?.phone || "",
      service: initial?.service || "",
      source: initial?.source || "manual",
      status: initial?.status || "new",
      ownerUserId: initial?.ownerUserId?._id || initial?.ownerUserId || "",
      notes: initial?.notes || "",
    });
  }, [open, initial]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setAssigneesState("loading");
    listLeadAssignees()
      .then((res) => {
        if (cancelled) return;
        setAssignees(Array.isArray(res?.items) ? res.items : res?.users || []);
        setAssigneesState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setAssignees([]);
        setAssigneesState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const isEdit = mode === "edit";
  const sourceLocked = isEdit && f.source === "plan_builder";
  const sourceOptions = LEAD_SOURCE_OPTIONS.filter((o) => o.value !== "plan_builder");
  if (f.source && !sourceOptions.some((o) => o.value === f.source) && !sourceLocked) {
    sourceOptions.unshift({ value: f.source, label: leadSourceLabel(f.source) });
  }
  const statusOptions = f.status === "converted" ? [{ value: "converted", label: "Converted" }, ...STATUS_OPTIONS] : STATUS_OPTIONS;
  const ownerOptions = [
    { value: "", label: assigneesState === "loading" ? "Loading staff…" : assigneesState === "failed" ? "Unassigned (staff list unavailable)" : "Unassigned" },
    ...assignees.map((a) => ({ value: a._id, label: a.fullName || a.email || "Staff member" })),
  ];
  if (f.ownerUserId && !ownerOptions.some((o) => o.value === f.ownerUserId)) {
    ownerOptions.push({ value: f.ownerUserId, label: initial?.ownerUserId?.fullName || "Current owner" });
  }

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit lead" : "New lead"}
      description={isEdit ? "Update the lead's details and qualification." : "Add a lead to the CRM."}
      onClose={onClose}
      busy={busy}
      canSubmit={String(f.fullName || "").trim().length >= 2}
      submitLabel={isEdit ? "Save changes" : "Create lead"}
      submitIcon={isEdit ? Pencil : Plus}
      onSubmit={() =>
        onSubmit?.({
          fullName: f.fullName.trim(),
          companyName: f.companyName.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
          service: f.service.trim(),
          source: f.source,
          status: f.status,
          ownerUserId: f.ownerUserId || null,
          notes: f.notes.trim(),
        })
      }
    >
      <fieldset className="px-form-section">
        <legend>Person</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Full name" required value={f.fullName || ""} onChange={set("fullName")} hint="At least 2 characters." />
          <TextField label="Company" value={f.companyName || ""} onChange={set("companyName")} />
          <TextField label="Email" type="email" value={f.email || ""} onChange={set("email")} />
          <TextField label="Phone" value={f.phone || ""} onChange={set("phone")} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Qualification</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Service of interest" value={f.service || ""} onChange={set("service")} placeholder="Website, SEO, Google Ads" />
          <SelectField label="Status" value={f.status || "new"} onChange={set("status")} options={statusOptions} disabled={f.status === "converted"} />
          {sourceLocked ? (
            <TextField label="Source" value={leadSourceLabel(f.source)} readOnly hint="Set by Build Your Plan; can't be changed." />
          ) : (
            <SelectField label="Source" value={f.source || "manual"} onChange={set("source")} options={sourceOptions} />
          )}
          <SelectField label="Owner" value={f.ownerUserId || ""} onChange={set("ownerUserId")} options={ownerOptions} />
        </div>
        <TextField label="Notes" multiline rows={3} value={f.notes || ""} onChange={set("notes")} hint="Internal. CRM is staff only." />
      </fieldset>
    </FormDialog>
  );
}
