import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../../shared/api/client";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardHeader, CardBody } from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import Button from "../../../shared/ui/Button";
import { useToast } from "../../../shared/ui/Toast";
import {
  FolderKanban,
  Ticket,
  Wallet,
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDot,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCurrency(n, currency = "AED") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiTile({ icon: Icon, label, value, sub, accent, loading }) {
  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-extrabold tracking-[0.22em] text-slate-500 uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-24 rounded-xl" />
          ) : (
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          )}
        </div>
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-black/8"
          style={{ background: accent }}
        >
          <Icon size={20} className="text-slate-700" />
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: "100%", background: "var(--brand)" }} />
      </div>
    </div>
  );
}

function BreakdownRow({ label, count, total, color, icon: Icon }) {
  const width = pct(count, total);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {Icon && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
          <Icon size={13} className="text-slate-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold capitalize text-slate-700">
            {label.replace(/_/g, " ")}
          </span>
          <span className="text-[12px] font-extrabold text-slate-900">{count ?? 0}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${width}%`, background: color || "var(--brand)" }}
          />
        </div>
      </div>
      <span className="w-8 text-right text-[11px] font-bold text-slate-400">{width}%</span>
    </div>
  );
}

// ── colour maps ───────────────────────────────────────────────────────────────

const PROJECT_STATUS_COLORS = {
  active:      "#6366f1",
  completed:   "#10b981",
  draft:       "#94a3b8",
  planned:     "#60a5fa",
  on_hold:     "#f59e0b",
  in_review:   "#a78bfa",
  archived:    "#cbd5e1",
  cancelled:   "#f87171",
};

const TICKET_STATUS_COLORS = {
  open:            "#6366f1",
  in_progress:     "#60a5fa",
  waiting_client:  "#f59e0b",
  waiting_vendor:  "#fb923c",
  in_review:       "#a78bfa",
  escalated:       "#f43f5e",
  resolved:        "#10b981",
  closed:          "#94a3b8",
};

const BILLING_STATUS_COLORS = {
  paid:    "#10b981",
  sent:    "#6366f1",
  draft:   "#94a3b8",
  overdue: "#f43f5e",
  void:    "#cbd5e1",
};

const BILLING_STATUS_ICONS = {
  paid:    CheckCircle2,
  sent:    ArrowUpRight,
  draft:   CircleDot,
  overdue: AlertTriangle,
  void:    XCircle,
};

// ── page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects]   = useState(null);
  const [tickets, setTickets]     = useState(null);
  const [billing, setBilling]     = useState(null);
  const [customers, setCustomers] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, bRes, cRes] = await Promise.allSettled([
        api.get("/projects/stats"),
        api.get("/tickets/stats"),
        api.get("/billing/stats"),
        api.get("/customers?limit=1&page=1"),
      ]);
      if (pRes.status === "fulfilled") setProjects(pRes.value.data);
      if (tRes.status === "fulfilled") setTickets(tRes.value.data);
      if (bRes.status === "fulfilled") setBilling(bRes.value.data);
      if (cRes.status === "fulfilled") setCustomers(cRes.value.data);
    } catch {
      toast.error("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // KPI derived values
  const totalProjects  = projects?.total ?? null;
  const activeProjects = projects?.byStatus?.active ?? null;
  const totalClients   = customers?.total ?? null;
  const openTickets    = tickets
    ? (tickets.byStatus?.open ?? 0) + (tickets.byStatus?.in_progress ?? 0)
    : null;
  const totalRevenue   = billing?.totalRevenue ?? null;
  const totalPaid      = billing?.totalPaid ?? null;

  // total for pct calculations
  const ticketTotal = tickets
    ? Object.values(tickets.byStatus || {}).reduce((s, v) => s + v, 0)
    : 0;
  const projectTotal = projects?.total || 0;
  const billingTotal = billing?.totalInvoices || 0;

  return (
    <div className="grid gap-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="REPORTING"
        title="Reports"
        subtitle="Performance snapshot across projects, tickets, and billing."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Reports" }]}
        right={
          <Button variant="outline" onClick={load} disabled={loading} size="sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={FolderKanban}
          label="Total Projects"
          value={fmt(totalProjects)}
          sub={`${fmt(activeProjects)} active`}
          accent="rgba(99,102,241,0.12)"
          loading={loading}
        />
        <KpiTile
          icon={Ticket}
          label="Open Tickets"
          value={fmt(openTickets)}
          sub={`${tickets?.overdue ?? "—"} overdue`}
          accent="rgba(244,63,94,0.10)"
          loading={loading}
        />
        <KpiTile
          icon={Wallet}
          label="Total Revenue"
          value={loading ? "—" : fmtCurrency(totalRevenue)}
          sub={loading ? "" : `${fmtCurrency(totalPaid)} collected`}
          accent="rgba(16,185,129,0.12)"
          loading={loading}
        />
        <KpiTile
          icon={Users}
          label="Clients"
          value={fmt(totalClients)}
          sub="active accounts"
          accent="rgba(245,158,11,0.12)"
          loading={loading}
        />
      </div>

      {/* ── Project + Ticket breakdowns ──────────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">

        {/* Project by status */}
        <Card>
          <CardHeader
            title="Project Status"
            subtitle="Distribution across all project lifecycle stages"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <FolderKanban size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : !projects ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              Object.entries(projects.byStatus || {})
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <BreakdownRow
                    key={status}
                    label={status}
                    count={count}
                    total={projectTotal}
                    color={PROJECT_STATUS_COLORS[status]}
                  />
                ))
            )}
          </CardBody>
        </Card>

        {/* Ticket by status */}
        <Card>
          <CardHeader
            title="Ticket Status"
            subtitle="Support and change request pipeline overview"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Ticket size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : !tickets ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              Object.entries(tickets.byStatus || {})
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <BreakdownRow
                    key={status}
                    label={status}
                    count={count}
                    total={ticketTotal}
                    color={TICKET_STATUS_COLORS[status]}
                  />
                ))
            )}
          </CardBody>
        </Card>

        {/* Project by priority */}
        <Card>
          <CardHeader
            title="Project Priority"
            subtitle="Urgency distribution across all projects"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <TrendingUp size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : !projects ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              [["urgent","#f43f5e"],["high","#fb923c"],["medium","#f59e0b"],["low","#94a3b8"]].map(([p, color]) => {
                const count = projects.byPriority?.[p] ?? 0;
                return (
                  <BreakdownRow
                    key={p}
                    label={p}
                    count={count}
                    total={projectTotal}
                    color={color}
                  />
                );
              })
            )}
          </CardBody>
        </Card>

        {/* Ticket by priority */}
        <Card>
          <CardHeader
            title="Ticket Priority"
            subtitle="Urgency breakdown across support tickets"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <AlertTriangle size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : !tickets ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              [["urgent","#f43f5e"],["high","#fb923c"],["medium","#f59e0b"],["low","#94a3b8"]].map(([p, color]) => {
                const count = tickets.byPriority?.[p] ?? 0;
                return (
                  <BreakdownRow
                    key={p}
                    label={p}
                    count={count}
                    total={ticketTotal}
                    color={color}
                  />
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Billing section ─────────────────────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">

        {/* Billing overview cards */}
        <Card>
          <CardHeader
            title="Billing Overview"
            subtitle="Invoice totals and collection status"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Wallet size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : !billing ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              <div className="grid gap-3">
                {[
                  { label: "Total Invoiced",  value: fmtCurrency(billing.totalRevenue),    color: "bg-indigo-50  border-indigo-100",  text: "text-indigo-700" },
                  { label: "Collected",        value: fmtCurrency(billing.totalPaid),       color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
                  { label: "Outstanding",      value: fmtCurrency(billing.totalOutstanding),color: "bg-rose-50    border-rose-100",    text: "text-rose-700" },
                ].map(({ label, value, color, text }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 ${color}`}
                  >
                    <span className={`text-sm font-semibold ${text}`}>{label}</span>
                    <span className={`text-base font-black ${text}`}>{value}</span>
                  </div>
                ))}
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Collection rate</span>
                    <span className="font-extrabold text-slate-700">
                      {pct(billing.totalPaid, billing.totalRevenue)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${pct(billing.totalPaid, billing.totalRevenue)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Invoice by status */}
        <Card>
          <CardHeader
            title="Invoice Breakdown"
            subtitle="Count and value by invoice status"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <BarChart3 size={14} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            {loading ? (
              <div className="grid gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : !billing ? (
              <p className="text-sm text-slate-400">No data available.</p>
            ) : (
              ["paid","sent","draft","overdue","void"].map((s) => {
                const entry = billing.byStatus?.[s];
                const count  = entry?.count  ?? 0;
                const amount = entry?.amount ?? 0;
                const Icon   = BILLING_STATUS_ICONS[s] || CircleDot;
                return (
                  <div key={s} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
                      <Icon size={13} className="text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] font-semibold capitalize text-slate-700">{s}</span>
                        <span className="text-[11px] font-extrabold text-slate-900">{count} inv.</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct(count, billingTotal)}%`, background: BILLING_STATUS_COLORS[s] }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-[11px] font-semibold text-slate-500">
                      {fmtCurrency(amount)}
                    </span>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

      </div>

      {/* ── Ticket type breakdown ────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Ticket Types"
          subtitle="Support, change requests, procurement, and internal tickets"
        />
        <CardBody>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : !tickets ? (
            <p className="text-sm text-slate-400">No data available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(tickets.byType || {}).map(([type, count]) => (
                <div
                  key={type}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-center"
                >
                  <p className="text-2xl font-black text-slate-900">{count}</p>
                  <p className="mt-1 text-[11px] font-bold capitalize text-slate-500">
                    {type.replace(/_/g, " ")}
                  </p>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct(count, ticketTotal)}%`, background: "var(--brand)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

    </div>
  );
}
