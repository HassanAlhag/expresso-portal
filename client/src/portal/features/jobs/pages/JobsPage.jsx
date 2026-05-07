import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/ui/Toast";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ViewToggle from "../../../shared/ui/ViewToggle";
import Modal from "../../../shared/ui/Modal";
import Input from "../../../shared/ui/Input";

import JobsPipelineBoard from "../components/JobsPipelineBoard";
import NewJobModal from "../components/NewJobModal";

import {
  Plus,
  RefreshCw,
  ClipboardList,
  LayoutList,
  PanelsTopLeft,
  Building2,
  FolderKanban,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
  X,
  ChevronRight,
} from "lucide-react";

import { createJob, listJobs, updateJob, deleteJob } from "../api";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listEnrollments } from "../../enrollments/api";
import { listUsers } from "../../iam/users/api";
import { JOB_SORT_OPTIONS, JOB_STATUSES, JOB_TYPES } from "../constants";
import { JOB_STAGES, getColumnKey } from "../pipeline";

// ── Constants ──────────────────────────────────────────────────────────────────

const PRIORITY_DOT = {
  urgent: "bg-rose-500",
  high: "bg-orange-400",
  normal: "bg-slate-300",
  low: "bg-slate-200",
};

const PRIORITY_LABEL = {
  urgent: "text-rose-600 bg-rose-50 border-rose-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  normal: "text-slate-500 bg-slate-50 border-slate-200",
  low: "text-slate-400 bg-slate-50 border-slate-200",
};

const STATUS_CLS = {
  brief: "bg-slate-100 text-slate-600",
  content_ready: "bg-sky-50 text-sky-700",
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
  delivered: "bg-emerald-100 text-emerald-800",
  on_hold: "bg-rose-50 text-rose-600",
  archived: "bg-slate-100 text-slate-500",
};

const TYPE_CLS = {
  reel: "border-violet-200 bg-violet-50 text-violet-700",
  video: "border-blue-200 bg-blue-50 text-blue-700",
  photo: "border-amber-200 bg-amber-50 text-amber-700",
  post: "border-slate-200 bg-slate-50 text-slate-600",
  story: "border-pink-200 bg-pink-50 text-pink-700",
  carousel: "border-sky-200 bg-sky-50 text-sky-700",
  design: "border-indigo-200 bg-indigo-50 text-indigo-700",
  case_study: "border-teal-200 bg-teal-50 text-teal-700",
  other: "border-slate-200 bg-slate-50 text-slate-500",
};

const EDIT_STATUS_OPTIONS = [
  { value: "brief", label: "Brief" },
  { value: "content_ready", label: "Content ready" },
  { value: "script", label: "Scripting" },
  { value: "pre_production", label: "Pre-production" },
  { value: "designing", label: "Designing" },
  { value: "shooting", label: "Shooting" },
  { value: "editing", label: "Editing" },
  { value: "internal_review", label: "Internal review" },
  { value: "client_review", label: "Client review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "delivered", label: "Delivered" },
  { value: "on_hold", label: "On hold" },
  { value: "archived", label: "Archived" },
];

const EDIT_PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

const PLATFORM_OPTIONS = [
  { value: "", label: "Any / unset" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AvatarStack({ assignees = [], size = 6 }) {
  if (!assignees.length) {
    return <span className="text-xs text-slate-400">Unassigned</span>;
  }
  const shown = assignees.slice(0, 4);
  const rest = assignees.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div
          key={a._id || i}
          title={a.fullName || a.name || "Staff"}
          style={{ marginLeft: i === 0 ? 0 : -6 }}
          className={`flex h-${size} w-${size} flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[9px] font-black text-indigo-700`}
        >
          {(a.fullName || a.name || "?").charAt(0).toUpperCase()}
        </div>
      ))}
      {rest > 0 && (
        <span className="ml-1 text-[10px] font-bold text-slate-400">+{rest}</span>
      )}
    </div>
  );
}

function MiniPipelineStage({ status }) {
  const col = getColumnKey(status || "brief");
  const idx = JOB_STAGES.findIndex((s) => s.key === col);
  return (
    <div className="flex items-center gap-0.5">
      {JOB_STAGES.map((s, i) => (
        <div
          key={s.key}
          title={s.label}
          className={[
            "h-1.5 rounded-full transition-all",
            i < idx ? "w-3 bg-indigo-400" : i === idx ? "w-4 bg-indigo-600" : "w-2 bg-slate-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel, busy }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
      <AlertCircle size={13} className="flex-shrink-0 text-rose-500" />
      <span className="text-xs font-semibold text-rose-700">Delete?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-black text-white hover:bg-rose-600 disabled:opacity-60"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50"
      >
        No
      </button>
    </div>
  );
}

// ── Quick Edit Modal ───────────────────────────────────────────────────────────

function JobEditModal({ open, job, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "", status: "brief", priority: "normal",
    type: "video", platform: "", dueDate: "", assignees: [],
  });
  const [users, setUsers] = useState([]);
  const [staffQ, setStaffQ] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !job) return;
    setForm({
      title: job.title || "",
      status: job.status || "brief",
      priority: job.priority || "normal",
      type: job.type || "video",
      platform: job.platform || "",
      dueDate: formatDate(job.dueDate),
      assignees: Array.isArray(job.assignees) ? job.assignees : [],
    });
    setError("");
    setStaffQ("");
  }, [open, job]);

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    listUsers({ limit: 100, isActive: true })
      .then((res) => setUsers(Array.isArray(res?.items) ? res.items : res?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!staffQ) return users;
    const lq = staffQ.toLowerCase();
    return users.filter(
      (u) => (u.fullName || u.name || "").toLowerCase().includes(lq)
    );
  }, [users, staffQ]);

  const isAssigned = (u) =>
    form.assignees.some((a) => (a._id || a) === u._id);

  const toggleAssignee = (u) => {
    setForm((f) => ({
      ...f,
      assignees: isAssigned(u)
        ? f.assignees.filter((a) => (a._id || a) !== u._id)
        : [...f.assignees, u],
    }));
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setBusy(true);
    setError("");
    try {
      await updateJob(job._id, {
        title: form.title.trim(),
        status: form.status,
        priority: form.priority,
        type: form.type,
        platform: form.platform || "",
        dueDate: form.dueDate || null,
        assignees: form.assignees.map((a) => a._id || a),
      });
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Job"
      subtitle="Update status, team assignment, and scheduling."
      width="760px"
      footer={
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Title */}
        <Input
          label="TITLE"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Job title"
        />

        {/* Status + Priority + Type */}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">Status</span>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              {EDIT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">Priority</span>
            <div className="flex gap-1.5">
              {EDIT_PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setField("priority", p)}
                  className={[
                    "flex-1 rounded-xl border py-2.5 text-[11px] font-bold capitalize transition",
                    form.priority === p
                      ? PRIORITY_LABEL[p]
                      : "border-black/5 bg-slate-50 text-slate-400 hover:bg-white",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">Platform</span>
            <select
              value={form.platform}
              onChange={(e) => setField("platform", e.target.value)}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Due date */}
        <Input
          label="DUE DATE"
          type="date"
          value={form.dueDate}
          onChange={(e) => setField("dueDate", e.target.value)}
        />

        {/* Assign staff */}
        <div>
          <div className="mb-3 text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
            Assigned staff
          </div>

          {form.assignees.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {form.assignees.map((a) => (
                <button
                  key={a._id || a}
                  type="button"
                  onClick={() => toggleAssignee(a)}
                  className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-400 text-[8px] font-black text-white">
                    {(a.fullName || a.name || "?").charAt(0).toUpperCase()}
                  </span>
                  {a.fullName || a.name || "Staff"}
                  <X size={9} />
                </button>
              ))}
            </div>
          )}

          <input
            value={staffQ}
            onChange={(e) => setStaffQ(e.target.value)}
            placeholder="Search staff by name…"
            className="mb-2 h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="max-h-44 divide-y divide-black/5 overflow-y-auto rounded-xl border border-black/10">
            {loadingUsers ? (
              <div className="p-3 text-center text-xs text-slate-400">Loading staff…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No staff found</div>
            ) : (
              filteredUsers.map((u) => {
                const active = isAssigned(u);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleAssignee(u)}
                    className={[
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                      active ? "bg-indigo-50" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black",
                        active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {(u.fullName || u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {u.fullName || u.name}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {String(u.role || "").replace(/_/g, " ")}
                      </div>
                    </div>
                    {active && <Check size={13} className="flex-shrink-0 text-indigo-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Advanced List Table ────────────────────────────────────────────────────────

function JobsTable({ items, onOpen, onRefresh, onEdit }) {
  const toast = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const [busyId, setBusyId] = useState("");

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteJob(id);
      setConfirmDeleteId("");
      await onRefresh?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white">
      {/* Header row */}
      <div className="grid grid-cols-[2.2fr_1.4fr_180px_130px_80px_140px] gap-2 border-b border-black/[0.06] bg-slate-50 px-5 py-3 text-[10.5px] font-black uppercase tracking-[0.18em] text-slate-400">
        <div>Job</div>
        <div>Client / Project</div>
        <div>Pipeline</div>
        <div>Assigned</div>
        <div>Due</div>
        <div>Actions</div>
      </div>

      <div className="divide-y divide-black/[0.05]">
        {items.map((j) => {
          const isBusy = busyId === j._id;
          const confirming = confirmDeleteId === j._id;
          const assignees = Array.isArray(j.assignees) ? j.assignees : [];
          const colKey = getColumnKey(j.status || "brief");
          const stageLabel = JOB_STAGES.find((s) => s.key === colKey)?.label || "Brief";
          const statusCls = STATUS_CLS[j.status] || "bg-slate-100 text-slate-600";
          const typeCls = TYPE_CLS[j.type] || TYPE_CLS.other;
          const dot = PRIORITY_DOT[j.priority] || PRIORITY_DOT.normal;
          const isOverdue =
            j.dueDate && !["published", "delivered", "archived"].includes(j.status) &&
            new Date(j.dueDate) < new Date();

          return (
            <div
              key={j._id}
              className="grid grid-cols-[2.2fr_1.4fr_180px_130px_80px_140px] items-center gap-2 px-5 py-4 transition hover:bg-slate-50/60"
            >
              {/* Job info */}
              <button
                type="button"
                className="min-w-0 text-left"
                onClick={() => onOpen?.(j)}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wide ${typeCls}`}
                  >
                    {j.type || "—"}
                  </span>
                  {j.priority && j.priority !== "normal" && (
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase ${PRIORITY_LABEL[j.priority]}`}
                    >
                      {j.priority}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-[13.5px] font-black text-slate-900">
                  {j.title || "Untitled job"}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold ${statusCls}`}>
                    {String(j.status || "brief").replace(/_/g, " ")}
                  </span>
                  {j.platform && (
                    <span className="text-[10px] capitalize text-slate-400">{j.platform}</span>
                  )}
                </div>
              </button>

              {/* Client / Project */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="flex-shrink-0 text-slate-300" />
                  <span className="truncate text-sm font-semibold text-slate-700">
                    {j.customerId?.companyName || j.customerId?.contactName || "—"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <FolderKanban size={11} className="flex-shrink-0 text-slate-300" />
                  <span className="truncate text-xs text-slate-500">
                    {j.projectId?.name || "—"}
                  </span>
                </div>
              </div>

              {/* Pipeline */}
              <div className="flex flex-col gap-1.5">
                <MiniPipelineStage status={j.status} />
                <span className="text-[9.5px] font-semibold text-slate-400">{stageLabel}</span>
              </div>

              {/* Assigned */}
              <div>
                <AvatarStack assignees={assignees} />
              </div>

              {/* Due date */}
              <div
                className={[
                  "text-xs font-semibold",
                  isOverdue ? "text-rose-500" : "text-slate-500",
                ].join(" ")}
              >
                {j.dueDate
                  ? new Date(j.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
                {isOverdue && (
                  <div className="text-[9px] font-bold text-rose-400">overdue</div>
                )}
              </div>

              {/* Actions */}
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {confirming ? (
                  <DeleteConfirm
                    busy={isBusy}
                    onConfirm={() => handleDelete(j._id)}
                    onCancel={() => setConfirmDeleteId("")}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpen?.(j)}
                      className="flex h-8 items-center gap-1 rounded-xl border border-black/10 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Open <ChevronRight size={11} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onEdit?.(j)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmDeleteId(j._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={13} />
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

export default function JobsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("-createdAt");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [view, setView] = useState("pipeline");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listJobs({ q, status, type, sort, limit: 100, page: 1 });
      const rows = res?.items || [];
      setItems(rows);
      setMeta({ page: res?.page || 1, pages: res?.pages || 1, total: res?.total ?? rows.length });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [q, status, type, sort]); // eslint-disable-line

  const counts = useMemo(() => {
    const IN_PROD = new Set(["brief", "content_ready", "script", "pre_production", "designing", "shooting", "editing"]);
    const IN_REV = new Set(["internal_review", "client_review"]);
    const APPR = new Set(["approved", "scheduled"]);
    const LIVE = new Set(["published", "delivered"]);
    return {
      production: items.filter((x) => IN_PROD.has(x.status)).length,
      review: items.filter((x) => IN_REV.has(x.status)).length,
      approved: items.filter((x) => APPR.has(x.status)).length,
      live: items.filter((x) => LIVE.has(x.status)).length,
    };
  }, [items]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createJob(payload);
      setCreateOpen(false);
      await load();
      const id = res?.item?._id || res?._id;
      if (id) nav(`/portal/jobs/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const moveJob = async (job, nextStatus) => {
    if (!job?._id || !nextStatus) return;
    setBusy(true);
    try { await updateJob(job._id, { status: nextStatus }); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || e?.message || "Move failed"); }
    finally { setBusy(false); }
  };

  const listProjectsForModal = async ({ customerId = "", q: pq = "" } = {}) => {
    const res = await listProjects({ q: pq, customerId, limit: 50, page: 1, sort: "-createdAt" });
    return { items: res?.items || [] };
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="CONTENT / EXECUTION"
          title="Jobs"
          subtitle="Manage production work across projects, clients, and enrolled scopes."
          breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Jobs" }]}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading || busy}>
                <RefreshCw size={15} />
                Refresh
              </Button>
              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus size={15} />
                New job
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={ClipboardList} label="Total" value={meta.total} color="indigo" />
          <StatCard icon={ClipboardList} label="In Production" value={counts.production} color="amber" />
          <StatCard icon={ClipboardList} label="In Review" value={counts.review} color="rose" />
          <StatCard icon={ClipboardList} label="Approved" value={counts.approved} color="violet" />
          <StatCard icon={ClipboardList} label="Live" value={counts.live} color="emerald" />
        </div>

        {/* Filter bar */}
        <FilterBar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search by title, client, project…"
          filters={[
            { label: "status", value: status, onChange: setStatus, options: JOB_STATUSES },
            { label: "type", value: type, onChange: setType, options: JOB_TYPES },
            { label: "sort", value: sort, onChange: setSort, options: JOB_SORT_OPTIONS },
          ]}
          onClear={() => { setQ(""); setStatus(""); setType(""); setSort("-createdAt"); }}
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
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No jobs yet"
            message="Create a job under a project to start tracking execution."
            actionLabel="New job"
            onAction={() => setCreateOpen(true)}
          />
        ) : view === "pipeline" ? (
          <JobsPipelineBoard
            items={items}
            busy={busy}
            onOpen={(j) => nav(`/portal/jobs/${j._id}`)}
            onMove={moveJob}
          />
        ) : (
          <JobsTable
            items={items}
            onOpen={(j) => nav(`/portal/jobs/${j._id}`)}
            onRefresh={load}
            onEdit={setEditJob}
          />
        )}
      </div>

      {/* Modals */}
      <NewJobModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        listCustomers={listCustomers}
        listProjects={listProjectsForModal}
        listEnrollments={listEnrollments}
        createJob={onCreate}
      />


      <JobEditModal
        open={!!editJob}
        job={editJob}
        onClose={() => setEditJob(null)}
        onSaved={async () => { setEditJob(null); await load(); }}
      />
    </>
  );
}
