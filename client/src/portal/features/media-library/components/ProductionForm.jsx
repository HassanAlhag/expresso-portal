import React from "react";
import Input from "../../../shared/ui/Input";
import Button from "../../../shared/ui/Button";

export default function ProductionForm({
  value,
  onChange,
  onSubmit,
  busy,
  onOpenMedia,
}) {
  const set = (key, val) => onChange?.({ ...value, [key]: val });

  return (
    <div className="grid gap-4">
      <Input
        label="Production title"
        value={value.title || ""}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Campaign launch assets"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Client"
          value={value.customerName || ""}
          onChange={(e) => set("customerName", e.target.value)}
          placeholder="Client name"
        />

        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
            Status
          </span>
          <select
            value={value.status || "draft"}
            onChange={(e) => set("status", e.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In progress</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
      </div>

      <textarea
        rows={5}
        value={value.notes || ""}
        onChange={(e) => set("notes", e.target.value)}
        placeholder="Production notes..."
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onOpenMedia}>
          Attach media
        </Button>
        <Button onClick={onSubmit} disabled={busy}>
          Save production
        </Button>
      </div>
    </div>
  );
}
