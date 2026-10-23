import React, { useEffect, useState } from "react";
import { Pencil, Target } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { idOf } from "../format";
import { KPI_DEPARTMENT_OPTIONS, KPI_PERIOD_TYPES, KPI_SCOPES, options, periodHint } from "./kpiFormat";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const blank = () => ({ indicatorId: "", scope: "individual", staffId: "", teamId: "", department: "", period: currentMonth(), periodType: "monthly", targetValue: "", notes: "" });

// KPI goal form (PUI-4), used by the KPI goals page and a staff record's KPI
// tab. With `staffId` set the goal is an individual goal for that person.
export default function KpiGoalFormDialog({ open, initial, indicators = [], staff = [], staffId, busy, error, onClose, onSubmit }) {
  const [form, setForm] = useState(blank);
  const fixed = Boolean(staffId);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            indicatorId: idOf(initial.indicatorId),
            scope: initial.scope || "individual",
            staffId: idOf(initial.staffId),
            teamId: initial.teamId || "",
            department: initial.department || "",
            period: initial.period || currentMonth(),
            periodType: initial.periodType || "monthly",
            targetValue: initial.targetValue ?? "",
            notes: initial.notes || "",
          }
        : { ...blank(), staffId: staffId || "" }
    );
  }, [open, initial, staffId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const submit = () => {
    const payload = { ...form, targetValue: Number(form.targetValue) };
    if (fixed) {
      payload.scope = "individual";
      payload.staffId = staffId;
    }
    if (payload.scope !== "individual") delete payload.staffId;
    if (payload.scope !== "team") delete payload.teamId;
    if (payload.scope !== "department") delete payload.department;
    onSubmit?.(payload);
  };

  const scopeReady =
    form.scope === "individual" ? fixed || Boolean(form.staffId) : form.scope === "department" ? Boolean(form.department) : true;
  const canSubmit = Boolean(form.indicatorId) && Boolean(String(form.period).trim()) && form.targetValue !== "" && Number(form.targetValue) >= 0 && scopeReady;
  const indicatorOptions = [{ value: "", label: "Choose an indicator" }, ...indicators.map((i) => ({ value: i._id, label: `${i.name}${i.unit ? ` (${i.unit})` : ""}` }))];

  return (
    <FormDialog
      open={open}
      title={initial ? "Edit KPI goal" : fixed ? "Assign a KPI goal" : "New KPI goal"}
      description="Progress is worked out from the check-ins logged against the target."
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      canSubmit={canSubmit}
      submitLabel={initial ? "Save changes" : fixed ? "Assign goal" : "Create goal"}
      submitIcon={initial ? Pencil : Target}
    >
      <fieldset className="px-form-section">
        <legend>What is measured</legend>
        <SelectField label="Indicator" required value={form.indicatorId} onChange={set("indicatorId")} options={indicatorOptions} />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Target value" type="number" min="0" step="any" required value={String(form.targetValue)} onChange={set("targetValue")} />
          <SelectField label="Period type" value={form.periodType} onChange={set("periodType")} options={options(KPI_PERIOD_TYPES)} />
        </div>
        <TextField label="Period" required value={form.period} onChange={set("period")} hint={periodHint(form.periodType)} />
      </fieldset>
      {fixed ? null : (
        <fieldset className="px-form-section">
          <legend>Who it's for</legend>
          <SelectField label="Scope" value={form.scope} onChange={set("scope")} options={options(KPI_SCOPES)} />
          {form.scope === "individual" ? (
            <SelectField label="Staff member" required value={form.staffId} onChange={set("staffId")} options={[{ value: "", label: "Choose a person" }, ...staff.map((s) => ({ value: s._id, label: `${s.fullName}${s.department ? ` (${s.department})` : ""}` }))]} />
          ) : null}
          {form.scope === "team" ? <TextField label="Team name" value={form.teamId} onChange={set("teamId")} placeholder="For example Frontend team" /> : null}
          {form.scope === "department" ? <SelectField label="Department" required value={form.department} onChange={set("department")} options={[{ value: "", label: "Choose a department" }, ...KPI_DEPARTMENT_OPTIONS]} /> : null}
        </fieldset>
      )}
      <fieldset className="px-form-section">
        <legend>Notes</legend>
        <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
