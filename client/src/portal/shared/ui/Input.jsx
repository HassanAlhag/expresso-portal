import React from "react";

// Wraps in a label so clicking the label text focuses the input.
// When no label/prefix/suffix/error is needed, renders identically
// to a plain <input> from the outside — all HTML input props pass through.

export default function Input({
  label,
  prefix,
  suffix,
  error,
  className = "",
  ...props
}) {
  const padLeft  = prefix ? "pl-9"  : "pl-4";
  const padRight = suffix ? "pr-9"  : "pr-4";

  const inputCls = [
    "h-11 w-full rounded-xl border bg-white text-sm shadow-sm outline-none transition",
    "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60",
    padLeft,
    padRight,
    error
      ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100",
    className,
  ].join(" ");

  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
          {label}
        </span>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 flex items-center">
            {prefix}
          </span>
        )}

        <input className={inputCls} {...props} />

        {suffix && (
          <span className="absolute right-3 flex items-center">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <span className="text-xs font-semibold text-rose-500">{error}</span>
      )}
    </label>
  );
}
