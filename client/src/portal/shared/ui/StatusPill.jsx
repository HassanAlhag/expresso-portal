import React from "react";

const TONE_MAP = {
  success: {
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "#10b981",
  },
  info: {
    cls: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dot: "#6366f1",
  },
  warning: {
    cls: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "#f59e0b",
  },
  danger: {
    cls: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "#f43f5e",
  },
  neutral: {
    cls: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "#94a3b8",
  },
};

export default function StatusPill({
  children,
  tone = "neutral",
  dot = true,
  size = "sm",
  className = "",
}) {
  const item = TONE_MAP[tone] || TONE_MAP.neutral;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-bold",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        item.cls,
        className,
      ].join(" ")}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: item.dot }}
        />
      ) : null}

      {children || "—"}
    </span>
  );
}
