import React from "react";

const COLOR_MAP = {
  emerald: "text-emerald-600 bg-emerald-50",
  indigo: "text-indigo-600 bg-indigo-50",
  rose: "text-rose-600 bg-rose-50",
  amber: "text-amber-600 bg-amber-50",
  violet: "text-violet-600 bg-violet-50",
  blue: "text-blue-600 bg-blue-50",
  slate: "text-slate-500 bg-slate-100",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "slate",
  className = "",
}) {
  const colorCls = COLOR_MAP[color] || COLOR_MAP.slate;

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3",
        className,
      ].join(" ")}
    >
      {Icon ? (
        <div
          className={[
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            colorCls,
          ].join(" ")}
        >
          <Icon size={15} />
        </div>
      ) : null}

      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-black leading-tight text-slate-900">
          {value ?? "—"}
        </div>
        {sub ? (
          <div className="mt-0.5 text-[10px] text-slate-400">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}
