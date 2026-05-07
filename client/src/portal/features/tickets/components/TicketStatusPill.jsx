import React from "react";

const STATUS_MAP = {
  open:           { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "#10b981" },
  in_progress:    { cls: "border-indigo-200 bg-indigo-50 text-indigo-800",   dot: "#6366f1" },
  waiting_client: { cls: "border-orange-200 bg-orange-50 text-orange-800",   dot: "#f97316" },
  waiting_vendor: { cls: "border-amber-200 bg-amber-50 text-amber-800",      dot: "#f59e0b" },
  in_review:      { cls: "border-violet-200 bg-violet-50 text-violet-800",   dot: "#8b5cf6" },
  escalated:      { cls: "border-rose-200 bg-rose-50 text-rose-800",         dot: "#f43f5e" },
  resolved:       { cls: "border-slate-200 bg-slate-50 text-slate-600",      dot: "#94a3b8" },
  closed:         { cls: "border-slate-200 bg-slate-50 text-slate-500",      dot: "#cbd5e1" },
};

export default function TicketStatusPill({ status, size = "sm" }) {
  const s = String(status || "").toLowerCase();
  const { cls, dot } = STATUS_MAP[s] || STATUS_MAP.closed;
  const label = s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-bold",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        cls,
      ].join(" ")}
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label || "—"}
    </span>
  );
}
