import React from "react";

export default function SegmentTabs({
  tabs = [],
  value,
  onChange,
  getCount,
  className = "",
}) {
  return (
    <div
      className={[
        "flex items-center gap-1 overflow-x-auto pb-1",
        className,
      ].join(" ")}
    >
      {tabs.map((tab) => {
        const tabValue = tab.value ?? tab.key ?? "";
        const label = tab.label;
        const active = value === tabValue;
        const count =
          typeof tab.count !== "undefined"
            ? tab.count
            : typeof getCount === "function"
            ? getCount(tabValue)
            : undefined;

        return (
          <button
            key={tabValue || label}
            type="button"
            onClick={() => onChange?.(tabValue)}
            className={[
              "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
            ].join(" ")}
          >
            {label}

            {typeof count !== "undefined" ? (
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs font-black",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
