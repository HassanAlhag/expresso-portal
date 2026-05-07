import React, { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
} from "lucide-react";

import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import HomepageSlidePreview from "./HomepageSlidePreview";
import { EMPTY_HOMEPAGE_SLIDE } from "../constants/homepageSlides.constants";
import { getAssetUrl } from "../../../shared/utils/assetUrl";
// Change this import to your actual media picker path/name.
import MediaPickerModal from "../../media-library/components/MediaPickerModal";

export default function HomepageSlideFormModal({
  open,
  initial,
  busy,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_HOMEPAGE_SLIDE);
  const [pickerTarget, setPickerTarget] = useState(null);

  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (open) {
      setForm(
        initial ? { ...EMPTY_HOMEPAGE_SLIDE, ...initial } : EMPTY_HOMEPAGE_SLIDE
      );
    }
  }, [open, initial]);

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setFromInput = (key) => (e) => {
    const value = e?.target?.value ?? "";

    setForm((current) => ({
      ...current,
      [key]: key === "order" ? Number(value || 0) : value,
    }));
  };

  const handleMediaSelect = (media) => {
    if (!pickerTarget || !media) return;

    const url =
      media?.url ||
      media?.thumbnailUrl ||
      media?.fileUrl ||
      media?.secureUrl ||
      media?.path ||
      media?.src ||
      "";

    if (!url) return;

    setForm((current) => ({
      ...current,
      [pickerTarget]: url,
      ...(pickerTarget === "imageUrl"
        ? { imageMediaId: media?._id || media?.id || null }
        : {}),
      ...(pickerTarget === "thumbImageUrl"
        ? { thumbImageMediaId: media?._id || media?.id || null }
        : {}),
    }));

    setPickerTarget(null);
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setValue("isActive", !form.isActive)}
        className={[
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition",
          form.isActive
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-500",
        ].join(" ")}
      >
        {form.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
        {form.isActive ? "Active" : "Inactive"}
      </button>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>

        <Button
          onClick={() => onSubmit(form)}
          disabled={busy || !form.title.trim()}
        >
          {busy ? "Saving..." : isEdit ? "Save changes" : "Create slide"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit homepage slide" : "New homepage slide"}
        subtitle="Manage the public homepage hero slider content, images, and actions."
        width="980px"
        footer={footer}
      >
        <div className="grid gap-6">
          <HomepageSlidePreview slide={form} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="EYEBROW LEFT"
              value={form.eyebrowLeft}
              onChange={setFromInput("eyebrowLeft")}
              placeholder="EXPRESSO DIGITAL"
            />

            <Input
              label="EYEBROW RIGHT"
              value={form.eyebrowRight}
              onChange={setFromInput("eyebrowRight")}
              placeholder="GROWTH SYSTEMS"
            />

            <div className="lg:col-span-2">
              <Input
                label="TITLE"
                value={form.title}
                onChange={setFromInput("title")}
                placeholder="Build Your Digital Presence"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="grid gap-2">
                <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
                  SUBTITLE
                </span>

                <textarea
                  value={form.subtitle}
                  onChange={(e) => setValue("subtitle", e.target.value)}
                  rows={3}
                  placeholder="Short description shown on the homepage slider."
                  className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <ImagePickerField
              label="MAIN BACKGROUND IMAGE"
              value={form.imageUrl}
              onPick={() => setPickerTarget("imageUrl")}
              onClear={() => setValue("imageUrl", "")}
            />

            <ImagePickerField
              label="THUMBNAIL / CARD IMAGE"
              value={form.thumbImageUrl}
              onPick={() => setPickerTarget("thumbImageUrl")}
              onClear={() => setValue("thumbImageUrl", "")}
            />

            <Input
              label="PRIMARY BUTTON LABEL"
              value={form.ctaLabel}
              onChange={setFromInput("ctaLabel")}
              placeholder="Explore Services"
            />

            <Input
              label="PRIMARY BUTTON URL"
              value={form.ctaUrl}
              onChange={setFromInput("ctaUrl")}
              placeholder="/services"
            />

            <Input
              label="SECONDARY BUTTON LABEL"
              value={form.secondaryCtaLabel}
              onChange={setFromInput("secondaryCtaLabel")}
              placeholder="Talk to Us"
            />

            <Input
              label="SECONDARY BUTTON URL"
              value={form.secondaryCtaUrl}
              onChange={setFromInput("secondaryCtaUrl")}
              placeholder="/contact-us"
            />

            <Input
              label="ORDER"
              type="number"
              value={form.order}
              onChange={setFromInput("order")}
              placeholder="0"
            />
          </div>
        </div>
      </Modal>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={handleMediaSelect}
        title={
          pickerTarget === "imageUrl"
            ? "Select main background image"
            : "Select thumbnail image"
        }
        subtitle="Choose an image from the media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </>
  );
}

function ImagePickerField({ label, value, onPick, onClear }) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
        {label}
      </span>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid aspect-[16/9] place-items-center bg-slate-50">
          {value ? (
            <img
              src={getAssetUrl(value)}
              alt={label}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="grid place-items-center gap-2 text-center text-slate-400">
              <ImageIcon size={24} />
              <span className="text-xs font-semibold">No image selected</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
          <div className="min-w-0 truncate text-xs text-slate-500">
            {value || "Choose from media library"}
          </div>

          <div className="flex shrink-0 gap-2">
            {value ? (
              <Button variant="outline" size="sm" onClick={onClear}>
                Clear
              </Button>
            ) : null}

            <Button variant="outline" size="sm" onClick={onPick}>
              <UploadCloud size={14} />
              Pick
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
