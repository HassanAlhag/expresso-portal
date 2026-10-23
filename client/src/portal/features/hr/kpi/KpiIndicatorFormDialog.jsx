import React, { useEffect, useState } from "react";
import { Activity, Pencil } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { KPI_AUTO_SOURCES, KPI_CATEGORIES, KPI_DIRECTIONS, KPI_FREQUENCIES, options } from "./kpiFormat";

const BLANK = { name: "", description: "", category: "performance", unit: "count", direction: "higher_is_better", frequency: "monthly", autoSource: "none", isActive: true, order: 0 };

// KPI indicator form (PUI-4): the same fields as before.
export default function KpiIndicatorFormDialog({ open, initial, busy, error, onClose, onSubmit }) {
  const [form, setForm] = useState(BLANK);
  useEffect(() => {
    if (open) setForm(initial ? Object.fromEntries(Object.keys(BLANK).map((k) => [k, initial[k] ?? BLANK[k]])) : BLANK);
  }, [open, initial]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  return (
    <FormDialog
      open={open}
      title={initial ? "Edit indicator" : "New indicator"}
      description="An indicator is what gets measured. Goals set a target on it."
      onClose={onClose}
      onSubmit={() => onSubmit?.({ ...form, name: form.name.trim(), order: Number(form.order) || 0, isActive: form.isActive === true || form.isActive === "true" })}
      busy={busy}
      error={error}
      canSubmit={Boolean(form.name.trim())}
      submitLabel={initial ? "Save changes" : "Create indicator"}
      submitIcon={initial ? Pencil : Activity}
    >
      <fieldset className="px-form-section">
        <legend>Indicator</legend>
        <TextField label="Name" required value={form.name} onChange={set("name")} placeholder="For example Monthly sales calls" />
        <TextField label="Description" value={form.description} onChange={set("description")} placeholder="What it measures" />
        <div className="px-form-grid px-form-grid--2">
          <SelectField label="Category" value={form.category} onChange={set("category")} options={options(KPI_CATEGORIES)} />
          <TextField label="Unit" value={form.unit} onChange={set("unit")} placeholder="count, %, AED, hours" />
          <SelectField label="Direction" value={form.direction} onChange={set("direction")} options={KPI_DIRECTIONS} />
          <SelectField label="Frequency" value={form.frequency} onChange={set("frequency")} options={options(KPI_FREQUENCIES)} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Source and order</legend>
        <SelectField label="Synced from" value={form.autoSource} onChange={set("autoSource")} options={KPI_AUTO_SOURCES} />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Sort order" type="number" value={String(form.order)} onChange={set("order")} />
          <SelectField label="Status" value={String(form.isActive)} onChange={set("isActive")} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
        </div>
      </fieldset>
    </FormDialog>
  );
}
