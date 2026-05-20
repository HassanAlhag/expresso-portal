import React, { useState } from "react";
import { Image as ImageIcon, Pencil, X } from "lucide-react";

import Input from "../../../shared/ui/Input";
import Card from "../../../shared/ui/Card";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import {
  BILLING_OPTIONS,
  STATUS_OPTIONS,
  EXECUTION_MODE_OPTIONS,
} from "../constants";

export default function ServiceTemplateOverview({ value, onChange }) {
  const v = value || {};
  const [pickerOpen, setPickerOpen] = useState(false);

  const coverImage = v.coverImageId;
  const coverSrc = coverImage?.thumbnailUrl || coverImage?.url || null;

  const handlePickCover = (media) => {
    onChange({ ...v, coverImageId: media });
    setPickerOpen(false);
  };

  const handleRemoveCover = (e) => {
    e.stopPropagation();
    onChange({ ...v, coverImageId: null });
  };

  return (
    <>
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickCover}
        title="Choose cover image"
        subtitle="Pick an image from the media library to use as the service cover."
        onlyType="image"
        multiple={false}
        allowUpload
      />

      <Card className="p-6">
        <div className="grid gap-6">
          {/* Cover image */}
          <div>
            <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
              COVER IMAGE
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPickerOpen(true);
                }
              }}
              className="group relative cursor-pointer overflow-hidden rounded-[20px] border border-dashed border-slate-300 bg-slate-50 transition hover:border-indigo-300 hover:bg-indigo-50/30"
              style={{ height: 180 }}
            >
              {coverSrc ? (
                <>
                  <img
                    src={coverSrc}
                    alt={coverImage?.title || "Cover"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition group-hover:bg-black/30">
                    <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow">
                        <Pencil size={12} />
                        Change
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white shadow"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white">
                    <ImageIcon size={24} className="text-slate-300" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black">Click to add cover image</div>
                    <div className="mt-0.5 text-xs text-slate-400">Choose from media library</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name + Slug */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="NAME"
              value={v.name || ""}
              onChange={(e) => onChange({ ...v, name: e.target.value })}
              placeholder="e.g. Social Media Management"
            />
            <Input
              label="SLUG (optional)"
              value={v.slug || ""}
              onChange={(e) => onChange({ ...v, slug: e.target.value })}
              placeholder="social-media-management"
            />
          </div>

          {/* Status / Billing / Mode / Price */}
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">STATUS</span>
              <select
                value={v.status || "draft"}
                onChange={(e) => onChange({ ...v, status: e.target.value })}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">BILLING</span>
              <select
                value={v.billingCycle || "monthly"}
                onChange={(e) => onChange({ ...v, billingCycle: e.target.value })}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {BILLING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">EXECUTION MODE</span>
              <select
                value={v.executionMode || "recurring"}
                onChange={(e) => onChange({ ...v, executionMode: e.target.value })}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {EXECUTION_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <Input
              label="PRICE (optional)"
              value={typeof v.price === "number" ? String(v.price) : v.price || ""}
              onChange={(e) =>
                onChange({
                  ...v,
                  price: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="e.g. 2500"
            />
          </div>

          {/* Summary */}
          <Input
            label="SUMMARY"
            value={v.summary || ""}
            onChange={(e) => onChange({ ...v, summary: e.target.value })}
            placeholder="Short text used in listings & plans…"
          />

          {/* Description */}
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">DESCRIPTION</span>
            <textarea
              value={v.description || ""}
              onChange={(e) => onChange({ ...v, description: e.target.value })}
              rows={6}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-black/5"
              placeholder="Full description shown in proposals and customer portal…"
            />
          </label>
        </div>
      </Card>
    </>
  );
}
