import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  Plus as PlusIcon,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Modal from "../../../shared/ui/Modal";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import {
  listKPIGoals,
  createKPIGoal,
  updateKPIGoal,
  deleteKPIGoal,
  syncKPIGoal,
  listKPIIndicators,
  listKPICheckins,
  createKPICheckin,
  deleteKPICheckin,
  listStaff,
} from "../api";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCOPES      = ["individual", "team", "department", "company"];
const PERIOD_TYPES = ["monthly", "quarterly", "annual"];
const STATUSES    = ["active", "completed", "at_risk", "missed", "cancelled"];
const DEPARTMENTS = ["management", "creative", "development", "marketing", "sales", "finance", "operations", "hr", "procurement", "other"];

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

function currentMonthPeriod() {
  return new Date().toISOString().slice(0, 7);
}

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

// ── Goal Form Modal ───────────────────────────────────────────────────────────

const EMPTY_GOAL = {
  indicatorId: "",
  scope: "individual",
  staffId: "",
  teamId: "",
  department: "",
  period: currentMonthPeriod(),
  periodType: "monthly",
  targetValue: "",
  notes: "",
};

function GoalFormModal({ open, initial, busy, indicators, staff, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_GOAL);

  useEffect(() => {
    if (initial) {
      setForm({
        indicatorId: initial.indicatorId?._id || initial.indicatorId || "",
        scope:       initial.scope || "individual",
        staffId:     initial.staffId?._id || initial.staffId || "",
        teamId:      initial.teamId || "",
        department:  initial.department || "",
        period:      initial.period || currentMonthPeriod(),
        periodType:  initial.periodType || "monthly",
        targetValue: initial.targetValue ?? "",
        notes:       initial.notes || "",
      });
    } else {
      setForm(EMPTY_GOAL);
    }
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, targetValue: Number(form.targetValue) };
    if (payload.scope !== "individual") delete payload.staffId;
    if (payload.scope !== "team") delete payload.teamId;
    if (payload.scope !== "department") delete payload.department;
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Goal" : "New KPI Goal"}
      width="620px"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button form="goal-form" type="submit" loading={busy}>
            {initial ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Indicator *</label>
          <select
            value={form.indicatorId}
            onChange={(e) => set("indicatorId", e.target.value)}
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Select indicator…</option>
            {indicators.map((ind) => (
              <option key={ind._id} value={ind._id}>{ind.name} ({ind.unit})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Scope"
            value={form.scope}
            onChange={(value) => set("scope", value)}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </Select>
          <Select
            label="Period Type"
            value={form.periodType}
            onChange={(value) => set("periodType", value)}
          >
            {PERIOD_TYPES.map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </Select>
        </div>

        <Input
          label={`Period * (e.g. ${form.periodType === "annual" ? "2026" : form.periodType === "quarterly" ? "2026-Q2" : "2026-05"})`}
          value={form.period}
          onChange={(e) => set("period", e.target.value)}
          placeholder={form.periodType === "annual" ? "2026" : form.periodType === "quarterly" ? "2026-Q2" : "2026-05"}
          required
        />

        {form.scope === "individual" && (
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Staff Member *</label>
            <select
              value={form.staffId}
              onChange={(e) => set("staffId", e.target.value)}
              required
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select staff member…</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>{s.fullName}{s.department ? ` (${s.department})` : ""}</option>
              ))}
            </select>
          </div>
        )}

        {form.scope === "team" && (
          <Input
            label="Team Name"
            value={form.teamId}
            onChange={(e) => set("teamId", e.target.value)}
            placeholder="e.g. Frontend Team"
          />
        )}

        {form.scope === "department" && (
          <Select
            label="Department"
            value={form.department}
            onChange={(value) => set("department", value)}
          >
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </Select>
        )}

        <Input
          label="Target Value *"
          type="number"
          value={form.targetValue}
          onChange={(e) => set("targetValue", e.target.value)}
          placeholder="e.g. 100"
          required
          min={0}
          step="any"
        />

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="Optional context…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Checkin Modal ─────────────────────────────────────────────────────────────

function CheckinModal({ open, goal, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({ value: "", notes: "", date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (open) setForm({ value: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ind = goal?.indicatorId || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ goalId: goal._id, value: Number(form.value), notes: form.notes, date: form.date });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Check-in"
      width="480px"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button form="checkin-form" type="submit" loading={busy}>Log Check-in</Button>
        </div>
      }
    >
      <form id="checkin-form" onSubmit={handleSubmit} className="grid gap-4">
        {ind.name && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-700">{ind.name}</span>
            {ind.unit && <span className="ml-2 text-slate-400">({ind.unit})</span>}
            {goal?.targetValue && (
              <span className="ml-auto float-right text-slate-400">Target: {goal.targetValue}</span>
            )}
          </div>
        )}
        <Input
          label="Value *"
          type="number"
          value={form.value}
          onChange={(e) => set("value", e.target.value)}
          placeholder="Current value achieved"
          required
          step="any"
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="What drove this value?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Goal Row (expandable) ─────────────────────────────────────────────────────

function GoalRow({ goal, onEdit, onDelete, onCheckin, onSync }) {
  const [expanded, setExpanded] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const [deleteCheckin, setDeleteCheckin] = useState(null);
  const toast = useToast();

  const loadCheckins = useCallback(async () => {
    setLoadingCheckins(true);
    try {
      const res = await listKPICheckins({ goalId: goal._id, limit: 20 });
      setCheckins(res?.items || []);
    } catch (e) {
      toast.error("Failed to load check-ins.");
    } finally {
      setLoadingCheckins(false);
    }
  }, [goal._id, toast]);

  useEffect(() => {
    if (expanded) loadCheckins();
  }, [expanded, loadCheckins]);

  const handleDeleteCheckin = async (id) => {
    try {
      await deleteKPICheckin(id);
      setCheckins((prev) => prev.filter((c) => c._id !== id));
      setDeleteCheckin(null);
      toast.success("Check-in removed.");
    } catch (e) {
      toast.error("Failed to remove check-in.");
    }
  };

  const ind = goal.indicatorId || {};
  const staff = goal.staffId || {};
  const StatusIcon = STATUS_ICON[goal.status] || Target;

  return (
    <>
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 grid gap-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">{ind.name || "—"}</span>
                <Badge tone={STATUS_TONE[goal.status] || "neutral"}>
                  <StatusIcon size={11} className="inline mr-0.5" />
                  {goal.status?.replace("_", " ")}
                </Badge>
                <Badge tone="neutral" className="capitalize text-xs">{goal.scope}</Badge>
                <span className="text-xs text-slate-400 tabular-nums">{goal.period}</span>
              </div>

              {/* Sub-info */}
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                {staff.fullName && <span>{staff.fullName}</span>}
                {goal.department && <span className="capitalize">{goal.department}</span>}
                {goal.teamId && <span>{goal.teamId}</span>}
                {ind.category && <span className="capitalize">{ind.category}</span>}
                {ind.autoSource && ind.autoSource !== "none" && (
                  <span className="flex items-center gap-1 text-indigo-500">
                    <Zap size={10} /> auto
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {ind.autoSource && ind.autoSource !== "none" && (
                <button
                  onClick={() => onSync(goal)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Auto-sync value"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                onClick={() => onCheckin(goal)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Log check-in"
              >
                <PlusIcon size={13} />
              </button>
              <button
                onClick={() => onEdit(goal)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(goal)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar pct={goal.progressPct} status={goal.status} />
            </div>
            <span className="text-sm font-semibold text-slate-600 tabular-nums w-12 text-right">
              {Math.round(goal.progressPct || 0)}%
            </span>
            <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
              {goal.currentValue ?? "—"} / {goal.targetValue} {ind.unit || ""}
            </span>
          </div>
        </div>

        {/* Expanded checkins */}
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-ins</span>
              <button
                onClick={() => onCheckin(goal)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <PlusIcon size={11} /> Add
              </button>
            </div>
            {loadingCheckins ? (
              <Skeleton className="h-10 rounded-lg" />
            ) : checkins.length === 0 ? (
              <p className="text-xs text-slate-400">No check-ins yet.</p>
            ) : (
              <div className="grid gap-1.5">
                {checkins.map((c) => (
                  <div key={c._id} className="flex items-center gap-3 text-xs">
                    <span className="tabular-nums text-slate-400">
                      {new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="font-semibold text-slate-700 tabular-nums">{c.value} {ind.unit || ""}</span>
                    {c.notes && <span className="text-slate-400 truncate max-w-xs">{c.notes}</span>}
                    {c.source === "auto" && (
                      <Badge tone="neutral" className="text-[10px]"><Zap size={8} className="inline" /> auto</Badge>
                    )}
                    <button
                      onClick={() => setDeleteCheckin(c)}
                      className="ml-auto p-1 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteCheckin}
        title="Remove Check-in?"
        message="Remove this check-in entry?"
        confirmLabel="Remove"
        danger
        onConfirm={() => handleDeleteCheckin(deleteCheckin._id)}
        onClose={() => setDeleteCheckin(null)}
      />
    </>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function KPIGoalsPage() {
  const toast = useToast();
  const [goals, setGoals]           = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState(false);

  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [checkinGoal, setCheckinGoal]   = useState(null);

  // Filters
  const [filterScope,  setFilterScope]  = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState(() => currentMonthPeriod());
  const [filterDept,   setFilterDept]   = useState("");

  const buildParams = useCallback(() => {
    const p = { limit: 100 };
    if (filterScope)  p.scope  = filterScope;
    if (filterStatus) p.status = filterStatus;
    if (filterPeriod) p.period = filterPeriod;
    if (filterDept)   p.department = filterDept;
    return p;
  }, [filterScope, filterStatus, filterPeriod, filterDept]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, indicatorsRes, staffRes] = await Promise.all([
        listKPIGoals(buildParams()),
        listKPIIndicators({ limit: 200 }),
        listStaff({ limit: 200, status: "active" }),
      ]);
      setGoals(goalsRes?.items || []);
      setIndicators(indicatorsRes?.items || []);
      setStaff(staffRes?.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [buildParams, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      await createKPIGoal(payload);
      setFormOpen(false);
      await load();
      toast.success("Goal created.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to create goal.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    setBusy(true);
    try {
      await updateKPIGoal(editTarget._id, payload);
      setEditTarget(null);
      await load();
      toast.success("Goal updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update goal.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteKPIGoal(deleteTarget._id);
      setDeleteTarget(null);
      await load();
      toast.success("Goal deleted.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete goal.");
    } finally {
      setBusy(false);
    }
  };

  const handleCheckin = async (payload) => {
    setBusy(true);
    try {
      await createKPICheckin(payload);
      setCheckinGoal(null);
      await load();
      toast.success("Check-in logged.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to log check-in.");
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async (goal) => {
    try {
      await syncKPIGoal(goal._id);
      await load();
      toast.success("Goal synced.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Sync failed.");
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="HR"
        title="KPI Goals"
        subtitle="Set targets, log check-ins, and track progress"
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "HR", to: "/portal/hr" },
          { label: "KPI Goals" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              New Goal
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Scopes</option>
          {SCOPES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
        </select>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={Target}
            title="No KPI goals found"
            message="Create goals to track performance against indicators."
            actionLabel="New Goal"
            onAction={() => setFormOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {goals.map((g) => (
            <GoalRow
              key={g._id}
              goal={g}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onCheckin={setCheckinGoal}
              onSync={handleSync}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        open={formOpen || !!editTarget}
        initial={editTarget}
        busy={busy}
        indicators={indicators}
        staff={staff}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
      />

      <CheckinModal
        open={!!checkinGoal}
        goal={checkinGoal}
        busy={busy}
        onClose={() => setCheckinGoal(null)}
        onSubmit={handleCheckin}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Goal?"
        message={`Delete this goal for "${deleteTarget?.indicatorId?.name || "—"}"? All check-ins will also be removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
