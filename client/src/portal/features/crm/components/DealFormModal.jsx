import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { X, BriefcaseBusiness } from "lucide-react";
import { DEAL_FORM_STAGE_OPTIONS } from "../constants";

export default function DealFormModal({
  open,
  mode = "create",
  initial = null,
  busy = false,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("discovery");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [probability, setProbability] = useState("0");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(initial?.title || "");
    setStage(initial?.stage || "discovery");
    setValue(
      initial?.value === null || typeof initial?.value === "undefined"
        ? ""
        : String(initial.value)
    );
    setCurrency(initial?.currency || "AED");
    setProbability(
      initial?.probability === null ||
        typeof initial?.probability === "undefined"
        ? "0"
        : String(initial.probability)
    );
    setExpectedCloseDate(
      initial?.expectedCloseDate
        ? new Date(initial.expectedCloseDate).toISOString().slice(0, 10)
        : ""
    );
    setSource(initial?.source || "");
    setNotes(initial?.notes || "");
  }, [open, initial]);

  const canSubmit = useMemo(() => title.trim().length >= 2, [title]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onSubmit?.({
      title: title.trim(),
      stage,
      value: value === "" ? null : Number(value),
      currency: currency.trim() || "AED",
      probability: probability === "" ? 0 : Number(probability),
      expectedCloseDate: expectedCloseDate || null,
      source: source.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => onClose?.()}
    >
      <div
        className="w-[min(760px,96vw)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Card className="overflow-hidden p-0">
          <div className="flex items-start justify-between border-b border-black/10 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-slate-50">
                <BriefcaseBusiness size={20} className="text-slate-800" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {mode === "edit" ? "Edit deal" : "New deal"}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Capture commercial opportunity and move it through the
                  pipeline.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white hover:bg-black/[0.03]"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 bg-white p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Deal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Website redesign for ABC"
              />

              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  STAGE
                </span>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
                >
                  {DEAL_FORM_STAGE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Input
                label="Value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="50000"
              />

              <Input
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="AED"
              />

              <Input
                label="Probability %"
                type="number"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                placeholder="50"
              />

              <Input
                label="Expected close date"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>

            <Input
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Referral, website, outbound, client upsell..."
            />

            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                NOTES
              </span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                placeholder="Context, objections, scope, next step..."
              />
            </label>

            <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose?.()}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={busy || !canSubmit}>
                {busy
                  ? "Saving..."
                  : mode === "edit"
                  ? "Save changes"
                  : "Create deal"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
