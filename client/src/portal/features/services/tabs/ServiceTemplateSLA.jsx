// client/src/portal/features/services/components/ServiceTemplateSLA.jsx
import React from "react";
import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import { SLA_UNITS } from "../constants";

export default function ServiceTemplateSLA({ value, onChange }) {
  const v = value || {};

  return (
    <Card className="p-6">
      <div className="grid gap-4">
        <div className="text-sm font-extrabold text-slate-900">SLA</div>
        <div className="text-sm text-slate-600">
          These rules drive expectations for response time, revisions, delivery
          window, etc.
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="RESPONSE TIME"
            value={String(v.responseTime ?? 24)}
            onChange={(e) =>
              onChange({ ...v, responseTime: Number(e.target.value || 0) })
            }
            placeholder="24"
          />

          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              UNIT
            </span>
            <select
              value={v.responseUnit || "hours"}
              onChange={(e) => onChange({ ...v, responseUnit: e.target.value })}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
            >
              {SLA_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="DELIVERY DAYS"
            value={String(v.deliveryDays ?? 7)}
            onChange={(e) =>
              onChange({ ...v, deliveryDays: Number(e.target.value || 0) })
            }
            placeholder="7"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="REVISION ROUNDS"
            value={String(v.revisionRounds ?? 2)}
            onChange={(e) =>
              onChange({ ...v, revisionRounds: Number(e.target.value || 0) })
            }
            placeholder="2"
          />

          <Input
            label="SUPPORT WINDOW"
            value={v.supportWindow || "Mon–Fri, 9am–6pm"}
            onChange={(e) => onChange({ ...v, supportWindow: e.target.value })}
            placeholder="Mon–Fri, 9am–6pm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="wd"
            type="checkbox"
            checked={v.workingDaysOnly !== false}
            onChange={(e) =>
              onChange({ ...v, workingDaysOnly: e.target.checked })
            }
          />
          <label htmlFor="wd" className="text-sm font-semibold text-slate-700">
            Working days only
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
            NOTES
          </span>
          <textarea
            rows={4}
            value={v.notes || ""}
            onChange={(e) => onChange({ ...v, notes: e.target.value })}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
            placeholder="Anything special: emergency response, weekend handling, etc."
          />
        </label>
      </div>
    </Card>
  );
}
