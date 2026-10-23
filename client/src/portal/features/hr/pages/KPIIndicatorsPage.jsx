import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

import { createKPIIndicator, deleteKPIIndicator, listKPIIndicators, updateKPIIndicator } from "../api";
import { humanize } from "../format";
import { autoSourceLabel, directionLabel, hasAutoSource } from "../kpi/kpiFormat";
import KpiIndicatorFormDialog from "../kpi/KpiIndicatorFormDialog";

// KPI indicators (PUI-4, hr.kpi.read; changes need hr.kpi.write).
export default function KPIIndicatorsPage() {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.kpi.write");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactive, setShowInactive] = useState("false");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listKPIIndicators(showInactive === "true" ? { includeInactive: "true" } : {});
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (item = null) => {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  };

  const save = async (payload) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      if (editing) await updateKPIIndicator(editing._id, payload);
      else await createKPIIndicator(payload);
      toast.success(editing ? "Indicator updated." : "Indicator created.");
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The indicator wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await deleteKPIIndicator(removing._id);
      toast.success("Indicator deleted, with its goals and check-ins.");
      setRemoving(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The indicator wasn't deleted. Try again.");
    }
  };

  let content;
  if (error) content = <ErrorState title="Indicators didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = (
      <EmptyState
        icon={Activity}
        title={showInactive === "true" ? "No indicators yet" : "No active indicators"}
        message="Indicators define what is measured: a unit, a direction and, optionally, a source to sync from."
        action={canWrite ? <Button onClick={() => openForm()}><Plus size={14} aria-hidden="true" />New indicator</Button> : null}
      />
    );
  else
    content = (
      <table className="px-table px-table--stack" aria-label="KPI indicators" aria-busy={loading || undefined}>
        <thead>
          <tr>
            <th scope="col">Indicator</th>
            <th scope="col">Category</th>
            <th scope="col" className="px-hide-tab">Measured as</th>
            <th scope="col" className="px-hide-tab">Synced from</th>
            <th scope="col">Status</th>
            {canWrite ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows rows={5} cols={canWrite ? 6 : 5} label="Loading indicators" />
          ) : (
            items.map((ind) => (
              <tr key={ind._id}>
                <td className="px-primary">
                  <div className="px-cell-main">
                    <b>{ind.name}</b>
                    {ind.description ? <span>{ind.description}</span> : null}
                  </div>
                </td>
                <td data-label="Category">{humanize(ind.category)}</td>
                <td data-label="Measured as" className="px-hide-tab">{[ind.unit, directionLabel(ind.direction), humanize(ind.frequency, "")].filter(Boolean).join(", ")}</td>
                <td data-label="Synced from" className="px-hide-tab">{hasAutoSource(ind) ? autoSourceLabel(ind.autoSource) : "Entered by hand"}</td>
                <td data-label="Status">
                  <Badge tone={ind.isActive ? "ok" : "idle"} dot>{ind.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                {canWrite ? (
                  <td className="px-actions-cell">
                    <RowActions
                      label={ind.name}
                      actions={[
                        { key: "edit", label: "Edit indicator", icon: Pencil, onSelect: () => openForm(ind) },
                        { key: "sep", separator: true },
                        { key: "delete", label: "Delete indicator", icon: Trash2, tone: "muted", onSelect: () => setRemoving(ind) },
                      ]}
                    />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

  return (
    <>
      <PageFrame
        title="KPI indicators"
        description="What gets measured, in which unit, and whether it syncs from HR data."
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "KPI", to: "/portal/hr/kpi" }, { label: "Indicators" }]}
        secondaryActions={
          <>
            <Link className="px-btn px-btn--outline" to="/portal/hr/kpi/goals">Goals</Link>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={canWrite ? <Button onClick={() => openForm()}><Plus size={14} aria-hidden="true" />New indicator</Button> : null}
      >
        <Panel flush bare label="Indicators" className="px-list-panel">
          <div className="px-toolbar" aria-label="Filter indicators">
            <SelectField label="Show" value={showInactive} onChange={setShowInactive} options={[{ value: "false", label: "Active indicators" }, { value: "true", label: "Active and inactive" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading indicators…" : error ? "Indicators unavailable" : `${items.length} indicator${items.length === 1 ? "" : "s"}`}</span>
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? <KpiIndicatorFormDialog open={formOpen} initial={editing} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSubmit={save} /> : null}
      <ConfirmDialog
        open={Boolean(removing)}
        icon={Trash2}
        tone="bad"
        danger
        title="Delete this indicator?"
        confirmLabel="Delete indicator"
        details={["Every KPI goal on this indicator, and every check-in on those goals, is deleted too.", "None of it can be restored. To stop using it but keep its goals, set it to Inactive instead."]}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
      >
        {removing ? `${removing.name}.` : ""}
      </ConfirmDialog>
    </>
  );
}
