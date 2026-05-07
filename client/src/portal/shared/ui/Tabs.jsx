import React from "react";

export default function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div
      className={[
        "flex items-center gap-1 overflow-x-auto pb-1",
        className,
      ].join(" ")}
    >
      {tabs.map((tab) => {
        const active = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={[
              "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
            ].join(" ")}
          >
            {tab.label}

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
