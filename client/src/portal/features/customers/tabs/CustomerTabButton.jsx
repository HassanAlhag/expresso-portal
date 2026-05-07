import React from "react";

export default function CustomerTabButton({ active, Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "portal-chip inline-flex items-center gap-2",
        active
          ? "border-[rgba(111,127,217,0.35)] bg-[rgba(111,127,217,0.10)]"
          : "hover:bg-black/[0.03]",
      ].join(" ")}
    >
      {Icon ? <Icon size={16} className="text-slate-700" /> : null}
      <span className="text-sm font-black text-slate-900">{children}</span>
    </button>
  );
}
