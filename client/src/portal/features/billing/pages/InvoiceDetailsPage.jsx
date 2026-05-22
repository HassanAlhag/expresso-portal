import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import { useToast } from "../../../shared/ui/Toast";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Ban,
  Receipt,
  Plus,
  Pencil,
  X,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  getInvoice,
  markInvoicePaid,
  voidInvoice,
  updateInvoice,
  recordPayment,
  deletePayment,
} from "../api";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];

function fmtMoney(amount, currency = "AED") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currency || "AED",
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InlineConfirm({ message, confirmLabel = "Confirm", busy, onConfirm, onCancel }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <AlertCircle size={15} className="flex-shrink-0 text-rose-500" />
      <span className="flex-1 text-sm font-semibold text-rose-700">{message}</span>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-600 disabled:opacity-60"
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={onCancel} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600">
        Cancel
      </button>
    </div>
  );
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
    <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-black tracking-[0.12em]", map[s] || map.draft].join(" ")}>
      {s.toUpperCase()}
    </span>
  );
}

// ---------- Edit form ----------
function EditForm({ item, onSave, onCancel, busy }) {
  const [currency, setCurrency] = useState(item.currency || "AED");
  const [dueDate, setDueDate] = useState(item.dueDate ? item.dueDate.slice(0, 10) : "");
  const [taxRate, setTaxRate] = useState(String(item.taxRate ?? 0));
  const [discount, setDiscount] = useState(String(item.discount ?? 0));
  const [notes, setNotes] = useState(item.notes || "");
  const [items, setItems] = useState(
    (item.items || []).map((it) => ({
      title: it.title || "",
      description: it.description || "",
      qty: it.qty ?? 1,
      unitPrice: it.unitPrice ?? 0,
    }))
  );

  const subtotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0), 0);
  const discountAmt = Math.max(0, Number(discount || 0));
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt = taxable * (Number(taxRate || 0) / 100);
  const total = taxable + taxAmt;

  const updateItem = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () => setItems((s) => [...s, { title: "", description: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

  const handleSave = () => {
    onSave({
      currency,
      dueDate: dueDate || null,
      taxRate: Number(taxRate || 0),
      discount: Number(discount || 0),
      notes,
      items,
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">CURRENCY</span>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">DUE DATE</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">DISCOUNT</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">TAX RATE %</span>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </label>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-sm font-black text-slate-900">Items</span>
          <Button size="sm" onClick={addItem}>
            <Plus size={14} />
            Add
          </Button>
        </div>
        <div className="grid gap-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 rounded-2xl border border-black/10 bg-white p-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <input
                  value={it.title}
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                  placeholder="Item title"
                  className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Description (optional)"
                  className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                />
              </div>
              <div className="sm:col-span-1">
                <input
                  type="number"
                  value={String(it.qty)}
                  onChange={(e) => updateItem(idx, { qty: Number(e.target.value || 0) })}
                  placeholder="Qty"
                  className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={String(it.unitPrice)}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value || 0) })}
                  placeholder="Unit price"
                  className="h-10 w-full rounded-2xl border border-black/10 px-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-right text-sm">
          <div className="text-slate-500">Subtotal: <b className="text-slate-900">{subtotal.toFixed(2)}</b> {currency}</div>
          {discountAmt > 0 && (
            <div className="text-slate-500">Discount: <b className="text-rose-600">-{discountAmt.toFixed(2)}</b> {currency}</div>
          )}
          {taxAmt > 0 && (
            <div className="text-slate-500">Tax ({taxRate}%): <b className="text-slate-900">{taxAmt.toFixed(2)}</b> {currency}</div>
          )}
          <div className="text-lg font-black text-slate-900">Total: {total.toFixed(2)} {currency}</div>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">NOTES</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          placeholder="Payment terms, bank details, notes…"
        />
      </label>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button onClick={handleSave} disabled={busy}>Save changes</Button>
      </div>
    </div>
  );
}

// ---------- Record payment form ----------
function RecordPaymentForm({ currency, onSubmit, onCancel, busy }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-black text-slate-900">Record payment</div>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">AMOUNT ({currency})</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">METHOD</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">DATE</span>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">NOTE</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button
          onClick={() => onSubmit({ amount: Number(amount || 0), method, paidAt, note })}
          disabled={busy || !amount || Number(amount) <= 0}
        >
          Record
        </Button>
      </div>
    </div>
  );
}

// ---------- Main page ----------
export default function InvoiceDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);

  const [confirmVoid, setConfirmVoid] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deletingPayId, setDeletingPayId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInvoice(id);
      setItem(res?.item || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    if (!item) return { subtotal: 0, discount: 0, taxRate: 0, tax: 0, total: 0, amountPaid: 0, balance: 0 };
    return {
      subtotal: Number(item.subtotal || 0),
      discount: Number(item.discount || 0),
      taxRate: Number(item.taxRate || 0),
      tax: Number(item.tax || 0),
      total: Number(item.total || 0),
      amountPaid: Number(item.amountPaid || 0),
      balance: Number(item.balance || 0),
    };
  }, [item]);

  const markPaid = async () => {
    setBusy(true);
    try {
      await markInvoicePaid(id);
      toast.success("Invoice marked as paid.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to mark paid");
    } finally {
      setBusy(false);
    }
  };

  const voidIt = async () => {
    setConfirmVoid(false);
    setBusy(true);
    try {
      await voidInvoice(id);
      toast.success("Invoice voided.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to void invoice");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (payload) => {
    setBusy(true);
    try {
      await updateInvoice(id, payload);
      toast.success("Invoice updated.");
      setEditMode(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onRecordPayment = async (payload) => {
    setBusy(true);
    try {
      await recordPayment(id, payload);
      toast.success("Payment recorded.");
      setShowPaymentForm(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  const onDeletePayment = async (payId) => {
    setBusy(true);
    setDeletingPayId(null);
    try {
      await deletePayment(id, payId);
      toast.success("Payment removed.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete payment");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 text-sm font-black text-slate-700 shadow-sm">
        Invoice not found.
      </div>
    );
  }

  const canEdit = item.status !== "void";
  const canAddPayment = !["paid", "void"].includes(item.status);

  return (
    <div className="grid gap-5">
      {confirmVoid && (
        <InlineConfirm
          message="Void this invoice? This action cannot be undone."
          confirmLabel="Void invoice"
          busy={busy}
          onConfirm={voidIt}
          onCancel={() => setConfirmVoid(false)}
        />
      )}

      {/* Header card */}
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => nav("/portal/billing")}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black text-slate-900 transition hover:bg-black/[0.03]"
            >
              <ArrowLeft size={14} />
              Back to billing
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="text-2xl font-black tracking-tight text-slate-900 truncate">
                {item.number || "Invoice"}
              </div>
              <StatusPill status={item.status} />
              <Badge tone="neutral">{item.currency || "AED"}</Badge>
              {item.projectId?.name || item.projectId?.title ? (
                <Badge tone="info">{item.projectId.name || item.projectId.title}</Badge>
              ) : null}
              {item.enrollmentId?.name || item.enrollmentId?.title ? (
                <Badge tone="info">{item.enrollmentId.name || item.enrollmentId.title}</Badge>
              ) : null}
            </div>

            {item.customerId?.companyName ? (
              <div className="mt-1 text-sm text-slate-600 truncate">
                {item.customerId.companyName}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 flex-wrap justify-end">
            {canEdit && !editMode ? (
              <Button variant="outline" onClick={() => setEditMode(true)} disabled={busy}>
                <Pencil size={16} />
                Edit
              </Button>
            ) : null}

            {item.status !== "paid" && item.status !== "void" ? (
              <Button variant="outline" onClick={markPaid} disabled={busy}>
                <CheckCircle2 size={16} />
                Mark paid
              </Button>
            ) : null}

            {item.status !== "void" ? (
              <Button variant="outline" onClick={() => setConfirmVoid(true)} disabled={busy}>
                <Ban size={16} />
                Void
              </Button>
            ) : null}

            <Button variant="outline" onClick={() => window.print()} disabled={busy}>
              <Receipt size={16} />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Edit form or details */}
      <Card className="p-6">
        {editMode ? (
          <EditForm
            item={item}
            onSave={saveEdit}
            onCancel={() => setEditMode(false)}
            busy={busy}
          />
        ) : (
          <>
            {/* Client + dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">CLIENT</div>
                <div className="mt-1 text-sm font-black text-slate-900">{item.customerId?.companyName || "—"}</div>
                <div className="mt-1 text-sm text-slate-600">{item.customerId?.contactName || "—"}</div>
                <div className="mt-1 text-sm text-slate-600">{item.customerId?.primaryEmail || "—"}</div>
              </div>

              <div>
                <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">DATES</div>
                <div className="mt-1 text-sm text-slate-600">Issued: <b className="text-slate-900">{fmtDate(item.issuedAt)}</b></div>
                <div className="mt-1 text-sm text-slate-600">Due: <b className="text-slate-900">{fmtDate(item.dueDate)}</b></div>
                <div className="mt-1 text-sm text-slate-600">Paid: <b className="text-slate-900">{fmtDate(item.paidAt)}</b></div>
              </div>
            </div>

            {/* Line items table */}
            <div className="mt-6 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
              <div className="border-b border-black/10 bg-white px-4 py-3 text-sm font-black text-slate-900">Items</div>
              {(item.items || []).length === 0 ? (
                <div className="p-4 text-sm text-slate-600">No items.</div>
              ) : (
                <div className="divide-y divide-black/10 bg-white">
                  {(item.items || []).map((it, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900">{it.title}</div>
                        {it.description ? (
                          <div className="text-sm text-slate-600">{it.description}</div>
                        ) : null}
                        <div className="mt-1 text-xs text-slate-500">
                          Qty: <b className="text-slate-900">{it.qty}</b> × Unit:{" "}
                          <b className="text-slate-900">{fmtMoney(it.unitPrice, item.currency)}</b>
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-black text-slate-900">
                        {fmtMoney(it.amount, item.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 grid gap-1 text-right">
              <div className="text-sm text-slate-600">
                Subtotal: <b className="text-slate-900">{fmtMoney(totals.subtotal, item.currency)}</b>
              </div>
              {totals.discount > 0 && (
                <div className="text-sm text-slate-600">
                  Discount: <b className="text-rose-600">-{fmtMoney(totals.discount, item.currency)}</b>
                </div>
              )}
              <div className="text-sm text-slate-600">
                Tax{totals.taxRate > 0 ? ` (${totals.taxRate}%)` : ""}:{" "}
                <b className="text-slate-900">{fmtMoney(totals.tax, item.currency)}</b>
              </div>
              <div className="text-lg font-black text-slate-900">
                Total: {fmtMoney(totals.total, item.currency)}
              </div>
              {totals.amountPaid > 0 && (
                <>
                  <div className="text-sm text-emerald-700 font-black">
                    Paid: {fmtMoney(totals.amountPaid, item.currency)}
                  </div>
                  {totals.balance > 0 && (
                    <div className="text-sm font-black text-rose-600">
                      Balance due: {fmtMoney(totals.balance, item.currency)}
                    </div>
                  )}
                </>
              )}
            </div>

            {item.notes ? (
              <div className="mt-5 rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">NOTES</div>
                <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{item.notes}</div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* Payments section */}
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-slate-500" />
            <span className="text-sm font-black text-slate-900">Payments</span>
            {totals.amountPaid > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-black text-emerald-700">
                {fmtMoney(totals.amountPaid, item.currency)} collected
              </span>
            )}
          </div>
          {canAddPayment && !showPaymentForm ? (
            <Button size="sm" onClick={() => setShowPaymentForm(true)} disabled={busy}>
              <Plus size={14} />
              Record payment
            </Button>
          ) : null}
        </div>

        {showPaymentForm && (
          <div className="mb-4">
            <RecordPaymentForm
              currency={item.currency || "AED"}
              onSubmit={onRecordPayment}
              onCancel={() => setShowPaymentForm(false)}
              busy={busy}
            />
          </div>
        )}

        {(item.payments || []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-slate-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/[0.07]">
            {(item.payments || []).map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {fmtMoney(p.amount, item.currency)}
                    </span>
                    <span className="rounded-full border border-black/10 bg-slate-50 px-2 py-0.5 text-xs capitalize text-slate-600">
                      {(p.method || "").replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {fmtDate(p.paidAt)}
                    {p.note ? ` • ${p.note}` : ""}
                    {p.recordedBy?.name ? ` • by ${p.recordedBy.name}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deletingPayId === p._id ? (
                    <InlineConfirm
                      message="Remove this payment?"
                      confirmLabel="Remove"
                      busy={busy}
                      onConfirm={() => onDeletePayment(p._id)}
                      onCancel={() => setDeletingPayId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingPayId(p._id)}
                      disabled={busy}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-black/10 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                      title="Remove payment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totals.balance > 0 && item.status !== "void" ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="text-sm font-black text-rose-700">Balance remaining</span>
            <span className="text-sm font-black text-rose-700">{fmtMoney(totals.balance, item.currency)}</span>
          </div>
        ) : null}

        {totals.balance <= 0 && totals.amountPaid > 0 ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-black text-emerald-700">Fully settled</span>
            <span className="text-sm font-black text-emerald-700">{fmtMoney(totals.amountPaid, item.currency)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
