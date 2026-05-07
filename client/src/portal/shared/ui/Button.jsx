import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant  = "primary",
  size     = "md",
  className = "",
  disabled,
  loading,
  type     = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100",
    ghost:   "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
    danger:  "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
  };

  const sizes = {
    sm: "h-8  px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        base,
        variants[variant] || variants.primary,
        sizes[size]       || sizes.md,
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
