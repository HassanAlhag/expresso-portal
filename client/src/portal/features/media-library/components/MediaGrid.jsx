import React from "react";
import { Image as ImageIcon, FileText, Film, Music, File } from "lucide-react";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

function TypeIcon({ type }) {
  if (type === "image") return <ImageIcon size={16} />;
  if (type === "video") return <Film size={16} />;
  if (type === "audio") return <Music size={16} />;
  if (type === "pdf") return <FileText size={16} />;
  return <File size={16} />;
}

function StatusBadge({ status }) {
  const map = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${
        map[status] || map.archived
      }`}
    >
      {status}
    </span>
  );
}

export default function MediaGrid({ items, onOpen }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((m) => (
        <button
          key={m._id}
          type="button"
          onClick={() => onOpen?.(m)}
          className="group overflow-hidden rounded-[24px] border border-black/10 bg-white text-left transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
            {m.type === "image" ? (
              <img
                src={getAssetUrl(m.thumbnailUrl || m.url)}
                alt={m.title}
                className="h-full w-full object-cover transition group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-600">
                <TypeIcon type={m.type} />
                <div className="text-xs font-extrabold uppercase">
                  {m.type || "file"}
                </div>
              </div>
            )}

            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-700 shadow-sm">
                <TypeIcon type={m.type} />
                {m.type}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="truncate text-sm font-black text-slate-900">
              {m.title || "Untitled"}
            </div>

            <div className="mt-1 truncate text-xs text-slate-500">
              {m.category || "Uncategorized"}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <StatusBadge status={m.status} />
              <div className="truncate text-[11px] text-slate-400">
                {(m.tags || []).slice(0, 2).join(", ") || "No tags"}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
