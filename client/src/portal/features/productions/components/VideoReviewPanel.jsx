import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  Send,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import Button from "../../../shared/ui/Button";

// ── Thread helpers ────────────────────────────────────────────────────────────

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
    <div className={`rounded-2xl border p-3.5 ${bg}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${iconCls}`}><Icon size={14} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700">{label}</span>
            <span className="text-[11px] text-slate-400">{formatTime(entry.createdAt)}</span>
          </div>
          {entry.note && (
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{entry.note}</p>
          )}
          <div className="mt-1 text-[11px] font-bold text-slate-400">{author}</div>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ src, poster, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={18} />
      </button>
      <div className="max-h-[90vh] max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
        <video
          src={src}
          poster={poster || ""}
          controls
          autoPlay
          playsInline
          className="w-full max-h-[90vh] rounded-2xl bg-black"
        />
      </div>
    </div>
  );
}

function getUrl(media) {
  return media?.url || media?.fileUrl || "";
}

// ── Version tab ───────────────────────────────────────────────────────────────
function VersionTab({ active, label, hasFile, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-transparent text-slate-500 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
      <span className={[
        "h-1.5 w-1.5 rounded-full",
        hasFile ? "bg-emerald-500" : "bg-slate-300",
      ].join(" ")} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VideoReviewPanel({
  draftMedia    = null,
  finalMedia    = null,
  posterMedia   = null,
  approvals     = [],
  busy          = false,
  onAttachDraft,
  onAttachFinal,
  onAttachPoster,
  onClearDraft,
  onClearFinal,
  onClearPoster,
  onApprove,
  onRequestChanges,
  onSendToClient,
  onAddNote,
}) {
  const [activeTab, setActiveTab]   = useState("draft");
  const [note, setNote]             = useState("");
  const [noteType, setNoteType]     = useState("internal_note");
  const [lightbox, setLightbox]     = useState(false);

  const currentMedia = activeTab === "draft" ? draftMedia : finalMedia;
  const videoSrc     = getUrl(currentMedia);
  const posterSrc    = getUrl(posterMedia);
  const hasDraft     = !!getUrl(draftMedia);
  const hasFinal     = !!getUrl(finalMedia);

  const handleAddNote = () => {
    if (!note.trim()) return;
    onAddNote?.(noteType, note);
    setNote("");
  };

  const handleApprove = () => {
    onApprove?.(note.trim() || "Approved.");
    setNote("");
  };

  const handleRequestChanges = () => {
    if (!note.trim()) return;
    onRequestChanges?.(note);
    setNote("");
  };

  const onAttach    = activeTab === "draft" ? onAttachDraft  : onAttachFinal;
  const onClear     = activeTab === "draft" ? onClearDraft   : onClearFinal;

  return (
    <>
      {lightbox && videoSrc && (
        <Lightbox src={videoSrc} poster={posterSrc} onClose={() => setLightbox(false)} />
      )}

      <div className="rounded-[24px] border border-black/[0.07] bg-white overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
          <div className="flex items-center gap-3">
            <Video size={15} className="text-slate-400" />
            <span className="text-sm font-extrabold text-slate-900">Video Review</span>
            {/* Version tabs */}
            <div className="flex items-center gap-1 ml-1">
              <VersionTab
                active={activeTab === "draft"}
                label="Draft"
                hasFile={hasDraft}
                onClick={() => setActiveTab("draft")}
              />
              <VersionTab
                active={activeTab === "final"}
                label="Final"
                hasFile={hasFinal}
                onClick={() => setActiveTab("final")}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Poster thumbnail if exists */}
            {posterSrc && (
              <img
                src={posterSrc}
                alt="Poster"
                className="h-8 w-8 rounded-lg border border-black/10 object-cover"
                title="Poster image"
              />
            )}
            <button
              type="button"
              onClick={onAttachPoster}
              disabled={busy}
              title={posterMedia ? "Change poster" : "Add poster image"}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <ImageIcon size={11} />
              Poster
            </button>
            <button
              type="button"
              onClick={onAttach}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Paperclip size={12} />
              {currentMedia ? "Replace" : "Attach"} {activeTab}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px]">
          {/* ── Left: video player ── */}
          <div className="border-b border-black/[0.07] lg:border-b-0 lg:border-r">
            {/* Video area */}
            <div className="relative bg-slate-950">
              {videoSrc ? (
                <video
                  key={videoSrc}
                  src={videoSrc}
                  poster={posterSrc || ""}
                  controls
                  playsInline
                  className="max-h-[520px] w-full object-contain"
                />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 text-slate-600">
                    <Film size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-500">
                      No {activeTab} video attached
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Attach the {activeTab} version for the team to review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onAttach}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-900/40 px-4 py-2 text-sm font-bold text-indigo-300 transition hover:bg-indigo-900/60 disabled:opacity-60"
                  >
                    <Paperclip size={14} />
                    Attach {activeTab} video
                  </button>
                </div>
              )}

              {/* Overlay actions */}
              {videoSrc && (
                <div className="absolute bottom-3 right-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    title="Fullscreen"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <a
                    href={videoSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    title="Open original"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Preview footer */}
            <div className="flex items-center justify-between border-t border-black/[0.07] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                {currentMedia && (
                  <>
                    <span className="text-sm font-semibold text-slate-700">
                      {currentMedia?.title || (activeTab === "draft" ? "Draft video" : "Final video")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {String(currentMedia?.type || currentMedia?.mimeType || "").split("/").pop()?.toUpperCase() || "VIDEO"}
                    </span>
                  </>
                )}
                {!currentMedia && (
                  <span className="text-xs text-slate-400">No {activeTab} video</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {currentMedia && (
                  <button
                    type="button"
                    onClick={onClear}
                    disabled={busy}
                    className="text-[11px] font-bold text-rose-400 transition hover:text-rose-600 disabled:opacity-60"
                  >
                    Clear
                  </button>
                )}
                <Button
                  variant="outline"
                  onClick={handleRequestChanges}
                  disabled={busy || !note.trim()}
                  title="Request changes (add a note first)"
                >
                  <AlertTriangle size={13} />
                  Request changes
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={busy}
                  style={{ backgroundColor: "#059669" }}
                >
                  <CheckCircle2 size={13} />
                  Approve
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right: thread + compose ── */}
          <div className="flex flex-col">
            {/* Thread */}
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 560 }}>
              {approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <MessageSquare size={24} className="text-slate-200" />
                  <p className="text-xs font-bold text-slate-400">No comments yet</p>
                  <p className="text-[11px] text-slate-400">Add a note, approve, or send to client to start the review thread.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {approvals.map((entry, i) => (
                    <ThreadEntry key={entry._id || i} entry={entry} />
                  ))}
                </div>
              )}
            </div>

            {/* Compose */}
            <div className="border-t border-black/[0.07] p-4">
              <div className="mb-2 flex gap-1">
                {[
                  { value: "internal_note", label: "Internal", Icon: Lock },
                  { value: "client_note",   label: "Client",   Icon: MessageSquare },
                ].map(({ value, label, Icon: Ic }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNoteType(value)}
                    className={[
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition",
                      noteType === value
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Ic size={10} />
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
                    ? "Write an internal note…"
                    : "Write a client-visible note…"
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={busy || !note.trim()}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Add note
                </button>
                <button
                  type="button"
                  onClick={() => onSendToClient?.()}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Send size={11} />
                  Send to client
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
