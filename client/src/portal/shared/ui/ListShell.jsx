import React from "react";

export default function ListShell({
  title,
  subtitle,
  right,
  filters,
  children,
}) {
  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-3xl font-black tracking-tight text-slate-900">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">{right}</div>
      </div>

      {filters ? (
        <div className="portal-surface-soft p-4">{filters}</div>
      ) : null}

      <div className="portal-surface p-0 overflow-hidden">{children}</div>
    </div>
  );
}
