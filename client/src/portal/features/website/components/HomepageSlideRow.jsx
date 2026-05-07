import React from "react";
import {
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";

export default function HomepageSlideRow({
  slide,
  busy,
  onEdit,
  onDelete,
  onToggle,
}) {
  const thumb = slide.thumbImageUrl || slide.imageUrl || "";

  return (
    <div className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50/80">
      <GripVertical size={16} className="shrink-0 text-slate-300" />

      <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {thumb ? (
          <img
            src={thumb}
            alt={slide.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={20} className="text-slate-300" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-black text-slate-900">
            {slide.title || "Untitled slide"}
          </div>

          <Badge tone={slide.isActive ? "success" : "neutral"}>
            {slide.isActive ? "Active" : "Inactive"}
          </Badge>

          <Badge tone="neutral">Order: {slide.order}</Badge>
        </div>

        {slide.subtitle ? (
          <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            {slide.subtitle}
          </div>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {slide.ctaLabel ? (
            <span className="flex items-center gap-1 text-indigo-600">
              <ExternalLink size={11} />
              {slide.ctaLabel} → {slide.ctaUrl || "—"}
            </span>
          ) : null}

          {slide.secondaryCtaLabel ? (
            <span className="flex items-center gap-1 text-slate-500">
              <ExternalLink size={11} />
              {slide.secondaryCtaLabel} → {slide.secondaryCtaUrl || "—"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(slide)}
          disabled={busy}
          title={slide.isActive ? "Deactivate" : "Activate"}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 disabled:opacity-50"
        >
          {slide.isActive ? (
            <ToggleRight size={16} className="text-emerald-600" />
          ) : (
            <ToggleLeft size={16} className="text-slate-400" />
          )}
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(slide)}
          disabled={busy}
        >
          <Pencil size={14} />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(slide)}
          disabled={busy}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
