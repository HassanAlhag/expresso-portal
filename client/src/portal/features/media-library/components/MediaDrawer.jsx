import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import {
  X,
  Trash2,
  Save,
  Copy,
  ExternalLink,
  Music,
  FileText,
  File,
  Calendar,
  HardDrive,
  Maximize2,
} from "lucide-react";
import { updateMedia, deleteMedia } from "../api";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

const BRAND = "#7F8AD1";

const STATUS_OPTS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(2)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

function MediaPreview({ item }) {
  const assetUrl = getAssetUrl(item?.mediumUrl || item?.url);
  const videoUrl = getAssetUrl(item?.url);

  if (item.type === "image") {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-slate-900">
        <img
          src={assetUrl}
          alt={item.title || "Media"}
          className="max-h-[300px] w-full object-contain"
        />
        <a
          href={assetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/70"
          title="View full size"
        >
          <Maximize2 size={13} />
        </a>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-black">
        <video
          src={videoUrl}
          controls
          className="max-h-[300px] w-full"
          preload="metadata"
        />
      </div>
    );
  }

  if (item.type === "audio") {
    return (
      <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-gradient-to-br from-amber-50 to-amber-100/50 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-amber-200 bg-white text-amber-500 shadow-sm">
            <Music size={28} />
          </div>
          <div className="text-sm font-extrabold text-amber-800">
            {item.title || "Audio file"}
          </div>
          <audio
            src={getAssetUrl(item.url)}
            controls
            className="w-full"
          />
        </div>
      </div>
    );
  }

  if (item.type === "pdf") {
    return (
      <div className="flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-gradient-to-br from-rose-50 to-rose-100/50 p-8">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-rose-200 bg-white text-rose-500 shadow-sm">
          <FileText size={28} />
        </div>
        <div className="text-center">
          <div className="text-sm font-extrabold text-rose-800">
            PDF Document
          </div>
          <div className="mt-1 break-all text-xs text-rose-600">
            {item.title || item.url?.split("/").pop()}
          </div>
        </div>
        <a
          href={getAssetUrl(item.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50"
        >
          <ExternalLink size={13} />
          Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-black/[0.07] bg-slate-50 p-8">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400">
        <File size={28} />
      </div>
      <div className="text-sm font-extrabold text-slate-500">
        {item.type ? item.type.toUpperCase() : "File"}
      </div>
    </div>
  );
}

export default function MediaDrawer({ open, item, onClose, onChanged }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [busy, setBusy] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const originalAssetUrl = getAssetUrl(item?.url);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title || "");
    setTags((item.tags || []).join(", "));
    setCategory(item.category || "");
    setStatus(item.status || "draft");
  }, [item]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !item) return null;

  const save = async () => {
    setBusy(true);
    try {
      const res = await updateMedia(item._id, { title, category, tags, status });
      onChanged?.(res?.item);
      toast.success("Changes saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    setConfirmState({
      title: "Delete media",
      message: `Delete "${item.title || "this item"}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteMedia(item._id);
          setConfirmState(null);
          onChanged?.(null, { deleted: true, id: item._id });
          onClose?.();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setConfirmState(null);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(originalAssetUrl);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const size = formatSize(item.size);
  const uploadDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onMouseDown={onClose}
      />

      <div
        className="absolute right-0 top-0 flex h-full w-[min(540px,95vw)] flex-col border-l border-black/[0.07] bg-white shadow-[0_0_80px_rgba(15,23,42,0.18)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.07] px-5">
          <div className="min-w-0">
            <div className="truncate text-base font-black text-slate-900">
              Media Details
            </div>
            <div className="text-[11px] text-slate-400">
              Press Esc to close
            </div>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.07] bg-white text-slate-500 transition hover:bg-black/[0.03] hover:text-slate-900"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-5 p-5">

            {/* Preview */}
            <MediaPreview item={item} />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03]"
              >
                <Copy size={13} />
                Copy URL
              </button>
              <a
                href={originalAssetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03]"
              >
                <ExternalLink size={13} />
                Open file
              </a>
            </div>

            {/* Edit form */}
            <div className="rounded-2xl border border-black/[0.07] bg-slate-50/60 p-4">
              <div className="mb-4 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Edit Metadata
              </div>
              <div className="grid gap-3">
                <Input
                  label="TITLE"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional title"
                />
                <Input
                  label="CATEGORY"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Branding"
                />
                <Input
                  label="TAGS"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags"
                />

                <label className="grid gap-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    STATUS
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    {STATUS_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* File info */}
            <div className="rounded-2xl border border-black/[0.07] bg-slate-50/60 p-4">
              <div className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                File Info
              </div>
              <div className="grid gap-2.5">
                {item.type && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                      <File size={12} />
                      Type
                    </span>
                    <span className="rounded-full border border-black/[0.07] bg-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-700">
                      {item.type}
                    </span>
                  </div>
                )}
                {size && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                      <HardDrive size={12} />
                      Size
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {size}
                    </span>
                  </div>
                )}
                {item.width && item.height && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                      <Maximize2 size={12} />
                      Dimensions
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {item.width} × {item.height}
                    </span>
                  </div>
                )}
                {uploadDate && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                      <Calendar size={12} />
                      Uploaded
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {uploadDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/[0.07] bg-white p-4">
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <Button
            onClick={save}
            disabled={busy}
            style={{ backgroundColor: BRAND }}
          >
            <Save size={14} />
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
