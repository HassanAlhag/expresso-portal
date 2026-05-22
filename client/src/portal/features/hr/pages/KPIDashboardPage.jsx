import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart2,
  RefreshCw,
  Users,
  Building2,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import StatCard from "../../../shared/ui/StatCard";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Button from "../../../shared/ui/Button";
import { useToast } from "../../../shared/ui/Toast";

import { getKPIDashboard } from "../api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: "", label: "All Periods" },
  ...Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    return {
      value: val,
      label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    };
  }),
];

const STATUS_TONE = {
  active: "info",
  completed: "success",
  at_risk: "warning",
  missed: "error",
  cancelled: "neutral",
};

const STATUS_ICON = {
  active: TrendingUp,
  completed: CheckCircle2,
  at_risk: AlertTriangle,
  missed: XCircle,
  cancelled: XCircle,
};

function ProgressBar({ pct, status }) {
  const color =
    status === "completed" ? "bg-emerald-500" :
    status === "at_risk"   ? "bg-amber-400" :
    status === "missed"    ? "bg-rose-500" :
    "bg-indigo-500";
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct || 0, 100)}%` }}
      />
    </div>
  );
}

function CategoryBar({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize font-medium text-slate-700">{label}</span>
        <span className="text-slate-400">{count} goals</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-indigo-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function KPIDashboardPage() {
  const toast = useToast();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState(() => new Date().toISOString().slice(0, 7));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKPIDashboard(period ? { period } : {});
      setData(res);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load KPI dashboard.");
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => { load(); }, [load]);

  const stats  = data?.stats  || {};
  const cats   = data?.byCategory   || [];
  const depts  = data?.byDepartment || [];
  const atRisk = data?.topAtRisk    || [];
  const goals  = data?.allGoals     || [];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="HR"
        title="KPI Dashboard"
        subtitle="Performance indicators across teams and departments"
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "HR", to: "/portal/hr" },
          { label: "KPI Dashboard" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Link
              to="/portal/hr/kpi/indicators"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Indicators
            </Link>
            <Link
              to="/portal/hr/kpi/goals"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Goals
            </Link>
          </div>
        }
      />

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Goals"
            value={stats.total ?? 0}
            icon={Target}
            color="indigo"
          />
          <StatCard
            label="Completed"
            value={stats.completed ?? 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="At Risk"
            value={stats.atRisk ?? 0}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            label="Avg Progress"
            value={`${Math.round(stats.avgProgress ?? 0)}%`}
            icon={BarChart2}
            color="blue"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-slate-800">By Category</h3>
          </div>
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 rounded-lg" />
              ))}
            </div>
          ) : cats.length === 0 ? (
            <p className="text-sm text-slate-400">No data.</p>
          ) : (
            <div className="grid gap-3">
              {cats.map((c) => (
                <CategoryBar key={c._id} label={c._id} count={c.total} total={stats.total} />
              ))}
            </div>
          )}
        </Card>

        {/* By Department */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-slate-800">By Department</h3>
          </div>
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 rounded-lg" />
              ))}
            </div>
          ) : depts.length === 0 ? (
            <p className="text-sm text-slate-400">No data.</p>
          ) : (
            <div className="grid gap-3">
              {depts.map((d) => (
                <CategoryBar key={d._id || "none"} label={d._id || "Unassigned"} count={d.total} total={stats.total} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top at-risk */}
      {!loading && atRisk.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800">Goals Needing Attention</h3>
          </div>
          <div className="grid gap-3">
            {atRisk.map((g) => {
              const ind = g.indicatorId || {};
              const staff = g.staffId || {};
              return (
                <div key={g._id} className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex-1 grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{ind.name || "—"}</span>
                      <Badge tone={STATUS_TONE[g.status] || "neutral"}>{g.status}</Badge>
                    </div>
                    {staff.fullName && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users size={10} /> {staff.fullName}
                        {staff.department && ` · ${staff.department}`}
                      </span>
                    )}
                    <ProgressBar pct={g.progressPct} status={g.status} />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                    {Math.round(g.progressPct || 0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All goals table */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} className="text-indigo-500" />
          <h3 className="font-semibold text-slate-800">All Goals</h3>
          <span className="ml-auto text-xs text-slate-400">{stats.total ?? 0} total</span>
        </div>
        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No KPI goals yet"
            message="Create indicators and assign goals to staff or departments."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Indicator</th>
                  <th className="pb-2 pr-4">Scope</th>
                  <th className="pb-2 pr-4">Period</th>
                  <th className="pb-2 pr-4">Progress</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {goals.map((g) => {
                  const ind = g.indicatorId || {};
                  const st  = g.staffId || {};
                  const Icon = STATUS_ICON[g.status] || Target;
                  return (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-slate-800">{ind.name || "—"}</span>
                        {ind.category && (
                          <span className="ml-1.5 text-xs text-slate-400 capitalize">{ind.category}</span>
                        )}
                        {st.fullName && (
                          <div className="text-xs text-slate-400 mt-0.5">{st.fullName}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge tone="neutral" className="capitalize">{g.scope}</Badge>
                        {g.department && <div className="text-xs text-slate-400 mt-0.5">{g.department}</div>}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 tabular-nums">{g.period}</td>
                      <td className="py-2.5 pr-4 w-32">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={g.progressPct} status={g.status} />
                          <span className="text-xs text-slate-500 w-8 text-right tabular-nums">
                            {Math.round(g.progressPct || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge tone={STATUS_TONE[g.status] || "neutral"}>
                          <Icon size={11} className="inline mr-0.5" />
                          {g.status?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-500 tabular-nums">
                        {g.currentValue ?? "—"} / {g.targetValue} {ind.unit || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
