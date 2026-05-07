// src/portal/features/billing/pages/BillingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import {
  listInvoices,
  createInvoice,
  markInvoicePaid,
  voidInvoice,
} from "../api";
import { listCustomers } from "../../customers/api";

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

/** Customer picker: improved alignment + nicer header */
function CustomerSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (query) => {
    setLoading(true);
    try {
      const res = await listCustomers({ q: query, limit: 20 });
      setItems(res?.items || res?.customers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load(q);
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q, open]);

  return (
    <div className="relative">
      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          CLIENT
        </span>

        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm outline-none transition hover:bg-black/[0.02] focus:ring-4 focus:ring-black/5"
        >
          {value ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-900">
                  {value.companyName || value.name || "Client"}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {value.contactName || value.primaryEmail || ""}
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          ) : (
            <span className="text-slate-500">Search and select…</span>
          )}
        </button>
      </label>

      {open ? (
        <div className="absolute z-[9999] mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
          <div className="p-3 border-b border-black/10 bg-white">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                <Search size={16} className="text-slate-700" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company name…"
                className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                No customers found.
              </div>
            ) : (
              items.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-black/[0.03] border-b border-black/5"
                >
                  <div className="text-sm font-black text-slate-900">
                    {c.companyName || c.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.contactName || c.primaryEmail || ""}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 bg-slate-50 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreateInvoiceModal({ open, onClose, onSubmit, busy }) {
  const [customer, setCustomer] = useState(null);
  const [currency, setCurrency] = useState("AED");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ title: "", qty: 1, unitPrice: 0 }]);

  useEffect(() => {
    if (!open) return;
    setCustomer(null);
    setCurrency("AED");
    setDueDate("");
    setTax("0");
    setNotes("");
    setItems([{ title: "", qty: 1, unitPrice: 0 }]);
  }, [open]);

  if (!open) return null;

  const canSubmit =
    Boolean(customer?._id) && items.some((i) => (i.title || "").trim());

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const total = subtotal + Number(tax || 0);

  const updateItem = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () =>
    setItems((s) => [...s, { title: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={() => onClose?.(false)}
    >
      <div
        className="w-[min(980px,96vw)] overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/10 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">
                New Invoice
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Create draft invoice. Mark as sent/paid later.
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

        <div className="p-6 grid gap-4 bg-white">
          <div className="grid gap-3 sm:grid-cols-3">
            <CustomerSelect value={customer} onChange={setCustomer} />

            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                CURRENCY
              </span>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                placeholder="AED"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                DUE DATE
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              />
            </label>
          </div>

          <div className="rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-slate-900">Items</div>
                <div className="text-xs text-slate-500">
                  What are you billing for?
                </div>
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
                  className="grid gap-2 sm:grid-cols-12 rounded-2xl border border-black/10 bg-white p-3"
                >
                  <div className="sm:col-span-6">
                    <input
                      value={it.title}
                      onChange={(e) =>
                        updateItem(idx, { title: e.target.value })
                      }
                      placeholder="Item title (e.g. March Social Media Package)"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      value={String(it.qty)}
                      onChange={(e) =>
                        updateItem(idx, { qty: Number(e.target.value || 0) })
                      }
                      placeholder="Qty"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      value={String(it.unitPrice)}
                      onChange={(e) =>
                        updateItem(idx, {
                          unitPrice: Number(e.target.value || 0),
                        })
                      }
                      placeholder="Unit price"
                      className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 items-end">
              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  TAX
                </span>
                <input
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                  placeholder="0"
                />
              </label>

              <div className="sm:col-span-2 text-right">
                <div className="text-xs text-slate-500">
                  Subtotal:{" "}
                  <b className="text-slate-900">{subtotal.toFixed(2)}</b>{" "}
                  {currency}
                </div>
                <div className="text-sm font-black text-slate-900">
                  Total: {total.toFixed(2)} {currency}
                </div>
              </div>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                NOTES
              </span>
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

        <div className="p-6 border-t border-black/10 bg-white flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onClose?.(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit?.({
                customerId: customer?._id,
                currency,
                dueDate: dueDate || null,
                tax: Number(tax || 0),
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

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listInvoices({ q, status, sort, page, limit });
      setItems(res?.items || []);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? 0,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, status, sort, page]);

  const stats = useMemo(() => {
    const total = meta.total || 0;
    const paid = items.filter((x) => x.status === "paid").length;
    const overdue = items.filter((x) => x.status === "overdue").length;
    const drafts = items.filter((x) => x.status === "draft").length;
    return { total, paid, overdue, drafts };
  }, [items, meta.total]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createInvoice(payload);
      setCreateOpen(false);
      setPage(1);
      await load();
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
    setConfirm({
      title: "Mark invoice as paid",
      message: `Mark invoice ${inv.number || inv._id} as PAID?`,
      danger: false,
      confirmLabel: "Mark as Paid",
      onConfirm: async () => {
        setBusy(true);
        setConfirm(null);
        try {
          await markInvoicePaid(inv._id);
          await load();
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
    setConfirm({
      title: "Void invoice",
      message: `Void invoice ${inv.number || inv._id}?`,
      danger: true,
      confirmLabel: "Void Invoice",
      onConfirm: async () => {
        setBusy(true);
        setConfirm(null);
        try {
          await voidInvoice(inv._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Failed");
        } finally {
          setBusy(false);
        }
      },
    });
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
            <Button variant="outline" onClick={load} disabled={loading || busy}>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CreditCard}   label="Total Invoices" value={stats.total}   color="indigo"  />
        <StatCard icon={Receipt}      label="Drafts"         value={stats.drafts}  color="amber"   />
        <StatCard icon={CheckCircle2} label="Paid"           value={stats.paid}    color="emerald" />
        <StatCard icon={Ban}          label="Overdue"        value={stats.overdue} color="rose"    />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="Invoice number, client, currency…"
        filters={[
          { label: "status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: [
            { value: "", label: "All status" },
            { value: "draft", label: "Draft" },
            { value: "sent", label: "Sent" },
            { value: "paid", label: "Paid" },
            { value: "overdue", label: "Overdue" },
            { value: "void", label: "Void" },
          ]},
          { label: "sort", value: sort, onChange: (v) => { setSort(v); setPage(1); }, options: [
            { value: "-createdAt", label: "Newest" },
            { value: "-dueDate", label: "Due date (latest)" },
            { value: "dueDate", label: "Due date (soonest)" },
            { value: "-total", label: "Total (high)" },
            { value: "total", label: "Total (low)" },
          ]},
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
                className="p-4 flex items-start justify-between gap-3 bg-white"
              >
                <button
                  className="min-w-0 text-left"
                  onClick={() => nav(`/portal/billing/${inv._id}`)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-slate-900 truncate">
                      {inv.number || "Invoice"}
                    </div>
                    <StatusPill status={inv.status} />
                    {inv.customerId?.companyName ? (
                      <span className="text-xs text-slate-500 truncate">
                        • {inv.customerId.companyName}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                    Total:{" "}
                    <b className="text-slate-900">
                      {Number(inv.total || 0).toFixed(2)}
                    </b>{" "}
                    {inv.currency || "AED"}
                    {inv.dueDate ? (
                      <span className="ml-3 text-xs text-slate-500">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Updated:{" "}
                    {inv.updatedAt
                      ? new Date(inv.updatedAt).toLocaleString()
                      : "—"}
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {inv.status !== "paid" && inv.status !== "void" ? (
                    <Button
                      variant="outline"
                      onClick={() => onMarkPaid(inv)}
                      disabled={busy}
                    >
                      <CheckCircle2 size={16} />
                      Mark paid
                    </Button>
                  ) : null}

                  {inv.status !== "void" ? (
                    <Button
                      variant="outline"
                      onClick={() => onVoid(inv)}
                      disabled={busy}
                    >
                      <Ban size={16} />
                      Void
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    onClick={() => nav(`/portal/billing/${inv._id}`)}
                    disabled={busy}
                  >
                    <Receipt size={16} />
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 bg-white">
            <div className="text-xs text-slate-500">
              Showing page <span className="font-black">{meta.page}</span> of{" "}
              <span className="font-black">{meta.pages}</span>
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
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
