// src/portal/features/billing/pages/InvoiceDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import { useToast } from "../../../shared/ui/Toast";

import { AlertCircle, ArrowLeft, CheckCircle2, Ban, Receipt } from "lucide-react";
import { getInvoice, markInvoicePaid, voidInvoice } from "../api";

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
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600"
      >
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

export default function InvoiceDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);
  const [confirmVoid, setConfirmVoid] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInvoice(id);
      setItem(res?.item || null);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load invoice"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const subtotal = Number(item?.subtotal || 0);
    const tax = Number(item?.tax || 0);
    const total = Number(item?.total || 0);
    return { subtotal, tax, total };
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

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="text-2xl font-black tracking-tight text-slate-900 truncate">
                {item.number || "Invoice"}
              </div>
              <StatusPill status={item.status} />
              <Badge tone="neutral">{item.currency || "AED"}</Badge>
            </div>

            {item.customerId?.companyName ? (
              <div className="mt-1 text-sm text-slate-600 truncate">
                {item.customerId.companyName}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={busy}
            >
              <Receipt size={16} />
              Print
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              CLIENT
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {item.customerId?.companyName || "—"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {item.customerId?.contactName || "—"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {item.customerId?.primaryEmail || "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              DATES
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Issued:{" "}
              <b className="text-slate-900">
                {item.issuedAt
                  ? new Date(item.issuedAt).toLocaleDateString()
                  : "—"}
              </b>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Due:{" "}
              <b className="text-slate-900">
                {item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString()
                  : "—"}
              </b>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Paid:{" "}
              <b className="text-slate-900">
                {item.paidAt ? new Date(item.paidAt).toLocaleDateString() : "—"}
              </b>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-black/10 bg-white text-sm font-black text-slate-900">
            Items
          </div>

          {(item.items || []).length === 0 ? (
            <div className="p-4 text-sm text-slate-600">No items.</div>
          ) : (
            <div className="divide-y divide-black/10 bg-white">
              {(item.items || []).map((it, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900">
                      {it.title}
                    </div>
                    {it.description ? (
                      <div className="text-sm text-slate-600">
                        {it.description}
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-slate-500">
                      Qty: <b className="text-slate-900">{it.qty}</b> • Unit:{" "}
                      <b className="text-slate-900">
                        {Number(it.unitPrice || 0).toFixed(2)}
                      </b>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 shrink-0">
                    {Number(it.amount || 0).toFixed(2)} {item.currency || "AED"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2 text-right">
          <div className="text-sm text-slate-600">
            Subtotal:{" "}
            <b className="text-slate-900">{totals.subtotal.toFixed(2)}</b>{" "}
            {item.currency}
          </div>
          <div className="text-sm text-slate-600">
            Tax: <b className="text-slate-900">{totals.tax.toFixed(2)}</b>{" "}
            {item.currency}
          </div>
          <div className="text-lg font-black text-slate-900">
            Total: {totals.total.toFixed(2)} {item.currency}
          </div>
        </div>

        {item.notes ? (
          <div className="mt-5 rounded-[28px] border border-black/[0.07] bg-white p-4 shadow-sm">
            <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              NOTES
            </div>
            <div className="mt-1 text-sm text-slate-700">{item.notes}</div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
