import React from "react";
import { LayoutGrid, LayoutList } from "lucide-react";

export default function ViewToggle({
  value = "list",
  onChange,
  options = [
    { value: "list", icon: LayoutList, label: "List view" },
    { value: "board", icon: LayoutGrid, label: "Board view" },
  ],
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            className={[
              "flex h-7 w-7 items-center justify-center rounded transition",
              active
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
            title={option.label}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
