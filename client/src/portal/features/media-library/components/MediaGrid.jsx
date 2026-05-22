import React from "react";
import {
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
  Play,
} from "lucide-react";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

function TypeIcon({ type, size = 16 }) {
  if (type === "image") return <ImageIcon size={size} />;
  if (type === "video") return <Film size={size} />;
  if (type === "audio") return <Music size={size} />;
  if (type === "pdf") return <FileText size={size} />;
  return <File size={size} />;
}

const TYPE_META = {
  image: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
  },
  video: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
  },
  audio: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  pdf: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  other: {
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-100",
  },
};

const STATUS_CLS = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

function MediaCard({ m, onOpen }) {
  const meta = TYPE_META[m.type] || TYPE_META.other;
  const thumbUrl = getAssetUrl(m.thumbnailUrl || m.mediumUrl || m.url);
  const hasThumb = !!thumbUrl;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(m)}
      className="group overflow-hidden rounded-3xl border border-black/[0.07] bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-[0_16px_48px_rgba(15,23,42,0.10)]"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {m.type === "image" && hasThumb ? (
          <img
            src={thumbUrl}
            alt={m.title || "Media"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : m.type === "video" ? (
          <div className={`relative flex h-full w-full items-center justify-center ${meta.bg}`}>
            {hasThumb && (
              <img
                src={thumbUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
            )}
            <div className="relative grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-white/90 shadow-lg backdrop-blur-sm">
              <Play size={22} className="translate-x-0.5 text-violet-600" fill="currentColor" />
            </div>
          </div>
        ) : m.type === "audio" ? (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${meta.bg}`}>
            <div className={`grid h-14 w-14 place-items-center rounded-2xl border ${meta.border} bg-white/80 ${meta.text}`}>
              <Music size={26} />
            </div>
            <div className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${meta.text}`}>
              Audio
            </div>
          </div>
        ) : m.type === "pdf" ? (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${meta.bg}`}>
            <div className={`grid h-14 w-14 place-items-center rounded-2xl border ${meta.border} bg-white/80 ${meta.text}`}>
              <FileText size={26} />
            </div>
            <div className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${meta.text}`}>
              PDF
            </div>
          </div>
        ) : (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${meta.bg}`}>
            <div className={`grid h-14 w-14 place-items-center rounded-2xl border ${meta.border} bg-white/80 ${meta.text}`}>
              <TypeIcon type={m.type} size={26} />
            </div>
            <div className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${meta.text}`}>
              {m.type || "File"}
            </div>
          </div>
        )}

        {/* Type badge — top left */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${meta.text}`}
          >
            <TypeIcon type={m.type} size={10} />
            {m.type || "file"}
          </span>
        </div>

        {/* Status badge — top right */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm ${STATUS_CLS[m.status] || STATUS_CLS.draft}`}
          >
            {m.status || "draft"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="truncate text-sm font-black text-slate-900">
          {m.title || "Untitled"}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-400">
          {m.category || "Uncategorized"}
        </div>

        {m.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {m.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full border border-black/[0.07] bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-600"
              >
                #{t}
              </span>
            ))}
            {m.tags.length > 3 && (
              <span className="rounded-full border border-black/[0.07] bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-400">
                +{m.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function MediaRow({ m, onOpen }) {
  const meta = TYPE_META[m.type] || TYPE_META.other;
  const thumbUrl = getAssetUrl(m.thumbnailUrl || m.mediumUrl || m.url);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(m)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-3 text-left shadow-sm transition hover:border-black/[0.12] hover:shadow-md"
    >
      {/* Thumbnail square */}
      <div
        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ${meta.bg}`}
      >
        {m.type === "image" && thumbUrl ? (
          <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
        ) : m.type === "video" ? (
          <div className="relative flex h-full w-full items-center justify-center">
            {thumbUrl && (
              <img
                src={thumbUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
            )}
            <Play size={16} className={`relative ${meta.text}`} fill="currentColor" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon type={m.type} size={18} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-black text-slate-900">
            {m.title || "Untitled"}
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${STATUS_CLS[m.status] || STATUS_CLS.draft}`}
          >
            {m.status || "draft"}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-[0.1em] ${meta.text}`}
          >
            {m.type}
          </span>
          {m.category && (
            <span className="text-xs text-slate-400">· {m.category}</span>
          )}
          {m.tags?.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-black/[0.07] bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-500"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Hover action */}
      <div className="shrink-0 opacity-0 transition group-hover:opacity-100">
        <span className="rounded-xl border border-black/[0.07] bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">
          View
        </span>
      </div>
    </button>
  );
}

export default function MediaGrid({ items, onOpen, viewMode = "grid" }) {
  if (viewMode === "list") {
    return (
      <div className="grid gap-2">
        {items.map((m) => (
          <MediaRow key={m._id} m={m} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((m) => (
        <MediaCard key={m._id} m={m} onOpen={onOpen} />
      ))}
    </div>
  );
}
