import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import AttentionList from "../../../shared/ui/AttentionList";
import TextField from "../../../shared/ui/TextField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { getKPIDashboard } from "../api";
import { humanize } from "../format";
import { goalOwner, kpiStatusLabel, pct } from "../kpi/kpiFormat";

function Breakdown({ rows, total }) {
  return (
    <ul className="px-list">
      {rows.map((r) => (
        <li key={r._id || "none"}>
          <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
            <div className="px-t">{humanize(r._id || "unassigned")}</div>
            <div className="px-bar" aria-hidden="true">
              <i style={{ width: `${total ? Math.round(((r.total || 0) / total) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="px-r">
            <b>{r.total || 0}</b>
            <span>{`${r.completed || 0} completed, ${r.atRisk || 0} at risk, ${pct(r.avgProgress)} average`}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// KPI overview (PUI-4, hr.kpi.read). Every figure comes from the KPI
// dashboard endpoint, which counts all goals for the period.
export default function KPIDashboardPage() {
  const access = useAccess();
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const dPeriod = useDebouncedValue(period);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getKPIDashboard(dPeriod.trim() ? { period: dPeriod.trim() } : {}));
    } catch (e) {
      setData(null);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dPeriod]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.stats;
  const metrics = s
    ? [
        { key: "total", label: "Goals", value: s.total || 0, note: `${s.active || 0} active, ${s.cancelled || 0} cancelled`, to: "/portal/hr/kpi/goals" },
        { key: "done", label: "Completed", value: s.completed || 0 },
        { key: "risk", label: "At risk", value: s.atRisk || 0, note: `${s.missed || 0} missed`, noteTone: s.atRisk || s.missed ? "warn" : undefined },
        { key: "avg", label: "Average progress", value: pct(s.avgProgress), note: "Goals with a value, not cancelled" },
      ]
    : [];
  const attention = (data?.topAtRisk || []).map((g) => ({
    key: g._id,
    tone: g.status === "at_risk" ? "warn" : "info",
    icon: AlertTriangle,
    title: `${g.indicatorId?.name || "Goal"}: ${pct(g.progressPct)}`,
    sub: `${goalOwner(g)}, ${g.period}, ${kpiStatusLabel(g.status)}${g.status === "active" ? " and under 40%" : ""}`,
    to: "/portal/hr/kpi/goals",
    actionLabel: "Open goals",
  }));

  return (
    <PageFrame
      title="KPI"
      description="How the period's goals are tracking, and the ones falling behind."
      breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "KPI" }]}
      secondaryActions={
        <>
          <Link className="px-btn px-btn--outline" to="/portal/hr/kpi/indicators">Indicators</Link>
          <Link className="px-btn px-btn--outline" to="/portal/hr/kpi/goals">Goals</Link>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        </>
      }
    >
      <div className="px-toolbar" aria-label="Choose a period">
        <TextField label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-05, 2026-Q2 or 2026" hint="Leave empty for every period." />
      </div>
      {error ? (
        <ErrorState title="The KPI overview didn't load" message={error} onRetry={load} />
      ) : !data ? (
        <LoadingState rows={6} label="Loading the KPI overview" />
      ) : !s?.total ? (
        <EmptyState title={dPeriod.trim() ? `No KPI goals for ${dPeriod.trim()}` : "No KPI goals yet"} message="Create indicators, then set goals on them." />
      ) : (
        <>
          <MetricsStrip label="KPI summary" items={metrics} />
          <div className="px-grid px-cols-main">
            <div className="px-stack">
              <Panel title="Falling behind" sub="At risk, or active and under 40%, lowest first" flush>
                <AttentionList
                  items={attention}
                  empty={
                    <div className="px-inline-empty">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>No goals are at risk or under 40%.</span>
                    </div>
                  }
                />
              </Panel>
            </div>
            <div className="px-stack">
              <Panel title="By department" flush>
                <Breakdown rows={data.byDepartment || []} total={s.total} />
              </Panel>
              <Panel title="By category" flush>
                <Breakdown rows={data.byCategory || []} total={s.total} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </PageFrame>
  );
}
