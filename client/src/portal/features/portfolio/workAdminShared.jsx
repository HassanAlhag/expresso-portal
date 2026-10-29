import React from "react";
import { Archive, Eye, EyeOff } from "lucide-react";
import { getAssetUrl } from "../../shared/utils/assetUrl";

export const WORK_STATUS_META = {
  published: { label: "Published", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: Eye },
  draft: { label: "Draft", cls: "border-amber-200 bg-amber-50 text-amber-700", Icon: EyeOff },
  archived: { label: "Archived", cls: "border-slate-200 bg-slate-100 text-slate-500", Icon: Archive },
};

export function WorkStatusPill({ status }) {
  const meta = WORK_STATUS_META[status] || WORK_STATUS_META.draft;
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${meta.cls}`}>
      <Icon size={10} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export const workCover = (item) => getAssetUrl(item?.cover?.src || item?.gallery?.[0]?.src || "");

/**
 * What a work item still needs before it reads well on the website. Seeded
 * drafts deliberately leave unknown facts blank; this list shows them.
 */
export function missingWorkFields(item = {}) {
  const missing = [];
  if (!item.cover?.src) missing.push("Cover");
  if (!item.clientName) missing.push("Client");
  if (!item.shortDescription) missing.push("Short description");
  if (!item.year) missing.push("Year");
  return missing;
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
