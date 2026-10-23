import React, { useEffect, useState } from "react";
import { Pencil, ReceiptText } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { readPortalUser } from "../../../shared/hooks/useAccess";
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_DEPARTMENT_OPTIONS } from "../constants/hr.constants";

const empty = () => ({
  title: "",
  staffName: readPortalUser().fullName || "",
  department: "marketing",
  category: "other",
  amount: "",
  currency: "AED",
  expenseDate: new Date().toISOString().slice(0, 10),
  claimMonth: new Date().toISOString().slice(0, 7),
  description: "",
  receiptUrl: "",
  notes: "",
});

// Only the form's own fields are sent. A loaded claim also carries populated
// references (staffUserId, approvedBy...) that the API would read as invalid
// ids and clear, which would detach the claim from its owner.
const FIELDS = Object.keys(empty());
const pickFields = (form) => Object.fromEntries(FIELDS.map((k) => [k, form[k]]));

// Expense claim form (PUI-4): same fields as before, on the shared form dialog.
export default function ExpenseClaimFormModal({ open, initial, busy, error, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);
  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            ...empty(),
            ...initial,
            expenseDate: initial.expenseDate ? new Date(initial.expenseDate).toISOString().slice(0, 10) : empty().expenseDate,
            amount: initial.amount ?? "",
          }
        : empty()
    );
  }, [open, initial]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit expense claim" : "New expense claim"}
      description={isEdit ? "Claims can't be changed once registered or paid." : "The claim is submitted for approval."}
      onClose={onClose}
      onSubmit={() => onSubmit?.({ ...pickFields(form), title: form.title.trim(), staffName: form.staffName.trim(), amount: Number(form.amount || 0) })}
      busy={busy}
      error={error}
      canSubmit={form.title.trim().length >= 3 && form.staffName.trim().length >= 2 && Number(form.amount || 0) > 0}
      submitLabel={isEdit ? "Save changes" : "Submit claim"}
      submitIcon={isEdit ? Pencil : ReceiptText}
    >
      <fieldset className="px-form-section">
        <legend>Claim</legend>
        <TextField label="What was it for" required value={form.title} onChange={set("title")} hint="At least 3 characters." />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Staff name" required value={form.staffName} onChange={set("staffName")} />
          <SelectField label="Department" value={form.department} onChange={set("department")} options={EXPENSE_DEPARTMENT_OPTIONS.filter((o) => o.value)} />
          <SelectField label="Category" value={form.category} onChange={set("category")} options={EXPENSE_CATEGORY_OPTIONS.filter((o) => o.value)} />
          <TextField label="Expense date" type="date" value={form.expenseDate} onChange={set("expenseDate")} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Amount</legend>
        <div className="px-form-grid px-form-grid--3">
          <TextField label="Amount" type="number" min="0" inputMode="decimal" required value={String(form.amount)} onChange={set("amount")} />
          <TextField label="Currency" value={form.currency} onChange={set("currency")} />
          <TextField label="Claim month" type="month" value={form.claimMonth} onChange={set("claimMonth")} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Details</legend>
        <TextField label="Description" multiline rows={3} value={form.description} onChange={set("description")} />
        <TextField label="Receipt link" value={form.receiptUrl} onChange={set("receiptUrl")} placeholder="Optional" />
        <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} hint="Seen by HR, approvers and the person claiming." />
      </fieldset>
    </FormDialog>
  );
}
