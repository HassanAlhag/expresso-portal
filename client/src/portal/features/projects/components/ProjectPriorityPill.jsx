import React from "react";

function toneForPriority(priority) {
  if (priority === "urgent") return "border-rose-200 bg-rose-50 text-rose-800";
  if (priority === "high")
    return "border-orange-200 bg-orange-50 text-orange-800";
  if (priority === "medium")
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ProjectPriorityPill({ priority }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        toneForPriority(priority),
      ].join(" ")}
    >
      {String(priority || "medium").toUpperCase()}
    </span>
  );
}
