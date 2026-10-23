import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { CATEGORY_OPTIONS } from "../constants";
import { EXTERNAL_TICKET_TYPES, TICKET_PRIORITY_LABEL } from "../format";

const BLANK = { type: "support", title: "", description: "", category: "general", priority: "medium", dueDate: "", vendor: "", vendorContact: "", budgetAmount: "", currency: "USD", purchaseOrderRef: "", deliveryDate: "" };

// New support request, client view (PUI-5). The fields a client already
// could send; the company comes from the account (the API sets it).
export default function ClientTicketFormDialog({ open, busy, error, onClose, onSubmit }) {
  const [f, setF] = useState(BLANK);
  useEffect(() => {
    if (open) setF(BLANK);
  }, [open]);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  const submit = () => {
    const payload = { type: f.type, title: f.title.trim(), description: f.description.trim(), category: f.category, priority: f.priority };
    if (f.dueDate) payload.dueDate = f.dueDate;
    if (f.type === "procurement") {
      Object.assign(payload, { vendor: f.vendor.trim() || null, vendorContact: f.vendorContact.trim() || null, currency: f.currency.trim() || "USD", purchaseOrderRef: f.purchaseOrderRef.trim() || null, deliveryDate: f.deliveryDate || null });
      if (f.budgetAmount !== "") payload.budgetAmount = Number(f.budgetAmount);
    }
    onSubmit?.(payload);
  };
  const type = EXTERNAL_TICKET_TYPES.find((t) => t.value === f.type);

  return (
    <FormDialog
      open={open}
      title="New support request"
      description="Expresso replies here, and you'll see each update on the request."
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      canSubmit={Boolean(f.title.trim()) && Boolean(f.description.trim())}
      submitLabel="Send request"
      submitIcon={Send}
    >
      <fieldset className="px-form-section">
        <legend>Request</legend>
        <SelectField label="Kind of request" value={f.type} onChange={set("type")} options={EXTERNAL_TICKET_TYPES} />
        {type?.hint ? <p className="px-muted" style={{ margin: "-4px 0 0", fontSize: 13 }}>{type.hint}</p> : null}
        <TextField label="Subject" required value={f.title} onChange={set("title")} maxLength={200} />
        <TextField label="Details" required multiline rows={5} value={f.description} onChange={set("description")} hint="What happened, where, and what you expected." />
        <div className="px-form-grid px-form-grid--3">
          <SelectField label="Area" value={f.category} onChange={set("category")} options={CATEGORY_OPTIONS.filter((o) => o.value)} />
          <SelectField label="Priority" value={f.priority} onChange={set("priority")} options={Object.entries(TICKET_PRIORITY_LABEL).map(([value, label]) => ({ value, label }))} />
          <TextField label="Needed by" type="date" value={f.dueDate} onChange={set("dueDate")} />
        </div>
      </fieldset>
      {f.type === "procurement" ? (
        <fieldset className="px-form-section">
          <legend>Procurement details</legend>
          <div className="px-form-grid px-form-grid--2">
            <TextField label="Preferred vendor" value={f.vendor} onChange={set("vendor")} placeholder="Optional" />
            <TextField label="Vendor contact" value={f.vendorContact} onChange={set("vendorContact")} placeholder="Optional" />
            <TextField label="Budget" type="number" min="0" inputMode="decimal" value={f.budgetAmount} onChange={set("budgetAmount")} />
            <TextField label="Currency" value={f.currency} onChange={set("currency")} />
            <TextField label="Your PO reference" value={f.purchaseOrderRef} onChange={set("purchaseOrderRef")} placeholder="Optional" />
            <TextField label="Delivery needed by" type="date" value={f.deliveryDate} onChange={set("deliveryDate")} />
          </div>
        </fieldset>
      ) : null}
    </FormDialog>
  );
}
