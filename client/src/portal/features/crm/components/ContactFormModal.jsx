import React, { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";

const FIELDS = ["fullName", "jobTitle", "email", "phone", "whatsapp", "notes"];

// CRM contact form (PUI-3). Same fields as before; `fixed` adds values the
// caller controls (for example the account a contact is added to).
export default function ContactFormModal({ open, mode = "create", initial = null, fixed = {}, busy = false, onClose, onSubmit, context }) {
  const [f, setF] = useState({});
  useEffect(() => {
    if (!open) return;
    const next = { isPrimary: Boolean(initial?.isPrimary) };
    FIELDS.forEach((k) => {
      next[k] = initial?.[k] || "";
    });
    setF(next);
  }, [open, initial]);

  if (!open) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const isEdit = mode === "edit";

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit contact" : "New contact"}
      description={context || "A person you deal with in the CRM."}
      onClose={onClose}
      busy={busy}
      canSubmit={Boolean(String(f.fullName || "").trim())}
      submitLabel={isEdit ? "Save changes" : "Create contact"}
      submitIcon={isEdit ? Pencil : Plus}
      onSubmit={() => onSubmit?.({ ...f, fullName: f.fullName.trim(), ...fixed })}
    >
      <fieldset className="px-form-section">
        <legend>Person</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Full name" required value={f.fullName || ""} onChange={set("fullName")} />
          <TextField label="Job title" value={f.jobTitle || ""} onChange={set("jobTitle")} />
        </div>
        <div className="px-form-grid px-form-grid--3">
          <TextField label="Email" type="email" value={f.email || ""} onChange={set("email")} />
          <TextField label="Phone" value={f.phone || ""} onChange={set("phone")} />
          <TextField label="WhatsApp" value={f.whatsapp || ""} onChange={set("whatsapp")} />
        </div>
        <label className="px-check">
          <input type="checkbox" checked={Boolean(f.isPrimary)} onChange={(e) => setF((s) => ({ ...s, isPrimary: e.target.checked }))} />
          Primary contact
        </label>
        <TextField label="Notes" multiline rows={2} value={f.notes || ""} onChange={set("notes")} hint="Internal. CRM is staff only." />
      </fieldset>
    </FormDialog>
  );
}
