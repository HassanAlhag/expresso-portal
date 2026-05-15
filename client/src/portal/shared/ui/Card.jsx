import React from "react";

// ── Card shell ────────────────────────────────────────────────────────────────

export default function Card({ children, className = "", as: Tag = "div" }) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────

export function CardHeader({ title, subtitle, right, className = "" }) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {title && typeof title === "string" ? (
          <h2 className="text-[13px] font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
        ) : title ? (
          title
        ) : null}
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

// ── CardBody ──────────────────────────────────────────────────────────────────

export function CardBody({ children, className = "" }) {
  return (
    <div className={["px-5 py-4", className].join(" ")}>
      {children}
    </div>
  );
}
