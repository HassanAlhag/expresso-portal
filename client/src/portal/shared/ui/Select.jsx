import React from "react";

export default function Select({
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
  error,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={[
        "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        error
          ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100",
        className,
      ].join(" ")}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}

      {options.map((option) => (
        <option key={option.value ?? option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
