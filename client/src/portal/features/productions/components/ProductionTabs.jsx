import React from "react";

export default function ProductionTabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const value = tab.value || tab.key;
        const label = tab.label;
        const active = activeTab === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange?.(value)}
            className={[
              "flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
            ].join(" ")}
          >
            {label}
            {typeof tab.count !== "undefined" ? (
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs font-black",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
