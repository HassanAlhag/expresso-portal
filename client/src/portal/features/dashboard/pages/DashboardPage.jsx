import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Ticket,
  UploadCloud,
  CheckCircle2,
  FolderKanban,
  Clapperboard,
  TrendingUp,
  ShoppingCart,
  Zap,
  FileText,
  Files,
  ReceiptText,
  CalendarDays,
  MessageCircle,
  BarChart2,
} from "lucide-react";

import Skeleton from "../../../shared/ui/Skeleton";
import Briefing from "../../../shared/ui/Briefing";
import StaffDashboard from "../staff/StaffDashboard";
import { listJobs } from "../../jobs/api";
import { listTickets } from "../../tickets/api";
import { listProjects } from "../../projects/api";
import { listRfqs } from "../../procurement/api";
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

function readPortalUser() {
  try {
    return JSON.parse(localStorage.getItem("portal_user") || "{}") || {};
  } catch {
    return {};
  }
}

function firstName() {
  const n = String(readPortalUser().fullName || "").trim();
  return n ? n.split(/\s+/)[0] : "";
}

// UI gating only (the API and ProtectedRoute still decide). Same rule as the
// API: super_admin, or the permission in the user's effective list.
function useCan() {
  return useMemo(() => {
    const u = readPortalUser();
    const role = String(u.role || "").toLowerCase();
    const set = new Set(Array.isArray(u.permissions) ? u.permissions : []);
    return (perm) => role === "super_admin" || set.has(perm);
  }, []);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const countOf = (n, word) => (n ? plural(n, word) : `No ${word}s`);

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
  const can = useCan();
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
      <Briefing
        when={fmtDate()}
        links={[
          can("jobs.read") && postsAwaitingApproval > 0 && { label: plural(postsAwaitingApproval, "post") + " to approve", icon: CheckCircle2, to: "/portal/content-calendar" },
          can("jobs.read") && { label: "View calendar", icon: CalendarDays, to: "/portal/content-calendar" },
          can("files.read") && { label: "Upload asset", icon: UploadCloud, to: "/portal/files" },
          can("messaging.read") && { label: "Message your team", icon: MessageCircle, to: "/portal/messages" },
        ].filter(Boolean)}
      >
        {greeting()}{firstName() ? `, ${firstName()}` : ""}.{" "}
        {loading ? (
          "Loading your workspace…"
        ) : (
          <>
            You have <strong>{countOf(openTickets.length, "open request").replace(/^No/, "no")}</strong>
            {postsAwaitingApproval > 0 ? <> and <strong>{plural(postsAwaitingApproval, "post")}</strong> waiting for your approval</> : null}.
          </>
        )}
      </Briefing>

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
      <Briefing
        when={fmtDate()}
        links={[{ label: "Open RFQs", count: loading ? null : openRfqs.length, to: "/portal/procurement/rfqs" }]}
      >
        {greeting()}{firstName() ? `, ${firstName()}` : ""}.{" "}
        {loading ? (
          "Loading your RFQs…"
        ) : openRfqs.length ? (
          <>
            <strong>{plural(openRfqs.length, "RFQ")}</strong> in your approved categories {openRfqs.length === 1 ? "is" : "are"} open for quotation.
          </>
        ) : (
          "No RFQs in your categories are open right now."
        )}
      </Briefing>

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

  // Client and vendor dashboards are unchanged in PUI-2; staff get the
  // migrated, permission-composed dashboard.
  if (isExternalClient) return <ClientDashboard nav={nav} />;
  if (role === "vendor") return <VendorDashboard nav={nav} />;
  return <StaffDashboard />;
}
