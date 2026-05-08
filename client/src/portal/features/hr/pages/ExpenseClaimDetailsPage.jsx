import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Wallet,
  Pencil,
  Trash2,
  ExternalLink,
  ReceiptText,
  CalendarDays,
  User,
  Building2,
  FileText,
  RefreshCw,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import EmptyState from "../../../shared/ui/EmptyState";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import PromptModal from "../../../shared/ui/PromptModal";
import { useToast } from "../../../shared/ui/Toast";

import ExpenseClaimFormModal from "../components/ExpenseClaimFormModal";
import ExpenseStatusPill from "../components/ExpenseStatusPill";
import ExpenseCategoryBadge from "../components/ExpenseCategoryBadge";

import {
  approveExpense,
  deleteExpense,
  getExpense,
  markExpensePaid,
  registerExpense,
  rejectExpense,
  updateExpense,
} from "../api";

function money(value, currency = "AED") {
  return `${currency} ${Number(value || 0).toLocaleString("en-AE", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoBox({ icon: Icon, label, value, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
          <Icon size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {children || value || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseClaimDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getExpense(id);
      setItem(res?.item || null);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load expense");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload) => {
    if (!item?._id) return;

    setBusy(true);

    try {
      await updateExpense(item._id, payload);
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!item?._id) return;
    setConfirmState({
      title: "Delete expense",
      message: `Delete expense "${item.title}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteExpense(item._id);
          nav("/portal/hr/expenses");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
        setConfirmState(null);
      },
    });
  };

  const doAction = async (fn, fallbackMessage) => {
    if (!item?._id) return;

    setBusy(true);

    try {
      await fn(item._id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || fallbackMessage);
    } finally {
      setBusy(false);
    }
  };

  const reject = () => {
    if (!item?._id) return;
    setPrompt({
      title: "Reject expense",
      inputLabel: "REJECTION REASON",
      inputPlaceholder: "Why is this being rejected?",
      inputType: "textarea",
      required: false,
      confirmLabel: "Reject",
      onConfirm: async (reason) => {
        setBusy(true);
        try {
          await rejectExpense(item._id, reason);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Reject failed");
        } finally {
          setBusy(false);
          setPrompt(null);
        }
      },
    });
  };

  const register = () => {
    if (!item?._id) return;
    setPrompt({
      title: "Register expense",
      message: `Register "${item.title}" to a month for accounting.`,
      inputLabel: "MONTH",
      inputType: "month",
      inputDefault: item.claimMonth || new Date().toISOString().slice(0, 7),
      required: true,
      confirmLabel: "Register",
      onConfirm: async (m) => {
        setBusy(true);
        try {
          await registerExpense(item._id, m);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Register failed");
        } finally {
          setBusy(false);
          setPrompt(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="Expense not found"
        message="The expense claim may have been deleted or the link is incorrect."
        actionLabel="Back to expenses"
        onAction={() => nav("/portal/hr/expenses")}
      />
    );
  }

  const canEdit = ["submitted", "approved", "rejected"].includes(item.status);
  const canDelete = ["submitted", "approved", "rejected"].includes(item.status);

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="HR"
          title={item.title || "Expense Claim"}
          subtitle="Expense claim details, approval status, and monthly registration."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "HR" },
            { label: "Expenses", to: "/portal/hr/expenses" },
            { label: item.title || "Expense" },
          ]}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => nav("/portal/hr/expenses")}
              >
                <ArrowLeft size={15} />
                Back
              </Button>

              <Button
                variant="outline"
                onClick={load}
                disabled={loading || busy}
              >
                <RefreshCw size={15} />
                Refresh
              </Button>

              {canEdit ? (
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  disabled={busy}
                >
                  <Pencil size={15} />
                  Edit
                </Button>
              ) : null}
            </div>
          }
        />

        <Card className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ExpenseStatusPill status={item.status} />
                <ExpenseCategoryBadge category={item.category} />

                <Badge
                  tone={item.paymentStatus === "paid" ? "success" : "warning"}
                >
                  {item.paymentStatus || "unpaid"}
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                {money(item.amount, item.currency)}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {item.description || "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.status === "submitted" ? (
                <>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => doAction(approveExpense, "Approve failed")}
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </Button>

                  <Button variant="outline" disabled={busy} onClick={reject}>
                    <XCircle size={15} />
                    Reject
                  </Button>
                </>
              ) : null}

              {item.status === "approved" ? (
                <Button variant="outline" disabled={busy} onClick={register}>
                  <ClipboardCheck size={15} />
                  Register
                </Button>
              ) : null}

              {item.status === "registered" ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    doAction(markExpensePaid, "Payment update failed")
                  }
                >
                  <Wallet size={15} />
                  Mark Paid
                </Button>
              ) : null}

              {canDelete ? (
                <Button variant="outline" disabled={busy} onClick={remove}>
                  <Trash2 size={15} />
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <InfoBox icon={User} label="Staff" value={item.staffName} />
          <InfoBox
            icon={Building2}
            label="Department"
            value={item.department}
          />
          <InfoBox icon={CalendarDays} label="Expense Date">
            {formatDate(item.expenseDate)}
          </InfoBox>

          <InfoBox
            icon={CalendarDays}
            label="Claim Month"
            value={item.claimMonth}
          />
          <InfoBox
            icon={ClipboardCheck}
            label="Registered Month"
            value={item.registeredMonth}
          />
          <InfoBox icon={Wallet} label="Amount">
            {money(item.amount, item.currency)}
          </InfoBox>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">
                Approval & Registration
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Timeline of approval and monthly registration.
              </div>
            </div>

            <div className="grid gap-3 p-5">
              <InfoBox icon={CheckCircle2} label="Approved By">
                {item.approvedBy?.fullName || item.approvedBy?.email || "—"}
              </InfoBox>

              <InfoBox icon={CalendarDays} label="Approved At">
                {formatDateTime(item.approvedAt)}
              </InfoBox>

              <InfoBox icon={ClipboardCheck} label="Registered By">
                {item.registeredBy?.fullName || item.registeredBy?.email || "—"}
              </InfoBox>

              <InfoBox icon={CalendarDays} label="Registered At">
                {formatDateTime(item.registeredAt)}
              </InfoBox>

              {item.rejectionReason ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                  Rejection reason: {item.rejectionReason}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">
                Receipt & Notes
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Supporting documents and internal notes.
              </div>
            </div>

            <div className="grid gap-4 p-5">
              {item.receiptUrl ? (
                <a
                  href={item.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-900 transition hover:bg-slate-100"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    Open receipt
                  </span>
                  <ExternalLink size={15} />
                </a>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No receipt attached.
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Notes
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.notes || "No notes."}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ExpenseClaimFormModal
        open={editOpen}
        initial={item}
        busy={busy}
        onClose={() => setEditOpen(false)}
        onSubmit={save}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />

      <PromptModal
        open={!!prompt}
        {...prompt}
        onClose={() => setPrompt(null)}
      />
    </>
  );
}
