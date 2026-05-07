import React from "react";

const TONE_MAP = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function Badge({
  children,
  tone = "neutral",
  className = "",
  size = "sm",
}) {
  const sizeClass =
    size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-bold capitalize",
        sizeClass,
        TONE_MAP[tone] || TONE_MAP.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
