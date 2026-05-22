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
  X,
} from "lucide-react";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import Modal from "../../../shared/ui/Modal";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import {
  listDigitalServices,
  createDigitalService,
  updateDigitalService,
  deleteDigitalService,
  reorderDigitalServices,
} from "../api";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inp = "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const area = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const lbl = "mb-1 block text-xs font-bold text-slate-600";

// ─── Image picker row ─────────────────────────────────────────────────────────

function ImageRow({ label, value, onPick, onClear }) {
  const [picker, setPicker] = useState(false);
  const handleMedia = (m) => {
    if (!m) return;
    onPick(m.url || m.mediumUrl || m.thumbnailUrl || m.path || "", m._id || m.id || null);
    setPicker(false);
  };
  return (
    <div>
      <label className={lbl}>{label}</label>
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

// ─── Repeatable field editors ─────────────────────────────────────────────────

function AddButton({ children, onClick }) {
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

function RemoveButton({ onClick, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
      title={label}
    >
      <Trash2 size={12} />
    </button>
  );
}

function SectionTitle({ title, action }) {
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

function TextListEditor({
  title,
  values = [],
  onChange,
  addLabel,
  placeholder,
  multiline = false,
}) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, value) => {
    const next = [...rows];
    next[idx] = value;
    onChange(next);
  };

  return (
    <div>
      <SectionTitle
        title={title}
        action={<AddButton onClick={() => onChange([...rows, ""])}>{addLabel}</AddButton>}
      />
      <div className="space-y-2">
        {rows.length === 0 ? (
          <EmptyRows label={title.toLowerCase()} />
        ) : rows.map((value, idx) => (
          <div key={idx} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                rows={3}
                className={area}
                value={value || ""}
                onChange={(e) => update(idx, e.target.value)}
                placeholder={placeholder}
              />
            ) : (
              <input
                className={inp}
                value={value || ""}
                onChange={(e) => update(idx, e.target.value)}
                placeholder={placeholder}
              />
            )}
            <RemoveButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessStepsEditor({ title = "Process Steps", values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch };
    onChange(next);
  };

  return (
    <div>
      <SectionTitle
        title={title}
        action={
          <AddButton onClick={() => onChange([...rows, { callout: "", title: "", description: "", image: "" }])}>
            Add step
          </AddButton>
        }
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label="steps" />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Step {idx + 1}</span>
              <RemoveButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={lbl}>Callout</label>
                <input
                  className={inp}
                  value={item.callout || ""}
                  onChange={(e) => update(idx, { callout: e.target.value })}
                  placeholder="Planning"
                />
              </div>
              <div>
                <label className={lbl}>Title</label>
                <input
                  className={inp}
                  value={item.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Defining Goals and Structure"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Description</label>
                <textarea
                  rows={3}
                  className={area}
                  value={item.description || ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  placeholder="Describe this step"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageRow
                  label="Step Image"
                  value={item.image}
                  onPick={(url) => update(idx, { image: url })}
                  onClear={() => update(idx, { image: "" })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItemsEditor({ values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch, id: idx + 1 };
    onChange(next);
  };

  const add = () => {
    const nextIndex = rows.length;
    onChange([
      ...rows,
      {
        id: nextIndex + 1,
        callout: "",
        title: "",
        description: "",
        contentPosition: nextIndex % 2 === 0 ? "r" : "l",
        image: "",
      },
    ]);
  };

  return (
    <div>
      <SectionTitle
        title="Timeline Items"
        action={<AddButton onClick={add}>Add item</AddButton>}
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label="timeline items" />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Item {idx + 1}</span>
              <RemoveButton onClick={() => onChange(rows.filter((_, i) => i !== idx).map((row, i) => ({ ...row, id: i + 1 })))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={lbl}>Callout</label>
                <input
                  className={inp}
                  value={item.callout || ""}
                  onChange={(e) => update(idx, { callout: e.target.value })}
                  placeholder="Strategy"
                />
              </div>
              <div>
                <label className={lbl}>Text Position</label>
                <select
                  className={inp}
                  value={item.contentPosition || (idx % 2 === 0 ? "r" : "l")}
                  onChange={(e) => update(idx, { contentPosition: e.target.value })}
                >
                  <option value="r">Right</option>
                  <option value="l">Left</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Title</label>
                <input
                  className={inp}
                  value={item.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Set the Stage for Success"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Description</label>
                <textarea
                  rows={3}
                  className={area}
                  value={item.description || ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  placeholder="Describe this item"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageRow
                  label="Item Image"
                  value={item.image}
                  onPick={(url) => update(idx, { image: url })}
                  onClear={() => update(idx, { image: "" })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqQuestionsEditor({ values = [], onChange }) {
  const rows = Array.isArray(values) ? values : [];
  const update = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), ...patch };
    onChange(next);
  };

  return (
    <div>
      <SectionTitle
        title="Questions"
        action={<AddButton onClick={() => onChange([...rows, { title: "", content: "", defaultOpen: false }])}>Add question</AddButton>}
      />
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRows label="questions" />
        ) : rows.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-400">Question {idx + 1}</span>
              <RemoveButton onClick={() => onChange(rows.filter((_, i) => i !== idx))} />
            </div>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Question</label>
                <input
                  className={inp}
                  value={item.title || item.question || ""}
                  onChange={(e) => update(idx, { title: e.target.value, question: undefined })}
                  placeholder="Will my website be mobile-friendly?"
                />
              </div>
              <div>
                <label className={lbl}>Answer</label>
                <textarea
                  rows={3}
                  className={area}
                  value={item.content || item.answer || ""}
                  onChange={(e) => update(idx, { content: e.target.value, answer: undefined })}
                  placeholder="Write the answer shown in the FAQ."
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(item.defaultOpen)}
                  onChange={(e) => update(idx, { defaultOpen: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                />
                Open by default
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Block type configs ───────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { value: "intro",        label: "Intro" },
  { value: "webSolutions", label: "Web Solutions" },
  { value: "steps",        label: "Steps" },
  { value: "process",      label: "Process" },
  { value: "faq",          label: "FAQ" },
];

const BLOCK_DEFAULTS = {
  intro:        { type: "intro",        eyebrow: "", title: "", highlight: "", imageUrl: "", descriptions: [], chips: [], ctaText: "", ctaLink: "" },
  webSolutions: { type: "webSolutions", imageUrl: "", heading: "", descriptions: [] },
  steps:        { type: "steps",        items: [] },
  process:      { type: "process",      eyebrow: "", title: "", steps: [] },
  faq:          { type: "faq",          heading: "FAQ", subtitle: "", questions: [] },
};

function cleanStringList(items) {
  return Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function hasAnyValue(item, keys) {
  return keys.some((key) => String(item?.[key] || "").trim());
}

function normalizeBlocksForSave(blocks = []) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    if (block.type === "intro") {
      return {
        ...block,
        descriptions: cleanStringList(block.descriptions),
        chips: cleanStringList(block.chips),
      };
    }

    if (block.type === "webSolutions") {
      return {
        ...block,
        descriptions: cleanStringList(block.descriptions),
      };
    }

    if (block.type === "steps") {
      return {
        ...block,
        items: (Array.isArray(block.items) ? block.items : [])
          .map((item, index) => ({
            id: index + 1,
            callout: String(item?.callout || "").trim(),
            title: String(item?.title || "").trim(),
            description: String(item?.description || "").trim(),
            contentPosition: item?.contentPosition
              ? (item.contentPosition === "l" ? "l" : "r")
              : (index % 2 === 0 ? "r" : "l"),
            image: String(item?.image || "").trim(),
          }))
          .filter((item) => hasAnyValue(item, ["callout", "title", "description", "image"])),
      };
    }

    if (block.type === "process") {
      return {
        ...block,
        steps: (Array.isArray(block.steps) ? block.steps : [])
          .map((item) => ({
            callout: String(item?.callout || "").trim(),
            title: String(item?.title || "").trim(),
            description: String(item?.description || "").trim(),
            image: String(item?.image || "").trim(),
          }))
          .filter((item) => hasAnyValue(item, ["callout", "title", "description", "image"])),
      };
    }

    if (block.type === "faq") {
      return {
        ...block,
        questions: (Array.isArray(block.questions) ? block.questions : [])
          .map((item) => ({
            title: String(item?.title || item?.question || "").trim(),
            content: String(item?.content || item?.answer || "").trim(),
            defaultOpen: Boolean(item?.defaultOpen),
          }))
          .filter((item) => hasAnyValue(item, ["title", "content"])),
      };
    }

    return block;
  });
}

function DigitalServicePreview({ service, blocks }) {
  const previewBlocks = normalizeBlocksForSave(blocks);
  const heroImage = service?.heroImageUrl || service?.imageUrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative min-h-44 bg-slate-950 p-5 text-white">
        {heroImage && (
          <img
            src={getAssetUrl(heroImage)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-slate-900/70" />
        <div className="relative">
          {service?.tag && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
              {service.tag}
            </span>
          )}
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
            {service?.title || "Digital Service"}
          </p>
          <h3 className="mt-1 text-xl font-black leading-tight text-white">
            {service?.heroHeading || service?.title || "Preview"}
          </h3>
          {(service?.heroSubheading || service?.description) && (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/70">
              {service.heroSubheading || service.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-h-[68vh] space-y-4 overflow-y-auto p-4">
        {previewBlocks.length === 0 ? (
          <EmptyRows label="preview blocks" />
        ) : previewBlocks.map((block, idx) => (
          <DigitalPreviewBlock key={`${block.type}-${idx}`} block={block} />
        ))}
      </div>
    </div>
  );
}

function PreviewTextList({ items }) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (rows.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {rows.map((item, index) => (
        <p key={`${item}-${index}`} className="text-xs leading-5 text-slate-500">
          {item}
        </p>
      ))}
    </div>
  );
}

function PreviewImageBlock({ src, alt = "" }) {
  if (!src) return null;

  return (
    <img
      src={getAssetUrl(src)}
      alt={alt}
      className="mt-3 h-32 w-full rounded-xl border border-slate-200 object-cover"
    />
  );
}

function DigitalPreviewBlock({ block }) {
  const typeLabel = BLOCK_TYPES.find((item) => item.value === block.type)?.label || block.type;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {typeLabel}
      </p>

      {(block.eyebrow || block.heading) && (
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-500">
          {block.eyebrow || block.heading}
        </p>
      )}

      {(block.title || block.heading) && (
        <h4 className="mt-1 text-base font-black leading-tight text-slate-950">
          {block.title || block.heading}
          {block.highlight && <span className="text-indigo-600"> {block.highlight}</span>}
        </h4>
      )}

      {block.type === "intro" && (
        <>
          <PreviewTextList items={block.descriptions} />
          {(block.chips || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {block.chips.map((chip, index) => (
                <span key={`${chip}-${index}`} className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-bold text-indigo-600">
                  {chip}
                </span>
              ))}
            </div>
          )}
          <PreviewImageBlock src={block.imageUrl} alt={block.title} />
          {block.ctaText && (
            <span className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black text-white">
              {block.ctaText}
            </span>
          )}
        </>
      )}

      {block.type === "webSolutions" && (
        <>
          <PreviewTextList items={block.descriptions} />
          <PreviewImageBlock src={block.imageUrl} alt={block.heading} />
        </>
      )}

      {block.type === "steps" && (
        <div className="mt-3 space-y-2">
          {(block.items || []).map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  {item.callout && <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.callout}</p>}
                  <p className="text-xs font-black text-slate-900">{item.title || "Untitled item"}</p>
                  {item.description && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p>}
                </div>
              </div>
              <PreviewImageBlock src={item.image} alt={item.title} />
            </div>
          ))}
        </div>
      )}

      {block.type === "process" && (
        <div className="mt-3 space-y-2">
          {(block.steps || []).map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  {item.callout && <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.callout}</p>}
                  <p className="text-xs font-black text-slate-900">{item.title || "Untitled step"}</p>
                  {item.description && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p>}
                </div>
              </div>
              <PreviewImageBlock src={item.image} alt={item.title} />
            </div>
          ))}
        </div>
      )}

      {block.type === "faq" && (
        <>
          {block.subtitle && <p className="mt-2 text-xs leading-5 text-slate-500">{block.subtitle}</p>}
          <div className="mt-3 space-y-2">
            {(block.questions || []).map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black text-slate-900">{item.title || "Untitled question"}</p>
                  {item.defaultOpen && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">Open</span>}
                </div>
                {item.content && <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.content}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange, onDelete }) {
  const [open, setOpen] = useState(true);
  const set = (k, v) => onChange({ ...block, [k]: v });

  const typeLabel = BLOCK_TYPES.find((t) => t.value === block.type)?.label || block.type;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            {typeLabel}
          </span>
          {block.title && (
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[220px]">
              {block.title}
            </span>
          )}
          {block.heading && !block.title && (
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[220px]">
              {block.heading}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500"
          >
            <X size={13} />
          </button>
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
          {/* INTRO */}
          {block.type === "intro" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Eyebrow</label>
                  <input className={inp} value={block.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} placeholder="OUR SERVICE" />
                </div>
                <div>
                  <label className={lbl}>Highlight (colored suffix)</label>
                  <input className={inp} value={block.highlight || ""} onChange={(e) => set("highlight", e.target.value)} placeholder="Solutions" />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Title</label>
                  <input className={inp} value={block.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="Powerful Digital" />
                </div>
                <div>
                  <label className={lbl}>CTA Text</label>
                  <input className={inp} value={block.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} placeholder="Get Started" />
                </div>
                <div>
                  <label className={lbl}>CTA Link</label>
                  <input className={inp} value={block.ctaLink || ""} onChange={(e) => set("ctaLink", e.target.value)} placeholder="/contact-us" />
                </div>
                <div className="sm:col-span-2">
                  <ImageRow
                    label="Block Image"
                    value={block.imageUrl}
                    onPick={(url) => set("imageUrl", url)}
                    onClear={() => set("imageUrl", "")}
                  />
                </div>
              </div>
              <TextListEditor
                title="Description Paragraphs"
                values={block.descriptions || []}
                onChange={(values) => set("descriptions", values)}
                addLabel="Add paragraph"
                placeholder="Write a paragraph for this block"
                multiline
              />
              <TextListEditor
                title="Chips"
                values={block.chips || []}
                onChange={(values) => set("chips", values)}
                addLabel="Add chip"
                placeholder="Performance-first"
              />
            </>
          )}

          {/* WEB SOLUTIONS */}
          {block.type === "webSolutions" && (
            <>
              <div>
                <label className={lbl}>Heading</label>
                <input className={inp} value={block.heading || ""} onChange={(e) => set("heading", e.target.value)} />
              </div>
              <ImageRow
                label="Image"
                value={block.imageUrl}
                onPick={(url) => set("imageUrl", url)}
                onClear={() => set("imageUrl", "")}
              />
              <TextListEditor
                title="Description Paragraphs"
                values={block.descriptions || []}
                onChange={(values) => set("descriptions", values)}
                addLabel="Add paragraph"
                placeholder="Write a paragraph for this block"
                multiline
              />
            </>
          )}

          {/* STEPS */}
          {block.type === "steps" && (
            <TimelineItemsEditor
              values={block.items || []}
              onChange={(values) => set("items", values)}
            />
          )}

          {/* PROCESS */}
          {block.type === "process" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Eyebrow</label>
                  <input className={inp} value={block.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Title</label>
                  <input className={inp} value={block.title || ""} onChange={(e) => set("title", e.target.value)} />
                </div>
              </div>
              <ProcessStepsEditor
                values={block.steps || []}
                onChange={(values) => set("steps", values)}
              />
            </>
          )}

          {/* FAQ */}
          {block.type === "faq" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Heading</label>
                  <input className={inp} value={block.heading || ""} onChange={(e) => set("heading", e.target.value)} placeholder="FAQ" />
                </div>
                <div>
                  <label className={lbl}>Subtitle</label>
                  <input className={inp} value={block.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
                </div>
              </div>
              <FaqQuestionsEditor
                values={block.questions || []}
                onChange={(values) => set("questions", values)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Blocks Editor ────────────────────────────────────────────────────────────

function BlocksEditor({ blocks, onChange }) {
  const [addType, setAddType] = useState("intro");

  const addBlock = () => {
    onChange([...blocks, { ...BLOCK_DEFAULTS[addType] }]);
  };

  const updateBlock = (idx, block) => {
    const next = [...blocks];
    next[idx] = block;
    onChange(next);
  };

  const deleteBlock = (idx) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...blocks];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (idx) => {
    if (idx === blocks.length - 1) return;
    const next = [...blocks];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          No blocks yet. Add one below.
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={idx} className="relative">
          <div className="absolute -left-5 top-3 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="grid h-5 w-5 place-items-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-30"
            >
              <ChevronUp size={11} />
            </button>
            <button
              type="button"
              onClick={() => moveDown(idx)}
              disabled={idx === blocks.length - 1}
              className="grid h-5 w-5 place-items-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-30"
            >
              <ChevronDown size={11} />
            </button>
          </div>
          <BlockEditor
            block={block}
            onChange={(b) => updateBlock(idx, b)}
            onDelete={() => deleteBlock(idx)}
          />
        </div>
      ))}

      <div className="flex items-center gap-2 pt-2">
        <select
          className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300"
          value={addType}
          onChange={(e) => setAddType(e.target.value)}
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={addBlock}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700"
        >
          <Plus size={13} />
          Add block
        </button>
      </div>
    </div>
  );
}

function ServiceBlocksPanel({ service, onSaved }) {
  const toast = useToast();
  const [blocks, setBlocks] = useState(service?.blocks || []);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBlocks(service?.blocks || []);
    setDirty(false);
  }, [service?._id, service?.blocks]);

  const setBlocksDirty = (nextBlocks) => {
    setBlocks(nextBlocks);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateDigitalService(service._id, {
        blocks: normalizeBlocksForSave(blocks),
      });
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
      <div className="pl-6">
        <BlocksEditor blocks={blocks} onChange={setBlocksDirty} />
      </div>

      <aside className="2xl:sticky 2xl:top-4 2xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Live Preview</h3>
          {dirty && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">Unsaved</span>}
        </div>
        <DigitalServicePreview service={service} blocks={blocks} />
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

// ─── Form Modal ───────────────────────────────────────────────────────────────

const TABS = ["Card", "Hero", "Blocks"];

const EMPTY = {
  title: "", tag: "", slug: "", description: "", imageUrl: "", imageMediaId: null,
  heroHeading: "", heroSubheading: "", heroImageUrl: "", heroImageMediaId: null,
  heroCtaText: "Get Started", heroCtaLink: "/contact-us",
  blocks: [],
  isActive: true,
};

function ServiceFormModal({ open, onClose, initial, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY, ...initial, blocks: initial.blocks || [] } : EMPTY);
      setTab(0);
      setSlugEdited(Boolean(initial?.slug));
    }
  }, [open, initial]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleTitleChange = (v) => {
    set("title", v);
    if (!slugEdited) set("slug", slugify(v));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); setTab(0); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); setTab(0); return; }
    setSaving(true);
    try {
      await onSave({ ...form, blocks: normalizeBlocksForSave(form.blocks) });
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Digital Service" : "New Digital Service"}
      width="860px"
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-4 pt-3">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={[
              "rounded-t-lg px-4 py-2 text-sm font-semibold transition",
              tab === i
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
        {/* ── Tab 0: Card ── */}
        {tab === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={lbl}>Title *</label>
                <input
                  className={inp}
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Website & App Development"
                />
              </div>
              <div>
                <label className={lbl}>Slug (URL path)</label>
                <input
                  className={inp}
                  value={form.slug}
                  onChange={(e) => { setSlugEdited(true); set("slug", slugify(e.target.value)); }}
                  placeholder="web-dev"
                />
                {form.slug && (
                  <p className="mt-1 font-mono text-[11px] text-slate-400">/service/{form.slug}</p>
                )}
              </div>
              <div>
                <label className={lbl}>Tag</label>
                <input
                  className={inp}
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  placeholder="WEB"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Description (shown on card)</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Short description of this service"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageRow
                  label="Card Image"
                  value={form.imageUrl}
                  onPick={(url, id) => { set("imageUrl", url); set("imageMediaId", id); }}
                  onClear={() => { set("imageUrl", ""); set("imageMediaId", null); }}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Active</label>
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={["relative h-6 w-11 rounded-full transition", form.isActive ? "bg-indigo-600" : "bg-slate-200"].join(" ")}
                >
                  <span className={["absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", form.isActive ? "translate-x-5" : "translate-x-0.5"].join(" ")} />
                </button>
              </div>
            </div>
            {initial && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                Use the <span className="font-bold">B</span> button in the services list to edit this page's content blocks with live preview. Public URL:{" "}
                <span className="font-mono font-bold">/service/{form.slug}</span>.
              </div>
            )}
          </div>
        )}

        {/* ── Tab 1: Hero ── */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={lbl}>Hero Heading</label>
                <input
                  className={inp}
                  value={form.heroHeading}
                  onChange={(e) => set("heroHeading", e.target.value)}
                  placeholder="Grow Your Business Online"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Hero Subheading</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  value={form.heroSubheading}
                  onChange={(e) => set("heroSubheading", e.target.value)}
                  placeholder="We build fast, modern websites…"
                />
              </div>
              <div>
                <label className={lbl}>CTA Text</label>
                <input
                  className={inp}
                  value={form.heroCtaText}
                  onChange={(e) => set("heroCtaText", e.target.value)}
                  placeholder="Get Started"
                />
              </div>
              <div>
                <label className={lbl}>CTA Link</label>
                <input
                  className={inp}
                  value={form.heroCtaLink}
                  onChange={(e) => set("heroCtaLink", e.target.value)}
                  placeholder="/contact-us"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageRow
                  label="Hero Banner Image"
                  value={form.heroImageUrl}
                  onPick={(url, id) => { set("heroImageUrl", url); set("heroImageMediaId", id); }}
                  onClear={() => { set("heroImageUrl", ""); set("heroImageMediaId", null); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Blocks ── */}
        {tab === 2 && (
          <div className="pl-6">
            <BlocksEditor
              blocks={form.blocks}
              onChange={(b) => set("blocks", b)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
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
          {initial ? "Save changes" : "Create service"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DigitalServicesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
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
      const res = await listDigitalServices({ includeInactive: true });
      setItems(res.items || []);
    } catch {
      toast.error("Failed to load digital services.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    const res = await createDigitalService({ ...form, order: items.length });
    setItems((p) => [...p, res.item]);
    toast.success("Service created.");
  };

  const handleUpdate = async (form) => {
    const res = await updateDigitalService(editing._id, form);
    setItems((p) => p.map((x) => (x._id === editing._id ? res.item : x)));
    toast.success("Service updated.");
  };

  const handleDelete = async () => {
    await deleteDigitalService(confirmId);
    setItems((p) => p.filter((x) => x._id !== confirmId));
    if (blocksFor?._id === confirmId) setBlocksFor(null);
    setConfirmId(null);
    toast.success("Deleted.");
  };

  const toggleActive = async (item) => {
    const res = await updateDigitalService(item._id, { isActive: !item.isActive });
    setItems((p) => p.map((x) => (x._id === item._id ? res.item : x)));
    if (blocksFor?._id === item._id) setBlocksFor(res.item);
  };

  const onDragStart = (idx) => { dragIdx.current = idx; };
  const onDragOver = (e, idx) => {
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
    setReordering(true);
    try {
      await reorderDigitalServices(items.map((x) => x._id));
      toast.success("Order saved.");
    } catch {
      toast.error("Failed to save order.");
    } finally {
      setReordering(false);
    }
  };

  const activeItem = blocksFor ? items.find((x) => x._id === blocksFor._id) || blocksFor : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Digital Services</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage service cards and detail page content. Drag to reorder.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={15} />
          Add service
        </button>
      </div>

      <div className={["grid gap-6", activeItem ? "xl:grid-cols-[minmax(360px,0.85fr)_minmax(680px,1.15fr)]" : ""].join(" ")}>
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-slate-400">No services yet. Add the first one.</p>
            </div>
          ) : (
            <>
              {reordering && (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                  <Loader2 size={13} className="animate-spin" /> Saving order…
                </div>
              )}
              {items.map((item, idx) => {
                const isBlocksOpen = blocksFor?._id === item._id;

                return (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className={[
                      "flex items-center gap-4 rounded-xl border bg-white p-3 shadow-sm transition",
                      isBlocksOpen ? "border-indigo-300 shadow-md" : "border-slate-200 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <GripVertical size={16} className="shrink-0 cursor-grab text-slate-300" />

                    {item.imageUrl ? (
                      <img
                        src={getAssetUrl(item.imageUrl)}
                        alt={item.title}
                        className="h-12 w-16 shrink-0 rounded-lg border border-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                        <UploadCloud size={16} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.title}</span>
                        {item.tag && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            {item.tag}
                          </span>
                        )}
                        {item.slug && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                            /service/{item.slug}
                          </span>
                        )}
                        <span className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                          item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400",
                        ].join(" ")}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{item.description}</p>
                      )}
                      {(item.blocks || []).length > 0 && (
                        <p className="mt-0.5 text-[11px] text-slate-400">{item.blocks.length} page block{item.blocks.length !== 1 ? "s" : ""}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
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
                        onClick={() => toggleActive(item)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditing(item); setFormOpen(true); }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(item._id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

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
            <ServiceBlocksPanel
              service={activeItem}
              onSaved={(updated) => {
                setItems((p) => p.map((x) => (x._id === updated._id ? updated : x)));
                setBlocksFor(updated);
              }}
            />
          </div>
        )}
      </div>

      <ServiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSave={editing ? handleUpdate : handleCreate}
      />

      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete service?"
        message="This will permanently remove this service. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
