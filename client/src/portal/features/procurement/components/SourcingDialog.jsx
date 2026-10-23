import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import RecordPicker from "../../../shared/ui/RecordPicker";
import { useAccess } from "../../../shared/hooks/useAccess";
import { listUsers } from "../../iam/users/api";
import { listVendors } from "../api";
import { idOf } from "../format";

const toInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

// Staff-only sourcing fields of a request (PUI-4): vendor, quoted amount,
// proposed delivery, the staff member it's assigned to, and internal notes.
// The API ignores these fields from client users and hides them from them.
export default function SourcingDialog({ open, request, busy, error, onClose, onSubmit }) {
  const access = useAccess();
  const canUsers = access.can("iam.users.read");
  const [form, setForm] = useState({ vendor: null, assignee: null, quotedAmount: "", proposedDelivery: "", notes: "" });

  useEffect(() => {
    if (!open || !request) return;
    setForm({
      vendor: request.vendorId && typeof request.vendorId === "object" ? request.vendorId : null,
      assignee: request.assignedTo && typeof request.assignedTo === "object" ? request.assignedTo : null,
      quotedAmount: request.quotedAmount ?? "",
      proposedDelivery: toInput(request.proposedDelivery),
      notes: request.notes || "",
    });
  }, [open, request]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const submit = () => {
    const payload = {
      vendorId: idOf(form.vendor) || null,
      quotedAmount: form.quotedAmount === "" || form.quotedAmount === null ? null : Number(form.quotedAmount),
      proposedDelivery: form.proposedDelivery || null,
      notes: form.notes,
    };
    if (canUsers) payload.assignedTo = idOf(form.assignee) || null;
    onSubmit?.(payload);
  };

  return (
    <FormDialog open={open} title="Sourcing details" description="Internal to Expresso. Client users don't see the notes or the assignee, and see the vendor and quote only once the request is approved." onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Save" submitIcon={Save}>
      <fieldset className="px-form-section">
        <legend>Vendor and quote</legend>
        <RecordPicker
          label="Vendor"
          value={form.vendor}
          onChange={set("vendor")}
          load={(q) => listVendors({ q, isActive: "true", limit: 20 })}
          getLabel={(v) => v?.name || "Vendor"}
          getSub={(v) => [v?.contactPerson, v?.country].filter(Boolean).join(", ")}
          searchLabel="Search vendors"
        />
        <div className="px-form-grid px-form-grid--2">
          <TextField label={`Quoted amount (${request?.currency || "AED"})`} type="number" min="0" inputMode="decimal" value={String(form.quotedAmount ?? "")} onChange={set("quotedAmount")} />
          <TextField label="Proposed delivery" type="date" value={form.proposedDelivery} onChange={set("proposedDelivery")} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Internal</legend>
        {canUsers ? (
          <RecordPicker label="Assigned to" value={form.assignee} onChange={set("assignee")} load={(q) => listUsers({ q, limit: 20 }).then((r) => r?.users || r?.items || [])} getLabel={(u) => u?.fullName || u?.email || "User"} getSub={(u) => u?.email} searchLabel="Search users" />
        ) : (
          <TextField label="Assigned to" value={form.assignee?.fullName || form.assignee?.email || "Nobody"} readOnly hint="Changing it needs access to users." />
        )}
        <TextField label="Internal notes" multiline rows={3} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
