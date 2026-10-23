import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, SearchX, Target } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SelectField from "../../../shared/ui/SelectField";
import TextField from "../../../shared/ui/TextField";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { createKPIGoal, listKPIGoals, listKPIIndicators } from "../api";
import { loadAllStaff } from "../lib/loadAllStaff";
import { KPI_DEPARTMENT_OPTIONS, KPI_SCOPES, KPI_STATUSES, kpiStatusLabel, options } from "../kpi/kpiFormat";
import KpiGoalTable from "../kpi/KpiGoalTable";
import KpiGoalFormDialog from "../kpi/KpiGoalFormDialog";

export function buildGoalParams({ period, scope, status, department }) {
  const p = {};
  if (period) p.period = period;
  if (scope) p.scope = scope;
  if (status) p.status = status;
  if (department) p.department = department;
  return p;
}

// KPI goals (PUI-4, hr.kpi.read). The API returns every goal that matches,
// so the counts above the table are complete for the filters chosen.
export default function KPIGoalsPage() {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.kpi.write");
  const canStaff = access.can("hr.staff.read");

  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const dPeriod = useDebouncedValue(period);
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [indicators, setIndicators] = useState([]);
  const [staff, setStaff] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listKPIGoals(buildGoalParams({ period: dPeriod.trim(), scope, status, department }));
      setGoals(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setGoals([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dPeriod, scope, status, department]);

  useEffect(() => {
    load();
  }, [load]);

  // Form options: indicators always; staff only for people who may read staff records.
  useEffect(() => {
    let cancelled = false;
    listKPIIndicators()
      .then((r) => !cancelled && setIndicators(r?.items || []))
      .catch(() => {});
    if (canStaff)
      loadAllStaff({ status: "active", sort: "fullName" })
        .then((r) => !cancelled && setStaff(r.items))
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canStaff]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(KPI_STATUSES.map((s) => [s, 0]));
    goals.forEach((g) => {
      c[g.status] = (c[g.status] || 0) + 1;
    });
    return c;
  }, [goals]);

  const metrics = loading || error
    ? []
    : [
        { key: "total", label: "Goals", value: goals.length, note: dPeriod.trim() ? `For ${dPeriod.trim()}` : "Every period" },
        { key: "active", label: kpiStatusLabel("active"), value: counts.active, onClick: () => setStatus(status === "active" ? "" : "active"), pressed: status === "active" },
        { key: "risk", label: kpiStatusLabel("at_risk"), value: counts.at_risk, note: `${counts.missed} missed`, noteTone: counts.at_risk || counts.missed ? "warn" : undefined, onClick: () => setStatus(status === "at_risk" ? "" : "at_risk"), pressed: status === "at_risk" },
        { key: "done", label: kpiStatusLabel("completed"), value: counts.completed, onClick: () => setStatus(status === "completed" ? "" : "completed"), pressed: status === "completed" },
      ];

  const create = async (payload) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      await createKPIGoal(payload);
      toast.success("Goal created.");
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The goal wasn't created. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = Boolean(scope || status || department);
  let content;
  if (error) content = <ErrorState title="KPI goals didn't load" message={error} onRetry={load} />;
  else if (!loading && !goals.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No goals match these filters" message="Try another period or clear the filters." action={<Button variant="outline" onClick={() => { setScope(""); setStatus(""); setDepartment(""); }}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Target} title={dPeriod.trim() ? `No KPI goals for ${dPeriod.trim()}` : "No KPI goals yet"} message="Goals set a target on an indicator for a person, team, department or the company." action={canWrite ? <Button onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />New goal</Button> : null} />
    );
  else content = <KpiGoalTable goals={goals} loading={loading} indicators={indicators} staff={staff} onChanged={load} />;

  return (
    <>
      <PageFrame
        title="KPI goals"
        description="Targets on each indicator, the check-ins logged against them and where each one stands."
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "KPI", to: "/portal/hr/kpi" }, { label: "Goals" }]}
        secondaryActions={
          <>
            <Link className="px-btn px-btn--outline" to="/portal/hr/kpi/indicators">Indicators</Link>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={canWrite ? <Button onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />New goal</Button> : null}
      >
        <MetricsStrip label="KPI goal summary" items={metrics} />
        <Panel flush bare label="KPI goals" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter KPI goals">
            <TextField label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-05, 2026-Q2 or 2026" hint="Leave empty for every period." />
            <SelectField label="Scope" value={scope} onChange={setScope} options={[{ value: "", label: "Any scope" }, ...options(KPI_SCOPES)]} />
            <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: "", label: "Any status" }, ...KPI_STATUSES.map((s) => ({ value: s, label: kpiStatusLabel(s) }))]} />
            <SelectField label="Department" value={department} onChange={setDepartment} options={[{ value: "", label: "Any department" }, ...KPI_DEPARTMENT_OPTIONS]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading goals…" : error ? "Goals unavailable" : `${goals.length} goal${goals.length === 1 ? "" : "s"}`}</span>
          </div>
          {content}
        </Panel>
      </PageFrame>
      {canWrite ? (
        <KpiGoalFormDialog open={formOpen} indicators={indicators} staff={staff} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSubmit={create} />
      ) : null}
    </>
  );
}
