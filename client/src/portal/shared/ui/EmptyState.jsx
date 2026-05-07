import React from "react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title = "No data found",
  message = "There is nothing to show here yet.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={[
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center",
        className,
      ].join(" ")}
    >
      {Icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
          <Icon size={24} />
        </div>
      ) : null}

      <h3 className="text-lg font-black text-slate-900">{title}</h3>

      {message ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {message}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
