import React from "react";

const TONE_MAP = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function Pill({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
        TONE_MAP[tone] || TONE_MAP.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
