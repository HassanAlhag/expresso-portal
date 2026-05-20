import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  Send,
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

// ── Media preview helpers ─────────────────────────────────────────────────────

function mediaSrc(m) {
  return m?.thumbnailUrl || m?.url || m?.fileUrl || "";
}
function mediaFull(m) {
  return m?.url || m?.fileUrl || "";
}
function isVideo(m) {
  return String(m?.type || m?.mimeType || "").startsWith("video");
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ media, onClose }) {
  const src = mediaFull(media);
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={18} />
      </button>
      <div className="max-h-[90vh] max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        {isVideo(media) ? (
          <video src={src} controls autoPlay playsInline className="w-full max-h-[90vh] rounded-2xl object-contain bg-black" />
        ) : (
          <img src={src} alt={media?.title || ""} className="w-full max-h-[90vh] rounded-2xl object-contain" />
        )}
        {media?.title && (
          <div className="mt-3 text-center text-sm font-semibold text-white/70">{media.title}</div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CreativeReviewPanel({
  media = [],
  approvals = [],
  busy = false,
  onAttach,          // () => void — opens MediaPickerModal
  onApprove,
  onRequestChanges,
  onSendToClient,
  onAddNote,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("internal_note");
  const [lightbox, setLightbox] = useState(false);

  const selected = media[selectedIdx] || null;
  const hasMedia = media.length > 0;

  const prev = () => setSelectedIdx((i) => Math.max(0, i - 1));
  const next = () => setSelectedIdx((i) => Math.min(media.length - 1, i + 1));

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

  return (
    <>
      {lightbox && selected && (
        <Lightbox media={selected} onClose={() => setLightbox(false)} />
      )}

      <div className="rounded-[24px] border border-black/[0.07] bg-white overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
          <div className="flex items-center gap-2">
            <Paperclip size={15} className="text-slate-400" />
            <span className="text-sm font-extrabold text-slate-900">Creative Review</span>
            {hasMedia && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-500">
                {media.length} version{media.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onAttach}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Paperclip size={12} />
            Attach version
          </button>
        </div>

        {!hasMedia ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300">
              <ImageIcon size={28} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-500">No artwork attached yet</p>
              <p className="mt-1 text-xs text-slate-400">Upload the creative here for everyone to review and approve.</p>
            </div>
            <button
              type="button"
              onClick={onAttach}
              disabled={busy}
              className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
            >
              <Paperclip size={14} />
              Attach creative
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px]">
            {/* ── Left: preview ── */}
            <div className="border-b border-black/[0.07] lg:border-b-0 lg:border-r">
              {/* Thumbnail strip */}
              {media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-b border-black/[0.07] p-3">
                  {media.map((m, i) => {
                    const thumb = mediaSrc(m);
                    const vid = isVideo(m);
                    return (
                      <button
                        key={m._id || i}
                        type="button"
                        onClick={() => setSelectedIdx(i)}
                        className={[
                          "relative shrink-0 h-14 w-14 overflow-hidden rounded-xl border-2 transition",
                          i === selectedIdx
                            ? "border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
                            : "border-transparent hover:border-slate-300",
                        ].join(" ")}
                      >
                        {thumb && !vid ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
                            <Film size={18} />
                          </div>
                        )}
                        <div className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 py-0.5 text-[8px] font-black text-white">
                          v{i + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main preview */}
              <div className="relative bg-slate-950">
                {isVideo(selected) ? (
                  <video
                    key={mediaFull(selected)}
                    src={mediaFull(selected)}
                    controls
                    playsInline
                    poster={selected?.thumbnailUrl || ""}
                    className="max-h-[480px] w-full object-contain"
                  />
                ) : mediaSrc(selected) ? (
                  <img
                    key={mediaSrc(selected)}
                    src={mediaSrc(selected)}
                    alt={selected?.title || "Creative"}
                    className="max-h-[480px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-slate-600">
                    <ImageIcon size={40} className="opacity-40" />
                  </div>
                )}

                {/* Navigation arrows */}
                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prev}
                      disabled={selectedIdx === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      disabled={selectedIdx === media.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}

                {/* Overlay actions */}
                <div className="absolute bottom-3 right-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    title="Fullscreen"
                  >
                    <ZoomIn size={14} />
                  </button>
                  {mediaFull(selected) && (
                    <a
                      href={mediaFull(selected)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                      title="Open original"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Preview footer */}
              <div className="flex items-center justify-between border-t border-black/[0.07] px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {selected?.title || `Version ${selectedIdx + 1}`}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {String(selected?.type || selected?.mimeType || "").split("/").pop()?.toUpperCase() || "FILE"}
                    {media.length > 1 && ` · ${selectedIdx + 1} of ${media.length}`}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
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
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 520 }}>
                {approvals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <MessageSquare size={24} className="text-slate-200" />
                    <p className="text-xs font-bold text-slate-400">No comments yet</p>
                    <p className="text-[11px] text-slate-400">Add a note or approve to start the review thread.</p>
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
        )}
      </div>
    </>
  );
}
