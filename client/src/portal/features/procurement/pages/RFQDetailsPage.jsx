import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Edit2,
  Send,
  Lock,
  RefreshCw,
  Mail,
  Users,
  Calendar,
  Hash,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  FileText,
  Tags,
  ArrowLeft,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card, { CardHeader, CardBody } from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import { usePortalPermissions } from "../../../shared/hooks/usePortalPermissions";

import {
  getRfq,
  publishRfq,
  closeRfq,
  listQuotations,
  submitQuotation,
  updateQuotationStatus,
  getMatchedVendors,
} from "../api";

import { me } from "../../../shared/api/auth.api";

const BRAND = "#6F7FD9";

const LABEL_CLS =
  "text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500";

const TEXTAREA_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const SELECT_CLS =
  "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const RFQ_TONES = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  published: "border-indigo-200 bg-indigo-50 text-indigo-700",
  closed: "border-amber-200 bg-amber-50 text-amber-700",
  awarded: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const Q_TONES = {
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

function StatusPill({ value, map = RFQ_TONES }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
        map[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value?.replace("_", " ") || "—"}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRfqTone(status) {
  if (status === "published") {
    return {
      label: "Published",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      text: "text-indigo-700",
      glow: "rgba(99,102,241,0.18)",
    };
  }

  if (status === "closed") {
    return {
      label: "Closed",
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-700",
      glow: "rgba(245,158,11,0.16)",
    };
  }

  if (status === "awarded") {
    return {
      label: "Awarded",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      glow: "rgba(16,185,129,0.16)",
    };
  }

  return {
    label: "Draft",
    bg: "bg-slate-50",
    border: "border-slate-100",
    text: "text-slate-700",
    glow: "rgba(100,116,139,0.14)",
  };
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-indigo-50 opacity-0 blur-2xl transition group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(111,127,217,0.10)", color: BRAND }}
        >
          <Icon size={15} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {children || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </div>

          <div className="mt-1 text-lg font-black text-slate-950">{value}</div>

          <div className="mt-0.5 text-xs font-semibold text-slate-400">
            {helper}
          </div>
        </div>

        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(111,127,217,0.10)", color: BRAND }}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function RfqHero({ rfq, isAdmin, onBack }) {
  const tone = getRfqTone(rfq.status);
  const categoriesCount = rfq.subcategoryIds?.length || 0;
  const attachmentsCount = rfq.attachments?.length || 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: tone.glow }}
      />

      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(111,127,217,0.12)" }}
      />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={13} />
            Back to RFQs
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.22em] text-indigo-600">
              Procurement RFQ
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.18em]",
                tone.bg,
                tone.border,
                tone.text,
              ].join(" ")}
            >
              {tone.label}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            {rfq.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-black text-slate-600">
              <Hash size={13} />
              {rfq.rfqNumber}
            </span>

            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-slate-500">
              <Calendar size={13} />
              Deadline: {formatDate(rfq.deadline)}
            </span>

            {isAdmin && (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-slate-500">
                <User size={13} />
                Internal view
              </span>
            )}
          </div>

          {rfq.description && (
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-500 line-clamp-3">
              {rfq.description}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat
            icon={Tags}
            label="Categories"
            value={categoriesCount}
            helper={categoriesCount === 1 ? "category" : "categories"}
          />

          <MiniStat
            icon={Paperclip}
            label="Attachments"
            value={attachmentsCount}
            helper={attachmentsCount === 1 ? "file" : "files"}
          />

          <MiniStat
            icon={Clock}
            label="Deadline"
            value={formatDate(rfq.deadline)}
            helper="submission closing date"
          />
        </div>
      </div>
    </div>
  );
}

// ── Publish modal ─────────────────────────────────────────────────────────────

function PublishModal({ open, rfqId, onClose, onDone }) {
  const [notify, setNotify] = useState(false);
  const [vendorCount, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;

    getMatchedVendors(rfqId)
      .then((r) => setCount(r.total ?? 0))
      .catch(() => setCount(0));
  }, [open, rfqId]);

  async function publish() {
    setLoading(true);

    try {
      const res = await publishRfq(rfqId, { notifyVendors: notify });

      if (notify && res.notified > 0) {
        toast.success(`Published — ${res.notified} vendor(s) notified.`);
      } else {
        toast.success("RFQ published.");
      }

      onDone(res.item);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Publish failed");
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish RFQ"
      subtitle="This will make the RFQ visible to matched vendors."
      width="480px"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={publish}
            loading={loading}
            style={{ backgroundColor: BRAND }}
          >
            Publish
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">
            Matched vendors:{" "}
            <strong className="text-slate-900">
              {vendorCount === null ? "Loading…" : vendorCount}
            </strong>
          </span>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />

          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Mail size={14} className="text-slate-400" />
              Notify vendors by email
            </div>

            <div className="text-xs text-slate-500">
              Send an email to all {vendorCount ?? "…"} matched vendors.
            </div>
          </div>
        </label>
      </div>
    </Modal>
  );
}

// ── Quotation submit form (vendor) ────────────────────────────────────────────

function QuotationForm({ rfqId, onSubmitted }) {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [deliveryDays, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!price || Number(price) <= 0) {
      setError("Price must be a positive number");
      return;
    }

    setSaving(true);

    try {
      const res = await submitQuotation(rfqId, {
        price: Number(price),
        currency,
        deliveryDays: deliveryDays ? Number(deliveryDays) : null,
        notes,
      });

      toast.success("Quotation submitted successfully.");
      onSubmitted(res.item);
    } catch (e) {
      setError(e?.response?.data?.message || "Submission failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="PRICE *"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className="grid gap-1.5">
          <span className={LABEL_CLS}>CURRENCY</span>

          <select
            className={SELECT_CLS}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {["AED", "USD", "EUR", "SAR", "GBP"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="DELIVERY (DAYS)"
          type="number"
          min="1"
          placeholder="e.g. 30"
          value={deliveryDays}
          onChange={(e) => setDelivery(e.target.value)}
        />
      </div>

      <label className="grid gap-1.5">
        <span className={LABEL_CLS}>NOTES / REMARKS</span>

        <textarea
          className={TEXTAREA_CLS}
          rows={4}
          placeholder="Additional terms, conditions, or clarifications…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={saving}
          style={{ backgroundColor: BRAND }}
        >
          <Send size={14} />
          Submit Quotation
        </Button>
      </div>
    </form>
  );
}

// ── Submitted quotation card (vendor) ─────────────────────────────────────────

function MyQuotationCard({ quotation }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <InfoRow icon={Hash} label="Status">
        <StatusPill value={quotation.status} map={Q_TONES} />
      </InfoRow>

      <InfoRow icon={Users} label="Price">
        {quotation.price?.toLocaleString()} {quotation.currency}
      </InfoRow>

      <InfoRow icon={Clock} label="Delivery">
        {quotation.deliveryDays
          ? `${quotation.deliveryDays} days`
          : "Not specified"}
      </InfoRow>

      <InfoRow icon={Calendar} label="Submitted">
        {formatDate(quotation.submittedAt || quotation.createdAt)}
      </InfoRow>

      {quotation.notes && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:col-span-2 lg:col-span-4">
          {quotation.notes}
        </div>
      )}
    </div>
  );
}

// ── Quotations table (staff) ──────────────────────────────────────────────────

function QuotationsTable({ rfqId, rfqStatus }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await listQuotations(rfqId);
      setItems(res.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(quotationId, status) {
    setUpdating(quotationId);

    try {
      const res = await updateQuotationStatus(quotationId, status);

      setItems((prev) =>
        prev.map((q) =>
          q._id === quotationId ? { ...q, status: res.item.status } : q
        )
      );

      toast.success(`Quotation marked as ${status.replace("_", " ")}.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  const canAct = rfqStatus === "published" || rfqStatus === "closed";

  if (loading) {
    return (
      <div className="grid gap-3 p-5">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={Users}
          title="No quotations yet"
          message="Quotations will appear here once vendors submit their responses."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-sm font-black text-slate-900">
            {items.length} quotation{items.length === 1 ? "" : "s"}
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Review vendor pricing, delivery, notes, and status.
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-4 py-3 text-left text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Vendor
              </th>

              <th className="px-4 py-3 text-right text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Price
              </th>

              <th className="px-4 py-3 text-center text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Delivery
              </th>

              <th className="px-4 py-3 text-left text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Notes
              </th>

              <th className="px-4 py-3 text-center text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Status
              </th>

              <th className="px-4 py-3 text-center text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Submitted
              </th>

              {canAct && <th className="px-4 py-3" />}
            </tr>
          </thead>

          <tbody>
            {items.map((q) => (
              <tr
                key={q._id}
                className="border-b border-slate-50 transition hover:bg-slate-50/70"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    {q.vendorId?.name || "—"}
                  </div>

                  <div className="text-xs text-slate-400">
                    {q.vendorId?.email}
                  </div>
                </td>

                <td className="px-4 py-3 text-right font-black text-slate-900">
                  {q.price?.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {q.currency}
                  </span>
                </td>

                <td className="px-4 py-3 text-center text-slate-600">
                  {q.deliveryDays ? `${q.deliveryDays}d` : "—"}
                </td>

                <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                  {q.notes || "—"}
                </td>

                <td className="px-4 py-3 text-center">
                  <StatusPill value={q.status} map={Q_TONES} />
                </td>

                <td className="px-4 py-3 text-center text-xs text-slate-400">
                  {formatDate(q.submittedAt || q.createdAt)}
                </td>

                {canAct && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {q.status === "submitted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updating === q._id}
                          onClick={() => setStatus(q._id, "under_review")}
                        >
                          Review
                        </Button>
                      )}

                      {!["accepted", "rejected"].includes(q.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:bg-emerald-50"
                          disabled={updating === q._id}
                          onClick={() => setStatus(q._id, "accepted")}
                        >
                          <CheckCircle size={13} />
                          Accept
                        </Button>
                      )}

                      {!["rejected", "accepted"].includes(q.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          disabled={updating === q._id}
                          onClick={() => setStatus(q._id, "rejected")}
                        >
                          <XCircle size={13} />
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RFQDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const { hasPermission } = usePortalPermissions();

  const [rfq, setRfq] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    me()
      .then((r) => setRole(r?.user?.role || null))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getRfq(id);
      setRfq(res.item);
    } catch {
      setRfq(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClose() {
    setClosing(true);

    try {
      const res = await closeRfq(id);

      setRfq((prev) => ({
        ...prev,
        status: res.item.status,
        closedAt: res.item.closedAt,
      }));

      toast.success("RFQ closed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to close RFQ");
    } finally {
      setClosing(false);
    }
  }

  const isVendor = role === "vendor";
  const canManageRfq = hasPermission("procurement.write");
  const canApproveRfq = hasPermission("procurement.approve");

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <EmptyState
        icon={Hash}
        title="RFQ not found"
        message="This RFQ may have been removed or you don't have access."
        actionLabel="Back to RFQs"
        onAction={() => nav("/portal/procurement/rfqs")}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PublishModal
        open={showPublish}
        rfqId={id}
        onClose={() => setShowPublish(false)}
        onDone={(updated) => {
          setRfq((prev) => ({ ...prev, ...updated }));
          setShowPublish(false);
        }}
      />

      <PageHeader
        eyebrow="PROCUREMENT"
        title="RFQ Details"
        subtitle="Review requirements, manage publishing, and track vendor quotations."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "RFQs", to: "/portal/procurement/rfqs" },
          { label: rfq.rfqNumber },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load}>
              <RefreshCw size={14} />
            </Button>

            {canManageRfq && rfq.status === "draft" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => nav(`/portal/procurement/rfqs/${id}/edit`)}
                >
                  <Edit2 size={14} />
                  Edit
                </Button>

                {canApproveRfq && (
                  <Button
                    onClick={() => setShowPublish(true)}
                    style={{ backgroundColor: BRAND }}
                  >
                    <Send size={14} />
                    Publish
                  </Button>
                )}
              </>
            )}

            {canApproveRfq && rfq.status === "published" && (
              <Button
                variant="outline"
                disabled={closing}
                loading={closing}
                onClick={handleClose}
              >
                <Lock size={14} />
                Close RFQ
              </Button>
            )}
          </div>
        }
      />

      <RfqHero
        rfq={rfq}
        isAdmin={canManageRfq}
        onBack={() => nav("/portal/procurement/rfqs")}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoRow icon={Calendar} label="Deadline">
          {formatDate(rfq.deadline)}
        </InfoRow>

        <InfoRow icon={User} label="Created by">
          {rfq.createdBy?.fullName || rfq.createdBy?.email || "—"}
        </InfoRow>

        <InfoRow icon={Send} label="Published">
          {rfq.publishedAt ? formatDate(rfq.publishedAt) : "Not published"}
        </InfoRow>

        <InfoRow icon={Lock} label="Closed">
          {rfq.closedAt ? formatDate(rfq.closedAt) : "Not closed"}
        </InfoRow>
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <CardHeader
          title="RFQ Requirements"
          subtitle="Main scope, requested categories, and supporting documents."
        />

        <CardBody className="grid gap-6">
          {rfq.description ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className={LABEL_CLS + " mb-3 flex items-center gap-2"}>
                <FileText size={13} />
                Description
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {rfq.description}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
              No description was added for this RFQ.
            </div>
          )}

          {(rfq.subcategoryIds || []).length > 0 && (
            <div>
              <div className={LABEL_CLS + " mb-3 flex items-center gap-2"}>
                <Tags size={13} />
                Categories
              </div>

              <div className="flex flex-wrap gap-2">
                {rfq.subcategoryIds.map((c) => (
                  <span
                    key={c._id || c}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"
                  >
                    {c.name || c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(rfq.attachments || []).length > 0 && (
            <div>
              <div className={LABEL_CLS + " mb-3 flex items-center gap-2"}>
                <Paperclip size={13} />
                Attachments
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {rfq.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip
                        size={14}
                        className="shrink-0 text-slate-400"
                      />
                      <span className="truncate">{a.name || a.url}</span>
                    </span>

                    <span className="text-xs font-black text-indigo-500 opacity-0 transition group-hover:opacity-100">
                      Open
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {isVendor && (
        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <CardHeader
            title={rfq.myQuotation ? "Your Quotation" : "Submit Quotation"}
            subtitle={
              rfq.myQuotation
                ? "Your submitted quotation for this RFQ."
                : "Fill in your pricing and timeline to respond to this RFQ."
            }
          />

          <CardBody>
            {rfq.myQuotation ? (
              <MyQuotationCard quotation={rfq.myQuotation} />
            ) : rfq.status === "published" ? (
              <QuotationForm
                rfqId={id}
                onSubmitted={(q) =>
                  setRfq((prev) => ({ ...prev, myQuotation: q }))
                }
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                This RFQ is no longer accepting quotations.
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {!isVendor && (
        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <CardHeader
            title="Quotations Received"
            subtitle="All vendor responses to this RFQ."
          />

          <CardBody className="p-0">
            <QuotationsTable rfqId={id} rfqStatus={rfq.status} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
