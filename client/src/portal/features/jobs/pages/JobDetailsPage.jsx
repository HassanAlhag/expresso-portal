import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { useToast } from "../../../shared/ui/Toast";

import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { addApproval, attachMedia, deleteJob, getJob, publishJob, updateJob } from "../api";
import { listUsers } from "../../iam/users/api";
import { BRAND } from "../constants";

const PIPELINE_STAGES = [
  { key: "brief",           label: "Brief" },
  { key: "content_ready",   label: "Content" },
  { key: "script",          label: "Script" },
  { key: "pre_production",  label: "Pre-prod" },
  { key: "designing",       label: "Design" },
  { key: "shooting",        label: "Shoot" },
  { key: "editing",         label: "Edit" },
  { key: "internal_review", label: "Int. Review" },
  { key: "client_review",   label: "Client Review" },
  { key: "approved",        label: "Approved" },
  { key: "scheduled",       label: "Scheduled" },
  { key: "published",       label: "Published" },
  { key: "delivered",       label: "Delivered" },
];

function stageIndex(status) {
  return PIPELINE_STAGES.findIndex((s) => s.key === status);
}

function statusTone(status) {
  if (["published", "delivered"].includes(status)) return "emerald";
  if (status === "approved") return "indigo";
  if (["internal_review", "client_review"].includes(status)) return "orange";
  if (["designing", "editing"].includes(status)) return "sky";
  if (["pre_production", "shooting", "scheduled"].includes(status)) return "amber";
  if (["archived", "on_hold"].includes(status)) return "red";
  return "slate";
}

const toneCls = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function Badge({ tone = "slate", children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${toneCls[tone] || toneCls.slate}`}>
      {children}
    </span>
  );
}

function threadStyle(status) {
  switch (status) {
    case "approved":
      return { bg: "bg-emerald-50 border-emerald-200", Icon: CheckCircle2, iconCls: "text-emerald-600", label: "Approved" };
    case "changes_requested":
      return { bg: "bg-orange-50 border-orange-200", Icon: AlertTriangle, iconCls: "text-orange-500", label: "Changes requested" };
    case "client_sent":
      return { bg: "bg-blue-50 border-blue-200", Icon: Send, iconCls: "text-blue-500", label: "Sent to client" };
    case "client_note":
      return { bg: "bg-violet-50 border-violet-200", Icon: MessageSquare, iconCls: "text-violet-500", label: "Client note" };
    default:
      return { bg: "bg-slate-50 border-slate-200", Icon: Lock, iconCls: "text-slate-400", label: "Internal note" };
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch { return ""; }
}

function ThreadEntry({ entry }) {
  const { bg, Icon, iconCls, label } = threadStyle(entry.status);
  const author = entry.createdBy?.fullName || entry.createdBy?.email || "Staff";
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${iconCls}`}><Icon size={15} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700">{label}</span>
            <span className="text-[11px] text-slate-400">{formatTime(entry.createdAt)}</span>
          </div>
          {entry.note && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{entry.note}</p>
          )}
          <div className="mt-1.5 text-[11px] font-bold text-slate-400">{author}</div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name = "") {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

export default function JobDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState(null);

  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("internal_note");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [planningDirty, setPlanningDirty] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getJob(id);
      setJob(res?.item || null);
      setPlanningDirty(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      listUsers({ role: "staff", isActive: true, limit: 100 }),
      listUsers({ role: "admin", isActive: true, limit: 50 }),
    ]).then(([s, a]) => {
      const all = [...(s?.items || []), ...(a?.items || [])];
      const seen = new Set();
      setStaffUsers(all.filter((u) => { if (seen.has(u._id)) return false; seen.add(u._id); return true; }));
    }).catch(() => {});
  }, []);

  const customerLabel = useMemo(() => {
    const c = job?.customerId;
    if (!c) return "—";
    if (typeof c === "object") return c.companyName || c.contactName || c.primaryEmail || "Client";
    return String(c);
  }, [job]);

  const projectLabel = useMemo(() => {
    const p = job?.projectId;
    if (!p) return "—";
    if (typeof p === "object") return p.name || "Project";
    return String(p);
  }, [job]);

  const enrollmentLabel = useMemo(() => {
    const e = job?.enrollmentId;
    if (!e) return "—";
    if (typeof e === "object") return e.serviceTemplateId?.name || "Scope item";
    return String(e);
  }, [job]);

  const moveToStage = async (status) => {
    if (!job?._id || busy) return;
    setBusy(true);
    try {
      await updateJob(job._id, { status });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally { setBusy(false); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await addApproval(id, { status: noteType, note });
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to add note");
    } finally { setBusy(false); }
  };

  const handleSendToClient = async () => {
    setBusy(true);
    try {
      await updateJob(id, { status: "client_review" });
      await addApproval(id, { status: "client_sent", note: note.trim() || "Job sent to client for review." });
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to send to client");
    } finally { setBusy(false); }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await addApproval(id, { status: "approved", note: note.trim() || "Approved." });
      await updateJob(id, { status: "approved" });
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Approval failed");
    } finally { setBusy(false); }
  };

  const handleRequestChanges = async () => {
    if (!note.trim()) { toast.error("Add a note describing the changes needed."); return; }
    setBusy(true);
    try {
      await addApproval(id, { status: "changes_requested", note });
      await updateJob(id, { status: "editing" });
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to request changes");
    } finally { setBusy(false); }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      await publishJob(id, {});
      toast.success("Job published successfully.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Publish failed");
    } finally { setBusy(false); }
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete job",
      message: `Delete "${job?.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deleteJob(id);
          nav("/portal/jobs");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
      },
    });
  };

  const handleSavePlanning = async () => {
    setBusy(true);
    try {
      await updateJob(id, {
        storyboard: job?.storyboard || "",
        shotList: job?.shotList || "",
        notes: job?.notes || "",
      });
      setPlanningDirty(false);
      toast.success("Planning notes saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally { setBusy(false); }
  };

  const handleMediaPicked = async (media) => {
    if (!media?._id) return;
    setBusy(true);
    try {
      await attachMedia(id, [media._id]);
      setPickerOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Attach failed");
    } finally { setBusy(false); }
  };

  const addAssignee = async (userId) => {
    if (!userId || busy) return;
    const existing = (job.assignees || []).map((x) => x._id || x);
    if (existing.includes(userId)) return;
    setBusy(true);
    try {
      await updateJob(job._id, { assignees: [...existing, userId] });
      await load();
    } catch { } finally { setBusy(false); }
  };

  const removeAssignee = async (userId) => {
    if (busy) return;
    const next = (job.assignees || []).map((x) => x._id || x).filter((x) => x !== userId);
    setBusy(true);
    try {
      await updateJob(job._id, { assignees: next });
      await load();
    } catch { } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="grid gap-5">
        <div className="rounded-[24px] border border-black/[0.07] bg-white p-6">
          <Skeleton className="mb-3 h-6 w-48" />
          <Skeleton className="mb-2 h-8 w-96" />
          <Skeleton className="mb-5 h-4 w-64" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <Skeleton className="h-80 rounded-[24px]" />
            <Skeleton className="h-64 rounded-[24px]" />
          </div>
          <div className="grid gap-5 content-start">
            <Skeleton className="h-48 rounded-[24px]" />
            <Skeleton className="h-48 rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">{error}</div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">Job not found.</div>
    );
  }

  const currentStageIdx = stageIndex(job.status);
  const approvals = Array.isArray(job.approvals) ? job.approvals : [];
  const assignees = Array.isArray(job.assignees) ? job.assignees : [];
  const media = Array.isArray(job.media) ? job.media : [];
  const isClientReview = job.status === "client_review";

  return (
    <div className="grid gap-5">
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
      {/* Header */}
      <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6">
        <button
          type="button"
          onClick={() => nav("/portal/jobs")}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03]"
        >
          <ArrowLeft size={13} />
          Back to jobs
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {customerLabel}
              {projectLabel !== "—" ? ` · ${projectLabel}` : ""}
              {enrollmentLabel !== "—" ? ` · ${enrollmentLabel}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone(job.status)}>{String(job.status || "").replaceAll("_", " ").toUpperCase()}</Badge>
              <Badge tone="slate">{String(job.type || "").toUpperCase()}</Badge>
              <Badge tone="amber">{String(job.priority || "normal").toUpperCase()}</Badge>
              {job.platform && <Badge tone="sky">{job.platform.toUpperCase()}</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleSendToClient} disabled={busy}>
              <Send size={15} />
              Send to client
            </Button>
            <Button onClick={handlePublish} disabled={busy} style={{ backgroundColor: BRAND }}>
              <Globe size={15} />
              Publish
            </Button>
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        {/* Pipeline progress bar */}
        <div className="mt-6">
          <div className="flex items-stretch gap-0.5">
            {PIPELINE_STAGES.map((stage, i) => {
              const isPast = i < currentStageIdx;
              const isCurrent = i === currentStageIdx;
              return (
                <button
                  key={stage.key}
                  type="button"
                  title={stage.label}
                  disabled={busy}
                  onClick={() => moveToStage(stage.key)}
                  className={[
                    "group relative flex-1 rounded-full transition",
                    isCurrent ? "h-3" : "h-2",
                    isPast
                      ? "bg-indigo-400 hover:bg-indigo-500"
                      : isCurrent
                      ? "bg-indigo-600 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                      : "bg-slate-200 hover:bg-slate-300",
                  ].join(" ")}
                >
                  <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Brief</span>
            <span className="font-extrabold text-slate-600">{PIPELINE_STAGES[currentStageIdx]?.label || "—"}</span>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      {/* Client review banner */}
      {isClientReview && (
        <div className="flex items-center justify-between gap-4 rounded-[20px] border border-orange-200 bg-orange-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
              <Send size={16} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-orange-900">Awaiting client review</div>
              <div className="text-xs text-orange-700">This job has been sent to the client for feedback and approval.</div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={handleRequestChanges} disabled={busy}>
              <AlertTriangle size={14} />
              Request changes
            </Button>
            <Button onClick={handleApprove} disabled={busy} style={{ backgroundColor: "#059669" }}>
              <CheckCircle2 size={14} />
              Approve
            </Button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="grid gap-5">
          {/* Communication thread */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-500" />
              <h2 className="text-sm font-extrabold text-slate-900">Review &amp; Communication</h2>
              {approvals.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-500">
                  {approvals.length}
                </span>
              )}
            </div>

            {approvals.length > 0 ? (
              <div className="mb-5 grid gap-3">
                {approvals.map((entry, i) => (
                  <ThreadEntry key={entry._id || i} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <MessageSquare size={20} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">No activity yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Add a note or send to client to start the thread.</p>
              </div>
            )}

            {/* Compose */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex gap-1.5">
                {[
                  { value: "internal_note", label: "Internal note", Icon: Lock },
                  { value: "client_note", label: "Client note", Icon: MessageSquare },
                ].map(({ value, label, Icon: Ic }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNoteType(value)}
                    className={[
                      "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                      noteType === value
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-white",
                    ].join(" ")}
                  >
                    <Ic size={12} />
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  noteType === "internal_note"
                    ? "Write an internal note visible only to staff…"
                    : "Write a note visible to the client…"
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleAddNote} disabled={busy || !note.trim()}>
                  Add note
                </Button>
                <Button variant="outline" onClick={handleSendToClient} disabled={busy}>
                  <Send size={14} />
                  Send to client
                </Button>
                <Button variant="outline" onClick={handleRequestChanges} disabled={busy}>
                  <AlertTriangle size={14} />
                  Request changes
                </Button>
                <Button onClick={handleApprove} disabled={busy} style={{ backgroundColor: "#059669" }}>
                  <CheckCircle2 size={14} />
                  Approve
                </Button>
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <h2 className="text-sm font-extrabold text-slate-900">Planning &amp; Content</h2>
                {planningDirty && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">Unsaved</span>
                )}
              </div>
              <Button
                onClick={handleSavePlanning}
                disabled={busy || !planningDirty}
                style={planningDirty ? { backgroundColor: BRAND } : {}}
              >
                Save
              </Button>
            </div>

            <div className="grid gap-4">
              {[
                { key: "storyboard", label: "STORYBOARD", placeholder: "Storyboard / script…" },
                { key: "shotList",   label: "SHOT LIST",   placeholder: "Shot list…" },
                { key: "notes",      label: "NOTES",       placeholder: "Execution notes…" },
              ].map(({ key, label, placeholder }) => (
                <label key={key} className="grid gap-2">
                  <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400">{label}</span>
                  <textarea
                    rows={3}
                    value={job[key] || ""}
                    onChange={(e) => {
                      setJob((prev) => ({ ...prev, [key]: e.target.value }));
                      setPlanningDirty(true);
                    }}
                    placeholder={placeholder}
                    className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="grid content-start gap-5">
          {/* Job info */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">JOB INFO</h3>
            <div className="grid gap-3">
              {[
                { Icon: Building2,   label: "Client",    value: customerLabel },
                { Icon: FolderKanban, label: "Project",   value: projectLabel },
                { Icon: Briefcase,   label: "Scope",     value: enrollmentLabel },
                { Icon: CalendarDays, label: "Due date",  value: job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "—" },
                { Icon: CalendarDays, label: "Created",   value: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-slate-400"><Icon size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-slate-400">{label}</div>
                    <div className="truncate text-sm font-semibold text-slate-800">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Move stage */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">MOVE STAGE</h3>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map((stage) => (
                <button
                  key={stage.key}
                  type="button"
                  disabled={busy || job.status === stage.key}
                  onClick={() => moveToStage(stage.key)}
                  className={[
                    "rounded-xl border px-2.5 py-1 text-xs font-bold transition",
                    job.status === stage.key
                      ? "cursor-default border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    busy ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned staff */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">ASSIGNED STAFF</h3>
            {assignees.length === 0 ? (
              <p className="mb-3 text-xs text-slate-400">No staff assigned yet.</p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-2">
                {assignees.map((a) => (
                  <div
                    key={a._id || a}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 py-0.5 pl-1 pr-2"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[9px] font-black text-indigo-800">
                      {getInitials(a.fullName || "")}
                    </div>
                    <span className="text-xs font-semibold text-indigo-800">{a.fullName || a.email || "Staff"}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeAssignee(a._id || a)}
                      className="ml-0.5 text-indigo-300 transition hover:text-rose-500"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {staffUsers.length > 0 && (
              <select
                value=""
                disabled={busy}
                onChange={(e) => addAssignee(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300"
              >
                <option value="">+ Add staff member…</option>
                {staffUsers
                  .filter((u) => !assignees.some((a) => (a._id || a) === u._id))
                  .map((u) => (
                    <option key={u._id} value={u._id}>{u.fullName || u.email}</option>
                  ))}
              </select>
            )}
          </div>

          {/* Media */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold tracking-[0.2em] text-slate-400">MEDIA</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={busy}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <UploadCloud size={12} />
                Attach
              </button>
            </div>
            {media.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                No media attached
              </div>
            ) : (
              <div className="grid gap-2">
                {media.map((m) => (
                  <div key={m._id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <ImageIcon size={14} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 truncate text-xs font-semibold text-slate-700">{m.title || "Media item"}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {m.type || "file"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaPicked}
        title="Attach media to job"
        subtitle="Choose media from the Media Library."
        onlyType=""
        multiple={false}
        allowUpload
      />
    </div>
  );
}
