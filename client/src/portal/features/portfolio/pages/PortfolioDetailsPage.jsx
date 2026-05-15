import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { getPortfolio, updatePortfolio, deletePortfolio } from "../api";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Globe,
  Eye,
  EyeOff,
  Archive,
  Save,
  Layers,
  Tag,
  Image as ImageIcon,
  Images,
  UploadCloud,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATUS_META = {
  published: {
    label: "Published",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    Icon: Eye,
  },
  draft: {
    label: "Draft",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    Icon: EyeOff,
  },
  archived: {
    label: "Archived",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    Icon: Archive,
  },
};

const IMAGE_FIELDS = {
  bannerImage: {
    label: "Banner image",
    hint: "Hero visual for the case-study page. Defaults can stay as /file.jpg until replaced.",
  },
  thumbnailImg: {
    label: "Listing thumbnail",
    hint: "Card image used across portfolio listings.",
  },
  solutionImage: {
    label: "Solution visual",
    hint: "Supporting visual used in the overview and approach sections.",
  },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const { Icon } = meta;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        meta.bg,
        meta.border,
        meta.text,
      ].join(" ")}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

function SectionTitle({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder = "" }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function ImagePickerField({ label, hint, value, onChange, onPick, onClear }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-[150px,1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          {value ? (
            <img
              src={getAssetUrl(value)}
              alt=""
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-slate-300">
              <ImageIcon size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">{label}</p>
              {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
            </div>
            {value ? (
              <button
                type="button"
                onClick={onClear}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Clear ${label}`}
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={value}
              onChange={onChange}
              placeholder="/current-default.jpg or media URL"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
            <Button variant="outline" size="md" onClick={onPick}>
              <UploadCloud size={15} /> Pick
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryManager({ value, onPick, onRemove }) {
  const urls = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-black text-slate-900">Project gallery</p>
          <p className="mt-1 text-xs text-slate-500">
            Keep the current URLs as defaults. Use media picker when you are ready to replace or add images.
          </p>
        </div>
        <Button variant="outline" onClick={onPick}>
          <Images size={15} /> Add images
        </Button>
      </div>

      {urls.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {urls.map((url) => (
            <div key={url} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-[4/3] bg-slate-100">
                <img
                  src={getAssetUrl(url)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:text-rose-600 group-hover:opacity-100"
                  aria-label="Remove gallery image"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="truncate px-3 py-2 font-mono text-[11px] text-slate-400">
                {url}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Images size={24} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-600">No gallery images yet</p>
          <p className="mt-1 text-xs text-slate-400">Pick images from the media library to build the gallery.</p>
        </div>
      )}
    </div>
  );
}

export default function PortfolioDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    description: "",
    category: "",
    status: "draft",
    tags: "",
    seoTitle: "",
    seoDesc: "",
    /* case-study fields */
    clientName: "",
    bannerTitle: "",
    bannerDesc: "",
    bannerImage: "",
    thumbnailImg: "",
    startDate: "",
    endDate: "",
    introDescription: "",
    problems: "",
    solutions: "",
    solutionImage: "",
    result: "",
    imageUrls: "",
    coverMediaId: "",
    galleryMediaIds: [],
    sortOrder: "",
  });
  const [picker, setPicker] = useState(null);
  const [dirty, setDirty] = useState(false);
  const MediaPicker = MediaPickerModal;
  const VisualStatusIcon = CheckCircle2;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPortfolio(id);
      const found = res?.item;
      if (!found) {
        setError("Portfolio item not found.");
        return;
      }
      setItem(found);
      setForm({
        title: found.title || "",
        slug: found.slug || "",
        excerpt: found.excerpt || "",
        description: found.description || "",
        category: found.category || "",
        status: found.status || "draft",
        tags: Array.isArray(found.tags) ? found.tags.join(", ") : "",
        seoTitle: found.seo?.metaTitle || "",
        seoDesc: found.seo?.metaDesc || "",
        clientName: found.clientName || "",
        bannerTitle: found.bannerTitle || "",
        bannerDesc: found.bannerDesc || "",
        bannerImage: found.bannerImage || "",
        thumbnailImg: found.thumbnailImg || "",
        startDate: found.startDate || "",
        endDate: found.endDate || "",
        introDescription: found.introDescription || "",
        problems: found.problems || "",
        solutions: Array.isArray(found.solutions) ? found.solutions.join("\n") : "",
        solutionImage: found.solutionImage || "",
        result: found.result || "",
        imageUrls: Array.isArray(found.imageUrls)
          ? found.imageUrls.map((u) => (typeof u === "string" ? u : u?.src || "")).join("\n")
          : "",
        coverMediaId: found.coverMedia?._id || found.coverMedia || "",
        galleryMediaIds: Array.isArray(found.gallery)
          ? found.gallery.map((m) => m?._id || m).filter(Boolean)
          : [],
        sortOrder: found.sortOrder != null ? String(found.sortOrder) : "0",
      });
      setDirty(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load item.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    setDirty(true);
  };

  const setValue = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const mediaUrl = (media) =>
    media?.url || media?.mediumUrl || media?.thumbnailUrl || media?.path || "";

  const handleMediaSelect = (selection) => {
    if (!picker) return;

    if (picker.kind === "gallery") {
      const selected = Array.isArray(selection) ? selection : selection ? [selection] : [];
      if (!selected.length) return;

      setForm((f) => {
        const currentUrls = f.imageUrls
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const nextUrls = selected.map(mediaUrl).filter(Boolean);
        const currentIds = Array.isArray(f.galleryMediaIds) ? f.galleryMediaIds : [];
        const nextIds = selected.map((m) => m?._id).filter(Boolean);

        return {
          ...f,
          imageUrls: [...new Set([...currentUrls, ...nextUrls])].join("\n"),
          galleryMediaIds: [...new Set([...currentIds, ...nextIds])],
        };
      });
      setDirty(true);
      return;
    }

    const media = Array.isArray(selection) ? selection[0] : selection;
    if (!media) return;

    const url = mediaUrl(media);
    if (!url) return;

    setForm((f) => ({
      ...f,
      [picker.field]: url,
      ...(picker.field === "thumbnailImg" || picker.field === "bannerImage"
        ? { coverMediaId: media._id || f.coverMediaId }
        : {}),
    }));
    setDirty(true);
  };

  const removeGalleryUrl = (url) => {
    setForm((f) => ({
      ...f,
      imageUrls: f.imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((x) => x !== url)
        .join("\n"),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug),
        excerpt: form.excerpt.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        status: form.status,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        seo: { metaTitle: form.seoTitle.trim(), metaDesc: form.seoDesc.trim() },
        clientName: form.clientName.trim(),
        bannerTitle: form.bannerTitle.trim(),
        bannerDesc: form.bannerDesc.trim(),
        bannerImage: form.bannerImage.trim(),
        thumbnailImg: form.thumbnailImg.trim(),
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        introDescription: form.introDescription.trim(),
        problems: form.problems.trim(),
        solutions: form.solutions.split("\n").map((s) => s.trim()).filter(Boolean),
        solutionImage: form.solutionImage.trim(),
        result: form.result.trim(),
        coverMedia: form.coverMediaId || null,
        gallery: Array.isArray(form.galleryMediaIds) ? form.galleryMediaIds : [],
        imageUrls: form.imageUrls
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((src) => ({ src, alt: "" })),
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      const res = await updatePortfolio(id, payload);
      setItem(res?.item);
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const res = await updatePortfolio(id, { status: "published" });
      setItem(res?.item);
      setForm((f) => ({ ...f, status: "published" }));
      toast.success("Published.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to publish.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete portfolio item",
      message: `Delete "${item?.title}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deletePortfolio(id);
          nav("/portal/portfolio");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed.");
          setBusy(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  const mediaPickerProps = {
    onSelect: handleMediaSelect,
  };

  return (
    <div className="grid gap-6">
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
      <PageHeader
        eyebrow="CONTENT"
        title={item?.title || "Portfolio item"}
        subtitle={
          <div className="flex items-center gap-2">
            <StatusPill status={item?.status} />
            <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
              <Globe size={11} />/{item?.slug}
            </span>
          </div>
        }
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Portfolio", to: "/portal/portfolio" },
          { label: item?.title || "Item" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => nav("/portal/portfolio")}
              disabled={busy}
            >
              <ArrowLeft size={15} />
            </Button>
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
            </Button>
            {item?.status !== "published" && (
              <Button variant="outline" onClick={handlePublish} disabled={busy}>
                <Eye size={15} /> Publish
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={15} />
            </Button>
            {dirty && (
              <Button onClick={handleSave} loading={busy}>
                <Save size={15} /> Save
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        {/* Main editor */}
        <div className="grid min-w-0 gap-6">
          <Card className="overflow-hidden">
            <CardHeader
              title={<SectionTitle icon={FileText} title="Content identity" subtitle="Naming, URL, and the short text used in portfolio lists." />}
            />
            <CardBody className="bg-slate-50/40">
              <div className="grid gap-4">
                <Input
                  label="TITLE"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="Portfolio title"
                />
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
                    SLUG
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
                    <span className="text-sm text-slate-400">/</span>
                    <input
                      value={form.slug}
                      onChange={set("slug")}
                      className="h-11 flex-1 bg-transparent font-mono text-sm text-slate-900 outline-none"
                      placeholder="my-case-study"
                    />
                  </div>
                </div>
                <TextareaField
                  label="EXCERPT"
                  value={form.excerpt}
                  onChange={set("excerpt")}
                  rows={2}
                  placeholder="Short summary shown on listing pages..."
                />
                <TextareaField
                  label="DESCRIPTION"
                  value={form.description}
                  onChange={set("description")}
                  rows={5}
                  placeholder="Optional internal/public description for this portfolio record..."
                />
              </div>
            </CardBody>
          </Card>

          {/* ── Case Study: Banner ─────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader
              title={<SectionTitle icon={ImageIcon} title="Case study hero" subtitle="The public detail page headline, client line, dates, and hero images." />}
            />
            <CardBody className="bg-slate-50/40">
              <div className="grid gap-4">
                <Input label="CLIENT NAME" value={form.clientName} onChange={set("clientName")} placeholder="Acme Corp" />
                <Input label="BANNER TITLE" value={form.bannerTitle} onChange={set("bannerTitle")} placeholder="Design That Speaks the Brand's Language" />
                <TextareaField label="BANNER DESCRIPTION" value={form.bannerDesc} onChange={set("bannerDesc")} rows={2} />
                <ImagePickerField
                  {...IMAGE_FIELDS.bannerImage}
                  value={form.bannerImage}
                  onChange={set("bannerImage")}
                  onPick={() => setPicker({ kind: "single", field: "bannerImage", title: "Select banner image" })}
                  onClear={() => setValue("bannerImage", "")}
                />
                <ImagePickerField
                  {...IMAGE_FIELDS.thumbnailImg}
                  value={form.thumbnailImg}
                  onChange={set("thumbnailImg")}
                  onPick={() => setPicker({ kind: "single", field: "thumbnailImg", title: "Select listing thumbnail" })}
                  onClear={() => setValue("thumbnailImg", "")}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="START DATE" value={form.startDate} onChange={set("startDate")} placeholder="10 March 2023" />
                  <Input label="END DATE" value={form.endDate} onChange={set("endDate")} placeholder="30 March 2023" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── Case Study: Story ───────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader
              title={<SectionTitle icon={Layers} title="Case study story" subtitle="Overview, challenge, approach bullets, and final outcome." />}
            />
            <CardBody className="bg-slate-50/40">
              <div className="grid gap-4">
                <TextareaField label="PROJECT OVERVIEW" value={form.introDescription} onChange={set("introDescription")} rows={4} />
                <TextareaField label="THE CHALLENGE" value={form.problems} onChange={set("problems")} rows={4} />
                <TextareaField
                  label="SOLUTIONS (one per line)"
                  value={form.solutions}
                  onChange={set("solutions")}
                  rows={6}
                  placeholder={"Built with React for performance.\nMobile-first responsive layout."}
                />
                <ImagePickerField
                  {...IMAGE_FIELDS.solutionImage}
                  value={form.solutionImage}
                  onChange={set("solutionImage")}
                  onPick={() => setPicker({ kind: "single", field: "solutionImage", title: "Select solution visual" })}
                  onClear={() => setValue("solutionImage", "")}
                />
                <TextareaField label="THE OUTCOME" value={form.result} onChange={set("result")} rows={4} />
              </div>
            </CardBody>
          </Card>

          {/* ── Case Study: Gallery ─────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader
              title={<SectionTitle icon={Images} title="Project gallery" subtitle="Gallery images used below the case-study content." />}
            />
            <CardBody className="bg-slate-50/40">
              <GalleryManager
                value={form.imageUrls}
                onPick={() => setPicker({ kind: "gallery", title: "Select gallery images" })}
                onRemove={removeGalleryUrl}
              />
              <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Advanced URL list
                </summary>
                <textarea
                  value={form.imageUrls}
                  onChange={set("imageUrls")}
                  rows={8}
                  placeholder={"/image1.jpg\n/image2.jpg\n/image3.png"}
                  className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:ring-4 focus:ring-black/5"
                />
              </details>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title={<SectionTitle icon={Globe} title="SEO" subtitle="Controls how this item appears in search results." />}
            />
            <CardBody className="bg-slate-50/40">
              <div className="grid gap-4">
                <Input
                  label="META TITLE"
                  value={form.seoTitle}
                  onChange={set("seoTitle")}
                  placeholder="Override the default page title..."
                />
                <TextareaField
                  label="META DESCRIPTION"
                  value={form.seoDesc}
                  onChange={set("seoDesc")}
                  rows={3}
                  placeholder="Brief description for search results (under 160 chars)..."
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start lg:sticky lg:top-6">
          <Card className="overflow-hidden border-indigo-100">
            <CardHeader title="Publishing" subtitle="Control visibility and organization." />
            <CardBody>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
                    STATUS
                  </label>
                  <select
                    value={form.status}
                    onChange={set("status")}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <Input
                  label="CATEGORY"
                  value={form.category}
                  onChange={set("category")}
                  placeholder="Branding, Social, Video..."
                />
                <div className="grid gap-2">
                  <label className="flex items-center gap-1 text-[11px] font-black tracking-[0.18em] text-slate-500">
                    <Tag size={11} /> TAGS (comma separated)
                  </label>
                  <input
                    value={form.tags}
                    onChange={set("tags")}
                    placeholder="branding, video, social media"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
                  />
                </div>
                <Input
                  label="SORT ORDER"
                  value={form.sortOrder}
                  onChange={set("sortOrder")}
                  placeholder="1"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Visual status"
              subtitle="Current images remain default until you replace them."
            />
            <CardBody>
              <div className="grid gap-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {form.thumbnailImg || form.bannerImage || item?.coverMedia?.url ? (
                    <img
                      src={getAssetUrl(
                        form.thumbnailImg ||
                          form.bannerImage ||
                          item.coverMedia.thumbnailUrl ||
                          item.coverMedia.url
                      )}
                      alt={item.title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center text-slate-300">
                      <Layers size={28} />
                    </div>
                  )}
                </div>

                <div className="grid gap-2 text-xs">
                  {[
                    ["Banner image", form.bannerImage],
                    ["Thumbnail", form.thumbnailImg],
                    ["Solution visual", form.solutionImage],
                    ["Gallery images", form.imageUrls.split("\n").filter(Boolean).length],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-500">{label}</span>
                      <span className="inline-flex items-center gap-1 font-black text-slate-800">
                        <VisualStatusIcon size={13} className={value ? "text-emerald-500" : "text-slate-300"} />
                        {typeof value === "number" ? value : value ? "Set" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {dirty && (
            <Button onClick={handleSave} loading={busy} className="w-full shadow-lg shadow-indigo-600/20">
              <Save size={15} /> Save changes
            </Button>
          )}
        </div>
      </div>

      <MediaPicker
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        onSelect={mediaPickerProps.onSelect}
        title={picker?.title || "Select media"}
        subtitle={
          picker?.kind === "gallery"
            ? "Choose one or more images for the project gallery."
            : "Choose an image from the media library or upload a new one."
        }
        onlyType="image"
        multiple={picker?.kind === "gallery"}
        allowUpload
      />
    </div>
  );
}
