import React from "react";

function toneForStatus(status) {
  if (status === "active")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "planned")
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (status === "on_hold")
    return "border-orange-200 bg-orange-50 text-orange-800";
  if (status === "completed")
    return "border-slate-200 bg-slate-50 text-slate-700";
  if (status === "archived" || status === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ProjectStatusPill({ status }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        toneForStatus(status),
      ].join(" ")}
    >
      {String(status || "draft")
        .replaceAll("_", " ")
        .toUpperCase()}
    </span>
  );
}
