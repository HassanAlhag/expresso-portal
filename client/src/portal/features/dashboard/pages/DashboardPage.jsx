import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Ticket,
  UploadCloud,
  CheckCircle2,
  Building2,
  Users,
  FolderKanban,
  Clapperboard,
  TrendingUp,
  Wallet,
  CircleDollarSign,
  Handshake,
  BarChart3,
  Package,
  ShoppingCart,
  Zap,
  FileText,
  Files,
  AlertTriangle,
  ReceiptText,
  CalendarDays,
  MessageCircle,
  BarChart2,
} from "lucide-react";

import Skeleton from "../../../shared/ui/Skeleton";
import { listJobs } from "../../jobs/api";
import { getTicketStats, listTickets } from "../../tickets/api";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listDeals } from "../../crm/api";
import { getProcurementStats, listRfqs } from "../../procurement/api";
import { getBillingStats } from "../../billing/api";
import { getExpenseStats, getLeaveStats } from "../../hr/api";
import { listEnrollments } from "../../enrollments/api";

/* ─── helpers ──────────────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtMoney(n, currency = "AED") {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtAed(n) {
  return `AED ${fmtMoney(Number(n || 0))}`;
}

function getPortalRole() {
  try {
    const token = localStorage.getItem("portal_token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]))?.role || null;
  } catch {
    return null;
  }
}

/* ─── KPI tile ──────────────────────────────────────────────────────── */

const ACCENTS = {
  brand: { bg: "rgba(111,127,217,0.11)", icon: "#6f7fd9" },
  blue: { bg: "rgba(59,130,246,0.11)", icon: "#3b82f6" },
  green: { bg: "rgba(16,185,129,0.11)", icon: "#10b981" },
  rose: { bg: "rgba(244,63,94,0.10)", icon: "#f03f5e" },
  amber: { bg: "rgba(245,158,11,0.11)", icon: "#f59e0b" },
  violet: { bg: "rgba(139,92,246,0.11)", icon: "#8b5cf6" },
  emerald: { bg: "rgba(5,150,105,0.11)", icon: "#059669" },
};

function KpiTile({ icon: Icon, label, value, sub, accent = "brand", onClick }) {
  const a = ACCENTS[accent] || ACCENTS.brand;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[24px] border border-black/[0.07] bg-white p-5 flex flex-col gap-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.10)] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <div
          className="h-10 w-10 rounded-xl grid place-items-center flex-shrink-0"
          style={{ background: a.bg }}
        >
          <Icon size={18} style={{ color: a.icon }} strokeWidth={1.9} />
        </div>
        <TrendingUp
          size={13}
          className="text-slate-200 group-hover:text-slate-300 transition mt-0.5"
        />
      </div>
      <div>
        <div className="text-[28px] font-black tracking-tight text-slate-900 leading-none">
          {value}
        </div>
        <div className="mt-1.5 text-[13px] font-semibold text-slate-500">
          {label}
        </div>
        {sub ? (
          <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>
        ) : null}
      </div>
    </button>
  );
}

/* ─── status chip ───────────────────────────────────────────────────── */

const STATUS_MAP = {
  review: {
    label: "Review",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  shoot: { label: "Shoot", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  uploaded: {
    label: "Uploaded",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  delivered: {
    label: "Delivered",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  todo: { label: "To do", cls: "bg-slate-50 text-slate-500 border-slate-200" },
  open: { label: "Open", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  closed: {
    label: "Closed",
    cls: "bg-slate-50 text-slate-500 border-slate-200",
  },
  resolved: {
    label: "Resolved",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  done: {
    label: "Done",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function StatusChip({ status }) {
  const k = (status || "").toLowerCase();
  const s = STATUS_MAP[k] || {
    label: status || "—",
    cls: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

/* ─── pipeline bar ──────────────────────────────────────────────────── */

// Grouped from the real Job statuses (portal-api job.constants.js). The old
// keys (todo/shoot/uploaded/review) no longer exist, so every bar read 0 (B3).
const STAGES = [
  { key: "planning", label: "Planning", color: "#cbd5e1", statuses: ["brief", "content_ready", "script", "pre_production"] },
  { key: "production", label: "In production", color: "#3b82f6", statuses: ["designing", "shooting", "editing"] },
  { key: "review", label: "In review", color: "#f59e0b", statuses: ["internal_review", "client_review"] },
  { key: "ready", label: "Approved / scheduled", color: "#8b5cf6", statuses: ["approved", "scheduled"] },
  { key: "delivered", label: "Delivered", color: "#10b981", statuses: ["published", "delivered"] },
];

const STAGE_OF_STATUS = Object.fromEntries(
  STAGES.flatMap((s) => s.statuses.map((status) => [status, s.key]))
);
const REVIEW_STATUSES = new Set(["internal_review", "client_review"]);
const IN_PROGRESS_STATUSES = new Set(["script", "pre_production", "designing", "shooting", "editing"]);
const DELIVERED_STATUSES = new Set(["published", "delivered"]);

function PipelineBar({ jobs }) {
  const counts = useMemo(() => {
    const m = {};
    STAGES.forEach((s) => {
      m[s.key] = 0;
    });
    jobs.forEach((j) => {
      const k = STAGE_OF_STATUS[String(j.status || "").toLowerCase()];
      if (k) m[k]++;
    });
    return m;
  }, [jobs]);

  const total = Math.max(jobs.length, 1);

  return (
    <div className="grid gap-4">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {STAGES.map((s) =>
          counts[s.key] > 0 ? (
            <div
              key={s.key}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all"
              style={{
                width: `${(counts[s.key] / total) * 100}%`,
                backgroundColor: s.color,
              }}
              title={`${s.label}: ${counts[s.key]}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {STAGES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-xs font-bold text-slate-700">
              {counts[s.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CRM stage bar ─────────────────────────────────────────────────── */

const CRM_STAGES = [
  { key: "discovery", label: "Discovery", color: "#94a3b8" },
  { key: "qualified", label: "Qualified", color: "#3b82f6" },
  { key: "proposal", label: "Proposal", color: "#6366f1" },
  { key: "negotiation", label: "Negotiation", color: "#f59e0b" },
  { key: "verbal_commitment", label: "Committed", color: "#8b5cf6" },
  { key: "won", label: "Won", color: "#10b981" },
];

function CrmPipelineBar({ deals }) {
  const counts = useMemo(() => {
    const m = {};
    CRM_STAGES.forEach((s) => {
      m[s.key] = 0;
    });
    deals.forEach((d) => {
      const k = (d.stage || "discovery").toLowerCase();
      if (k in m) m[k]++;
    });
    return m;
  }, [deals]);

  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const totalValue = open.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const total = Math.max(deals.filter((d) => d.stage !== "lost").length, 1);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Open pipeline value</div>
        <div className="text-sm font-black text-slate-900">
          AED {fmtMoney(totalValue)}
        </div>
      </div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {CRM_STAGES.map((s) =>
          counts[s.key] > 0 ? (
            <div
              key={s.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(counts[s.key] / total) * 100}%`,
                backgroundColor: s.color,
              }}
              title={`${s.label}: ${counts[s.key]}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {CRM_STAGES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-xs font-bold text-slate-700">
              {counts[s.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── shortcut ──────────────────────────────────────────────────────── */

function Shortcut({ icon: Icon, label, sub, bg, to, nav }) {
  return (
    <button
      type="button"
      onClick={() => nav(to)}
      className="group flex w-full items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50 active:scale-[0.99]"
    >
      <div
        className="h-9 w-9 flex-shrink-0 rounded-xl grid place-items-center transition group-hover:scale-105"
        style={{ background: bg }}
      >
        <Icon size={16} className="text-slate-600" strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900">
          {label}
        </div>
        <div className="truncate text-[11px] text-slate-400">{sub}</div>
      </div>
      <ArrowRight
        size={13}
        className="flex-shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
      />
    </button>
  );
}

/* ─── section header ────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title, badge, action, onAction }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
      <Icon
        size={15}
        className="flex-shrink-0 text-slate-400"
        strokeWidth={2}
      />
      <span className="text-[13px] font-bold text-slate-700">{title}</span>
      {badge != null ? (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
          {badge}
        </span>
      ) : null}
      {action ? (
        <button
          onClick={onAction}
          className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-slate-700"
        >
          {action}
          <ArrowRight size={11} />
        </button>
      ) : null}
    </div>
  );
}

/* ─── list row ──────────────────────────────────────────────────────── */

function ListRow({ title, sub, status, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50/80"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {meta && (
          <span className="text-[11px] font-semibold text-slate-500">
            {meta}
          </span>
        )}
        <StatusChip status={status} />
      </div>
    </button>
  );
}

function ControlMetric({
  icon: Icon,
  label,
  value,
  sub,
  tone = "slate",
  onClick,
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[116px] flex-col items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50 active:scale-[0.99]"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div
          className={[
            "grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl",
            tones[tone] || tones.slate,
          ].join(" ")}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
        <ArrowRight
          size={13}
          className="mt-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
        />
      </div>
      <div className="min-w-0">
        <div className="text-[23px] font-black leading-none tracking-tight text-slate-900">
          {value}
        </div>
        <div className="mt-1.5 text-[12px] font-bold text-slate-600">
          {label}
        </div>
        <div className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
          {sub}
        </div>
      </div>
    </button>
  );
}

function EmptyRows({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <Icon size={28} className="mb-2 text-slate-200" strokeWidth={1.5} />
      <p className="text-[13px] font-semibold text-slate-400">{message}</p>
    </div>
  );
}

/* ─── client dashboard ──────────────────────────────────────────────── */

function ClientDashboard({ nav }) {
  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("portal_user") || "{}"); }
    catch { return {}; }
  }, []);

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets]     = useState([]);
  const [projects, setProjects]   = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [monthJobs, setMonthJobs] = useState([]);

  useEffect(() => {
    const clientId = me?.clientId;
    (async () => {
      setLoading(true);
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        // Only call endpoints this user may use, and let each widget fail on
        // its own: one 403 used to blank the whole client dashboard (B7).
        const perms = new Set(
          (() => {
            try {
              return JSON.parse(localStorage.getItem("portal_permissions") || "[]");
            } catch {
              return [];
            }
          })()
        );
        const empty = Promise.resolve({ items: [] });
        const [t, p, e, j] = await Promise.allSettled([
          perms.has("tickets.read") ? listTickets({ limit: 50, page: 1 }) : empty,
          clientId && perms.has("projects.read") ? listProjects({ customerId: clientId, status: "active", limit: 10 }) : empty,
          clientId && perms.has("enrollments.read") ? listEnrollments({ customerId: clientId, status: "active", limit: 1 }) : empty,
          clientId && perms.has("jobs.read") ? listJobs({ customerId: clientId, dueDateFrom: firstDay, dueDateTo: lastDay, limit: 200 }) : empty,
        ]);
        const items = (r) => (r.status === "fulfilled" ? r.value?.items || [] : []);
        setTickets(items(t));
        setProjects(items(p));
        setEnrollment(items(e)[0] || null);
        setMonthJobs(items(j));
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  const openTickets = useMemo(
    () => tickets.filter((x) => !["closed", "resolved", "done"].includes((x.status || "").toLowerCase())),
    [tickets]
  );
  // Deliverables tracker (#18)
  const deliverableTarget = useMemo(() => {
    if (!enrollment?.finalScope?.groups) return 0;
    return enrollment.finalScope.groups.reduce(
      (sum, g) => sum + (g.jobs || []).reduce((s2, j) => s2 + (j.quantity || 1), 0),
      0
    );
  }, [enrollment]);
  const deliverablesDone = useMemo(
    () => monthJobs.filter((j) => j.publishStatus === "published" || j.status === "delivered").length,
    [monthJobs]
  );
  const postsAwaitingApproval = useMemo(
    () => monthJobs.filter((j) => j.status === "client_review").length,
    [monthJobs]
  );

  return (
    <div className="grid gap-5">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-6 text-white shadow-[0_8px_32px_rgba(15,23,42,0.16)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl" style={{ backgroundColor: "#6f7fd9", opacity: 0.22 }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(111,127,217,0.5) 50%, transparent)" }} />
        <div className="relative z-10">
          <p className="text-[12px] font-medium tracking-wide text-white/45">{fmtDate()}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">{greeting()}</h1>
          <p className="mt-1 text-[13px] text-white/55">
            {loading ? "Loading workspace…" : `${openTickets.length} open ticket${openTickets.length !== 1 ? "s" : ""} · ${postsAwaitingApproval} post${postsAwaitingApproval !== 1 ? "s" : ""} pending approval`}
          </p>

          {/* #21 Quick Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => nav("/portal/content-calendar")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.14]">
              <CalendarDays size={14} /> View Calendar
            </button>
            {postsAwaitingApproval > 0 && (
              <button type="button" onClick={() => nav("/portal/content-calendar")}
                className="flex items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/20 px-4 py-2 text-[13px] font-semibold text-orange-200 transition hover:bg-orange-500/30">
                <CheckCircle2 size={14} /> Approve Posts
                <span className="ml-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white">{postsAwaitingApproval}</span>
              </button>
            )}
            <button type="button" onClick={() => nav("/portal/files")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.14]">
              <UploadCloud size={14} /> Upload Asset
            </button>
            <button type="button" onClick={() => nav("/portal/messages")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/[0.14]">
              <MessageCircle size={14} /> Message Agency
            </button>
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiTile icon={Ticket} label="Open Tickets" value={openTickets.length} sub="Awaiting response" accent="rose" onClick={() => nav("/portal/tickets")} />
          <KpiTile icon={FolderKanban} label="Active Projects" value={projects.length} sub="In progress" accent="brand" onClick={() => nav("/portal/projects")} />
          <KpiTile icon={BarChart2} label="Posts Pending" value={postsAwaitingApproval} sub="Need your approval" accent="amber" onClick={() => nav("/portal/content-calendar")} />
        </div>
      )}

      {/* #17 Enrollment + #18 Deliverables */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Enrollment widget */}
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ReceiptText size={15} className="text-indigo-500" />
              <p className="text-[13px] font-bold text-slate-800">Active Package</p>
            </div>
            {enrollment ? (
              <div>
                <p className="text-[15px] font-black text-slate-900 truncate">
                  {enrollment.serviceTemplateName || enrollment.serviceTemplateId?.name || "Service Plan"}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                  {enrollment.pricing?.billingCycle && (
                    <span>🔄 {enrollment.pricing.billingCycle}</span>
                  )}
                  {enrollment.pricing?.price && (
                    <span>💳 {fmtAed(enrollment.pricing.price)}</span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600 capitalize">{enrollment.status || "active"}</span>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">No active package found.</p>
            )}
          </div>

          {/* Deliverables tracker */}
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clapperboard size={15} className="text-indigo-500" />
              <p className="text-[13px] font-bold text-slate-800">Deliverables — This Month</p>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[28px] font-black text-slate-900">{deliverablesDone}</span>
              <span className="text-[13px] text-slate-400">of {deliverableTarget || monthJobs.length || "—"} posts</span>
            </div>
            {(deliverableTarget > 0 || monthJobs.length > 0) && (() => {
              const total = deliverableTarget || monthJobs.length;
              const pct = total > 0 ? Math.min(100, Math.round((deliverablesDone / total) * 100)) : 0;
              return (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#6F7FD9] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{pct}% delivered</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr,0.5fr]">
        {/* #16 Active Projects + Tickets combined panel */}
        <div className="grid gap-4">
          {/* Active Projects */}
          {!loading && projects.length > 0 && (
            <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
              <SectionHeader icon={FolderKanban} title="Active Projects" badge={projects.length} action="View all" onAction={() => nav("/portal/projects")} />
              <div className="divide-y divide-slate-50/80">
                {projects.slice(0, 4).map((p) => (
                  <ListRow
                    key={p._id}
                    title={p.name || p.title || "Project"}
                    sub={p.phase || p.status || "—"}
                    status={p.status || "active"}
                    onClick={() => nav(`/portal/projects/${p._id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
            <SectionHeader
              icon={Ticket}
              title="Your tickets"
              badge={!loading ? openTickets.length : undefined}
              action="View all"
              onAction={() => nav("/portal/tickets")}
            />
            <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : tickets.length === 0 ? (
              <EmptyRows icon={Ticket} message="No tickets yet." />
            ) : (
              tickets
                .slice(0, 8)
                .map((t) => (
                  <ListRow
                    key={t._id}
                    title={t.title || t.subject || "Ticket"}
                    sub={t.ref || t.category || "—"}
                    status={t.status || "open"}
                    onClick={() => nav(`/portal/tickets/${t._id}`)}
                  />
                ))
            )}
          </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader icon={Zap} title="Quick access" />
          <div className="p-2 grid gap-0.5">
            <Shortcut
              icon={CalendarDays}
              label="Content Calendar"
              sub="Social posts & approvals"
              bg="rgba(111,127,217,0.09)"
              to="/portal/content-calendar"
              nav={nav}
            />
            <Shortcut
              icon={MessageCircle}
              label="Messages"
              sub="Chat with your agency"
              bg="rgba(16,185,129,0.09)"
              to="/portal/messages"
              nav={nav}
            />
            <Shortcut
              icon={Ticket}
              label="Tickets"
              sub="Support & requests"
              bg="rgba(111,127,217,0.09)"
              to="/portal/tickets"
              nav={nav}
            />
            <Shortcut
              icon={Files}
              label="Files"
              sub="Documents & uploads"
              bg="rgba(139,92,246,0.09)"
              to="/portal/files"
              nav={nav}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── vendor dashboard ──────────────────────────────────────────────── */

function VendorDashboard({ nav }) {
  const [loading, setLoading] = useState(true);
  const [rfqs, setRfqs] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await listRfqs({ limit: 20, page: 1 });
        setRfqs(r?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openRfqs = useMemo(
    () => rfqs.filter((r) => r.status !== "closed"),
    [rfqs]
  );

  return (
    <div className="grid gap-5">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-6 text-white shadow-[0_8px_32px_rgba(15,23,42,0.16)]">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl"
          style={{ backgroundColor: "#6f7fd9", opacity: 0.22 }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(111,127,217,0.5) 50%, transparent)",
          }}
        />
        <div className="relative z-10">
          <p className="text-[12px] font-medium tracking-wide text-white/45">
            {fmtDate()}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {greeting()}
          </h1>
          <p className="mt-1 text-[13px] text-white/55">
            {loading
              ? "Loading workspace…"
              : `${openRfqs.length} open RFQ${openRfqs.length !== 1 ? "s" : ""} · ${rfqs.length} total`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiTile
            icon={FileText}
            label="Open RFQs"
            value={openRfqs.length}
            sub="Awaiting quotation"
            accent="blue"
            onClick={() => nav("/portal/procurement/rfqs")}
          />
          <KpiTile
            icon={CheckCircle2}
            label="Total RFQs"
            value={rfqs.length}
            sub="All time"
            accent="brand"
            onClick={() => nav("/portal/procurement/rfqs")}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr,0.5fr]">
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader
            icon={FileText}
            title="Recent RFQs"
            badge={!loading ? openRfqs.length : undefined}
            action="View all"
            onAction={() => nav("/portal/procurement/rfqs")}
          />
          <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : rfqs.length === 0 ? (
              <EmptyRows icon={FileText} message="No RFQs assigned yet." />
            ) : (
              rfqs.slice(0, 8).map((r) => (
                <ListRow
                  key={r._id}
                  title={r.title || r.ref || "Untitled RFQ"}
                  sub={r.category || "—"}
                  status={r.status || "open"}
                  onClick={() => nav(`/portal/procurement/rfqs/${r._id}`)}
                />
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader icon={Zap} title="Quick access" />
          <div className="p-2 grid gap-0.5">
            <Shortcut
              icon={FileText}
              label="RFQs"
              sub="Requests for quotation"
              bg="rgba(59,130,246,0.09)"
              to="/portal/procurement/rfqs"
              nav={nav}
            />
            <Shortcut
              icon={ShoppingCart}
              label="Procurement"
              sub="Overview & pipeline"
              bg="rgba(16,185,129,0.09)"
              to="/portal/procurement"
              nav={nav}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const nav = useNavigate();
  const role = getPortalRole();
  const isExternalClient = ["client", "staff_client", "procurement_client", "client_admin"].includes(role);

  // All hooks must run unconditionally — role-based early returns come after.
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientTotal, setClientTotal] = useState(0);
  const [projectTotal, setProjectTotal] = useState(0);
  const [deals, setDeals] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [billingStats, setBillingStats] = useState(null);
  const [procurementStats, setProcurementStats] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);

  useEffect(() => {
    // Skip admin data fetch for non-admin roles — they have their own dashboards.
    if (isExternalClient || role === "vendor") {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [
          jobsRes,
          ticketsRes,
          ticketStatsRes,
          customersRes,
          projectsRes,
          dealsRes,
          billingRes,
          procurementRes,
          expenseRes,
          leaveRes,
        ] = await Promise.allSettled([
          listJobs({ limit: 100, page: 1 }),
          listTickets({ limit: 50, page: 1 }),
          getTicketStats(),
          listCustomers({ limit: 6, page: 1, sort: "-createdAt" }),
          listProjects({ limit: 1, page: 1 }),
          listDeals({ limit: 100, page: 1 }),
          getBillingStats(),
          getProcurementStats(),
          getExpenseStats(),
          getLeaveStats(),
        ]);

        const j = jobsRes.status === "fulfilled" ? jobsRes.value : null;
        const t = ticketsRes.status === "fulfilled" ? ticketsRes.value : null;
        const ts =
          ticketStatsRes.status === "fulfilled" ? ticketStatsRes.value : null;
        const c = customersRes.status === "fulfilled" ? customersRes.value : null;
        const p = projectsRes.status === "fulfilled" ? projectsRes.value : null;
        const d = dealsRes.status === "fulfilled" ? dealsRes.value : null;
        const b = billingRes.status === "fulfilled" ? billingRes.value : null;
        const pr =
          procurementRes.status === "fulfilled" ? procurementRes.value : null;
        const e = expenseRes.status === "fulfilled" ? expenseRes.value : null;
        const l = leaveRes.status === "fulfilled" ? leaveRes.value : null;

        setJobs(j?.items || []);
        setTickets(t?.items || []);
        setTicketStats(ts);
        setClients(c?.items || []);
        setClientTotal(c?.total ?? 0);
        setProjectTotal(p?.total ?? 0);
        setDeals(Array.isArray(d?.items) ? d.items : []);
        setBillingStats(b);
        setProcurementStats(pr);
        setExpenseStats(e);
        setLeaveStats(l);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const approvals = useMemo(
    () => jobs.filter((x) => REVIEW_STATUSES.has(x.status)),
    [jobs]
  );
  const inProgress = useMemo(
    () => jobs.filter((x) => IN_PROGRESS_STATUSES.has(x.status)),
    [jobs]
  );
  const delivered = useMemo(
    () => jobs.filter((x) => DELIVERED_STATUSES.has(x.status)),
    [jobs]
  );
  const openTickets = useMemo(
    () =>
      tickets.filter(
        (x) =>
          !["closed", "resolved", "done"].includes(
            (x.status || "").toLowerCase()
          )
      ),
    [tickets]
  );
  const openDeals = useMemo(
    () => deals.filter((x) => !["won", "lost"].includes(x.stage)),
    [deals]
  );
  const wonDeals = useMemo(
    () => deals.filter((x) => x.stage === "won"),
    [deals]
  );
  const pipelineValue = useMemo(
    () => openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
    [openDeals]
  );
  const overdueTickets = ticketStats?.overdue ?? null;
  const billingOutstanding = Number(billingStats?.totalOutstanding || 0);
  const billingOverdue = Number(billingStats?.totalOverdue || 0);
  const procurementPending =
    procurementStats?.totals?.pending ??
    (procurementStats
      ? (procurementStats.byStatus?.new || 0) +
        (procurementStats.byStatus?.assessing || 0) +
        (procurementStats.byStatus?.quoted || 0)
      : null);
  const procurementUrgentHigh = procurementStats
    ? (procurementStats.totals?.urgent ??
        (procurementStats.byPriority?.urgent || 0)) +
      (procurementStats.totals?.high ?? (procurementStats.byPriority?.high || 0))
    : null;
  const pendingExpenses = expenseStats?.totals?.pending ?? null;
  const submittedLeaves = leaveStats?.totals?.submitted ?? null;
  const controlItems = useMemo(
    () =>
      [
        billingStats
          ? {
              key: "cash",
              icon: Wallet,
              label: "Cash collection",
              value: fmtAed(billingOutstanding),
              sub: `${fmtAed(billingOverdue)} overdue balance`,
              tone: billingOverdue > 0 ? "rose" : "emerald",
              signal: billingOverdue,
              to: "/portal/billing",
            }
          : null,
        ticketStats
          ? {
              key: "sla",
              icon: AlertTriangle,
              label: "Support SLA",
              value: overdueTickets ?? 0,
              sub: `${openTickets.length} active support ticket${
                openTickets.length !== 1 ? "s" : ""
              }`,
              tone: overdueTickets > 0 ? "rose" : "blue",
              signal: overdueTickets ?? 0,
              to: "/portal/tickets",
            }
          : null,
        {
          key: "approvals",
          icon: ClipboardList,
          label: "Creative approvals",
          value: approvals.length,
          sub: "jobs waiting for review",
          tone: approvals.length > 0 ? "amber" : "emerald",
          signal: approvals.length,
          to: "/portal/productions",
        },
        procurementStats
          ? {
              key: "procurement",
              icon: ShoppingCart,
              label: "Procurement pressure",
              value: procurementUrgentHigh ?? 0,
              sub: `${procurementPending ?? 0} pending requests`,
              tone: procurementUrgentHigh > 0 ? "amber" : "blue",
              signal: procurementUrgentHigh ?? 0,
              to: "/portal/procurement",
            }
          : null,
        expenseStats || leaveStats
          ? {
              key: "hr",
              icon: ReceiptText,
              label: "HR approvals",
              value: (pendingExpenses ?? 0) + (submittedLeaves ?? 0),
              sub: `${pendingExpenses ?? 0} expenses · ${
                submittedLeaves ?? 0
              } leaves`,
              tone:
                (pendingExpenses ?? 0) + (submittedLeaves ?? 0) > 0
                  ? "violet"
                  : "emerald",
              signal: (pendingExpenses ?? 0) + (submittedLeaves ?? 0),
              to: "/portal/hr",
            }
          : null,
      ].filter(Boolean),
    [
      approvals.length,
      billingOutstanding,
      billingOverdue,
      billingStats,
      expenseStats,
      leaveStats,
      openTickets.length,
      overdueTickets,
      pendingExpenses,
      procurementPending,
      procurementStats,
      procurementUrgentHigh,
      submittedLeaves,
      ticketStats,
    ]
  );
  const controlSignalCount = controlItems.reduce(
    (sum, item) => sum + (Number(item.signal || 0) > 0 ? 1 : 0),
    0
  );

  if (isExternalClient) return <ClientDashboard nav={nav} />;
  if (role === "vendor") return <VendorDashboard nav={nav} />;

  return (
    <div className="grid gap-5">
      {/* ── 1. Greeting banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-6 text-white shadow-[0_8px_32px_rgba(15,23,42,0.16)]">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl"
          style={{ backgroundColor: "#6f7fd9", opacity: 0.22 }}
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-32 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: "#6f7fd9", opacity: 0.08 }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(111,127,217,0.5) 50%, transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-medium tracking-wide text-white/45">
              {fmtDate()}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              {greeting()}
            </h1>
            <p className="mt-1 text-[13px] text-white/55">
              {loading
                ? "Loading workspace…"
                : `${approvals.length} approval${
                    approvals.length !== 1 ? "s" : ""
                  } waiting · ${openTickets.length} open ticket${
                    openTickets.length !== 1 ? "s" : ""
                  } · AED ${fmtMoney(pipelineValue)} in pipeline`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => nav("/portal/crm/deals")}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.12]"
            >
              CRM Deals
            </button>
            <button
              type="button"
              onClick={() => nav("/portal/tickets")}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.12]"
            >
              New ticket
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. KPI row ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KpiTile
            icon={ClipboardList}
            label="Approvals"
            value={approvals.length}
            sub="Jobs in review"
            accent="amber"
            onClick={() => nav("/portal/productions")}
          />
          <KpiTile
            icon={UploadCloud}
            label="In Progress"
            value={inProgress.length}
            sub="Shoot / uploaded"
            accent="blue"
            onClick={() => nav("/portal/productions")}
          />
          <KpiTile
            icon={CheckCircle2}
            label="Delivered"
            value={delivered.length}
            sub="Completed jobs"
            accent="emerald"
            onClick={() => nav("/portal/productions")}
          />
          <KpiTile
            icon={Ticket}
            label="Open Tickets"
            value={openTickets.length}
            sub="Active support"
            accent="rose"
            onClick={() => nav("/portal/tickets")}
          />
          <KpiTile
            icon={Building2}
            label="Clients"
            value={clientTotal}
            sub="Total accounts"
            accent="brand"
            onClick={() => nav("/portal/customers")}
          />
          <KpiTile
            icon={Handshake}
            label="Open Deals"
            value={openDeals.length}
            sub={`AED ${fmtMoney(pipelineValue)}`}
            accent="violet"
            onClick={() => nav("/portal/crm/deals")}
          />
          <KpiTile
            icon={FolderKanban}
            label="Projects"
            value={projectTotal}
            sub="All time"
            accent="blue"
            onClick={() => nav("/portal/projects")}
          />
        </div>
      )}

      {/* ── 3. Management control ── */}
      <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
        <SectionHeader
          icon={AlertTriangle}
          title="Management control"
          badge={!loading ? `${controlSignalCount} signal${controlSignalCount !== 1 ? "s" : ""}` : undefined}
          action="Open reports"
          onAction={() => nav("/portal/reports")}
        />
        {loading ? (
          <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : controlItems.length === 0 ? (
          <EmptyRows
            icon={CheckCircle2}
            message="No management signals available for this role."
          />
        ) : (
          <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
            {controlItems.map((item) => (
              <ControlMetric
                key={item.key}
                icon={item.icon}
                label={item.label}
                value={item.value}
                sub={item.sub}
                tone={item.tone}
                onClick={() => nav(item.to)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Approvals + Tickets lists ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Approvals */}
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader
            icon={ClipboardList}
            title="Approvals waiting"
            badge={!loading ? approvals.length : undefined}
            action="View all"
            onAction={() => nav("/portal/productions")}
          />
          <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : approvals.length === 0 ? (
              <EmptyRows
                icon={CheckCircle2}
                message="All clear — no approvals pending."
              />
            ) : (
              approvals
                .slice(0, 7)
                .map((j) => (
                  <ListRow
                    key={j._id}
                    title={j.title || "Untitled job"}
                    sub={`${j.customerId?.companyName || "—"} · ${
                      String(j.type || "").toUpperCase() || "JOB"
                    }`}
                    status="review"
                    onClick={() => nav(`/portal/productions/${j._id}`)}
                  />
                ))
            )}
          </div>
        </div>

        {/* Tickets */}
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader
            icon={Ticket}
            title="Recent tickets"
            badge={!loading ? openTickets.length : undefined}
            action="View all"
            onAction={() => nav("/portal/tickets")}
          />
          <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : tickets.length === 0 ? (
              <EmptyRows icon={Ticket} message="No tickets yet." />
            ) : (
              tickets
                .slice(0, 7)
                .map((t) => (
                  <ListRow
                    key={t._id}
                    title={t.title || t.subject || "Ticket"}
                    sub={t.customerId?.companyName || t.ref || "—"}
                    status={t.status || "open"}
                    onClick={() => nav(`/portal/tickets/${t._id}`)}
                  />
                ))
            )}
          </div>
        </div>
      </div>

      {/* ── 5. CRM Deals + Recent Clients ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* CRM Deals list */}
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader
            icon={Handshake}
            title="Active deals"
            badge={!loading ? openDeals.length : undefined}
            action="View pipeline"
            onAction={() => nav("/portal/crm/deals")}
          />
          <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : openDeals.length === 0 ? (
              <EmptyRows
                icon={CircleDollarSign}
                message="No open deals in the pipeline."
              />
            ) : (
              openDeals
                .slice(0, 6)
                .map((d) => (
                  <ListRow
                    key={d._id}
                    title={d.title || "Untitled deal"}
                    sub={d.customerId?.companyName || "—"}
                    meta={d.value ? `AED ${fmtMoney(d.value)}` : undefined}
                    status={d.stage || "discovery"}
                    onClick={() => nav(`/portal/crm/deals/${d._id}`)}
                  />
                ))
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader
            icon={Building2}
            title="Recent clients"
            badge={!loading ? clientTotal : undefined}
            action="View all"
            onAction={() => nav("/portal/customers")}
          />
          <div className="divide-y divide-slate-50/80">
            {loading ? (
              <div className="grid gap-3 px-5 py-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : clients.length === 0 ? (
              <EmptyRows icon={Building2} message="No clients yet." />
            ) : (
              clients.map((c) => {
                const deptLabel =
                  c.department === "procurement"
                    ? "Procurement"
                    : c.department === "both"
                    ? "Both"
                    : "Digital Agency";
                return (
                  <ListRow
                    key={c._id}
                    title={c.companyName}
                    sub={`${c.contactName || "—"} · ${deptLabel}`}
                    status={c.isActive ? "done" : "closed"}
                    onClick={() => nav(`/portal/customers/${c._id}`)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 6. Pipeline bar + Shortcuts ── */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        {/* Two mini pipeline bars stacked */}
        <div className="grid gap-4">
          {/* Jobs pipeline */}
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
            <SectionHeader
              icon={Clapperboard}
              title="Jobs pipeline"
              badge={!loading ? `${jobs.length} total` : undefined}
              action="View jobs"
              onAction={() => nav("/portal/productions")}
            />
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : jobs.length === 0 ? (
                <p className="text-[13px] text-slate-400">No jobs loaded.</p>
              ) : (
                <PipelineBar jobs={jobs} />
              )}
            </div>
          </div>
          {/* CRM pipeline */}
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
            <SectionHeader
              icon={BarChart3}
              title="CRM pipeline"
              badge={
                !loading
                  ? `${openDeals.length} open · ${wonDeals.length} won`
                  : undefined
              }
              action="View deals"
              onAction={() => nav("/portal/crm/deals")}
            />
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : deals.length === 0 ? (
                <p className="text-[13px] text-slate-400">No deals loaded.</p>
              ) : (
                <CrmPipelineBar deals={deals} />
              )}
            </div>
          </div>
        </div>

        {/* Navigation shortcuts */}
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-sm">
          <SectionHeader icon={Zap} title="Quick access" />
          <div className="p-2 grid gap-0.5">
            <Shortcut
              icon={Building2}
              label="Clients"
              sub="Accounts & relationships"
              bg="rgba(91,58,30,0.09)"
              to="/portal/customers"
              nav={nav}
            />
            <Shortcut
              icon={FolderKanban}
              label="Projects"
              sub="Milestones & delivery"
              bg="rgba(59,130,246,0.09)"
              to="/portal/projects"
              nav={nav}
            />
            <Shortcut
              icon={Handshake}
              label="CRM Deals"
              sub="Pipeline & conversions"
              bg="rgba(139,92,246,0.09)"
              to="/portal/crm/deals"
              nav={nav}
            />
            <Shortcut
              icon={ShoppingCart}
              label="Procurement"
              sub="Requests & vendors"
              bg="rgba(16,185,129,0.09)"
              to="/portal/procurement"
              nav={nav}
            />
            <Shortcut
              icon={Wallet}
              label="Billing"
              sub="Invoices & payment"
              bg="rgba(245,158,11,0.09)"
              to="/portal/billing"
              nav={nav}
            />
            <Shortcut
              icon={Package}
              label="Assets"
              sub="Media library"
              bg="rgba(244,63,94,0.09)"
              to="/portal/files"
              nav={nav}
            />
            <Shortcut
              icon={Users}
              label="IAM"
              sub="Roles, invites, teams"
              bg="rgba(111,127,217,0.09)"
              to="/portal/users"
              nav={nav}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
