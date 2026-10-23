import React, { useCallback, useEffect, useState } from "react";
import { Plus, Target } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import TextField from "../../../shared/ui/TextField";
import ErrorState from "../../../shared/ui/ErrorState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";
import { createKPIGoal, listKPIGoals, listKPIIndicators } from "../api";
import KpiGoalTable from "../kpi/KpiGoalTable";
import KpiGoalFormDialog from "../kpi/KpiGoalFormDialog";

// KPI tab of a staff record (PUI-4, hr.kpi.read): this person's individual
// goals for a period. Assigning and changing goals needs hr.kpi.write.
export default function StaffKpiTab({ staff }) {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.kpi.write");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const dPeriod = useDebouncedValue(period);
  const [goals, setGoals] = useState([]);
  const [state, setState] = useState("loading");
  const [indicators, setIndicators] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await listKPIGoals({ staffId: staff._id, ...(dPeriod.trim() ? { period: dPeriod.trim() } : {}) });
      setGoals(res?.items || []);
      setState("ready");
    } catch {
      setGoals([]);
      setState("failed");
    }
  }, [staff._id, dPeriod]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!canWrite) return undefined;
    let cancelled = false;
    listKPIIndicators()
      .then((r) => !cancelled && setIndicators(r?.items || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canWrite]);

  const create = async (payload) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await createKPIGoal(payload);
      toast.success("KPI goal assigned.");
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "The goal wasn't assigned. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Panel
        title="KPI goals"
        sub={state === "ready" ? `${goals.length} individual goal${goals.length === 1 ? "" : "s"}${dPeriod.trim() ? ` for ${dPeriod.trim()}` : ""}` : undefined}
        flush
        action={canWrite ? <Button size="sm" onClick={() => { setError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />Assign goal</Button> : null}
      >
        <div className="px-toolbar" aria-label="Choose a period">
          <TextField label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-05, 2026-Q2 or 2026" hint="Leave empty for every period." />
        </div>
        {state === "failed" ? (
          <ErrorState title="KPI goals didn't load" onRetry={load} />
        ) : state === "ready" && !goals.length ? (
          <div className="px-inline-empty">
            <Target size={18} aria-hidden="true" />
            <span>No individual KPI goals{dPeriod.trim() ? ` for ${dPeriod.trim()}` : ""}.</span>
          </div>
        ) : (
          <KpiGoalTable goals={goals} loading={state === "loading"} indicators={indicators} staffId={staff._id} showOwner={false} label={`KPI goals of ${staff.fullName}`} onChanged={load} />
        )}
      </Panel>
      {canWrite ? <KpiGoalFormDialog open={formOpen} indicators={indicators} staffId={staff._id} busy={busy} error={error} onClose={() => setFormOpen(false)} onSubmit={create} /> : null}
    </>
  );
}
