import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";

const today = () => new Date().toISOString().slice(0, 10);

// Log a KPI check-in (PUI-4): a measured value on a date.
export default function KpiCheckinDialog({ open, goal, busy, error, onClose, onSubmit }) {
  const [form, setForm] = useState({ value: "", notes: "", date: today() });
  useEffect(() => {
    if (open) setForm({ value: "", notes: "", date: today() });
  }, [open]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ind = goal?.indicatorId || {};

  return (
    <FormDialog
      open={open}
      title="Log a check-in"
      description={ind.name ? `${ind.name}: target ${goal.targetValue}${ind.unit ? ` ${ind.unit}` : ""} for ${goal.period}.` : ""}
      onClose={onClose}
      onSubmit={() => onSubmit?.({ goalId: goal._id, value: Number(form.value), notes: form.notes, date: form.date })}
      busy={busy}
      error={error}
      canSubmit={form.value !== "" && !Number.isNaN(Number(form.value)) && Boolean(form.date)}
      submitLabel="Log check-in"
      submitIcon={Plus}
    >
      <fieldset className="px-form-section">
        <legend>Measurement</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label={`Value${ind.unit ? ` (${ind.unit})` : ""}`} type="number" step="any" required value={form.value} onChange={set("value")} />
          <TextField label="Date" type="date" required value={form.date} onChange={set("date")} />
        </div>
        <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
