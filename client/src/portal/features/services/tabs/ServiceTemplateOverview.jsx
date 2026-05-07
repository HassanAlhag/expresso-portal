import React from "react";
import Input from "../../../shared/ui/Input";
import Card from "../../../shared/ui/Card";
import {
  BILLING_OPTIONS,
  STATUS_OPTIONS,
  EXECUTION_MODE_OPTIONS,
} from "../constants";

export default function ServiceTemplateOverview({ value, onChange }) {
  const v = value || {};

  return (
    <Card className="p-6">
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="NAME"
            value={v.name || ""}
            onChange={(e) => onChange({ ...v, name: e.target.value })}
            placeholder="e.g. Social Media Management"
          />
          <Input
            label="SLUG (optional)"
            value={v.slug || ""}
            onChange={(e) => onChange({ ...v, slug: e.target.value })}
            placeholder="social-media-management"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              STATUS
            </span>
            <select
              value={v.status || "draft"}
              onChange={(e) => onChange({ ...v, status: e.target.value })}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              BILLING
            </span>
            <select
              value={v.billingCycle || "monthly"}
              onChange={(e) => onChange({ ...v, billingCycle: e.target.value })}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              {BILLING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              EXECUTION MODE
            </span>
            <select
              value={v.executionMode || "recurring"}
              onChange={(e) =>
                onChange({ ...v, executionMode: e.target.value })
              }
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              {EXECUTION_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="PRICE (optional)"
            value={
              typeof v.price === "number" ? String(v.price) : v.price || ""
            }
            onChange={(e) =>
              onChange({
                ...v,
                price:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="e.g. 2500"
          />
        </div>

        <Input
          label="SUMMARY"
          value={v.summary || ""}
          onChange={(e) => onChange({ ...v, summary: e.target.value })}
          placeholder="Short text used in listings & plans…"
        />

        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
            DESCRIPTION
          </span>
          <textarea
            value={v.description || ""}
            onChange={(e) => onChange({ ...v, description: e.target.value })}
            rows={6}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            placeholder="Full description shown in proposals and customer portal…"
          />
        </label>
      </div>
    </Card>
  );
}
