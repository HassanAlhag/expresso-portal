import React from "react";
import SearchInput from "./SearchInput";

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onClear,
  right,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3",
        className,
      ].join(" ")}
    >
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange?.(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          {(filter.options || []).map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 transition hover:bg-slate-50"
        >
          Clear
        </button>
      ) : null}

      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  );
}
