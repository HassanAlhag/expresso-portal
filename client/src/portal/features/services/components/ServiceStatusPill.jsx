// client/src/portal/features/services/components/ServiceStatusPill.jsx
import React from "react";

const MAP = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  draft: "border-orange-200 bg-orange-50 text-orange-800",
  archived: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function ServiceStatusPill({ status }) {
  const s = String(status || "draft");
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        MAP[s] || MAP.draft,
      ].join(" ")}
    >
      {s.toUpperCase()}
    </span>
  );
}
