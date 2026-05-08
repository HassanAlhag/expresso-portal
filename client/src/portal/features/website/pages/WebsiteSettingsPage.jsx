import React, { useCallback, useEffect, useState } from "react";
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Check,
  Loader2,
  Globe,
  Palette,
  Info,
  Briefcase,
  Layers,
  UserRound,
  Phone,
  GalleryVerticalEnd,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { getSiteSettings, updateSiteSettings } from "../api";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

// ─── Section config ───────────────────────────────────────────────────────────

const TABS = [
  {
    key: "branding",
    label: "Branding",
    Icon: Palette,
    hint: "Logo, favicon, OG image",
    type: "images",
    fields: [
      { key: "logoUrl",       mediaKey: "logoMediaId",       label: "Logo (Dark)",              hint: "Used on light backgrounds" },
      { key: "logoWhiteUrl",  mediaKey: "logoWhiteMediaId",  label: "Logo (White / Nav)",       hint: "Used in the header on dark/hero backgrounds" },
      { key: "faviconUrl",    mediaKey: "faviconMediaId",    label: "Favicon",                  hint: "Browser tab icon — 32×32 or 64×64 PNG" },
      { key: "ogImageUrl",    mediaKey: "ogImageMediaId",    label: "Default Social Share Image", hint: "Shown when pages are shared on social — 1200×630" },
    ],
  },
  {
    key: "home",
    label: "Home",
    Icon: Globe,
    hint: "Hero background & video",
    type: "images",
    fields: [
      { key: "heroBannerUrl", mediaKey: "heroBannerMediaId", label: "Hero Banner Image",        hint: "Fallback background behind the hero slides" },
    ],
    textFields: [
      { key: "heroVideoUrl", label: "Hero Video URL", placeholder: "https://…/video.mp4",      hint: "Optional looping background video" },
    ],
  },
  {
    key: "about",
    label: "About",
    Icon: Info,
    hint: "About page images",
    type: "images",
    fields: [
      { key: "heroImageUrl",    mediaKey: "heroImageMediaId",    label: "Page Hero Image",      hint: "Full-width banner at the top of the About page" },
      { key: "teamPhotoUrl",    mediaKey: "teamPhotoMediaId",    label: "Team Group Photo",     hint: "Photo of the team" },
      { key: "missionImageUrl", mediaKey: "missionImageMediaId", label: "Mission / Values",    hint: "Image alongside the mission statement" },
    ],
  },
  {
    key: "services",
    label: "Services",
    Icon: Briefcase,
    hint: "Services page images",
    type: "images",
    fields: [
      { key: "heroImageUrl",  mediaKey: "heroImageMediaId",  label: "Page Hero Image",          hint: "Banner at the top of the Services page" },
      { key: "sectionBgUrl",  mediaKey: "sectionBgMediaId",  label: "Section Background",      hint: "Background texture used in service cards" },
    ],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    Icon: Layers,
    hint: "Portfolio page images",
    type: "images",
    fields: [
      { key: "heroImageUrl",  mediaKey: "heroImageMediaId",  label: "Page Hero Image",          hint: "Banner at the top of the Portfolio page" },
    ],
  },
  {
    key: "careers",
    label: "Careers",
    Icon: UserRound,
    hint: "Careers page images",
    type: "images",
    fields: [
      { key: "heroImageUrl",   mediaKey: "heroImageMediaId",   label: "Page Hero Image",       hint: "Banner at the top of the Careers page" },
      { key: "officeImageUrl", mediaKey: "officeImageMediaId", label: "Office / Culture Photo", hint: "Culture section photo" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    Icon: Phone,
    hint: "Contact page images",
    type: "images",
    fields: [
      { key: "heroImageUrl",   mediaKey: "heroImageMediaId",   label: "Page Hero Image",       hint: "Banner at the top of the Contact page" },
      { key: "officeImageUrl", mediaKey: "officeImageMediaId", label: "Office Photo",          hint: "Location photo in the contact section" },
    ],
  },
  {
    key: "gallery",
    label: "Gallery",
    Icon: GalleryVerticalEnd,
    hint: "Draggable homepage gallery",
    type: "gallery",
  },
  {
    key: "marquee",
    label: "Brands Strip",
    Icon: Sparkles,
    hint: "Scrolling brands marquee",
    type: "marquee",
  },
];

// ─── Shared image picker field ────────────────────────────────────────────────

function ImagePickerField({ label, hint, value, onPick, onClear, saving, aspect = "16/7" }) {
  return (
    <div className="grid gap-2">
      <div>
        <span className="text-[11px] font-extrabold tracking-[0.18em] text-slate-600">{label}</span>
        {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div
          className="relative grid place-items-center overflow-hidden bg-slate-50"
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <>
              <img src={getAssetUrl(value)} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 size={20} className="animate-spin text-slate-500" />
                </div>
              )}
            </>
          ) : (
            <div className="grid place-items-center gap-2 text-slate-400">
              <ImageIcon size={22} />
              <span className="text-xs font-semibold">No image set</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
          <div className="min-w-0 flex-1 truncate text-[11px] text-slate-400">{value || "Not set"}</div>
          <div className="flex shrink-0 items-center gap-1.5">
            {value && (
              <button type="button" onClick={onClear} disabled={saving}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50">
                <X size={11} /> Clear
              </button>
            )}
            <button type="button" onClick={onPick} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50">
              <UploadCloud size={13} />
              {value ? "Change" : "Pick"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Standard images section ──────────────────────────────────────────────────

function ImagesSection({ tab, sectionData, onSave }) {
  const toast = useToast();
  const [local, setLocal] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => { setLocal(sectionData || {}); setDirty(false); }, [sectionData]);

  const set = (key, value) => { setLocal((p) => ({ ...p, [key]: value })); setDirty(true); };

  const handleSelect = (media) => {
    if (!media || !picker) return;
    const url = media.url || media.mediumUrl || media.thumbnailUrl || "";
    set(picker.key, url);
    if (picker.mediaKey) set(picker.mediaKey, media._id || null);
    setPicker(null);
  };

  const save = async () => {
    setSaving(true);
    try { await onSave(tab.key, local); setDirty(false); toast.success("Saved."); }
    catch (e) { toast.error(e?.response?.data?.message || e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {(tab.fields || []).map((f) => (
          <ImagePickerField key={f.key} label={f.label} hint={f.hint}
            value={local[f.key] || ""} saving={saving}
            onPick={() => setPicker(f)}
            onClear={() => { set(f.key, ""); if (f.mediaKey) set(f.mediaKey, null); }}
          />
        ))}

        {(tab.textFields || []).map((f) => (
          <div key={f.key} className="grid gap-2 sm:col-span-2">
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.18em] text-slate-600">{f.label}</span>
              {f.hint && <p className="mt-0.5 text-[11px] text-slate-400">{f.hint}</p>}
            </div>
            <input type="text" value={local[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
          </div>
        ))}
      </div>

      {dirty && (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save changes
          </button>
        </div>
      )}

      <MediaPickerModal open={Boolean(picker)} onClose={() => setPicker(null)} onSelect={handleSelect}
        title={picker?.label || "Select image"} subtitle="Choose from the media library or upload a new one."
        onlyType="image" multiple={false} allowUpload />
    </>
  );
}

// ─── Gallery section (up to 8 images) ────────────────────────────────────────

const GALLERY_SIZE = 8;

function GallerySection({ sectionData, onSave }) {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerIdx, setPickerIdx] = useState(null);

  useEffect(() => {
    const src = Array.isArray(sectionData?.images) ? sectionData.images : [];
    const padded = Array.from({ length: GALLERY_SIZE }, (_, i) => src[i] || { url: "", mediaId: null, alt: "" });
    setImages(padded);
    setDirty(false);
  }, [sectionData]);

  const setSlot = (idx, patch) => {
    setImages((prev) => prev.map((img, i) => i === idx ? { ...img, ...patch } : img));
    setDirty(true);
  };

  const handleSelect = (media) => {
    if (media && pickerIdx !== null) {
      setSlot(pickerIdx, { url: media.url || media.mediumUrl || "", mediaId: media._id || null });
    }
    setPickerIdx(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave("gallery", { images: images.filter((i) => i.url) });
      setDirty(false);
      toast.success("Gallery saved.");
    } catch (e) { toast.error(e?.response?.data?.message || e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        These images power the draggable gallery section on the homepage. Upload up to {GALLERY_SIZE} images.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {images.map((img, idx) => (
          <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative aspect-square overflow-hidden bg-slate-50">
              {img.url ? (
                <img src={getAssetUrl(img.url)} alt={img.alt || `Gallery ${idx + 1}`}
                  loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-300">
                  <ImageIcon size={24} />
                  <span className="text-[11px] font-semibold text-slate-400">Slot {idx + 1}</span>
                </div>
              )}
            </div>
            <div className="p-2.5">
              <input type="text" value={img.alt || ""} placeholder="Alt text…"
                onChange={(e) => setSlot(idx, { alt: e.target.value })}
                className="mb-2 h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 outline-none focus:border-indigo-200 focus:ring-1 focus:ring-indigo-100" />
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setPickerIdx(idx)} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50">
                  <UploadCloud size={12} /> {img.url ? "Change" : "Pick"}
                </button>
                {img.url && (
                  <button type="button" onClick={() => setSlot(idx, { url: "", mediaId: null })} disabled={saving}
                    className="flex items-center justify-center rounded-lg border border-slate-200 px-2.5 text-slate-400 transition hover:text-rose-500 disabled:opacity-50">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save gallery
          </button>
        </div>
      )}

      <MediaPickerModal open={pickerIdx !== null} onClose={() => setPickerIdx(null)} onSelect={handleSelect}
        title={`Gallery slot ${(pickerIdx ?? 0) + 1}`} subtitle="Pick an image from the media library or upload a new one."
        onlyType="image" multiple={false} allowUpload />
    </>
  );
}

// ─── Marquee brands section (up to 10) ───────────────────────────────────────

const MARQUEE_SIZE = 10;
const EMPTY_BRAND = () => ({ label: "", imageUrl: "", mediaId: null });

function MarqueeSection({ sectionData, onSave }) {
  const toast = useToast();
  const [brands, setBrands] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerIdx, setPickerIdx] = useState(null);

  useEffect(() => {
    const src = Array.isArray(sectionData?.brands) ? sectionData.brands : [];
    setBrands(src.length > 0 ? src : [EMPTY_BRAND(), EMPTY_BRAND()]);
    setDirty(false);
  }, [sectionData]);

  const setBrand = (idx, patch) => {
    setBrands((prev) => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
    setDirty(true);
  };

  const addBrand = () => {
    if (brands.length >= MARQUEE_SIZE) return;
    setBrands((prev) => [...prev, EMPTY_BRAND()]);
    setDirty(true);
  };

  const removeBrand = (idx) => {
    setBrands((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSelect = (media) => {
    if (media && pickerIdx !== null) {
      setBrand(pickerIdx, { imageUrl: media.url || media.mediumUrl || "", mediaId: media._id || null });
    }
    setPickerIdx(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave("marquee", { brands: brands.filter((b) => b.imageUrl || b.label) });
      setDirty(false);
      toast.success("Brands strip saved.");
    } catch (e) { toast.error(e?.response?.data?.message || e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        These cards scroll in the "Brands we helped stand out" marquee strip on the homepage. Up to {MARQUEE_SIZE} brands.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {brands.map((brand, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <button type="button" onClick={() => setPickerIdx(idx)} disabled={saving}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-indigo-300">
              {brand.imageUrl ? (
                <img src={getAssetUrl(brand.imageUrl)} alt={brand.label || `Brand ${idx + 1}`}
                  className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition hover:bg-black/20">
                <UploadCloud size={14} className="text-white opacity-0 transition group-hover:opacity-100" />
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <input type="text" value={brand.label || ""} placeholder="Brand name…"
                onChange={(e) => setBrand(idx, { label: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:ring-1 focus:ring-indigo-100" />
              <button type="button" onClick={() => setPickerIdx(idx)}
                className="mt-1.5 text-[11px] font-semibold text-indigo-600 hover:underline">
                {brand.imageUrl ? "Change image" : "Pick image"}
              </button>
            </div>

            <button type="button" onClick={() => removeBrand(idx)} disabled={saving}
              className="shrink-0 text-slate-300 transition hover:text-rose-500 disabled:opacity-50">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {brands.length < MARQUEE_SIZE && (
        <button type="button" onClick={addBrand}
          className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600">
          <Plus size={15} /> Add brand
        </button>
      )}

      {dirty && (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save brands strip
          </button>
        </div>
      )}

      <MediaPickerModal open={pickerIdx !== null} onClose={() => setPickerIdx(null)} onSelect={handleSelect}
        title={`Brand image — ${brands[pickerIdx]?.label || `slot ${(pickerIdx ?? 0) + 1}`}`}
        subtitle="Pick the brand card image from the media library or upload a new one."
        onlyType="image" multiple={false} allowUpload />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebsiteSettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getSiteSettings(); setSettings(res.settings || {}); }
    catch { toast.error("Failed to load site settings."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (section, data) => {
    try { const res = await updateSiteSettings(section, data); setSettings(res.settings || {}); }
    catch { /* errors handled by individual section components */ }
  };

  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div className="flex h-full min-h-screen gap-0">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
        <div className="sticky top-0 p-3 pt-6">
          <p className="mb-3 px-2 text-[10px] font-black tracking-[0.22em] text-slate-400">SECTIONS</p>
          <nav className="grid gap-0.5">
            {TABS.map(({ key, label, Icon, hint }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={[
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition",
                  activeTab === key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}>
                <Icon size={14} className="shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-black">{label}</div>
                  <div className={`truncate text-[10px] leading-tight ${activeTab === key ? "text-indigo-200" : "text-slate-400"}`}>{hint}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 bg-slate-50 p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50">
            <currentTab.Icon size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">{currentTab.label}</h1>
            <p className="text-xs text-slate-500">{currentTab.hint}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : currentTab.type === "gallery" ? (
            <GallerySection
              key={currentTab.key}
              sectionData={(settings || {})[currentTab.key] || {}}
              onSave={handleSave}
            />
          ) : currentTab.type === "marquee" ? (
            <MarqueeSection
              key={currentTab.key}
              sectionData={(settings || {})[currentTab.key] || {}}
              onSave={handleSave}
            />
          ) : (
            <ImagesSection
              key={currentTab.key}
              tab={currentTab}
              sectionData={(settings || {})[currentTab.key] || {}}
              onSave={handleSave}
            />
          )}
        </div>
      </main>
    </div>
  );
}
