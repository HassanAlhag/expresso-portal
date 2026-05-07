import React from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";

export default function MediaFilters({
  q,
  setQ,
  type,
  setType,
  status,
  setStatus,
  category,
  setCategory,
  total,
  onClear,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-12 items-end">
        <div className="lg:col-span-5">
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="title, tags, category…"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
            >
              <option value="">All</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <div className="lg:col-span-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <div className="lg:col-span-3">
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Branding"
          />
        </div>

        <div className="lg:col-span-12 flex items-center gap-2 pt-1">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>

          <div className="ml-auto text-xs font-semibold text-slate-500">
            Total: <span className="font-extrabold">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
