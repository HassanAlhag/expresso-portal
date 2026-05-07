import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import ProductionJobFormModal from "../components/ProductionJobFormModal";

import { addApproval } from "../../jobs/api";
import { listUsers } from "../../iam/users/api";
import {
  getProductionJob,
  publishProductionJob,
  setProductionJobStatus,
  updateProductionJob,
} from "../jobs.api";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  Film,
  FolderKanban,
  Globe,
  Lock,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Video,
  X,
} from "lucide-react";

const PROD_STAGES = [
  { key: "brief",           label: "Brief" },
  { key: "script",          label: "Scripting" },
  { key: "designing",       label: "Design" },
  { key: "editing",         label: "Editing" },
  { key: "internal_review", label: "Int. Review" },
  { key: "client_review",   label: "Client Review" },
  { key: "approved",        label: "Approved" },
  { key: "scheduled",       label: "Scheduled" },
  { key: "published",       label: "Published" },
];

function stageIndex(status) {
  return PROD_STAGES.findIndex((s) => s.key === status);
}

function statusTone(status) {
  if (["published", "delivered"].includes(status)) return "emerald";
  if (status === "approved") return "indigo";
  if (["internal_review", "client_review"].includes(status)) return "orange";
  if (["designing", "editing"].includes(status)) return "sky";
  if (["scheduled"].includes(status)) return "amber";
  if (["on_hold", "cancelled"].includes(status)) return "red";
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

function getMediaUrl(media) {
  return media?.url || media?.fileUrl || "";
}

function MediaSlot({ title, media, kind = "video", onChoose, onClear, disabled }) {
  const src = getMediaUrl(media);
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-700">{title}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onChoose}
            disabled={disabled}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Choose
          </button>
          {media && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {!src ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
          No file attached
        </div>
      ) : kind === "image" ? (
        <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-slate-50">
          <img src={src} alt={title} className="h-40 w-full object-cover" draggable={false} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-black">
          <video className="h-40 w-full object-contain" src={src} controls playsInline />
        </div>
      )}
      {src && (
        <a href={src} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
          <Eye size={12} />
          Open file
        </a>
      )}
    </div>
  );
}

export default function ProductionDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("internal_note");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState("video");
  const [pickerSlot, setPickerSlot] = useState("");
  const [externalUrlDraft, setExternalUrlDraft] = useState("");
  const [staffUsers, setStaffUsers] = useState([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getProductionJob(id);
      setItem(res?.item || res || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load production");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setExternalUrlDraft(item?.externalPostUrl || "");
  }, [item]);

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

  const moveToStage = async (status) => {
    if (!item?._id || busy) return;
    setBusy(true);
    try {
      const res = await setProductionJobStatus(item._id, status);
      setItem(res?.item || { ...item, status });
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
      await setProductionJobStatus(id, "client_review");
      await addApproval(id, { status: "client_sent", note: note.trim() || "Production sent to client for review." });
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally { setBusy(false); }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await addApproval(id, { status: "approved", note: note.trim() || "Approved." });
      await setProductionJobStatus(id, "approved");
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Approval failed");
    } finally { setBusy(false); }
  };

  const handleRequestChanges = async () => {
    if (!note.trim()) { toast.warning("Add a note describing the changes needed."); return; }
    setBusy(true);
    try {
      await addApproval(id, { status: "changes_requested", note });
      await setProductionJobStatus(id, "editing");
      setNote("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally { setBusy(false); }
  };

  const handlePublish = async () => {
    if (!item?.finalMediaId) { toast.warning("Attach the final video before publishing."); return; }
    setBusy(true);
    try {
      await publishProductionJob(id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Publish failed");
    } finally { setBusy(false); }
  };

  const openPicker = (slot, type) => {
    setPickerSlot(slot);
    setPickerType(type);
    setPickerOpen(true);
  };

  const handleMediaPicked = async (media) => {
    if (!item?._id || !media?._id || !pickerSlot) return;
    const patch = {};
    if (pickerSlot === "draft") patch.draftMediaId = media._id;
    if (pickerSlot === "final") patch.finalMediaId = media._id;
    if (pickerSlot === "poster") patch.posterMediaId = media._id;
    setBusy(true);
    try {
      await updateProductionJob(item._id, patch);
      setPickerOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to attach media");
    } finally { setBusy(false); }
  };

  const handleClearMedia = async (field) => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await updateProductionJob(item._id, { [field]: null });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally { setBusy(false); }
  };

  const handleWebsiteToggle = async () => {
    if (!item?._id) return;
    setBusy(true);
    try {
      const next = !item.websiteVisible;
      const res = await updateProductionJob(item._id, { websiteVisible: next });
      setItem(res?.item || { ...item, websiteVisible: next });
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally { setBusy(false); }
  };

  const handleSaveExternalUrl = async () => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await updateProductionJob(item._id, { externalPostUrl: externalUrlDraft });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed");
    } finally { setBusy(false); }
  };

  const addAssignee = async (userId) => {
    if (!userId || busy) return;
    const existing = (item.assignees || []).map((x) => x._id || x);
    if (existing.includes(userId)) return;
    setBusy(true);
    try {
      await updateProductionJob(item._id, { assignees: [...existing, userId] });
      await load();
    } catch { } finally { setBusy(false); }
  };

  const removeAssignee = async (userId) => {
    if (busy) return;
    const next = (item.assignees || []).map((x) => x._id || x).filter((x) => x !== userId);
    setBusy(true);
    try {
      await updateProductionJob(item._id, { assignees: next });
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

  if (!item) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">Production not found.</div>
    );
  }

  const currentStageIdx = stageIndex(item.status);
  const approvals = Array.isArray(item.approvals) ? item.approvals : [];
  const assignees = Array.isArray(item.assignees) ? item.assignees : [];
  const isClientReview = item.status === "client_review";
  const TypeIcon = item.type === "reel" ? Film : Video;
  const clientName = item.customerId?.companyName || item.customerId?.contactName || "—";

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6">
        <button
          type="button"
          onClick={() => nav("/portal/productions")}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03]"
        >
          <ArrowLeft size={13} />
          Back to productions
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon size={18} className="shrink-0 text-indigo-500" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{item.title}</h1>
            </div>
            <p className="text-sm text-slate-500">{clientName}{item.platform ? ` · ${item.platform}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone(item.status)}>{String(item.status || "").replaceAll("_", " ").toUpperCase()}</Badge>
              <Badge tone="slate">{String(item.type || "").toUpperCase()}</Badge>
              {item.priority && <Badge tone="amber">{String(item.priority).toUpperCase()}</Badge>}
              {item.websiteVisible && <Badge tone="emerald">ON WEBSITE</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
              <Pencil size={15} />
              Edit
            </Button>
            <Button variant="outline" onClick={handleSendToClient} disabled={busy}>
              <Send size={15} />
              Send to client
            </Button>
            <Button onClick={handlePublish} disabled={busy} style={{ backgroundColor: "#7F8AD1" }}>
              <Globe size={15} />
              Publish
            </Button>
          </div>
        </div>

        {/* Pipeline bar */}
        <div className="mt-6">
          <div className="flex items-stretch gap-0.5">
            {PROD_STAGES.map((stage, i) => {
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
            <span className="font-extrabold text-slate-600">{PROD_STAGES[currentStageIdx]?.label || "—"}</span>
            <span>Published</span>
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
              <div className="text-xs text-orange-700">This production has been sent to the client for feedback.</div>
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
                <p className="mt-0.5 text-xs text-slate-400">Add a note or send to client to start the thread.</p>
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

          {/* Production details */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">Production details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "TYPE", value: item.type },
                { label: "PLATFORM", value: item.platform },
                { label: "SHOOT DATE", value: item.shootDate ? new Date(item.shootDate).toLocaleDateString() : "—" },
                { label: "LOCATION", value: item.location },
                { label: "DUE DATE", value: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—" },
                { label: "SOURCE TYPE", value: item.sourceType },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</div>
                </div>
              ))}
            </div>

            {[
              { label: "CONCEPT", value: item.concept },
              { label: "SCRIPT", value: item.script },
              { label: "SHOT LIST", value: item.shotList },
              { label: "CAPTION", value: item.caption },
              { label: "NOTES", value: item.notes },
            ].filter((f) => f.value).map(({ label, value }) => (
              <div key={label} className="mt-4">
                <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-400">{label}</div>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="grid content-start gap-5">
          {/* Job info */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">PRODUCTION INFO</h3>
            <div className="grid gap-3">
              {[
                { Icon: Building2,    label: "Client",   value: clientName },
                { Icon: FolderKanban, label: "Project",  value: item.projectId?.name || "—" },
                { Icon: CalendarDays, label: "Due date", value: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—" },
                { Icon: CalendarDays, label: "Created",  value: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—" },
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
              {PROD_STAGES.map((stage) => (
                <button
                  key={stage.key}
                  type="button"
                  disabled={busy || item.status === stage.key}
                  onClick={() => moveToStage(stage.key)}
                  className={[
                    "rounded-xl border px-2.5 py-1 text-xs font-bold transition",
                    item.status === stage.key
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
                  <div key={a._id || a} className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 py-0.5 pl-1 pr-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[9px] font-black text-indigo-800">
                      {getInitials(a.fullName || "")}
                    </div>
                    <span className="text-xs font-semibold text-indigo-800">{a.fullName || a.email || "Staff"}</span>
                    <button type="button" disabled={busy} onClick={() => removeAssignee(a._id || a)} className="ml-0.5 text-indigo-300 transition hover:text-rose-500">
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

          {/* Website visibility */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">WEBSITE</h3>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-xs font-bold text-slate-700">Website visibility</div>
                <div className="text-[11px] text-slate-500">Show on public showcase</div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleWebsiteToggle}
                className={[
                  "rounded-full px-3 py-1 text-xs font-extrabold transition",
                  item.websiteVisible
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300",
                ].join(" ")}
              >
                {item.websiteVisible ? "Visible" : "Hidden"}
              </button>
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-400 mb-2">EXTERNAL LINK</div>
              <div className="flex gap-2">
                <input
                  value={externalUrlDraft}
                  onChange={(e) => setExternalUrlDraft(e.target.value)}
                  placeholder="Instagram / TikTok / YouTube…"
                  className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-300"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSaveExternalUrl}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
              {item.externalPostUrl && (
                <a href={item.externalPostUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
                  <Eye size={12} />
                  Open external post
                </a>
              )}
            </div>
          </div>

          {/* Media slots */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-5">
            <h3 className="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-slate-400">MEDIA FILES</h3>
            <div className="grid gap-3">
              <MediaSlot
                title="Draft video"
                media={item.draftMediaId}
                kind="video"
                onChoose={() => openPicker("draft", "video")}
                onClear={() => handleClearMedia("draftMediaId")}
                disabled={busy}
              />
              <MediaSlot
                title="Final video"
                media={item.finalMediaId}
                kind="video"
                onChoose={() => openPicker("final", "video")}
                onClear={() => handleClearMedia("finalMediaId")}
                disabled={busy}
              />
              <MediaSlot
                title="Poster image"
                media={item.posterMediaId}
                kind="image"
                onChoose={() => openPicker("poster", "image")}
                onClear={() => handleClearMedia("posterMediaId")}
                disabled={busy}
              />
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaPicked}
        title={
          pickerSlot === "draft" ? "Select draft video"
          : pickerSlot === "final" ? "Select final video"
          : "Select poster image"
        }
        subtitle="Choose media from the Media Library."
        onlyType={pickerType}
        multiple={false}
        allowUpload
      />

      <ProductionJobFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={async () => { setEditOpen(false); await load(); }}
        mode="edit"
        initialData={item}
      />
    </div>
  );
}
