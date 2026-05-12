import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Tag,
  User,
  Building2,
  FolderOpen,
  Star,
  Save,
  AlertTriangle,
  ChevronRight,
  Zap,
  MessageSquare,
  Lock,
  Shield,
  Send,
  Loader2,
} from "lucide-react";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import PromptModal from "../../../shared/ui/PromptModal";
import TicketStatusPill from "../components/TicketStatusPill";
import TicketTypeBadge from "../components/TicketTypeBadge";
import TicketThread from "../components/TicketThread";
import TicketCommentComposer from "../components/TicketCommentComposer";
import {
  getTicket,
  addTicketComment,
  updateTicketStatus,
  approveTicket,
  updateTicket,
} from "../api";
import { listUsers } from "../../iam/users/api";
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SLA_OPTIONS,
  TERMINAL_STATUSES,
} from "../constants";

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_FLOW = [
  { key: "open", label: "Open", color: "emerald" },
  { key: "in_progress", label: "In Progress", color: "indigo" },
  { key: "waiting_client", label: "Waiting Client", color: "orange" },
  { key: "waiting_vendor", label: "Waiting Vendor", color: "amber" },
  { key: "in_review", label: "In Review", color: "violet" },
  { key: "escalated", label: "Escalated", color: "rose" },
  { key: "resolved", label: "Resolved", color: "slate" },
  { key: "closed", label: "Closed", color: "slate" },
];

const STATUS_COLORS = {
  emerald: {
    active: "bg-emerald-500 text-white border-emerald-500",
    idle: "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
  },
  indigo: {
    active: "bg-indigo-500 text-white border-indigo-500",
    idle: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
  },
  orange: {
    active: "bg-orange-500 text-white border-orange-500",
    idle: "border-orange-200 text-orange-600 hover:bg-orange-50",
  },
  amber: {
    active: "bg-amber-500 text-white border-amber-500",
    idle: "border-amber-200 text-amber-600 hover:bg-amber-50",
  },
  violet: {
    active: "bg-violet-500 text-white border-violet-500",
    idle: "border-violet-200 text-violet-600 hover:bg-violet-50",
  },
  rose: {
    active: "bg-rose-500 text-white border-rose-500",
    idle: "border-rose-200 text-rose-600 hover:bg-rose-50",
  },
  slate: {
    active: "bg-slate-600 text-white border-slate-600",
    idle: "border-slate-200 text-slate-500 hover:bg-slate-50",
  },
};

const PRIORITY_COLORS = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-indigo-100 bg-indigo-50 text-indigo-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function getRole() {
  try {
    const u = JSON.parse(localStorage.getItem("portal_user") || "{}");
    return u?.role || "client";
  } catch {
    return "client";
  }
}

function isAdminRole(r) {
  return [
    "super_admin",
    "admin",
    "operations_manager",
    "finance",
    "procurement_manager",
    "procurement_officer",
    "project_manager",
    "staff",
    "hr_management",
  ].includes(r);
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dueStatus(dueDate, status) {
  if (!dueDate || TERMINAL_STATUSES.includes(status)) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (diff < 0)
    return {
      text: `${Math.abs(days)}d overdue`,
      cls: "text-rose-600 bg-rose-50 border-rose-200",
    };
  if (days === 0)
    return {
      text: "Due today",
      cls: "text-orange-700 bg-orange-50 border-orange-200",
    };
  if (days === 1)
    return {
      text: "Due tomorrow",
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    };
  return {
    text: `Due ${fmtDate(dueDate)}`,
    cls: "text-slate-500 bg-slate-50 border-slate-200",
  };
}

function slaElapsed(createdAt, resolvedAt) {
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const start = new Date(createdAt);
  const h = Math.floor((end - start) / 3600000);
  if (h < 1) return "< 1 hour";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function Initials({ name, size = "md" }) {
  const s = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";
  return (
    <div
      className={`${s} flex-shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center`}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SideCard({ title, icon: Icon, children, accent }) {
  const border =
    accent === "rose"
      ? "border-rose-100 bg-rose-50/30"
      : accent === "violet"
      ? "border-violet-100 bg-violet-50/20"
      : accent === "emerald"
      ? "border-emerald-100 bg-emerald-50/20"
      : "border-black/[0.07] bg-white";
  const titleCls =
    accent === "rose"
      ? "text-rose-700"
      : accent === "violet"
      ? "text-violet-700"
      : accent === "emerald"
      ? "text-emerald-700"
      : "text-slate-400";
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <div className="flex items-center gap-1.5 mb-3">
        {Icon && <Icon size={13} className={titleCls} />}
        <span
          className={`text-[10.5px] font-black uppercase tracking-[0.2em] ${titleCls}`}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
      <Icon size={13} className="mt-0.5 flex-shrink-0 text-slate-300" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function TicketDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const role = useMemo(getRole, []);
  const isAdmin = isAdminRole(role);
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [confirmEscalate, setConfirmEscalate] = useState(false);
  const [prompt, setPrompt] = useState(null);

  // editable meta (admin only)
  const [localMeta, setLocalMeta] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTicket(id);
      const t = res?.item || null;
      setTicket(t);
      if (t) {
        setLocalMeta({
          category: t.category || "general",
          priority: t.priority || "medium",
          slaLevel: t.slaLevel || "standard",
          assigneeId: t.assigneeId?._id || t.assigneeId || "",
          dueDate: t.dueDate
            ? new Date(t.dueDate).toISOString().slice(0, 10)
            : "",
          estimatedHours: t.estimatedHours ?? "",
          actualHours: t.actualHours ?? "",
          estimatedCost: t.estimatedCost ?? "",
          vendor: t.vendor || "",
          vendorContact: t.vendorContact || "",
          budgetAmount: t.budgetAmount ?? "",
          currency: t.currency || "AED",
          purchaseOrderRef: t.purchaseOrderRef || "",
          deliveryDate: t.deliveryDate
            ? new Date(t.deliveryDate).toISOString().slice(0, 10)
            : "",
          resolution: t.resolution || "",
          tags: t.tags || [],
        });
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      listUsers({ role: "staff", isActive: true, limit: 100 }),
      listUsers({ role: "admin", isActive: true, limit: 50 }),
    ])
      .then(([s, a]) => {
        const all = [...(s?.items || []), ...(a?.items || [])];
        const seen = new Set();
        setStaffUsers(
          all.filter((u) => {
            if (seen.has(u._id)) return false;
            seen.add(u._id);
            return true;
          })
        );
      })
      .catch(() => {});
  }, [isAdmin]);

  const saveMeta = async (overrides = {}) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const payload = { ...localMeta, ...overrides };
      await updateTicket(id, {
        category: payload.category,
        priority: payload.priority,
        slaLevel: payload.slaLevel,
        assigneeId: payload.assigneeId || null,
        dueDate: payload.dueDate || null,
        estimatedHours:
          payload.estimatedHours !== "" ? Number(payload.estimatedHours) : null,
        actualHours:
          payload.actualHours !== "" ? Number(payload.actualHours) : null,
        estimatedCost:
          payload.estimatedCost !== "" ? Number(payload.estimatedCost) : null,
        vendor: payload.vendor || null,
        vendorContact: payload.vendorContact || null,
        budgetAmount:
          payload.budgetAmount !== "" ? Number(payload.budgetAmount) : null,
        currency: payload.currency,
        purchaseOrderRef: payload.purchaseOrderRef || null,
        deliveryDate: payload.deliveryDate || null,
        resolution: payload.resolution || null,
        tags: payload.tags,
      });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (status, resolution) => {
    setBusy(true);
    try {
      await updateTicketStatus(id, status, resolution);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (decision, note) => {
    setBusy(true);
    try {
      await approveTicket(id, decision, note);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async ({ body, visibility }) => {
    setBusy(true);
    try {
      await addTicketComment(id, { body, visibility });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Comment failed");
    } finally {
      setBusy(false);
    }
  };

  // ── loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
        {error}
      </div>
    );

  if (!ticket)
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Ticket not found.
      </div>
    );

  const assignee = ticket.assigneeId;
  const assigneeName = assignee?.fullName || assignee?.email || null;
  const client = ticket.customerId?.companyName || ticket.clientId?.companyName;
  const project = ticket.projectId?.name || ticket.projectId?.title;
  const due = dueStatus(ticket.dueDate, ticket.status);
  const isEscalated = ticket.status === "escalated";
  const isTerminal = TERMINAL_STATUSES.includes(ticket.status);
  const elapsedTime = slaElapsed(ticket.createdAt, ticket.resolvedAt);

  return (
    <div className="grid gap-4">
      {confirmEscalate && (
        <InlineConfirm
          message="Escalate this ticket? It will be flagged as urgent and marked escalated."
          confirmLabel="Escalate"
          busy={busy}
          onConfirm={() => {
            setConfirmEscalate(false);
            saveMeta({ priority: "urgent" }).then(() => handleStatus("escalated"));
          }}
          onCancel={() => setConfirmEscalate(false)}
        />
      )}
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] items-start">
      {/* ── LEFT: main content ────────────────────────────────────────────── */}
      <div className="grid gap-4">
        {/* Header card */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
          <button
            onClick={() => nav("/portal/tickets")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={12} /> Back to tickets
          </button>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Ref + badges */}
              <div className="flex flex-wrap items-center gap-2">
                {ticket.ref && (
                  <span className="font-mono text-sm font-black text-slate-400">
                    {ticket.ref}
                  </span>
                )}
                <TicketTypeBadge type={ticket.type} />
                <TicketStatusPill status={ticket.status} />
                {ticket.priority && (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${
                      PRIORITY_COLORS[ticket.priority]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                )}
                {due && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${due.cls}`}
                  >
                    <Clock size={9} /> {due.text}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 leading-snug">
                {ticket.title}
              </h1>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Opened {fmt(ticket.createdAt)}</span>
                {ticket.lastActivityAt &&
                  ticket.lastActivityAt !== ticket.createdAt && (
                    <span>· Updated {fmt(ticket.lastActivityAt)}</span>
                  )}
                {client && (
                  <button
                    type="button"
                    onClick={() =>
                      nav(
                        `/portal/customers/${
                          ticket.customerId?._id || ticket.customerId
                        }`
                      )
                    }
                    className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                  >
                    <Building2 size={11} /> {client}
                  </button>
                )}
                {project && (
                  <button
                    type="button"
                    onClick={() =>
                      nav(
                        `/portal/projects/${
                          ticket.projectId?._id || ticket.projectId
                        }`
                      )
                    }
                    className="inline-flex items-center gap-1 text-slate-500 font-semibold hover:underline"
                  >
                    <FolderOpen size={11} /> {project}
                  </button>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={load}
              disabled={busy || loading}
              className="flex-shrink-0"
            >
              <RefreshCw
                size={13}
                className={busy || loading ? "animate-spin" : ""}
              />
            </Button>
          </div>

          {/* Assignee + SLA strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <User size={13} className="text-slate-300" />
              <span className="text-xs text-slate-400">Handled by</span>
              {assigneeName ? (
                <div className="flex items-center gap-1.5">
                  <Initials name={assigneeName} />
                  <span className="text-sm font-bold text-slate-800">
                    {assigneeName}
                  </span>
                </div>
              ) : (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                  Unassigned
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} /> Time open:{" "}
              <span className="font-bold text-slate-700">{elapsedTime}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield size={12} /> SLA:{" "}
              <span className="font-bold text-slate-700 capitalize">
                {ticket.slaLevel || "standard"}
              </span>
            </div>

            {ticket.firstResponseAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MessageSquare size={12} /> First response:{" "}
                <span className="font-bold text-slate-700">
                  {fmt(ticket.firstResponseAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Escalation banner */}
        {isEscalated && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <AlertTriangle size={16} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-rose-800">
                  This ticket has been escalated
                </div>
                <div className="mt-1 text-xs text-rose-600">
                  Immediate attention required. Assign a handler and update the
                  status to begin resolution.
                </div>
                {isAdmin && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatus("in_progress")}
                      disabled={busy}
                    >
                      Take ownership
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatus("in_review")}
                      disabled={busy}
                    >
                      Move to review
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change request approval banner */}
        {isAdmin &&
          ticket.type === "change_request" &&
          (() => {
            const pending =
              !ticket.approvalStatus || ticket.approvalStatus === "pending";
            const approved = ticket.approvalStatus === "approved";
            if (!pending)
              return (
                <div
                  className={`rounded-2xl border p-4 ${
                    approved
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-sm font-bold ${
                      approved ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {approved ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <XCircle size={15} />
                    )}
                    Change request {approved ? "approved" : "rejected"}
                    {ticket.approvedAt && (
                      <span className="font-normal text-xs ml-1">
                        · {fmtDate(ticket.approvedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            return <CRApprovalPanel onApprove={handleApprove} busy={busy} />;
          })()}

        {/* Description */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
          <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
            Description
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
          {ticket.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CSAT (post-resolution client view) */}
        {isTerminal && !isAdmin && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-black text-amber-800 mb-3">
              How satisfied are you with the resolution?
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={async () => {
                    await updateTicket(id, { satisfactionRating: n });
                    await load();
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-black transition ${
                    ticket.satisfactionRating === n
                      ? "border-amber-400 bg-amber-400 text-white"
                      : "border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {ticket.satisfactionRating && (
              <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                <Star size={11} fill="currentColor" /> You rated this{" "}
                {ticket.satisfactionRating}/5 — thank you!
              </div>
            )}
          </div>
        )}

        {/* Resolution notes (when resolved) */}
        {isTerminal && ticket.resolution && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span className="text-sm font-black text-emerald-800">
                Resolution
              </span>
              <span className="text-xs text-emerald-600">
                {fmt(ticket.resolvedAt)}
              </span>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
              {ticket.resolution}
            </p>
          </div>
        )}

        {/* Thread */}
        <div className="rounded-2xl border border-black/[0.07] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <MessageSquare size={14} className="text-slate-400" />
            <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">
              Thread · {(ticket.comments || []).filter((c) => !c.event).length}{" "}
              messages
            </span>
          </div>
          <div className="p-5">
            <TicketThread comments={ticket.comments || []} isAdmin={isAdmin} />
          </div>
        </div>

        {/* Reply composer */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Send size={13} className="text-slate-400" />
            <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">
              Reply
            </span>
          </div>
          <TicketCommentComposer
            busy={busy}
            isAdmin={isAdmin}
            onSubmit={handleComment}
          />
        </div>
      </div>

      {/* ── RIGHT: control panel ───────────────────────────────────────────── */}
      <div className="grid gap-3 lg:sticky lg:top-4">
        {/* Status workflow (admin) */}
        {isAdmin && (
          <SideCard title="Workflow" icon={Zap}>
            <div className="grid gap-1.5">
              {STATUS_FLOW.map((s) => {
                const isCurrent = ticket.status === s.key;
                const isTerminalStatus = TERMINAL_STATUSES.includes(s.key);
                const c = STATUS_COLORS[s.color];
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      if (isCurrent || busy) return;
                      if (isTerminalStatus) {
                        setPrompt({
                          title: "Resolution Note",
                          inputLabel: "NOTE (OPTIONAL)",
                          inputPlaceholder: "Briefly describe how this was resolved…",
                          inputType: "textarea",
                          confirmLabel: "Confirm",
                          onConfirm: async (value) => {
                            setPrompt(null);
                            await handleStatus(s.key, value);
                          },
                        });
                      } else {
                        handleStatus(s.key);
                      }
                    }}
                    disabled={busy || saving}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      isCurrent ? c.active : `bg-white ${c.idle} cursor-pointer`
                    } disabled:opacity-40`}
                  >
                    <span>{s.label}</span>
                    {isCurrent && <CheckCircle2 size={13} />}
                  </button>
                );
              })}
            </div>

            {!isTerminal && (
              <button
                onClick={() => setConfirmEscalate(true)}
                disabled={busy || isEscalated}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 transition disabled:opacity-40"
              >
                <AlertTriangle size={12} /> Escalate ticket
              </button>
            )}
          </SideCard>
        )}

        {/* Assignment (admin) */}
        {isAdmin && (
          <SideCard title="Assignment" icon={User}>
            <div className="mb-3">
              {assigneeName ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  <Initials name={assigneeName} size="lg" />
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {assigneeName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Currently handling
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertTriangle size={13} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-700">
                    No one assigned yet
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
              Assign to staff
            </div>
            <select
              value={localMeta.assigneeId}
              onChange={(e) => {
                const val = e.target.value;
                setLocalMeta((p) => ({ ...p, assigneeId: val }));
                saveMeta({ assigneeId: val });
              }}
              disabled={saving || busy}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300 disabled:opacity-50"
            >
              <option value="">— Unassigned —</option>
              {staffUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
            {saving && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                <Loader2 size={10} className="animate-spin" /> Saving…
              </div>
            )}
          </SideCard>
        )}

        {/* Details (editable for admin, read-only for client) */}
        <SideCard title="Details" icon={Tag}>
          {isAdmin ? (
            <div className="grid gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
                  Category
                </div>
                <select
                  value={localMeta.category}
                  onChange={(e) =>
                    setLocalMeta((p) => ({ ...p, category: e.target.value }))
                  }
                  onBlur={() => saveMeta()}
                  disabled={saving}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300"
                >
                  {CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
                  Priority
                </div>
                <select
                  value={localMeta.priority}
                  onChange={(e) =>
                    setLocalMeta((p) => ({ ...p, priority: e.target.value }))
                  }
                  onBlur={() => saveMeta()}
                  disabled={saving}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300"
                >
                  {PRIORITY_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
                  SLA Level
                </div>
                <select
                  value={localMeta.slaLevel}
                  onChange={(e) =>
                    setLocalMeta((p) => ({ ...p, slaLevel: e.target.value }))
                  }
                  onBlur={() => saveMeta()}
                  disabled={saving}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300"
                >
                  {SLA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
                  Due Date
                </div>
                <input
                  type="date"
                  value={localMeta.dueDate}
                  onChange={(e) =>
                    setLocalMeta((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  onBlur={() => saveMeta()}
                  disabled={saving}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-300"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                  Tags
                </div>
                <TagsEditor
                  tags={localMeta.tags || []}
                  onChange={(tags) => {
                    setLocalMeta((p) => ({ ...p, tags }));
                    saveMeta({ tags });
                  }}
                  disabled={saving}
                />
              </div>
              <button
                onClick={() => saveMeta()}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-40"
              >
                <Save size={11} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <div>
              <MetaRow icon={Tag} label="Category">
                {ticket.category?.replaceAll("_", " ") || "—"}
              </MetaRow>
              <MetaRow icon={Tag} label="Priority">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
                    PRIORITY_COLORS[ticket.priority] || ""
                  }`}
                >
                  {ticket.priority || "—"}
                </span>
              </MetaRow>
              <MetaRow icon={Calendar} label="Due">
                {fmtDate(ticket.dueDate)}
              </MetaRow>
              <MetaRow icon={Shield} label="SLA">
                {ticket.slaLevel || "standard"}
              </MetaRow>
            </div>
          )}
        </SideCard>

        {/* SLA / Timing */}
        {(ticket.firstResponseAt || ticket.resolvedAt) && (
          <SideCard title="SLA Timing" icon={Clock} accent="emerald">
            {ticket.firstResponseAt && (
              <MetaRow icon={MessageSquare} label="First Response">
                {fmt(ticket.firstResponseAt)}
              </MetaRow>
            )}
            {ticket.resolvedAt && (
              <MetaRow icon={CheckCircle2} label="Resolved At">
                {fmt(ticket.resolvedAt)}
              </MetaRow>
            )}
            <MetaRow icon={Clock} label="Total Time">
              {elapsedTime}
            </MetaRow>
          </SideCard>
        )}

        {/* Resolution (admin writes when resolving) */}
        {isAdmin && isTerminal && (
          <SideCard
            title="Resolution Notes"
            icon={CheckCircle2}
            accent="emerald"
          >
            <textarea
              value={localMeta.resolution}
              onChange={(e) =>
                setLocalMeta((p) => ({ ...p, resolution: e.target.value }))
              }
              onBlur={() => saveMeta()}
              placeholder="Describe how this was resolved…"
              rows={3}
              disabled={saving}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-300"
            />
          </SideCard>
        )}

        {/* Change Request fields */}
        {ticket.type === "change_request" && isAdmin && (
          <SideCard title="Change Request" icon={ChevronRight} accent="violet">
            <div className="grid gap-2">
              {[
                { key: "estimatedHours", label: "Est. Hours", type: "number" },
                { key: "actualHours", label: "Actual Hours", type: "number" },
                { key: "estimatedCost", label: "Est. Cost", type: "number" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">
                    {label}
                  </div>
                  <input
                    type={type}
                    min="0"
                    value={localMeta[key] ?? ""}
                    onChange={(e) =>
                      setLocalMeta((p) => ({ ...p, [key]: e.target.value }))
                    }
                    onBlur={() => saveMeta()}
                    placeholder="0"
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-violet-300"
                  />
                </div>
              ))}
            </div>
          </SideCard>
        )}

        {/* Procurement fields */}
        {ticket.type === "procurement" && isAdmin && (
          <SideCard title="Procurement" icon={ChevronRight}>
            <div className="grid gap-2">
              {[
                { key: "vendor", label: "Vendor", type: "text" },
                { key: "vendorContact", label: "Contact", type: "text" },
                { key: "budgetAmount", label: "Budget", type: "number" },
                {
                  key: "purchaseOrderRef",
                  label: "PO Reference",
                  type: "text",
                },
                { key: "deliveryDate", label: "Delivery Date", type: "date" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">
                    {label}
                  </div>
                  <input
                    type={type}
                    value={localMeta[key] ?? ""}
                    onChange={(e) =>
                      setLocalMeta((p) => ({ ...p, [key]: e.target.value }))
                    }
                    onBlur={() => saveMeta()}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-300"
                  />
                </div>
              ))}
            </div>
          </SideCard>
        )}

        {/* Activity timeline (from comment events) */}
        {(() => {
          const events = (ticket.comments || []).filter((c) => c.event);
          if (!events.length) return null;
          return (
            <SideCard title="Activity Log" icon={Clock}>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100" />
                <div className="grid gap-3 pl-7">
                  {events.map((e, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-4 top-0.5 h-2 w-2 rounded-full border-2 border-indigo-300 bg-white" />
                      <div className="text-xs font-semibold text-slate-700">
                        {e.event?.replaceAll("_", " ")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fmt(e.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SideCard>
          );
        })()}
      </div>
    </div>

    <PromptModal
      open={!!prompt}
      {...prompt}
      onClose={() => setPrompt(null)}
    />
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function TagsEditor({ tags, onChange, disabled }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
          >
            #{tag}
            {!disabled && (
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-slate-300 hover:text-rose-500 ml-0.5"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add tag…"
            className="h-7 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-indigo-300"
          />
          <button
            onClick={add}
            className="rounded-lg bg-slate-100 px-2.5 text-xs text-slate-600 hover:bg-slate-200 font-bold"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function CRApprovalPanel({ onApprove, busy }) {
  const [note, setNote] = useState("");
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <Lock size={13} className="text-violet-600" />
        </div>
        <span className="text-sm font-black text-violet-900">
          Change request pending approval
        </span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Approval note (optional)…"
        rows={2}
        className="w-full resize-none rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-violet-300 focus:border-violet-400"
        disabled={busy}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onApprove("approved", note)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-700 transition disabled:opacity-40"
        >
          <CheckCircle2 size={13} /> Approve
        </button>
        <button
          onClick={() => onApprove("rejected", note)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition disabled:opacity-40"
        >
          <XCircle size={13} /> Reject
        </button>
      </div>
    </div>
  );
}
