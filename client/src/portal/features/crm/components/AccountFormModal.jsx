import React, { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { ACCOUNT_STATUS_LABEL } from "../format";

const FIELDS = ["name", "legalName", "industry", "website", "phone", "email", "country", "city", "address", "status", "notes"];

// CRM account form (PUI-3). Same fields and payload as before.
export default function AccountFormModal({ open, mode = "create", initial = null, busy = false, onClose, onSubmit }) {
  const [f, setF] = useState({});
  useEffect(() => {
    if (!open) return;
    const next = {};
    FIELDS.forEach((k) => {
      next[k] = initial?.[k] || (k === "status" ? "active" : "");
    });
    setF(next);
  }, [open, initial]);

  if (!open) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const isEdit = mode === "edit";
  const statusOptions = Object.entries(ACCOUNT_STATUS_LABEL).map(([value, label]) => ({ value, label }));
  if (f.status && !ACCOUNT_STATUS_LABEL[f.status]) statusOptions.push({ value: f.status, label: f.status });

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit account" : "New account"}
      description="A company in the CRM, used for its contacts and deals."
      onClose={onClose}
      busy={busy}
      canSubmit={Boolean(String(f.name || "").trim())}
      submitLabel={isEdit ? "Save changes" : "Create account"}
      submitIcon={isEdit ? Pencil : Plus}
      onSubmit={() => onSubmit?.(f)}
    >
      <fieldset className="px-form-section">
        <legend>Company</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Account name" required value={f.name || ""} onChange={set("name")} />
          <TextField label="Legal name" value={f.legalName || ""} onChange={set("legalName")} />
          <TextField label="Industry" value={f.industry || ""} onChange={set("industry")} />
          <SelectField label="Status" value={f.status || "active"} onChange={set("status")} options={statusOptions} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Contact details</legend>
        <div className="px-form-grid px-form-grid--3">
          <TextField label="Website" value={f.website || ""} onChange={set("website")} />
          <TextField label="Email" type="email" value={f.email || ""} onChange={set("email")} />
          <TextField label="Phone" value={f.phone || ""} onChange={set("phone")} />
        </div>
        <div className="px-form-grid px-form-grid--3">
          <TextField label="Country" value={f.country || ""} onChange={set("country")} />
          <TextField label="City" value={f.city || ""} onChange={set("city")} />
          <TextField label="Address" value={f.address || ""} onChange={set("address")} />
        </div>
        <TextField label="Notes" multiline rows={3} value={f.notes || ""} onChange={set("notes")} hint="Internal. CRM is staff only." />
      </fieldset>
    </FormDialog>
  );
}
