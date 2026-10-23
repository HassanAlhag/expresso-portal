import React, { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Pencil } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { readPortalUser } from "../../../shared/hooks/useAccess";
import { HR_DEPARTMENT_OPTIONS, LEAVE_TYPE_OPTIONS } from "../constants/hr.constants";
import { daysBetween } from "../format";

const today = () => new Date().toISOString().slice(0, 10);
const toInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const empty = () => ({
  staffName: readPortalUser().fullName || "",
  department: "marketing",
  leaveType: "annual",
  startDate: today(),
  endDate: today(),
  reason: "",
  notes: "",
});

// Only the form's own fields are sent; a loaded request also carries populated
// references the API would read as invalid ids and clear.
const FIELDS = Object.keys(empty());
const pickFields = (form) => Object.fromEntries(FIELDS.map((k) => [k, form[k]]));

// Leave request form (PUI-4): same fields as before, on the shared form
// dialog. Days are counted inclusively, as before.
export default function LeaveRequestFormModal({ open, initial, busy, error, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);
  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...empty(), ...initial, startDate: toInput(initial.startDate), endDate: toInput(initial.endDate) } : empty());
  }, [open, initial]);

  const days = useMemo(() => daysBetween(form.startDate, form.endDate), [form.startDate, form.endDate]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const datesValid = form.startDate && form.endDate && form.endDate >= form.startDate;

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit leave request" : "New leave request"}
      description={isEdit ? "Only submitted requests can be changed." : "The request is submitted for approval."}
      onClose={onClose}
      onSubmit={() => onSubmit?.({ ...pickFields(form), staffName: form.staffName.trim(), days })}
      busy={busy}
      error={error}
      canSubmit={form.staffName.trim().length >= 2 && Boolean(datesValid)}
      submitLabel={isEdit ? "Save changes" : "Submit request"}
      submitIcon={isEdit ? Pencil : CalendarPlus}
    >
      <fieldset className="px-form-section">
        <legend>Who and what</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Staff name" required value={form.staffName} onChange={set("staffName")} />
          <SelectField label="Department" value={form.department} onChange={set("department")} options={HR_DEPARTMENT_OPTIONS.filter((o) => o.value)} />
        </div>
        <SelectField label="Leave type" value={form.leaveType} onChange={set("leaveType")} options={LEAVE_TYPE_OPTIONS.filter((o) => o.value)} />
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Dates</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="First day" type="date" required value={form.startDate} onChange={set("startDate")} />
          <TextField
            label="Last day"
            type="date"
            required
            value={form.endDate}
            onChange={set("endDate")}
            hint={datesValid ? `${days} day${days === 1 ? "" : "s"}, counting both ends.` : "The last day can't be before the first."}
          />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Details</legend>
        <TextField label="Reason" multiline rows={3} value={form.reason} onChange={set("reason")} hint="Seen by HR and approvers." />
        <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
