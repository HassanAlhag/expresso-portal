import React, { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import { DEAL_FORM_STAGE_OPTIONS } from "../constants";

const dateOnly = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

// Deal form (PUI-3). Same fields and payload as before.
export default function DealFormModal({ open, mode = "create", initial = null, busy = false, onClose, onSubmit }) {
  const [f, setF] = useState({});

  useEffect(() => {
    if (!open) return;
    setF({
      title: initial?.title || "",
      stage: initial?.stage === "new" ? "discovery" : initial?.stage || "discovery",
      value: initial?.value === null || initial?.value === undefined ? "" : String(initial.value),
      currency: initial?.currency || "AED",
      probability: initial?.probability === null || initial?.probability === undefined ? "0" : String(initial.probability),
      expectedCloseDate: dateOnly(initial?.expectedCloseDate),
      source: initial?.source || "",
      notes: initial?.notes || "",
    });
  }, [open, initial]);

  if (!open) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const isEdit = mode === "edit";
  const prob = Number(f.probability);
  const probOk = f.probability === "" || (prob >= 0 && prob <= 100);

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit deal" : "New deal"}
      description="A commercial opportunity that moves through the sales stages."
      onClose={onClose}
      busy={busy}
      canSubmit={String(f.title || "").trim().length >= 2 && probOk}
      submitLabel={isEdit ? "Save changes" : "Create deal"}
      submitIcon={isEdit ? Pencil : Plus}
      onSubmit={() =>
        onSubmit?.({
          title: f.title.trim(),
          stage: f.stage,
          value: f.value === "" ? null : Number(f.value),
          currency: f.currency.trim() || "AED",
          probability: f.probability === "" ? 0 : Number(f.probability),
          expectedCloseDate: f.expectedCloseDate || null,
          source: f.source.trim(),
          notes: f.notes.trim(),
        })
      }
    >
      <fieldset className="px-form-section">
        <legend>Deal</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Deal title" required value={f.title || ""} onChange={set("title")} placeholder="Website redesign for ABC" />
          <SelectField label="Stage" value={f.stage || "discovery"} onChange={set("stage")} options={DEAL_FORM_STAGE_OPTIONS} />
        </div>
        <div className="px-form-grid px-form-grid--4">
          <TextField label="Value" inputMode="decimal" value={f.value || ""} onChange={set("value")} />
          <TextField label="Currency" value={f.currency || ""} onChange={set("currency")} />
          <TextField
            label="Probability (%)"
            inputMode="numeric"
            value={f.probability ?? ""}
            onChange={set("probability")}
            hint={probOk ? "0 to 100." : "Enter a number from 0 to 100."}
            aria-invalid={!probOk || undefined}
          />
          <TextField label="Expected close" type="date" value={f.expectedCloseDate || ""} onChange={set("expectedCloseDate")} />
        </div>
        <TextField label="Source" value={f.source || ""} onChange={set("source")} />
        <TextField label="Notes" multiline rows={3} value={f.notes || ""} onChange={set("notes")} hint="Internal. CRM is staff only." />
      </fieldset>
    </FormDialog>
  );
}
