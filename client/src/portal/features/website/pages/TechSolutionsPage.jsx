import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FiPackage as FiPkg } from "react-icons/fi";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import Modal from "../../../shared/ui/Modal";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import {
  listSolutions,
  createSolution,
  updateSolution,
  deleteSolution,
  reorderSolutions,
} from "../api";
import { getAssetUrl } from "../../../shared/utils/assetUrl";
import { ICON_META } from "../../../../data/technologyConstants";

const ICON_OPTIONS = Object.keys(ICON_META);
const inputClass = "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const textareaClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const labelClass = "mb-1 block text-xs font-bold text-slate-600";

function cleanText(value) {
  return String(value || "").trim();
}

function hasAnyValue(item, keys) {
  return keys.some((key) => cleanText(item?.[key]));
}

function AddRowButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
    >
      <Plus size={12} />
      {children}
    </button>
  );
}

function RemoveRowButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
      title="Remove"
    >
      <Trash2 size={12} />
    </button>
  );
}

function RowsHeader({ title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-xs font-bold text-slate-600">{title}</label>
      {action}
    </div>
  );
}

function EmptyRows({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-400">
      No {label} yet.
    </div>
  );
}

function ImagePickerRow({ label, value, onPick, onClear }) {
  const [picker, setPicker] = useState(false);

  const handleMedia = (media) => {
    if (!media) return;
    onPick(media.url || media.mediumUrl || media.thumbnailUrl || media.path || "", media._id || media.id || null);
    setPicker(false);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={getAssetUrl(value)}
            alt=""
            className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <UploadCloud size={12} />
          {value ? "Change" : "Pick image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-rose-500 hover:text-rose-700"
          >
            Remove
          </button>
        )}
      </div>
      <MediaPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={handleMedia}
        title={`Pick ${label}`}
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </div>
  );
}

function FeatureGridItemsEditor({ values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch };
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <RowsHeader
        title="Feature Cards"
        action={<AddRowButton onClick={() => onChange([...rows, { title: "", desc: "" }])}>Add card</AddRowButton>}
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label="feature cards" />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Card {idx + 1}</span>
              <RemoveRowButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={item.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Productivity Suites"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={item.desc || item.description || ""}
                  onChange={(e) => update(idx, { desc: e.target.value, description: undefined })}
                  placeholder="Describe what this feature covers"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessStepsEditor({ values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch };
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <RowsHeader
        title="Process Steps"
        action={<AddRowButton onClick={() => onChange([...rows, { step: "", title: "", desc: "" }])}>Add step</AddRowButton>}
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label="process steps" />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Step {idx + 1}</span>
              <RemoveRowButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
              <div>
                <label className={labelClass}>Number</label>
                <input
                  className={inputClass}
                  value={item.step || ""}
                  onChange={(e) => update(idx, { step: e.target.value })}
                  placeholder={String(idx + 1).padStart(2, "0")}
                />
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={item.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Requirement Review"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={item.desc || item.description || ""}
                  onChange={(e) => update(idx, { desc: e.target.value, description: undefined })}
                  placeholder="Describe what happens in this step"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextRowsEditor({ title, values = [], onChange, addLabel, placeholder }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, value) => {
    const next = [...rows];
    next[idx] = value;
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <RowsHeader
        title={title}
        action={<AddRowButton onClick={() => onChange([...rows, ""])}>{addLabel}</AddRowButton>}
      />
      <div className="space-y-2">
        {rows.length === 0 ? (
          <EmptyRows label={title.toLowerCase()} />
        ) : rows.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className={inputClass}
              value={typeof item === "string" ? item : item?.title || item?.label || item?.text || ""}
              onChange={(e) => update(idx, e.target.value)}
              placeholder={placeholder}
            />
            <RemoveRowButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageCardsItemsEditor({ title = "Image Cards", values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch };
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <RowsHeader
        title={title}
        action={<AddRowButton onClick={() => onChange([...rows, { title: "", desc: "", imageUrl: "" }])}>Add card</AddRowButton>}
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label={title.toLowerCase()} />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Card {idx + 1}</span>
              <RemoveRowButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
            </div>
            <div className="space-y-3">
              <ImagePickerRow
                label="Card Image"
                value={item.imageUrl || item.image}
                onPick={(url) => update(idx, { imageUrl: url, image: undefined })}
                onClear={() => update(idx, { imageUrl: "", image: undefined })}
              />
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={item.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Secure access layer"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={item.desc || item.description || ""}
                  onChange={(e) => update(idx, { desc: e.target.value, description: undefined })}
                  placeholder="Describe what this visual card explains"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryItemsEditor({ values = [], onChange }) {
  return (
    <ImageCardsItemsEditor
      title="Gallery Items"
      values={values}
      onChange={onChange}
    />
  );
}

function normalizeBlocksForSave(blocks = []) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    if (block.type === "featureGrid") {
      return {
        ...block,
        items: (Array.isArray(block.items) ? block.items : [])
          .map((item) => ({
            title: cleanText(item?.title),
            desc: cleanText(item?.desc || item?.description || item?.content),
          }))
          .filter((item) => hasAnyValue(item, ["title", "desc"])),
      };
    }

    if (block.type === "process") {
      return {
        ...block,
        steps: (Array.isArray(block.steps) ? block.steps : [])
          .map((item, index) => ({
            step: cleanText(item?.step) || String(index + 1).padStart(2, "0"),
            title: cleanText(item?.title),
            desc: cleanText(item?.desc || item?.description || item?.content),
          }))
          .filter((item) => hasAnyValue(item, ["title", "desc"])),
      };
    }

    if (block.type === "useCases") {
      return {
        ...block,
        items: (Array.isArray(block.items) ? block.items : [])
          .map((item) => (
            typeof item === "string"
              ? cleanText(item)
              : cleanText(item?.title || item?.label || item?.text)
          ))
          .filter(Boolean),
      };
    }

    if (block.type === "split") {
      return {
        ...block,
        desc: cleanText(block.desc || block.description || block.content),
        points: (Array.isArray(block.points) ? block.points : [])
          .map((item) => (
            typeof item === "string"
              ? cleanText(item)
              : cleanText(item?.title || item?.label || item?.text)
          ))
          .filter(Boolean),
      };
    }

    if (block.type === "imageShowcase") {
      return {
        ...block,
        desc: cleanText(block.desc || block.description || block.content),
        imageUrl: cleanText(block.imageUrl || block.image),
        secondaryImageUrl: cleanText(block.secondaryImageUrl || block.secondaryImage),
        points: (Array.isArray(block.points) ? block.points : [])
          .map((item) => (
            typeof item === "string"
              ? cleanText(item)
              : cleanText(item?.title || item?.label || item?.text)
          ))
          .filter(Boolean),
      };
    }

    if (block.type === "imageCards" || block.type === "gallery") {
      return {
        ...block,
        items: (Array.isArray(block.items) ? block.items : [])
          .map((item) => ({
            title: cleanText(item?.title),
            desc: cleanText(item?.desc || item?.description || item?.content),
            imageUrl: cleanText(item?.imageUrl || item?.image),
          }))
          .filter((item) => hasAnyValue(item, ["title", "desc", "imageUrl"])),
      };
    }

    return block;
  });
}

function blockDefaults(type) {
  if (type === "process") return { type, eyebrow: "", title: "", subtitle: "", steps: [] };
  if (type === "useCases") return { type, eyebrow: "", title: "", subtitle: "", items: [] };
  if (type === "split") return { type, eyebrow: "", title: "", desc: "", points: [] };
  if (type === "imageCards") return { type, eyebrow: "", title: "", highlight: "", subtitle: "", items: [] };
  if (type === "imageShowcase") return { type, eyebrow: "", title: "", desc: "", imageUrl: "", secondaryImageUrl: "", points: [] };
  if (type === "gallery") return { type, eyebrow: "", title: "", subtitle: "", items: [] };
  return { type: "featureGrid", eyebrow: "", title: "", highlight: "", subtitle: "", items: [] };
}

function SolutionPreview({ solution, blocks }) {
  const meta = ICON_META[solution?.icon] || {};
  const previewBlocks = normalizeBlocksForSave(blocks);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative min-h-44 bg-slate-950 p-5 text-white">
        {solution?.heroImageUrl && (
          <img
            src={getAssetUrl(solution.heroImageUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-slate-900/70" />
        <div className="relative">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: meta.bg || "#eef2ff", color: meta.color || "#4f46e5" }}
          >
            {React.createElement(meta.Icon || FiPkg, { size: 16 })}
          </span>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
            {solution?.title || "Technology Solution"}
          </p>
          <h3 className="mt-1 text-xl font-black leading-tight text-white">
            {solution?.subtitle || solution?.title || "Preview"}
          </h3>
          {solution?.description && (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/70">
              {solution.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-h-[68vh] space-y-4 overflow-y-auto p-4">
        {previewBlocks.length === 0 ? (
          <EmptyRows label="preview blocks" />
        ) : previewBlocks.map((block, idx) => (
          <PreviewBlock key={`${block.type}-${idx}`} block={block} meta={meta} />
        ))}
      </div>
    </div>
  );
}

function PreviewBlock({ block, meta }) {
  const accent = meta.color || "#4f46e5";
  const accentBg = meta.bg || "#eef2ff";

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {block.eyebrow && (
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          {block.eyebrow}
        </p>
      )}
      {block.title && (
        <h4 className="mt-1 text-base font-black leading-tight text-slate-950">
          {block.title}
          {block.highlight && <span style={{ color: accent }}> {block.highlight}</span>}
        </h4>
      )}
      {block.subtitle && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{block.subtitle}</p>
      )}

      {block.type === "featureGrid" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(block.items || []).map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black"
                style={{ backgroundColor: accentBg, color: accent }}
              >
                {index + 1}
              </span>
              <p className="mt-2 text-xs font-black text-slate-900">{item.title || "Untitled card"}</p>
              {item.desc && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.desc}</p>}
            </div>
          ))}
        </div>
      )}

      {block.type === "process" && (
        <div className="mt-3 space-y-2">
          {(block.steps || []).map((item, index) => (
            <div key={`${item.step}-${index}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                style={{ backgroundColor: accentBg, color: accent }}
              >
                {item.step || String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-black text-slate-900">{item.title || "Untitled step"}</p>
                {item.desc && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {block.type === "useCases" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(block.items || []).map((item, index) => (
            <span key={`${item}-${index}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
              {item}
            </span>
          ))}
        </div>
      )}

      {block.type === "split" && (
        <>
          {block.desc && <p className="mt-2 text-xs leading-5 text-slate-500">{block.desc}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(block.points || []).map((point, index) => (
              <span key={`${point}-${index}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600">
                {point}
              </span>
            ))}
          </div>
        </>
      )}

      {block.type === "imageShowcase" && (
        <>
          {block.desc && <p className="mt-2 text-xs leading-5 text-slate-500">{block.desc}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[block.imageUrl, block.secondaryImageUrl].filter(Boolean).map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={getAssetUrl(image)}
                alt=""
                className="h-28 w-full rounded-lg border border-slate-200 object-cover"
              />
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(block.points || []).map((point, index) => (
              <span key={`${point}-${index}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600">
                {point}
              </span>
            ))}
          </div>
        </>
      )}

      {(block.type === "imageCards" || block.type === "gallery") && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(block.items || []).map((item, index) => (
            <div key={`${item.title}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {item.imageUrl && (
                <img
                  src={getAssetUrl(item.imageUrl)}
                  alt=""
                  className="h-24 w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="text-xs font-black text-slate-900">{item.title || "Untitled image"}</p>
                {item.desc && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

const EMPTY_SOLUTION = {
  title: "",
  subtitle: "",
  description: "",
  slug: "",
  group: "",
  icon: "software",
  heroImageUrl: "",
  heroImageMediaId: null,
  isActive: true,
  // Classification (website IA): "technology" = sourced & delivered,
  // "digital" = software built and owned by Expresso (e.g. CAS).
  kind: "technology",
  ownership: "partner",
  tagline: "",
  badge: "",
  ctaLabel: "",
  demoCtaLabel: "",
  demoCtaHref: "",
  customPage: "",
};

const KIND_OPTIONS = [
  { value: "digital", label: "Digital Solution", hint: "Software built by Expresso · /digital-solutions" },
  { value: "technology", label: "Technology Solution", hint: "Sourced & delivered, grouped · /it-solutions" },
];

const CUSTOM_PAGE_OPTIONS = [
  { value: "", label: "Standard layout (content blocks)" },
  { value: "cas", label: "CAS product page" },
];

function publicPath(form) {
  return `${form.kind === "digital" ? "/digital-solutions" : "/it-solutions"}/${form.slug || "…"}`;
}

const inputCls =
  "h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

function toSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SolutionFormModal({ open, onClose, initial, onSave, groups }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_SOLUTION);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY_SOLUTION, ...initial } : EMPTY_SOLUTION);
      setSlugEdited(Boolean(initial));
    }
  }, [open, initial]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  // Digital Solutions never have a technology group; switching type clears it.
  const setKind = (kind) =>
    setForm((p) => ({
      ...p,
      kind,
      ownership: kind === "digital" ? "expresso" : "partner",
      group: kind === "digital" ? "" : p.group,
    }));

  const handleTitleChange = (v) => {
    set("title", v);
    if (!slugEdited) set("slug", toSlug(v));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    if (form.kind !== "digital" && !groups.some((group) => group.id === form.group)) {
      toast.error("Choose a technology group");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleMedia = (media) => {
    if (!media) return;
    set("heroImageUrl", media.url || media.mediumUrl || media.thumbnailUrl || media.path || "");
    set("heroImageMediaId", media._id || media.id || null);
    setPicker(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Solution" : "New Solution"}>
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-700">Type</span>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Type">
              {KIND_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === o.value}
                  onClick={() => setKind(o.value)}
                  className={[
                    "rounded-xl border px-3 py-2 text-left transition",
                    form.kind === o.value
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <span className="block text-sm font-bold text-slate-900">{o.label}</span>
                  <span className="block text-[11px] text-slate-500">{o.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700">Title *</label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="ERP Solution"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Slug *</label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={form.slug}
              onChange={(e) => { setSlugEdited(true); set("slug", toSlug(e.target.value)); }}
              placeholder="erp-solution"
            />
            <p className="mt-1 text-[11px] text-slate-400">URL: {publicPath(form)}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Subtitle</label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Streamline operations end-to-end"
            />
          </div>

          {form.kind !== "digital" && (
            <div className="sm:col-span-2">
              <label htmlFor="solution-technology-group" className="mb-1 block text-xs font-bold text-slate-700">Technology group *</label>
              <select id="solution-technology-group" value={form.group} onChange={(e) => set("group", e.target.value)} className={inputClass} required>
                <option value="">Choose a group</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">Used on Technology Solutions and in the website navigation.</p>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Shown as the hero subtitle on the solution detail page"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((key) => {
                const m = ICON_META[key];
                const Ic = m?.Icon || FiPkg;
                return (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    onClick={() => set("icon", key)}
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
                      form.icon === key
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300",
                    ].join(" ")}
                    style={form.icon === key ? { color: m?.color, borderColor: m?.color, background: m?.bg } : {}}
                  >
                    <Ic size={16} />
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Selected: {form.icon}</p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700">Hero Image</label>
            <div className="flex items-center gap-3">
              {form.heroImageUrl && (
                <img
                  src={getAssetUrl(form.heroImageUrl)}
                  alt=""
                  className="h-16 w-24 rounded-lg border border-slate-200 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setPicker(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <UploadCloud size={13} />
                {form.heroImageUrl ? "Change image" : "Pick image"}
              </button>
              {form.heroImageUrl && (
                <button
                  type="button"
                  onClick={() => { set("heroImageUrl", ""); set("heroImageMediaId", null); }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {form.kind === "digital" && (
            <div className="sm:col-span-2 grid gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                Digital Solution · product listing
              </p>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-700">Tagline</label>
                <input
                  className={inputCls}
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="One sentence shown on the product card and menu"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Badge</label>
                <input
                  className={inputCls}
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  placeholder="Built by Expresso"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold text-slate-700">Ownership</span>
                <p className="flex h-10 items-center rounded-xl border border-slate-100 bg-white/60 px-3 text-sm text-slate-600">
                  Built &amp; owned by Expresso
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Set by the type. Technology Solutions are never Expresso-owned.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Main button label</label>
                <input
                  className={inputCls}
                  value={form.ctaLabel}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder={`Explore ${form.title || "product"}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Detail page</label>
                <select
                  className={inputCls}
                  value={form.customPage}
                  onChange={(e) => set("customPage", e.target.value)}
                >
                  {CUSTOM_PAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Demo button label</label>
                <input
                  className={inputCls}
                  value={form.demoCtaLabel}
                  onChange={(e) => set("demoCtaLabel", e.target.value)}
                  placeholder="Request a Demo"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Demo button link</label>
                <input
                  className={inputCls}
                  value={form.demoCtaHref}
                  onChange={(e) => set("demoCtaHref", e.target.value)}
                  placeholder="/contact-us?interest=demo"
                />
                <p className="mt-1 text-[11px] text-slate-400">Site path (/…) or https:// link. Leave empty to hide.</p>
              </div>
            </div>
          )}

          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">Active</label>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={[
                "relative h-6 w-11 rounded-full transition",
                form.isActive ? "bg-indigo-600" : "bg-slate-200",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  form.isActive ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {initial && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Use the <span className="font-bold">B</span> button in the solutions list to edit this page's content blocks. Public URL:{" "}
            <span className="font-mono font-bold">{publicPath(form)}</span>.
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {initial ? "Save changes" : "Create solution"}
          </button>
        </div>
      </div>

      <MediaPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={handleMedia}
        title="Pick hero image"
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </Modal>
  );
}

// ─── Blocks Editor ────────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { value: "featureGrid", label: "Feature Grid" },
  { value: "imageCards", label: "Image Cards" },
  { value: "imageShowcase", label: "Image Showcase" },
  { value: "gallery", label: "Gallery" },
  { value: "process", label: "Process" },
  { value: "useCases", label: "Use Cases" },
  { value: "split", label: "Split Section" },
];

function BlocksEditor({ solution, solutionId, blocks: initialBlocks, onSaved }) {
  const toast = useToast();
  const [blocks, setBlocks] = useState(initialBlocks || []);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [addType, setAddType] = useState("featureGrid");

  useEffect(() => {
    setBlocks(initialBlocks || []);
    setDirty(false);
  }, [initialBlocks]);

  const toggle = (idx) => setExpanded((p) => ({ ...p, [idx]: !p[idx] }));

  const setBlock = (idx, patch) => {
    setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
    setDirty(true);
  };

  const addBlock = () => {
    setBlocks((p) => [...p, blockDefaults(addType)]);
    setDirty(true);
    setExpanded((p) => ({ ...p, [blocks.length]: true }));
  };

  const removeBlock = (idx) => {
    setBlocks((p) => p.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const moveBlock = (idx, dir) => {
    setBlocks((p) => {
      const next = [...p];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return p;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateSolution(solutionId, { blocks: normalizeBlocksForSave(blocks) });
      onSaved(res.item);
      setDirty(false);
      toast.success("Blocks saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-3">
        {blocks.map((block, idx) => {
          const blockLabel = BLOCK_TYPES.find((item) => item.value === block.type)?.label || block.type;

          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-slate-600">
                    {blockLabel}
                  </span>
                  <span className="truncate text-sm font-bold text-slate-800">
                    {block.title || block.eyebrow || "(untitled)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                    disabled={idx === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                    disabled={idx === blocks.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeBlock(idx); }}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-rose-100 text-rose-400 hover:bg-rose-50"
                  >
                    <Trash2 size={12} />
                  </button>
                  {expanded[idx] ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              {expanded[idx] && (
                <div className="space-y-3 border-t border-slate-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Block Type</label>
                      <select
                        value={block.type}
                        onChange={(e) => setBlock(idx, {
                          ...blockDefaults(e.target.value),
                          eyebrow: block.eyebrow || "",
                          title: block.title || "",
                        })}
                        className={inputClass}
                      >
                        {BLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Eyebrow</label>
                      <input
                        className={inputClass}
                        value={block.eyebrow || ""}
                        onChange={(e) => setBlock(idx, { eyebrow: e.target.value })}
                        placeholder="Section label"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Title</label>
                      <input
                        className={inputClass}
                        value={block.title || ""}
                        onChange={(e) => setBlock(idx, { title: e.target.value })}
                        placeholder="Block heading"
                      />
                    </div>

                    {block.type === "featureGrid" && (
                      <>
                        <div>
                          <label className={labelClass}>Highlight</label>
                          <input
                            className={inputClass}
                            value={block.highlight || ""}
                            onChange={(e) => setBlock(idx, { highlight: e.target.value })}
                            placeholder="emphasized words"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={2}
                            className={textareaClass}
                            value={block.subtitle || ""}
                            onChange={(e) => setBlock(idx, { subtitle: e.target.value })}
                            placeholder="Short section description"
                          />
                        </div>
                        <FeatureGridItemsEditor
                          values={block.items || []}
                          onChange={(values) => setBlock(idx, { items: values })}
                        />
                      </>
                    )}

                    {block.type === "imageCards" && (
                      <>
                        <div>
                          <label className={labelClass}>Highlight</label>
                          <input
                            className={inputClass}
                            value={block.highlight || ""}
                            onChange={(e) => setBlock(idx, { highlight: e.target.value })}
                            placeholder="visual proof"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={2}
                            className={textareaClass}
                            value={block.subtitle || ""}
                            onChange={(e) => setBlock(idx, { subtitle: e.target.value })}
                            placeholder="Short intro before the image cards"
                          />
                        </div>
                        <ImageCardsItemsEditor
                          values={block.items || []}
                          onChange={(values) => setBlock(idx, { items: values })}
                        />
                      </>
                    )}

                    {block.type === "imageShowcase" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Description</label>
                          <textarea
                            rows={3}
                            className={textareaClass}
                            value={block.desc || block.description || ""}
                            onChange={(e) => setBlock(idx, { desc: e.target.value, description: undefined })}
                            placeholder="Describe the visual showcase"
                          />
                        </div>
                        <div>
                          <ImagePickerRow
                            label="Main Image"
                            value={block.imageUrl || block.image}
                            onPick={(url) => setBlock(idx, { imageUrl: url, image: undefined })}
                            onClear={() => setBlock(idx, { imageUrl: "", image: undefined })}
                          />
                        </div>
                        <div>
                          <ImagePickerRow
                            label="Secondary Image"
                            value={block.secondaryImageUrl || block.secondaryImage}
                            onPick={(url) => setBlock(idx, { secondaryImageUrl: url, secondaryImage: undefined })}
                            onClear={() => setBlock(idx, { secondaryImageUrl: "", secondaryImage: undefined })}
                          />
                        </div>
                        <TextRowsEditor
                          title="Key Points"
                          values={block.points || []}
                          onChange={(values) => setBlock(idx, { points: values })}
                          addLabel="Add point"
                          placeholder="Clear requirement mapping"
                        />
                      </>
                    )}

                    {block.type === "gallery" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={2}
                            className={textareaClass}
                            value={block.subtitle || ""}
                            onChange={(e) => setBlock(idx, { subtitle: e.target.value })}
                            placeholder="Short intro before the gallery"
                          />
                        </div>
                        <GalleryItemsEditor
                          values={block.items || []}
                          onChange={(values) => setBlock(idx, { items: values })}
                        />
                      </>
                    )}

                    {block.type === "process" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={2}
                            className={textareaClass}
                            value={block.subtitle || ""}
                            onChange={(e) => setBlock(idx, { subtitle: e.target.value })}
                            placeholder="Optional process intro"
                          />
                        </div>
                        <ProcessStepsEditor
                          values={block.steps || []}
                          onChange={(values) => setBlock(idx, { steps: values })}
                        />
                      </>
                    )}

                    {block.type === "useCases" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={2}
                            className={textareaClass}
                            value={block.subtitle || ""}
                            onChange={(e) => setBlock(idx, { subtitle: e.target.value })}
                            placeholder="Optional use-case intro"
                          />
                        </div>
                        <TextRowsEditor
                          title="Use Cases"
                          values={block.items || []}
                          onChange={(values) => setBlock(idx, { items: values })}
                          addLabel="Add use case"
                          placeholder="Banks and financial service centers"
                        />
                      </>
                    )}

                    {block.type === "split" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Description</label>
                          <textarea
                            rows={3}
                            className={textareaClass}
                            value={block.desc || block.description || ""}
                            onChange={(e) => setBlock(idx, { desc: e.target.value, description: undefined })}
                            placeholder="Describe the section"
                          />
                        </div>
                        <TextRowsEditor
                          title="Points"
                          values={block.points || []}
                          onChange={(values) => setBlock(idx, { points: values })}
                          addLabel="Add point"
                          placeholder="Clear use-case definition"
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {blocks.length === 0 && <EmptyRows label="content blocks" />}

        <div className="flex items-center gap-2">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300"
          >
            {BLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            type="button"
            onClick={addBlock}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            <Plus size={14} />
            Add block
          </button>
        </div>
      </div>

      <aside className="2xl:sticky 2xl:top-4 2xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Live Preview</h3>
          {dirty && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">Unsaved</span>}
        </div>
        <SolutionPreview solution={solution} blocks={blocks} />
      </aside>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur 2xl:col-span-2">
          <span className="text-sm font-bold text-slate-900">Unsaved blocks</span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save blocks
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TechSolutionsPage() {
  const toast = useToast();
  // PI closure: create, edit, show/hide, delete, reorder and page blocks are
  // all website.write on the API; website.read only views the list.
  const canWrite = useAccess().can("website.write");
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [blocksFor, setBlocksFor] = useState(null);
  const dragIdx = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Both website sections live in one Solutions collection.
      const res = await listSolutions({ includeInactive: true, kind: "all" });
      setItems(res.items || []);
      setGroups(res.groups || []);
    } catch {
      toast.error("Failed to load solutions.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    if (!canWrite) return;
    const res = await createSolution({ ...form, order: items.length });
    setItems((p) => [...p, res.item]);
    toast.success("Solution created.");
  };

  const handleUpdate = async (form) => {
    if (!canWrite) return;
    const res = await updateSolution(editing._id, form);
    setItems((p) => p.map((x) => (x._id === editing._id ? res.item : x)));
    toast.success("Solution updated.");
  };

  const handleDelete = async () => {
    if (!canWrite) return;
    await deleteSolution(confirmId);
    setItems((p) => p.filter((x) => x._id !== confirmId));
    if (blocksFor?._id === confirmId) setBlocksFor(null);
    setConfirmId(null);
    toast.success("Deleted.");
  };

  const toggleActive = async (item) => {
    if (!canWrite) return;
    const res = await updateSolution(item._id, { isActive: !item.isActive });
    setItems((p) => p.map((x) => (x._id === item._id ? res.item : x)));
    if (blocksFor?._id === item._id) setBlocksFor(res.item);
  };

  // Drag-to-reorder
  const onDragStart = (idx) => { dragIdx.current = idx; };
  const onDragOver = (e, idx) => {
    if (!canWrite) return;
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };
  const onDragEnd = async () => {
    dragIdx.current = null;
    if (!canWrite) return;
    setReordering(true);
    try {
      await reorderSolutions(items.map((x) => x._id));
      toast.success("Order saved.");
    } catch {
      toast.error("Failed to save order.");
    } finally {
      setReordering(false);
    }
  };

  const activeItem = blocksFor && canWrite ? items.find((x) => x._id === blocksFor._id) || blocksFor : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Solutions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digital Solutions (software built by Expresso) and Technology Solutions (grouped). Edit a solution to set its type and, for technology, its group. Drag to reorder.
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={15} />
            Add solution
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(680px,1.15fr)]">
        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-slate-400">No solutions yet.{canWrite ? " Add the first one." : ""}</p>
            </div>
          ) : (
            <>
              {reordering && (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                  <Loader2 size={13} className="animate-spin" /> Saving order…
                </div>
              )}
              {items.map((item, idx) => {
                const meta = ICON_META[item.icon];
                const IconComp = meta?.Icon || FiPkg;
                const isBlocksOpen = blocksFor?._id === item._id;

                return (
                  <div
                    key={item._id}
                    draggable={canWrite}
                    onDragStart={canWrite ? () => onDragStart(idx) : undefined}
                    onDragOver={canWrite ? (e) => onDragOver(e, idx) : undefined}
                    onDragEnd={canWrite ? onDragEnd : undefined}
                    className={[
                      "flex items-center gap-4 rounded-xl border bg-white p-3 shadow-sm transition",
                      isBlocksOpen ? "border-indigo-300 shadow-md" : "border-slate-200 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <GripVertical size={16} className="shrink-0 cursor-grab text-slate-300" />

                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: meta?.bg, color: meta?.color }}
                    >
                      <IconComp size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.title}</span>
                        <span className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                          item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400",
                        ].join(" ")}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                          item.kind === "digital" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500",
                        ].join(" ")}>
                          {item.kind === "digital" ? "Digital · Built by Expresso" : "Technology"}
                        </span>
                      </div>
                      {item.kind !== "digital" && (
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{groups.find((group) => group.id === item.group)?.label || "Choose a technology group"}</p>
                      )}
                      {item.subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{item.subtitle}</p>}
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{publicPath(item)}</p>
                    </div>

                    {canWrite ? <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title="Edit blocks"
                        onClick={() => setBlocksFor(isBlocksOpen ? null : item)}
                        className={[
                          "grid h-8 w-8 place-items-center rounded-lg border text-xs font-bold transition",
                          isBlocksOpen
                            ? "border-indigo-400 bg-indigo-600 text-white"
                            : "border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600",
                        ].join(" ")}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        title={item.isActive ? "Deactivate" : "Activate"}
                        aria-label={`${item.isActive ? "Deactivate" : "Activate"} ${item.title || "item"}`}
                        onClick={() => toggleActive(item)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${item.title || "item"}`}
                        onClick={() => { setEditing(item); setFormOpen(true); }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${item.title || "item"}`}
                        onClick={() => setConfirmId(item._id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div> : null}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Blocks editor panel */}
        {activeItem && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Content Blocks</h2>
                <p className="text-xs text-slate-500">{activeItem.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setBlocksFor(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <BlocksEditor
              solution={activeItem}
              solutionId={activeItem._id}
              blocks={activeItem.blocks || []}
              onSaved={(updated) => setItems((p) => p.map((x) => (x._id === updated._id ? updated : x)))}
            />
          </div>
        )}
      </div>

      <SolutionFormModal
        open={formOpen && canWrite}
        onClose={() => setFormOpen(false)}
        initial={editing}
        groups={groups}
        onSave={editing ? handleUpdate : handleCreate}
      />

      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete solution?"
        message="This will permanently remove this solution and all its content blocks. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
