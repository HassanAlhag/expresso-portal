import React from "react";
import { Search, X } from "lucide-react";

export default function ProductionToolbar({
  q,
  setQ,
  type,
  setType,
  status,
  setStatus,
  websiteOnly,
  setWebsiteOnly,
  onClear,
  typeOptions = [],
  statusOptions = [],
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-9">
        <Search size={14} className="flex-shrink-0 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ?.(e.target.value)}
          placeholder="Search production..."
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <select
        value={type}
        onChange={(e) => setType?.(e.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      >
        {typeOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => setStatus?.(e.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      >
        {statusOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setWebsiteOnly?.(!websiteOnly)}
        className={[
          "h-9 rounded-lg border px-3 text-sm font-semibold transition",
          websiteOnly
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        ].join(" ")}
      >
        Website only
      </button>

      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 transition hover:bg-slate-50"
      >
        <X size={14} />
        Clear
      </button>
    </div>
  );
}
