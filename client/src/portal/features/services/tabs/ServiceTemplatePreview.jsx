import React from "react";
import Card from "../../../shared/ui/Card";
import ServiceStatusPill from "../components/ServiceStatusPill";

function money(x) {
  if (typeof x !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(x);
  } catch {
    return String(x);
  }
}

export default function ServiceTemplatePreview({ value }) {
  const v = value || {};

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="text-sm font-extrabold text-slate-900">
          Proposal / scope preview
        </div>
        <div className="mt-1 text-sm text-slate-600">
          This is the clean version of the template you can later reuse in
          sales, project scope, and customer-facing summaries.
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 portal-glass p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ServiceStatusPill status={v.status} />
            <span className="text-xs text-slate-500">/{v.slug || "—"}</span>
          </div>

          <div className="mt-3 text-2xl font-black text-slate-900">
            {v.name || "Untitled service"}
          </div>

          <div className="mt-2 text-sm text-slate-600">
            {v.summary || "No summary yet."}
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 bg-white/80 p-4">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              DESCRIPTION
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {v.description || "No description yet."}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid gap-3">
          <div className="portal-glass-soft p-5">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              PRICE
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {money(v.price)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {v.billingCycle ? `per ${v.billingCycle}` : "billing not set"}
            </div>
          </div>

          <div className="portal-glass-soft p-5">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              DELIVERY MODEL
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {Array.isArray(v.deliverables) ? v.deliverables.length : 0}{" "}
              deliverable
              {Array.isArray(v.deliverables) && v.deliverables.length === 1
                ? ""
                : "s"}
            </div>
          </div>

          <div className="portal-glass-soft p-5">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              APPROVAL
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {v.approvals?.required === false ? "Optional" : "Required"}
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-sm font-extrabold text-slate-900">
          Deliverables
        </div>

        {!Array.isArray(v.deliverables) || v.deliverables.length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">
            No deliverables yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {v.deliverables.map((d, index) => (
              <div
                key={d.id || `${d.title}-${index}`}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="text-sm font-black text-slate-900">
                  {d.title || "Untitled deliverable"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {d.qty ?? d.quantity ?? 1} {d.unit || "item"} • due in{" "}
                  {d.dueDays ?? 0} days
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {d.description || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="text-sm font-extrabold text-slate-900">
          SLA snapshot
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              RESPONSE
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {v.sla?.responseTime ?? 24} {v.sla?.responseUnit || "hours"}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              DELIVERY
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {v.sla?.deliveryDays ?? 7} days
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
              REVISIONS
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {v.sla?.revisionRounds ?? 2}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
