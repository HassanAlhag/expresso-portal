import React from "react";
import {
  LayoutTemplate,
  ListChecks,
  Clock3,
  ShieldCheck,
  Paperclip,
  Eye,
} from "lucide-react";

export default function ServiceTemplateTabs({ value, onChange }) {
  const tabs = [
    { id: "overview", label: "Overview", Icon: LayoutTemplate },
    { id: "scope", label: "Scope", Icon: ListChecks },
    { id: "sla", label: "SLA", Icon: Clock3 },
    { id: "approvals", label: "Approvals", Icon: ShieldCheck },
    { id: "files", label: "Files", Icon: Paperclip },
    { id: "preview", label: "Preview", Icon: Eye },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.id;
        const Icon = t.Icon;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition",
              active
                ? "border-black/10 bg-black/[0.03] text-slate-900 shadow-sm"
                : "border-black/10 bg-white text-slate-700 hover:bg-black/[0.02]",
            ].join(" ")}
          >
            <Icon size={15} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
