import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  Activity,
  RefreshCw,
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
  listKPIIndicators,
  createKPIIndicator,
  updateKPIIndicator,
  deleteKPIIndicator,
} from "../api";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["performance", "productivity", "attendance", "financial", "development", "quality", "custom"];
const DIRECTIONS = ["higher_is_better", "lower_is_better", "on_target"];
const FREQUENCIES = ["weekly", "monthly", "quarterly", "annual"];
const AUTO_SOURCES = [
  { value: "none", label: "None (manual entry)" },
  { value: "leaves_taken", label: "Leaves Taken (approved days)" },
  { value: "expenses_total", label: "Expenses Total (approved AED)" },
  { value: "scorecard_avg", label: "Scorecard Average Rating" },
  { value: "learning_goals_completed", label: "Learning Goals Completed" },
];

const CATEGORY_TONE = {
  performance: "info",
  productivity: "success",
  attendance: "warning",
  financial: "neutral",
  development: "info",
  quality: "success",
  custom: "neutral",
};

const DIRECTION_LABEL = {
  higher_is_better: "↑ Higher is better",
  lower_is_better:  "↓ Lower is better",
  on_target:        "◎ On target",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "performance",
  unit: "count",
  direction: "higher_is_better",
  frequency: "monthly",
  autoSource: "none",
  isActive: true,
  order: 0,
};

// ── Form Modal ─────────────────────────────────────────────────────────────────

function IndicatorFormModal({ open, initial, busy, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setForm(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, order: Number(form.order) || 0 });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit KPI Indicator" : "New KPI Indicator"}
      width="600px"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button form="ind-form" type="submit" loading={busy}>
            {initial ? "Save Changes" : "Create Indicator"}
          </Button>
        </div>
      }
    >
      <form id="ind-form" onSubmit={handleSubmit} className="grid gap-4">
        <Input
          label="Name *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Monthly Sales Calls"
          required
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What does this indicator measure?"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(value) => set("category", value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </Select>
          <Input
            label="Unit"
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="count, %, AED, days, score…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Direction"
            value={form.direction}
            onChange={(value) => set("direction", value)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>{DIRECTION_LABEL[d]}</option>
            ))}
          </Select>
          <Select
            label="Frequency"
            value={form.frequency}
            onChange={(value) => set("frequency", value)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f} className="capitalize">{f}</option>
            ))}
          </Select>
        </div>

        <Select
          label="Auto Source"
          value={form.autoSource}
          onChange={(value) => set("autoSource", value)}
        >
          {AUTO_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>

        {form.autoSource !== "none" && (
          <div className="flex items-start gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            <Zap size={14} className="mt-0.5 shrink-0" />
            <span>This indicator will auto-sync values from system data when goals are synced.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sort Order"
            type="number"
            value={form.order}
            onChange={(e) => set("order", e.target.value)}
            min={0}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-600">Active</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function KPIIndicatorsPage() {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listKPIIndicators({
        limit: 200,
        ...(showInactive ? { includeInactive: "true" } : {}),
      });
      setItems(res?.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load indicators.");
    } finally {
      setLoading(false);
    }
  }, [showInactive, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      await createKPIIndicator(payload);
      setFormOpen(false);
      await load();
      toast.success("Indicator created.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to create.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    setBusy(true);
    try {
      await updateKPIIndicator(editTarget._id, payload);
      setEditTarget(null);
      await load();
      toast.success("Indicator updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteKPIIndicator(deleteTarget._id);
      setDeleteTarget(null);
      await load();
      toast.success("Indicator deleted.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete.");
    } finally {
      setBusy(false);
    }
  };

  const visible = showInactive ? items : items.filter((i) => i.isActive);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="HR"
        title="KPI Indicators"
        subtitle="Define what to measure — categories, units, and auto-sources"
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "HR", to: "/portal/hr" },
          { label: "KPI Indicators" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              New Indicator
            </Button>
          </div>
        }
      />

      <Card className="p-5">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No KPI indicators yet"
            message="Create indicators to start tracking performance metrics."
            actionLabel="New Indicator"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Unit</th>
                  <th className="pb-2 pr-4">Direction</th>
                  <th className="pb-2 pr-4">Frequency</th>
                  <th className="pb-2 pr-4">Auto Source</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((ind) => (
                  <tr key={ind._id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-slate-800">{ind.name}</span>
                      {ind.description && (
                        <div className="text-xs text-slate-400 max-w-xs truncate">{ind.description}</div>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={CATEGORY_TONE[ind.category] || "neutral"} className="capitalize">
                        {ind.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{ind.unit}</td>
                    <td className="py-2.5 pr-4 text-slate-500 text-xs">{DIRECTION_LABEL[ind.direction]}</td>
                    <td className="py-2.5 pr-4 capitalize text-slate-500">{ind.frequency}</td>
                    <td className="py-2.5 pr-4">
                      {ind.autoSource !== "none" ? (
                        <span className="flex items-center gap-1 text-indigo-600 text-xs">
                          <Zap size={11} />
                          {AUTO_SOURCES.find((s) => s.value === ind.autoSource)?.label || ind.autoSource}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Manual</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={ind.isActive ? "success" : "neutral"}>
                        {ind.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(ind)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(ind)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <IndicatorFormModal
        open={formOpen || !!editTarget}
        initial={editTarget}
        busy={busy}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Indicator?"
        message={`Delete "${deleteTarget?.name}"? This will also delete all associated goals and check-ins. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
