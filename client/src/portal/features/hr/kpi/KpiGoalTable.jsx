import React, { useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import Badge from "../../../shared/ui/Badge";
import RowActions from "../../../shared/ui/RowActions";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { createKPICheckin, deleteKPICheckin, deleteKPIGoal, listKPICheckins, syncKPIGoal, updateKPIGoal } from "../api";
import { date, humanize } from "../format";
import { KPI_STATUS_TONE, goalOwner, hasAutoSource, kpiStatusLabel, pct } from "./kpiFormat";
import KpiGoalFormDialog from "./KpiGoalFormDialog";
import KpiCheckinDialog from "./KpiCheckinDialog";

const errorText = (e, fallback) => e?.response?.data?.message || fallback;

// KPI goals table (PUI-4), shared by the KPI goals page and a staff record's
// KPI tab. Anyone with hr.kpi.read sees goals and their check-ins; logging,
// syncing, editing and deleting need hr.kpi.write.
export default function KpiGoalTable({ goals, loading, indicators = [], staff = [], staffId, showOwner = true, label = "KPI goals", onChanged }) {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.kpi.write");

  const [open, setOpen] = useState({}); // goalId -> { state, items }
  const [editing, setEditing] = useState(null);
  const [checkinGoal, setCheckinGoal] = useState(null);
  const [removing, setRemoving] = useState(null); // { kind: "goal" | "checkin", item, goal }
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const running = useRef(false);

  const loadCheckins = useCallback(async (goalId) => {
    setOpen((o) => ({ ...o, [goalId]: { state: "loading", items: o[goalId]?.items || [] } }));
    try {
      const res = await listKPICheckins({ goalId, limit: 20 });
      setOpen((o) => (o[goalId] ? { ...o, [goalId]: { state: "ready", items: res?.items || [] } } : o));
    } catch {
      setOpen((o) => (o[goalId] ? { ...o, [goalId]: { state: "failed", items: [] } } : o));
    }
  }, []);

  const toggle = (goalId) => {
    if (open[goalId]) {
      setOpen((o) => {
        const next = { ...o };
        delete next[goalId];
        return next;
      });
    } else loadCheckins(goalId);
  };

  const guarded = async (fn) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFormError("");
    try {
      await fn();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const saveGoal = (payload) =>
    guarded(async () => {
      try {
        await updateKPIGoal(editing._id, payload);
        toast.success("Goal updated.");
        setEditing(null);
        await onChanged?.();
      } catch (e) {
        setFormError(errorText(e, "The goal wasn't saved. Try again."));
      }
    });

  const saveCheckin = (payload) =>
    guarded(async () => {
      try {
        await createKPICheckin(payload);
        toast.success("Check-in logged.");
        const id = checkinGoal._id;
        setCheckinGoal(null);
        await onChanged?.();
        if (open[id]) await loadCheckins(id);
      } catch (e) {
        setFormError(errorText(e, "The check-in wasn't logged. Try again."));
      }
    });

  const sync = async (goal) => {
    try {
      const res = await syncKPIGoal(goal._id);
      if (res?.synced === false) toast.info(res.message || "There was nothing to sync.");
      else toast.success("Goal synced from its source.");
      await onChanged?.();
    } catch (e) {
      toast.error(errorText(e, "The goal didn't sync. Try again."));
    }
  };

  const remove = async () => {
    const { kind, item, goal } = removing;
    try {
      if (kind === "goal") await deleteKPIGoal(item._id);
      else await deleteKPICheckin(item._id);
      toast.success(kind === "goal" ? "Goal deleted." : "Check-in removed.");
      setRemoving(null);
      await onChanged?.();
      if (kind === "checkin" && open[goal._id]) await loadCheckins(goal._id);
    } catch (e) {
      toast.error(errorText(e, "That didn't work. Try again."));
    }
  };

  const cols = 5;
  return (
    <>
      <table className="px-table px-table--stack" aria-label={label} aria-busy={loading || undefined}>
        <thead>
          <tr>
            <th scope="col">Indicator</th>
            <th scope="col" className="px-hide-tab">Period</th>
            <th scope="col">Progress</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows rows={4} cols={cols} label="Loading KPI goals" />
          ) : (
            goals.map((g) => {
              const ind = g.indicatorId || {};
              const expanded = open[g._id];
              const actions = [
                { key: "checkins", label: expanded ? "Hide check-ins" : "Show check-ins", icon: expanded ? ChevronUp : ChevronDown, onSelect: () => toggle(g._id) },
                canWrite ? { key: "log", label: "Log check-in", icon: Plus, onSelect: () => { setFormError(""); setCheckinGoal(g); } } : null,
                canWrite && hasAutoSource(ind) ? { key: "sync", label: "Sync from source", icon: RefreshCw, onSelect: () => sync(g) } : null,
                canWrite ? { key: "edit", label: "Edit goal", icon: Pencil, onSelect: () => { setFormError(""); setEditing(g); } } : null,
                canWrite ? { key: "sep", separator: true } : null,
                canWrite ? { key: "delete", label: "Delete goal", icon: Trash2, tone: "muted", onSelect: () => setRemoving({ kind: "goal", item: g }) } : null,
              ];
              const sub = [showOwner ? goalOwner(g) : null, ind.category ? humanize(ind.category) : null, hasAutoSource(ind) ? "Synced from data" : null].filter(Boolean).join(", ");
              return (
                <React.Fragment key={g._id}>
                  <tr>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <b>{ind.name || "Indicator removed"}</b>
                        {sub ? <span>{sub}</span> : null}
                      </div>
                    </td>
                    <td data-label="Period" className="px-hide-tab">{g.period}</td>
                    <td data-label="Progress">
                      <div style={{ display: "grid", gap: 4, minWidth: 120 }}>
                        <div className="px-bar" data-tone={g.status === "completed" ? "ok" : g.status === "missed" ? "bad" : g.status === "at_risk" ? "warn" : undefined} aria-hidden="true">
                          <i style={{ width: `${Math.min(100, Math.max(0, Number(g.progressPct) || 0))}%` }} />
                        </div>
                        <small className="px-muted">
                          {pct(g.progressPct)}: {g.currentValue ?? "no value yet"} of {g.targetValue}
                          {ind.unit ? ` ${ind.unit}` : ""}
                        </small>
                      </div>
                    </td>
                    <td data-label="Status">
                      <Badge tone={KPI_STATUS_TONE[g.status] || "neutral"} dot>{kpiStatusLabel(g.status)}</Badge>
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={`${ind.name || "goal"} for ${g.period}`} actions={actions} />
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="px-subrow">
                      <td colSpan={cols}>
                        {expanded.state === "loading" && !expanded.items.length ? (
                          <span className="px-muted">Loading check-ins…</span>
                        ) : expanded.state === "failed" ? (
                          <span className="px-muted">The check-ins didn't load. <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={() => loadCheckins(g._id)}>Try again</button></span>
                        ) : expanded.items.length ? (
                          <ul className="px-list" aria-label={`Check-ins for ${ind.name || "goal"}`}>
                            {expanded.items.map((c) => (
                              <li key={c._id}>
                                <div style={{ minWidth: 0 }}>
                                  <div className="px-t">
                                    {c.value}
                                    {ind.unit ? ` ${ind.unit}` : ""}
                                    {c.source === "auto" ? <Badge tone="neutral"><Zap size={10} aria-hidden="true" /> Synced</Badge> : null}
                                  </div>
                                  <div className="px-s">{[date(c.date), c.notes].filter(Boolean).join(", ")}</div>
                                </div>
                                {canWrite ? (
                                  <RowActions label={`check-in on ${date(c.date)}`} actions={[{ key: "rm", label: "Remove check-in", icon: Trash2, tone: "muted", onSelect: () => setRemoving({ kind: "checkin", item: c, goal: g }) }]} />
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="px-muted">No check-ins yet.</span>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {canWrite ? (
        <>
          <KpiGoalFormDialog open={Boolean(editing)} initial={editing} indicators={indicators} staff={staff} staffId={staffId} busy={busy} error={formError} onClose={() => setEditing(null)} onSubmit={saveGoal} />
          <KpiCheckinDialog open={Boolean(checkinGoal)} goal={checkinGoal} busy={busy} error={formError} onClose={() => setCheckinGoal(null)} onSubmit={saveCheckin} />
          <ConfirmDialog
            open={Boolean(removing)}
            icon={Trash2}
            tone="bad"
            danger
            title={removing?.kind === "goal" ? "Delete this KPI goal?" : "Remove this check-in?"}
            confirmLabel={removing?.kind === "goal" ? "Delete goal" : "Remove check-in"}
            details={removing?.kind === "goal" ? ["The goal and all its check-ins are deleted and can't be restored."] : ["The check-in is deleted. The goal's current value and progress are not recalculated until the next check-in or sync."]}
            onClose={() => setRemoving(null)}
            onConfirm={remove}
          >
            {removing?.kind === "goal"
              ? `${removing.item.indicatorId?.name || "Goal"} for ${removing.item.period}.`
              : removing
                ? `${removing.item.value} on ${date(removing.item.date)}.`
                : ""}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
