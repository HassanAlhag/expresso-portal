import React, { useMemo } from "react";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import {
  CalendarDays,
  ReceiptText,
  Wallet,
  CheckCircle2,
  Clock,
} from "lucide-react";

function money(value, currency = "AED") {
  return `${currency} ${Number(value || 0).toLocaleString("en-AE", {
    maximumFractionDigits: 2,
  })}`;
}

function SummaryBox({ icon: Icon, label, value, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{value}</div>
        </div>

        <Badge tone={tone}>
          <Icon size={13} />
        </Badge>
      </div>
    </div>
  );
}

export default function MonthlyExpenseSummary({
  month,
  total = 0,
  count = 0,
  paid = 0,
  unpaid = 0,
  currency = "AED",
  categoryRows = [],
  staffRows = [],
}) {
  const maxCategory = useMemo(() => {
    return Math.max(...categoryRows.map((x) => Number(x.total || 0)), 1);
  }, [categoryRows]);

  const maxStaff = useMemo(() => {
    return Math.max(...staffRows.map((x) => Number(x.total || 0)), 1);
  }, [staffRows]);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900">
              Monthly Expense Summary
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Registered expenses for {month || "selected month"}.
            </div>
          </div>

          <Badge tone="info">
            <CalendarDays size={13} />
            {month || "—"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryBox
            icon={Wallet}
            label="Total"
            value={money(total, currency)}
            tone="success"
          />

          <SummaryBox
            icon={ReceiptText}
            label="Claims"
            value={count}
            tone="info"
          />

          <SummaryBox
            icon={CheckCircle2}
            label="Paid"
            value={money(paid, currency)}
            tone="success"
          />

          <SummaryBox
            icon={Clock}
            label="Unpaid"
            value={money(unpaid, currency)}
            tone="warning"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-black text-slate-900">By Category</div>

            <div className="mt-4 grid gap-3">
              {categoryRows.length ? (
                categoryRows.map((row) => {
                  const width = Math.round(
                    (Number(row.total || 0) / maxCategory) * 100
                  );

                  return (
                    <div key={row.category || row._id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold capitalize text-slate-600">
                          {String(
                            row.category || row._id || "other"
                          ).replaceAll("_", " ")}
                        </div>
                        <div className="text-xs font-black text-slate-900">
                          {money(row.total, currency)}
                        </div>
                      </div>

                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[var(--brand)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No category breakdown available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-black text-slate-900">By Staff</div>

            <div className="mt-4 grid gap-3">
              {staffRows.length ? (
                staffRows.map((row) => {
                  const width = Math.round(
                    (Number(row.total || 0) / maxStaff) * 100
                  );

                  return (
                    <div key={row.staffName || row._id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-600">
                          {row.staffName || row._id || "Unassigned"}
                        </div>
                        <div className="text-xs font-black text-slate-900">
                          {money(row.total, currency)}
                        </div>
                      </div>

                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[var(--brand)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No staff breakdown available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
