import React from "react";
import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  return (
    <div
      className={[
        "flex h-9 min-w-[160px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3",
        className,
      ].join(" ")}
    >
      <Search size={14} className="flex-shrink-0 text-slate-400" />

      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
