import React from "react";
import { Headphones, RefreshCw, Lock, ShoppingCart } from "lucide-react";

const TYPE_MAP = {
  support:        { label: "Support",        Icon: Headphones,   cls: "border-blue-200 bg-blue-50 text-blue-800" },
  change_request: { label: "Change Request", Icon: RefreshCw,    cls: "border-violet-200 bg-violet-50 text-violet-800" },
  internal:       { label: "Internal",       Icon: Lock,         cls: "border-amber-200 bg-amber-50 text-amber-800" },
  procurement:    { label: "Procurement",    Icon: ShoppingCart, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
};

export default function TicketTypeBadge({ type, showIcon = true }) {
  const t = String(type || "support").toLowerCase();
  const { label, Icon, cls } = TYPE_MAP[t] || TYPE_MAP.support;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold",
        cls,
      ].join(" ")}
    >
      {showIcon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}
