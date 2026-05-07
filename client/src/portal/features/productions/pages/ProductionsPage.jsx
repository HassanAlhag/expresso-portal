import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import { useToast } from "../../../shared/ui/Toast";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ViewToggle from "../../../shared/ui/ViewToggle";
import ProductionCreateModal from "../components/ProductionCreateModal";
import ProductionJobFormModal from "../components/ProductionJobFormModal";

import {
  Clapperboard,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileVideo,
  Globe,
  Pencil,
  Trash2,
  ExternalLink,
  AlertCircle,
  CalendarDays,
  LayoutList,
  PanelsTopLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { PRODUCTION_STATUS_OPTIONS } from "../constants/production.constants";
import {
  listProductionJobs,
  updateProductionJob,
  setProductionJobStatus,
  publishProductionJob,
  deleteProductionJob,
} from "../jobs.api";

// ── Production pipeline stages ─────────────────────────────────────────────────

const PROD_STAGES = [
  { key: "brief",      label: "Brief",      moveStatus: "brief",           statuses: ["brief", "content_ready"] },
  { key: "scripting",  label: "Scripting",  moveStatus: "script",          statuses: ["script", "pre_production"] },
  { key: "production", label: "Production", moveStatus: "editing",         statuses: ["designing", "shooting", "editing"] },
  { key: "review",     label: "Review",     moveStatus: "internal_review", statuses: ["internal_review", "client_review"] },
  { key: "approved",   label: "Approved",   moveStatus: "approved",        statuses: ["approved", "scheduled"] },
  { key: "live",       label: "Live",       moveStatus: "published",       statuses: ["published", "delivered"] },
];

const STATUS_TO_COL = {};
PROD_STAGES.forEach((s) => s.statuses.forEach((st) => (STATUS_TO_COL[st] = s.key)));
const STAGE_IDX = Object.fromEntries(PROD_STAGES.map((s, i) => [s.key, i]));

function getColKey(status) { return STATUS_TO_COL[status] || "brief"; }
function nextStage(status) {
  const idx = STAGE_IDX[getColKey(status)] ?? 0;
  return PROD_STAGES[Math.min(idx + 1, PROD_STAGES.length - 1)].moveStatus;
}
function prevStage(status) {
  const idx = STAGE_IDX[getColKey(status)] ?? 0;
  return PROD_STAGES[Math.max(idx - 1, 0)].moveStatus;
}

// ── Style maps ─────────────────────────────────────────────────────────────────

const STATUS_CLS = {
  brief: "bg-slate-100 text-slate-600",
  content_ready: "bg-slate-100 text-slate-600",
  script: "bg-sky-50 text-sky-700",
  pre_production: "bg-sky-50 text-sky-700",
  designing: "bg-indigo-50 text-indigo-700",
  shooting: "bg-indigo-50 text-indigo-700",
  editing: "bg-indigo-50 text-indigo-700",
  internal_review: "bg-amber-50 text-amber-700",
  client_review: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-teal-50 text-teal-700",
  published: "bg-violet-50 text-violet-700",
  on_hold: "bg-rose-50 text-rose-600",
  cancelled: "bg-red-50 text-red-600",
};

const TYPE_CLS = {
  reel: "border-violet-200 bg-violet-50 text-violet-700",
  video: "border-blue-200 bg-blue-50 text-blue-700",
};

const PRIORITY_DOT = {
  urgent: "bg-rose-500",
  high: "bg-orange-400",
  normal: "bg-slate-300",
  low: "bg-slate-200",
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  ...PRODUCTION_STATUS_OPTIONS.filter((x) => x.value),
];

// ── Shared helpers ─────────────────────────────────────────────────────────────

function AvatarStack({ assignees = [] }) {
  if (!assignees.length) return null;
  const shown = assignees.slice(0, 4);
  const rest = assignees.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div
          key={a._id || i}
          title={a.fullName || a.name || "Staff"}
          style={{ marginLeft: i === 0 ? 0 : -5 }}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[8px] font-black text-indigo-700"
        >
          {(a.fullName || a.name || "?").charAt(0).toUpperCase()}
        </div>
      ))}
      {rest > 0 && (
        <span className="ml-1 text-[9px] font-bold text-slate-400">+{rest}</span>
      )}
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel, busy }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5">
      <AlertCircle size={12} className="flex-shrink-0 text-rose-500" />
      <span className="text-[11px] font-semibold text-rose-700">Delete?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white hover:bg-rose-600 disabled:opacity-60"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-black text-rose-600 hover:bg-rose-50"
      >
        No
      </button>
    </div>
  );
}

// ── Pipeline board view ────────────────────────────────────────────────────────

function PipelineCard({ item, onOpen, onEdit, onMove, onDelete, busy }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isBusy = busy === item._id;
  const assignees = Array.isArray(item.assignees) ? item.assignees : [];
  const dot = PRIORITY_DOT[item.priority] || PRIORITY_DOT.normal;
  const typeCls = TYPE_CLS[item.type] || TYPE_CLS.reel;
  const isOverdue =
    item.dueDate &&
    !["published", "delivered"].includes(item.status) &&
    new Date(item.dueDate) < new Date();

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-sm">
      {/* Top row */}
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
        <button type="button" onClick={() => onOpen?.(item)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${typeCls}`}>
              {item.type}
            </span>
            {item.platform && (
              <span className="text-[9px] capitalize text-slate-400">{item.platform}</span>
            )}
          </div>
          <div className="mt-1 text-[12.5px] font-black leading-snug text-slate-900 line-clamp-2">
            {item.title || "Untitled"}
          </div>
          <div className="mt-0.5 truncate text-[10px] text-slate-400">
            {item.customerId?.companyName || item.customerId?.contactName || "—"}
          </div>
        </button>
      </div>

      {/* Meta */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        {item.dueDate && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${isOverdue ? "text-rose-500" : "text-slate-400"}`}>
            <CalendarDays size={9} />
            {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {isOverdue && " · overdue"}
          </span>
        )}
        <AvatarStack assignees={assignees} />
      </div>

      {/* Website badge */}
      {item.websiteVisible && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
          <Globe size={8} /> On website
        </div>
      )}

      {/* Actions row */}
      <div className="mt-3 border-t border-black/[0.05] pt-2.5">
        {confirmDelete ? (
          <DeleteConfirm
            busy={isBusy}
            onConfirm={() => { onDelete?.(item); setConfirmDelete(false); }}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onMove?.(item, nextStage(item.status))}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 py-1.5 text-[10px] font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"
            >
              Next <ChevronRight size={10} />
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onMove?.(item, prevStage(item.status))}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={10} />
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onEdit?.(item)}
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-black/10 bg-white text-slate-400 transition hover:text-slate-700"
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmDelete(true)}
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductionPipelineBoard({ items, onOpen, onEdit, onMove, onDelete, busy }) {
  const byStage = useMemo(() => {
    const map = {};
    PROD_STAGES.forEach((s) => (map[s.key] = []));
    items.forEach((item) => {
      const col = getColKey(item.status || "brief");
      if (map[col]) map[col].push(item);
      else map[col] = [item];
    });
    return map;
  }, [items]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[900px] gap-3">
        {PROD_STAGES.map((col) => {
          const colItems = byStage[col.key] || [];
          return (
            <div
              key={col.key}
              className="flex min-w-[170px] flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-slate-50/60"
            >
              <div className="flex items-center justify-between border-b border-black/[0.07] bg-white px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {col.label}
                </span>
                <span className="min-w-[18px] rounded-full bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-black text-slate-600">
                  {colItems.length}
                </span>
              </div>
              <div className="grid gap-2 p-2">
                {colItems.map((item) => (
                  <PipelineCard
                    key={item._id}
                    item={item}
                    onOpen={onOpen}
                    onEdit={onEdit}
                    onMove={onMove}
                    onDelete={onDelete}
                    busy={busy}
                  />
                ))}
                {colItems.length === 0 && (
                  <div className="py-8 text-center text-[10px] text-slate-400">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────────

function ProductionsListTable({ items, onOpen, onEdit, onRefresh }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");

  const run = async (id, fn) => {
    setBusyId(id);
    try { await fn(); await onRefresh?.(); }
    catch (e) { toast.error(e?.response?.data?.message || e?.message || "Action failed"); }
    finally { setBusyId(""); }
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white">
      <div className="grid grid-cols-[2fr_1.2fr_160px_110px_80px_210px] gap-2 border-b border-black/[0.06] bg-slate-50 px-5 py-3 text-[10.5px] font-black uppercase tracking-[0.18em] text-slate-400">
        <div>Production</div>
        <div>Client</div>
        <div>Stage</div>
        <div>Assigned</div>
        <div>Due</div>
        <div>Actions</div>
      </div>

      <div className="divide-y divide-black/[0.05]">
        {items.map((item) => {
          const isBusy = busyId === item._id;
          const confirming = confirmDeleteId === item._id;
          const typeCls = TYPE_CLS[item.type] || TYPE_CLS.reel;
          const statusCls = STATUS_CLS[item.status] || "bg-slate-100 text-slate-600";
          const dot = PRIORITY_DOT[item.priority] || PRIORITY_DOT.normal;
          const colKey = getColKey(item.status);
          const stageLabel = PROD_STAGES.find((s) => s.key === colKey)?.label || "Brief";
          const stageIdx = STAGE_IDX[colKey] ?? 0;
          const isOverdue =
            item.dueDate &&
            !["published", "delivered"].includes(item.status) &&
            new Date(item.dueDate) < new Date();

          return (
            <div
              key={item._id}
              className="grid grid-cols-[2fr_1.2fr_160px_110px_80px_210px] items-center gap-2 px-5 py-4 transition hover:bg-slate-50/60"
            >
              {/* Title + type */}
              <button type="button" className="min-w-0 text-left" onClick={() => onOpen?.(item)}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                  <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9.5px] font-black uppercase ${typeCls}`}>
                    {item.type}
                  </span>
                </div>
                <div className="mt-1 truncate text-sm font-black text-slate-900">{item.title || "Untitled"}</div>
                <div className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[9.5px] font-bold ${statusCls}`}>
                  {String(item.status || "—").replace(/_/g, " ")}
                </div>
              </button>

              {/* Client */}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-700">
                  {item.customerId?.companyName || item.customerId?.contactName || "—"}
                </div>
                {item.platform && (
                  <div className="text-xs capitalize text-slate-400">{item.platform}</div>
                )}
              </div>

              {/* Stage progress */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  {PROD_STAGES.map((s, i) => (
                    <div
                      key={s.key}
                      title={s.label}
                      className={[
                        "h-1.5 rounded-full transition-all",
                        i < stageIdx ? "w-3 bg-indigo-400" : i === stageIdx ? "w-4 bg-indigo-600" : "w-2 bg-slate-200",
                      ].join(" ")}
                    />
                  ))}
                </div>
                <span className="text-[9.5px] font-semibold text-slate-400">{stageLabel}</span>
              </div>

              {/* Assigned */}
              <div>
                {Array.isArray(item.assignees) && item.assignees.length > 0
                  ? <AvatarStack assignees={item.assignees} />
                  : <span className="text-xs text-slate-400">—</span>}
              </div>

              {/* Due */}
              <div className={`text-xs font-semibold ${isOverdue ? "text-rose-500" : "text-slate-500"}`}>
                {item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
                {isOverdue && <div className="text-[9px] text-rose-400">overdue</div>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {confirming ? (
                  <DeleteConfirm
                    busy={isBusy}
                    onConfirm={() => run(item._id, async () => { await deleteProductionJob(item._id); setConfirmDeleteId(""); })}
                    onCancel={() => setConfirmDeleteId("")}
                  />
                ) : (
                  <>
                    <select
                      value=""
                      disabled={isBusy}
                      onChange={(e) => { if (e.target.value) run(item._id, () => setProductionJobStatus(item._id, e.target.value)); }}
                      className="h-8 rounded-xl border border-black/10 bg-white px-2 text-[11px] font-semibold outline-none"
                    >
                      <option value="">Stage</option>
                      {STATUS_FILTER_OPTIONS.filter((x) => x.value).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => run(item._id, () =>
                        item.status === "published"
                          ? setProductionJobStatus(item._id, "approved")
                          : publishProductionJob(item._id)
                      )}
                      className={[
                        "flex h-8 items-center gap-1 rounded-xl border px-2.5 text-[11px] font-bold transition",
                        item.status === "published"
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-indigo-200 bg-indigo-50 text-indigo-700",
                      ].join(" ")}
                    >
                      <ExternalLink size={10} />
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => run(item._id, () => updateProductionJob(item._id, { websiteVisible: !item.websiteVisible }))}
                      className={[
                        "flex h-8 items-center gap-1 rounded-xl border px-2 text-[11px] font-bold transition",
                        item.websiteVisible
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      ].join(" ")}
                    >
                      <Globe size={10} />
                      {item.websiteVisible ? "Visible" : "Hidden"}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onEdit?.(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-slate-400 transition hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmDeleteId(item._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTS = [
  { value: "", label: "All statuses" },
  ...PRODUCTION_STATUS_OPTIONS.filter((x) => x.value),
];

export default function ProductionsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("pipeline");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { q, page: 1, limit: 200 };
      if (statusFilter) params.status = statusFilter;
      const res = await listProductionJobs(params);
      // Keep only reels and videos
      const rows = (Array.isArray(res?.items) ? res.items : []).filter(
        (x) => ["reel", "video"].includes(x.type)
      );
      setItems(rows);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: items.length,
    reels: items.filter((x) => x.type === "reel").length,
    videos: items.filter((x) => x.type === "video").length,
    inReview: items.filter((x) => ["internal_review", "client_review"].includes(x.status)).length,
    published: items.filter((x) => x.status === "published").length,
  }), [items]);

  const moveItem = async (item, nextStatus) => {
    if (!item?._id || !nextStatus) return;
    setBusyId(item._id);
    try { await setProductionJobStatus(item._id, nextStatus); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || e?.message || "Move failed"); }
    finally { setBusyId(""); }
  };

  const deleteItem = async (item) => {
    setBusyId(item._id);
    try { await deleteProductionJob(item._id); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || e?.message || "Delete failed"); }
    finally { setBusyId(""); }
  };

  const filtered = useMemo(() => {
    if (!q) return items;
    const lq = q.toLowerCase();
    return items.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(lq) ||
        (x.customerId?.companyName || "").toLowerCase().includes(lq) ||
        (x.platform || "").toLowerCase().includes(lq)
    );
  }, [items, q]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Production"
        title="Production workspace"
        subtitle="Track reels and videos from brief through to publishing."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Production" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={15} />
              New production
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={Clapperboard} color="indigo" />
        <StatCard label="Reels" value={stats.reels} icon={FileVideo} color="violet" />
        <StatCard label="Videos" value={stats.videos} icon={FileVideo} color="blue" />
        <StatCard label="In Review" value={stats.inReview} icon={Eye} color="amber" />
        <StatCard label="Published" value={stats.published} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Filters + view toggle */}
      <FilterBar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search reels and videos…"
        filters={[
          { label: "status", value: statusFilter, onChange: setStatusFilter, options: STATUS_FILTER_OPTS },
        ]}
        onClear={() => { setQ(""); setStatusFilter(""); }}
        right={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "pipeline", icon: PanelsTopLeft, label: "Pipeline" },
              { value: "list", icon: LayoutList, label: "List" },
            ]}
          />
        }
      />

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No reels or videos found"
          message="Create your first production to start tracking delivery."
          actionLabel="New production"
          onAction={() => setCreateOpen(true)}
        />
      ) : view === "pipeline" ? (
        <ProductionPipelineBoard
          items={filtered}
          onOpen={(item) => item?._id && nav(`/portal/productions/${item._id}`)}
          onEdit={setEditItem}
          onMove={moveItem}
          onDelete={deleteItem}
          busy={busyId}
        />
      ) : (
        <ProductionsListTable
          items={filtered}
          onOpen={(item) => item?._id && nav(`/portal/productions/${item._id}`)}
          onEdit={setEditItem}
          onRefresh={load}
        />
      )}

      {/* Modals */}
      <ProductionCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); load(); }}
      />
      <ProductionJobFormModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSaved={() => { setEditItem(null); load(); }}
        mode="edit"
        initialData={editItem}
      />
    </div>
  );
}
