import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Button from "../../../shared/ui/Button";
import { listInvoices } from "../../billing/api";
import { Wallet, ArrowRight, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

const STATUS_META = {
  paid:    { cls: "bg-emerald-50 text-emerald-700",  icon: CheckCircle2 },
  sent:    { cls: "bg-indigo-50 text-indigo-700",    icon: Clock },
  draft:   { cls: "bg-slate-100 text-slate-600",     icon: Clock },
  overdue: { cls: "bg-rose-50 text-rose-700",        icon: AlertTriangle },
  void:    { cls: "bg-slate-100 text-slate-400",     icon: XCircle },
};

function fmtMoney(amount, currency = "AED") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-AE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function ProjectBillingTab({ projectId, customerId }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 50, page: 1 };
      if (projectId) params.projectId = projectId;
      else if (customerId) params.customerId = customerId;
      const res = await listInvoices(params);
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, [projectId, customerId]);

  useEffect(() => { load(); }, [load]);

  const total = items.reduce((s, i) => s + (i.amount || i.total || 0), 0);
  const paid = items.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || i.total || 0), 0);
  const outstanding = items.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + (i.amount || i.total || 0), 0);

  return (
    <div className="grid gap-4">
      {/* Summary strip */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total invoiced", value: fmtMoney(total), cls: "text-slate-900" },
            { label: "Collected",      value: fmtMoney(paid),  cls: "text-emerald-700" },
            { label: "Outstanding",    value: fmtMoney(outstanding), cls: "text-rose-600" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-[20px] border border-black/[0.07] bg-white p-4 shadow-sm">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
              <div className={`mt-1.5 text-xl font-black ${cls}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="text-sm font-black text-slate-900">Invoices</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button onClick={() => nav("/portal/billing")}>
              <Wallet size={13} /> View all billing
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-2 p-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="p-4 text-sm font-semibold text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No invoices for this project"
            message="Invoices linked to this project will appear here."
            actionLabel="Go to billing"
            onAction={() => nav("/portal/billing")}
          />
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {items.map((inv) => {
              const meta = STATUS_META[inv.status] || STATUS_META.draft;
              const Icon = meta.icon;
              return (
                <button
                  key={inv._id}
                  type="button"
                  onClick={() => nav(`/portal/billing/${inv._id}`)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/60"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-slate-50">
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {inv.invoiceNumber || inv.title || `Invoice`}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${meta.cls}`}>
                        {inv.status}
                      </span>
                      {inv.dueDate && (
                        <span className="text-[10px] text-slate-400">
                          Due {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-black text-slate-900">
                    {fmtMoney(inv.amount || inv.total, inv.currency)}
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
