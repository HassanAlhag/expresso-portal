import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import {
  CreditCard,
  Plus,
  RefreshCw,
  Receipt,
  CheckCircle2,
  Ban,
  Search,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";

import {
  listInvoices,
  getBillingStats,
  createInvoice,
  markInvoicePaid,
  voidInvoice,
  markOverdueInvoices,
} from "../api";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listEnrollments } from "../../enrollments/api";

function fmtMoney(amount, currency = "AED") {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currency || "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusPill({ status }) {
  const s = String(status || "draft");
  const map = {
    draft: "border-orange-200 bg-orange-50 text-orange-800",
    sent: "border-indigo-200 bg-indigo-50 text-indigo-800",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    overdue: "border-rose-200 bg-rose-50 text-rose-800",
    void: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black tracking-[0.12em]",
        map[s] || map.draft,
      ].join(" ")}
    >
      {s.toUpperCase()}
    </span>
  );
}

function SearchSelect({ label, value, onChange, loadItems, displayLabel, displaySub }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (query) => {
    setLoading(true);
    try {
      const res = await loadItems(query);
      setItems(Array.isArray(res) ? res : (res?.items || []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  return (
    <div className="relative">
      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm outline-none transition hover:bg-black/[0.02] focus:ring-4 focus:ring-black/5"
        >
          {value ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-900">{displayLabel(value)}</div>
                {displaySub && (
                  <div className="truncate text-xs text-slate-500">{displaySub(value)}</div>
                )}
              </div>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          ) : (
            <span className="text-slate-400">Search and select…</span>
          )}
        </button>
      </label>

      {open && (
        <div className="absolute z-[9999] mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
          <div className="border-b border-black/10 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                <Search size={16} className="text-slate-700" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Nothing found.</div>
            ) : (
              items.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                  className="w-full border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
                >
                  <div className="text-sm font-black text-slate-900">{displayLabel(c)}</div>
                  {displaySub && (
                    <div className="text-xs text-slate-500">{displaySub(c)}</div>
                  )}
                </button>
              ))
            )}
          </div>
          {value && (
            <div className="border-t border-black/10 bg-slate-50 p-2 text-right">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-50"
              >
                Clear
              </button>
            </div>
          )}
          <div className="border-t border-black/10 bg-slate-50 p-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateInvoiceModal({ open, onClose, onSubmit, busy }) {
  const [customer, setCustomer] = useState(null);
  const [project, setProject] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currency, setCurrency] = useState("AED");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ title: "", qty: 1, unitPrice: 0 }]);

  useEffect(() => {
    if (!open) return;
    setCustomer(null);
    setProject(null);
    setEnrollment(null);
    setCurrency("AED");
    setDueDate("");
    setTaxRate("0");
    setDiscount("0");
    setNotes("");
    setItems([{ title: "", qty: 1, unitPrice: 0 }]);
  }, [open]);

  if (!open) return null;

  const canSubmit = Boolean(customer?._id) && items.some((i) => (i.title || "").trim());

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const discountAmt = Math.max(0, Number(discount || 0));
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt = taxable * (Number(taxRate || 0) / 100);
  const total = taxable + taxAmt;

  const updateItem = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () => setItems((s) => [...s, { title: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => onClose?.(false)}
    >
      <div
        className="w-[min(1020px,96vw)] max-h-[92vh] overflow-y-auto rounded-[28px] border border-black/[0.07] bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-black/10 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">New Invoice</div>
              <div className="mt-1 text-sm text-slate-600">
                Invoice number is auto-generated. Mark as sent/paid after creation.
              </div>
            </div>
            <button
              className="h-11 w-11 rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
              onClick={() => onClose?.(false)}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6">
          {/* Client + currency + due date */}
          <div className="grid gap-3 sm:grid-cols-3">
            <SearchSelect
              label="CLIENT *"
              value={customer}
              onChange={setCustomer}
              loadItems={(q) => listCustomers({ q, limit: 20 }).then((r) => r?.items || r?.customers || [])}
              displayLabel={(c) => c.companyName || c.name || "Client"}
              displaySub={(c) => c.contactName || c.primaryEmail || ""}
            />
            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">CURRENCY</span>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                placeholder="AED"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">DUE DATE</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              />
            </label>
          </div>

          {/* Optional links */}
          <div className="grid gap-3 sm:grid-cols-2">
            <SearchSelect
              label="LINK TO PROJECT (optional)"
              value={project}
              onChange={setProject}
              loadItems={(q) => listProjects({ q, limit: 20 }).then((r) => r?.items || r?.projects || [])}
              displayLabel={(p) => p.name || p.title || "Project"}
              displaySub={null}
            />
            <SearchSelect
              label="LINK TO ENROLLMENT (optional)"
              value={enrollment}
              onChange={setEnrollment}
              loadItems={(q) => listEnrollments({ q, limit: 20 }).then((r) => r?.items || r?.enrollments || [])}
              displayLabel={(e) => e.name || e.title || "Enrollment"}
              displaySub={null}
            />
          </div>

          {/* Line items */}
          <div className="rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-slate-900">Items</div>
                <div className="text-xs text-slate-500">What are you billing for?</div>
              </div>
              <Button onClick={addItem}>
                <Plus size={16} />
                Add item
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-2xl border border-black/10 bg-white p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-6">
                    <input
                      value={it.title}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                      placeholder="Item title…"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      value={String(it.qty)}
                      onChange={(e) => updateItem(idx, { qty: Number(e.target.value || 0) })}
                      placeholder="Qty"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      value={String(it.unitPrice)}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value || 0) })}
                      placeholder="Unit price"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button variant="outline" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals + discount + tax rate */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3 items-end">
              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  DISCOUNT ({currency})
                </span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                  placeholder="0"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  TAX RATE (%)
                </span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                  placeholder="0"
                />
              </label>
              <div className="text-right">
                <div className="text-xs text-slate-500">
                  Subtotal: <b className="text-slate-900">{subtotal.toFixed(2)}</b> {currency}
                </div>
                {discountAmt > 0 && (
                  <div className="text-xs text-slate-500">
                    Discount: <b className="text-rose-600">-{discountAmt.toFixed(2)}</b> {currency}
                  </div>
                )}
                {taxAmt > 0 && (
                  <div className="text-xs text-slate-500">
                    Tax ({taxRate}%): <b className="text-slate-900">{taxAmt.toFixed(2)}</b> {currency}
                  </div>
                )}
                <div className="text-sm font-black text-slate-900">
                  Total: {total.toFixed(2)} {currency}
                </div>
              </div>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">NOTES</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                placeholder="Payment terms, bank details, notes…"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-black/10 bg-white p-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onClose?.(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit?.({
                customerId: customer?._id,
                projectId: project?._id || null,
                enrollmentId: enrollment?._id || null,
                currency,
                dueDate: dueDate || null,
                taxRate: Number(taxRate || 0),
                discount: Number(discount || 0),
                notes,
                items,
                status: "draft",
              })
            }
            disabled={busy || !canSubmit}
          >
            Create invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getBillingStats();
      setStats(res);
    } catch {
      // non-fatal
    } finally {
      setStatsLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listInvoices({ q, status, sort, page, limit });
      setItems(res?.items || []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0 });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => { load(); loadStats(); };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { load(); }, [q, status, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createInvoice(payload);
      setCreateOpen(false);
      setPage(1);
      refresh();
      const id = res?.item?._id;
      if (id) nav(`/portal/billing/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onMarkPaid = (inv) => {
    if (!inv?._id) return;
    setConfirmState({
      title: "Mark invoice as paid",
      message: `Mark invoice ${inv.number || inv._id} as PAID?`,
      danger: false,
      confirmLabel: "Mark as Paid",
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await markInvoicePaid(inv._id);
          refresh();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const onVoid = (inv) => {
    if (!inv?._id) return;
    setConfirmState({
      title: "Void invoice",
      message: `Void invoice ${inv.number || inv._id}?`,
      danger: true,
      confirmLabel: "Void Invoice",
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await voidInvoice(inv._id);
          refresh();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const onMarkOverdue = async () => {
    setBusy(true);
    try {
      const res = await markOverdueInvoices();
      toast.success(`Marked ${res?.updated ?? 0} invoice(s) as overdue.`);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CORE"
        title="Billing"
        subtitle="Invoices and payment tracking."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Billing" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onMarkOverdue} disabled={loading || busy} title="Mark all past-due sent invoices as overdue">
              <Clock size={16} />
              Mark overdue
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={16} />
              New invoice
            </Button>
          </div>
        }
      />

      {/* Stats from API */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={statsLoading ? "—" : fmtMoney(stats?.totalRevenue)}
          color="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={statsLoading ? "—" : fmtMoney(stats?.totalPaid)}
          color="emerald"
        />
        <StatCard
          icon={CreditCard}
          label="Outstanding"
          value={statsLoading ? "—" : fmtMoney(stats?.totalOutstanding)}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={statsLoading ? "—" : fmtMoney(stats?.totalOverdue)}
          color="rose"
        />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="Invoice number, notes, currency…"
        filters={[
          {
            label: "status",
            value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: [
              { value: "", label: "All status" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
              { value: "void", label: "Void" },
            ],
          },
          {
            label: "sort",
            value: sort,
            onChange: (v) => { setSort(v); setPage(1); },
            options: [
              { value: "-createdAt", label: "Newest" },
              { value: "-dueDate", label: "Due date (latest)" },
              { value: "dueDate", label: "Due date (soonest)" },
              { value: "-total", label: "Total (high)" },
              { value: "total", label: "Total (low)" },
            ],
          },
        ]}
        onClear={() => { setQ(""); setStatus(""); setSort("-createdAt"); setPage(1); }}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No invoices yet"
          message="Create your first invoice and start tracking payments."
          actionLabel="New invoice"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="divide-y divide-black/10">
            {items.map((inv) => (
              <div
                key={inv._id}
                className="flex items-start justify-between gap-3 bg-white p-4"
              >
                <button
                  className="min-w-0 text-left"
                  onClick={() => nav(`/portal/billing/${inv._id}`)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-black text-slate-900">
                      {inv.number || "Invoice"}
                    </div>
                    <StatusPill status={inv.status} />
                    {inv.customerId?.companyName ? (
                      <span className="truncate text-xs text-slate-500">
                        • {inv.customerId.companyName}
                      </span>
                    ) : null}
                    {inv.projectId?.name || inv.projectId?.title ? (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                        {inv.projectId.name || inv.projectId.title}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    Total:{" "}
                    <b className="text-slate-900">
                      {fmtMoney(inv.total, inv.currency)}
                    </b>
                    {inv.balance > 0 && inv.status !== "void" ? (
                      <span className="ml-2 text-xs text-rose-600 font-black">
                        Balance: {fmtMoney(inv.balance, inv.currency)}
                      </span>
                    ) : null}
                    {inv.dueDate ? (
                      <span className="ml-3 text-xs text-slate-500">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Updated:{" "}
                    {inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : "—"}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  {inv.status !== "paid" && inv.status !== "void" ? (
                    <Button variant="outline" onClick={() => onMarkPaid(inv)} disabled={busy}>
                      <CheckCircle2 size={16} />
                      Mark paid
                    </Button>
                  ) : null}

                  {inv.status !== "void" ? (
                    <Button variant="outline" onClick={() => onVoid(inv)} disabled={busy}>
                      <Ban size={16} />
                      Void
                    </Button>
                  ) : null}

                  <Button variant="outline" onClick={() => nav(`/portal/billing/${inv._id}`)} disabled={busy}>
                    <Receipt size={16} />
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">
              Page <span className="font-black">{meta.page}</span> of{" "}
              <span className="font-black">{meta.pages}</span> •{" "}
              <span className="font-black">{meta.total}</span> total
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={meta.page >= meta.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
