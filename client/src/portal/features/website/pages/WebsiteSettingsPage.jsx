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
  Save,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { getSiteSettings, updateSiteSettings } from "../api";
import { getAssetUrl } from "../../../shared/utils/assetUrl";
import { IT_SOLUTION_IMAGE_FIELDS } from "../../../../data/technologySolutionsData";
import {
  OTHER_WEBSITE_IMAGE_REGISTRY,
  WEBSITE_PAGE_IMAGE_REGISTRY,
  WEBSITE_IMAGE_REGISTRY,
} from "../../../../data/websiteImageRegistry";
import { toWebsiteImageUrl } from "../../../../utils/websiteImages";

// ─── Section config ───────────────────────────────────────────────────────────

const TABS = [
  {
    key: "branding",
    label: "Branding",
    Icon: Palette,
    hint: "Logo, favicon, OG image",
    type: "images",
    fields: [
      {
        key: "logoUrl",
        mediaKey: "logoMediaId",
        label: "Logo (Dark)",
        hint: "Used on light backgrounds",
      },
      {
        key: "logoWhiteUrl",
        mediaKey: "logoWhiteMediaId",
        label: "Logo (White / Nav)",
        hint: "Used in the header on dark/hero backgrounds",
      },
      {
        key: "faviconUrl",
        mediaKey: "faviconMediaId",
        label: "Favicon",
        hint: "Browser tab icon — 32×32 or 64×64 PNG",
      },
      {
        key: "ogImageUrl",
        mediaKey: "ogImageMediaId",
        label: "Default Social Share Image",
        hint: "Shown when pages are shared on social — 1200×630",
      },
    ],
  },
  {
    key: "home",
    label: "Home",
    Icon: Globe,
    hint: "Hero background & video",
    type: "images",
    fields: [
      {
        key: "heroBannerUrl",
        mediaKey: "heroBannerMediaId",
        label: "Hero Banner Image",
        hint: "Fallback background behind the hero slides",
      },
    ],
    textFields: [
      {
        key: "heroVideoUrl",
        label: "Hero Video URL",
        placeholder: "https://…/video.mp4",
        hint: "Optional looping background video",
      },
    ],
  },
  {
    key: "homepageSections",
    label: "Homepage Sections",
    Icon: Layers,
    hint: "Parallax section images on the homepage",
    type: "images",
    fields: [
      {
        key: "aboutImageUrl",
        mediaKey: "aboutImageMediaId",
        label: "Parallax — Main Background",
        hint: "Full-width scrolling background image in the homepage parallax section",
      },
      {
        key: "servicesImageUrl",
        mediaKey: "servicesImageMediaId",
        label: "Parallax — Card Thumbnail",
        hint: "Small card image displayed inside the parallax section",
      },
    ],
  },
  {
    key: "about",
    label: "About",
    Icon: Info,
    hint: "About page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Page Hero Image",
        hint: "Full-width banner at the top of the About page",
      },
      {
        key: "teamPhotoUrl",
        mediaKey: "teamPhotoMediaId",
        label: "Team Group Photo",
        hint: "Photo of the team",
      },
      {
        key: "missionImageUrl",
        mediaKey: "missionImageMediaId",
        label: "Mission Section Background",
        hint: "Background image behind the web and marketing section",
      },
      {
        key: "missionDeviceImageUrl",
        mediaKey: "missionDeviceImageMediaId",
        label: "Mission Section Device",
        hint: "Floating device/mockup image in the mission section",
      },
      {
        key: "blueprintCustomerImageUrl",
        mediaKey: "blueprintCustomerImageMediaId",
        label: "Blueprint Card 1",
        hint: "Customer-centered strategy card image",
      },
      {
        key: "blueprintInnovationImageUrl",
        mediaKey: "blueprintInnovationImageMediaId",
        label: "Blueprint Card 2",
        hint: "Innovation strategy card image",
      },
      {
        key: "blueprintQualityImageUrl",
        mediaKey: "blueprintQualityImageMediaId",
        label: "Blueprint Card 3",
        hint: "Quality and results card image",
      },
      {
        key: "teamMohamedImageUrl",
        mediaKey: "teamMohamedImageMediaId",
        label: "Team — Mohamed",
        hint: "Team carousel image",
      },
      {
        key: "teamHassanImageUrl",
        mediaKey: "teamHassanImageMediaId",
        label: "Team — Hassan",
        hint: "Team carousel image",
      },
      {
        key: "teamSwekshyaImageUrl",
        mediaKey: "teamSwekshyaImageMediaId",
        label: "Team — Swekshya",
        hint: "Team carousel image",
      },
      {
        key: "teamAfridImageUrl",
        mediaKey: "teamAfridImageMediaId",
        label: "Team — Afrid",
        hint: "Team carousel image",
      },
      {
        key: "teamNazimImageUrl",
        mediaKey: "teamNazimImageMediaId",
        label: "Team — Nazim",
        hint: "Team carousel image",
      },
      {
        key: "teamSaadImageUrl",
        mediaKey: "teamSaadImageMediaId",
        label: "Team — Saad",
        hint: "Team carousel image",
      },
      {
        key: "teamYasirImageUrl",
        mediaKey: "teamYasirImageMediaId",
        label: "Team — Yasir",
        hint: "Team carousel image",
      },
    ],
  },
  {
    key: "services",
    label: "Services",
    Icon: Briefcase,
    hint: "Services page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Page Hero Image",
        hint: "Banner at the top of the Services page",
      },
      {
        key: "sectionBgUrl",
        mediaKey: "sectionBgMediaId",
        label: "Section Background",
        hint: "Background texture used in service cards",
      },
    ],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    Icon: Layers,
    hint: "Portfolio page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Page Hero Image",
        hint: "Banner at the top of the Portfolio page",
      },
    ],
  },
  {
    key: "careers",
    label: "Careers",
    Icon: UserRound,
    hint: "Careers page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Page Hero Image",
        hint: "Banner at the top of the Careers page",
      },
      {
        key: "officeImageUrl",
        mediaKey: "officeImageMediaId",
        label: "Office / Culture Photo",
        hint: "Culture section photo",
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    Icon: Phone,
    hint: "Contact page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Page Hero Image",
        hint: "Banner at the top of the Contact page",
      },
      {
        key: "officeImageUrl",
        mediaKey: "officeImageMediaId",
        label: "Office Photo",
        hint: "Location photo in the contact section",
      },
    ],
  },
  {
    key: "websiteImages",
    label: "Website Images",
    Icon: ImageIcon,
    hint: "Page and component image replacements",
    type: "websiteImages",
  },

  {
    key: "itSolutions",
    label: "IT Solutions",
    Icon: Briefcase,
    hint: "Main IT Solutions page and inner solution page images",
    type: "images",
    fields: [
      {
        key: "heroImageUrl",
        mediaKey: "heroImageMediaId",
        label: "Main IT Solutions Page Hero",
        hint: "Used on /it-solutions",
      },
      ...IT_SOLUTION_IMAGE_FIELDS,
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

function getSectionProgress(tab, data = {}) {
  if (tab.type === "gallery") {
    const images = Array.isArray(data.images) ? data.images.filter((i) => i.url) : [];
    return { used: images.length, total: GALLERY_SIZE, label: `${images.length}/${GALLERY_SIZE}` };
  }

  if (tab.type === "marquee") {
    const brands = Array.isArray(data.brands)
      ? data.brands.filter((b) => b.imageUrl || b.label)
      : [];
    return { used: brands.length, total: MARQUEE_SIZE, label: `${brands.length}/${MARQUEE_SIZE}` };
  }

  if (tab.type === "websiteImages") {
    const images = Array.isArray(data.images) ? data.images.filter((i) => i.url) : [];
    return {
      used: images.length,
      total: WEBSITE_IMAGE_REGISTRY.length,
      label: `${images.length}/${WEBSITE_IMAGE_REGISTRY.length}`,
    };
  }

  const total = (tab.fields || []).length + (tab.textFields || []).length;
  const used = [
    ...(tab.fields || []).map((f) => data[f.key]),
    ...(tab.textFields || []).map((f) => data[f.key]),
  ].filter(Boolean).length;

  return { used, total, label: `${used}/${total}` };
}

function SaveBar({ dirty, saving, label, onSave }) {
  if (!dirty) {
    return (
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold">All changes saved</span>
          <Check size={15} className="text-emerald-500" />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Changes appear on the website within 5 minutes, or immediately after a hard-reload (Ctrl+Shift+R).
        </p>
      </div>
    );
  }

  return (
    <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/95 px-4 py-3 shadow-lg shadow-slate-200/70 backdrop-blur">
      <div className="min-w-0">
        <div className="text-sm font-black text-slate-900">Unsaved changes</div>
        <div className="truncate text-xs text-slate-500">Review and save this section before switching tasks.</div>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {label}
      </button>
    </div>
  );
}

// ─── Shared image picker field ────────────────────────────────────────────────

function ImagePickerField({
  label,
  hint,
  value,
  onPick,
  onClear,
  saving,
  aspect = "16/7",
}) {
  return (
    <div className="group grid gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-600">
          {label}
          </span>
          {hint && <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{hint}</p>}
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
            value
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-400",
          ].join(" ")}
        >
          {value ? "Set" : "Empty"}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:border-indigo-200 group-hover:shadow-md">
        <div
          className="relative grid place-items-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)]"
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <>
              <img
                src={getAssetUrl(value)}
                alt={label}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 size={20} className="animate-spin text-slate-500" />
                </div>
              )}
            </>
          ) : (
            <div className="grid place-items-center gap-2 text-center text-slate-400">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-slate-300 bg-white/70">
                <ImageIcon size={22} />
              </div>
              <span className="text-xs font-bold">No image set</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-400">
            {value || "Not set"}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {value && (
              <button
                type="button"
                onClick={onClear}
                disabled={saving}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                title="Clear image"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={onPick}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
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

  useEffect(() => {
    setLocal(sectionData || {});
    setDirty(false);
  }, [sectionData]);

  const set = (key, value) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const handleSelect = (media) => {
    if (!media || !picker) return;
    const url = media.url || media.mediumUrl || media.thumbnailUrl || media.path || "";
    set(picker.key, url);
    if (picker.mediaKey) set(picker.mediaKey, media._id || media.id || null);
    setPicker(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(tab.key, local);
      setDirty(false);
      toast.success("Saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {(tab.fields || []).map((f) => (
          <ImagePickerField
            key={f.key}
            label={f.label}
            hint={f.hint}
            value={local[f.key] || ""}
            saving={saving}
            onPick={() => setPicker(f)}
            onClear={() => {
              set(f.key, "");
              if (f.mediaKey) set(f.mediaKey, null);
            }}
          />
        ))}

        {(tab.textFields || []).map((f) => (
          <div key={f.key} className="grid gap-2 sm:col-span-2">
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.18em] text-slate-600">
                {f.label}
              </span>
              {f.hint && (
                <p className="mt-0.5 text-[11px] text-slate-400">{f.hint}</p>
              )}
            </div>
            <input
              type="text"
              value={local[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        label="Save changes"
        onSave={save}
      />

      <MediaPickerModal
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        onSelect={handleSelect}
        title={picker?.label || "Select image"}
        subtitle="Choose from the media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </>
  );
}

// ─── Page-organized website image replacement map ─────────────────────────────

function countConfiguredImages(images = [], items = {}) {
  return images.reduce((sum, item) => sum + (items[item.key]?.url ? 1 : 0), 0);
}

function searchMatches(parts = [], query) {
  if (!query) return true;
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

const OTHER_WEBSITE_IMAGES_KEY = "__otherWebsiteImages";

function getWebsiteItemsMap(sectionData = {}) {
  const src = Array.isArray(sectionData?.images) ? sectionData.images : [];
  return src.reduce((acc, item) => {
    if (item?.key) acc[item.key] = item;
    return acc;
  }, {});
}

function getPageImages(page = {}) {
  return (page.components || []).flatMap((component) => component.images || []);
}

function getWebsiteImageTarget(selectedKey) {
  if (selectedKey === OTHER_WEBSITE_IMAGES_KEY) {
    return {
      key: OTHER_WEBSITE_IMAGES_KEY,
      label: "Other Website Images",
      hint: "Images kept from old defaults or components not mapped to a current page.",
      type: "other",
      images: OTHER_WEBSITE_IMAGE_REGISTRY,
      components: [],
    };
  }

  const page =
    WEBSITE_PAGE_IMAGE_REGISTRY.find((item) => item.key === selectedKey) ||
    WEBSITE_PAGE_IMAGE_REGISTRY[0];

  return {
    ...page,
    hint: `${page.route} · ${page.file}`,
    type: "page",
    images: getPageImages(page),
  };
}

function getWebsiteTargetProgress(target, items = {}) {
  const images =
    target?.type === "other" ? target.images || [] : getPageImages(target);
  const used = countConfiguredImages(images, items);
  const total = images.length;
  return { used, total, label: `${used}/${total}` };
}

const WEBSITE_SECTION_ICONS = {
  branding: Palette,
  home: Globe,
  aboutUs: Info,
  servicesMain: Briefcase,
  websiteDevelopment: Layers,
  socialMediaMarketing: Sparkles,
  seoMarketing: Search,
  googleAds: Briefcase,
  videography: GalleryVerticalEnd,
  contentCreation: Sparkles,
  portfolio: GalleryVerticalEnd,
  portfolioDetail: Layers,
  contact: Phone,
  careers: UserRound,
  itSolutions: Briefcase,
  itSolutionDetails: Briefcase,
  planBuilder: Layers,
  webPricing: Briefcase,
  seoPricing: Search,
  googleAdsPricing: Briefcase,
  socialMediaPricing: UserRound,
  marketingSolutions: Sparkles,
  thankYou: Check,
  productions: GalleryVerticalEnd,
  productionDetails: GalleryVerticalEnd,
  vendorRegistration: Briefcase,
  notFound: Info,
  errorBoundary: Info,
  [OTHER_WEBSITE_IMAGES_KEY]: ImageIcon,
};

function getWebsiteSectionIcon(key) {
  return WEBSITE_SECTION_ICONS[key] || ImageIcon;
}

const WEBSITE_MENU_GROUPS = [
  {
    label: "Core",
    keys: [
      "branding",
      "home",
      "aboutUs",
      "servicesMain",
      "portfolio",
      "careers",
      "contact",
      "itSolutions",
      "itSolutionDetails",
      "planBuilder",
      "marketingSolutions",
    ],
  },
  {
    label: "Services",
    keys: [
      "websiteDevelopment",
      "socialMediaMarketing",
      "seoMarketing",
      "googleAds",
      "videography",
      "contentCreation",
    ],
  },
  {
    label: "Pricing",
    keys: ["webPricing", "seoPricing", "googleAdsPricing", "socialMediaPricing"],
  },
  {
    label: "Portfolio & Media",
    keys: ["portfolioDetail", "productions", "productionDetails"],
  },
  {
    label: "Utility",
    keys: ["thankYou", "vendorRegistration", "notFound", "errorBoundary"],
  },
  {
    label: "Fallback",
    keys: [OTHER_WEBSITE_IMAGES_KEY],
  },
];

function getWebsiteMenuGroups(settings = {}, sectionData = {}) {
  const items = getWebsiteItemsMap(sectionData);
  const brandingTab = TABS.find((tab) => tab.key === "branding");
  const brandingProgress = getSectionProgress(
    brandingTab,
    settings?.branding || {}
  );
  const allItems = [
    {
      key: "branding",
      label: "Branding",
      hint: brandingTab?.hint || "Logo, favicon, OG image",
      Icon: Palette,
      progress: brandingProgress,
    },
    ...WEBSITE_PAGE_IMAGE_REGISTRY.map((page) => ({
      key: page.key,
      label: page.label,
      hint: page.route,
      Icon: getWebsiteSectionIcon(page.key),
      progress: getWebsiteTargetProgress(page, items),
    })),
    {
      key: OTHER_WEBSITE_IMAGES_KEY,
      label: "Other Website Images",
      hint: "Unmapped defaults",
      Icon: ImageIcon,
      progress: getWebsiteTargetProgress(
        getWebsiteImageTarget(OTHER_WEBSITE_IMAGES_KEY),
        items
      ),
    },
  ];
  const itemMap = new Map(allItems.map((item) => [item.key, item]));
  const groupedKeys = new Set(WEBSITE_MENU_GROUPS.flatMap((group) => group.keys));
  const groups = WEBSITE_MENU_GROUPS.map((group) => ({
    ...group,
    items: group.keys.map((key) => itemMap.get(key)).filter(Boolean),
  })).filter((group) => group.items.length > 0);
  const ungrouped = allItems.filter((item) => !groupedKeys.has(item.key));

  return ungrouped.length
    ? [...groups, { label: "Other Pages", items: ungrouped }]
    : groups;
}

function getWebsiteWorkspaceProgress(settings = {}, sectionData = {}) {
  const menuItems = getWebsiteMenuGroups(settings, sectionData)
    .flatMap((group) => group.items)
    .filter((item) => item.progress.total > 0);
  const used = menuItems.reduce((sum, item) => sum + item.progress.used, 0);
  const total = menuItems.reduce((sum, item) => sum + item.progress.total, 0);
  return { used, total, label: `${used}/${total}` };
}

function WebsiteImagesSidebarMenu({
  settings,
  sectionData,
  selectedKey,
  onSelect,
  loading,
  compact = false,
}) {
  const [sectionQuery, setSectionQuery] = useState("");
  const [openGroups, setOpenGroups] = useState({});
  const normalizedSectionQuery = sectionQuery.trim().toLowerCase();
  const allGroups = getWebsiteMenuGroups(settings, sectionData)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.progress.total > 0),
    }))
    .filter((group) => group.items.length > 0);
  const groups = allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        searchMatches([item.label, item.hint, group.label], normalizedSectionQuery)
      ),
    }))
    .filter((group) => group.items.length > 0);
  const menuItems = groups.flatMap((group) => group.items);

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  if (compact) {
    return (
      <div className="flex min-w-max gap-2">
        {menuItems.map((item) => {
          const selected = selectedKey === item.key;
          const Icon = item.Icon || ImageIcon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                selected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600",
              ].join(" ")}
            >
              <Icon size={14} className="shrink-0" />
              <span>{item.label}</span>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px]",
                  selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {loading ? "-" : item.progress.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="relative block">
        <Search
          size={13}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={sectionQuery}
          onChange={(event) => setSectionQuery(event.target.value)}
          placeholder="Find section..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      {groups.map((group) => (
        <div key={group.label}>
          <button
            type="button"
            onClick={() => toggleGroup(group.label)}
            className="flex h-8 w-full items-center justify-between rounded-lg px-1 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <span>{group.label}</span>
            <span className="inline-flex items-center gap-1">
              {group.items.length}
              {normalizedSectionQuery || openGroups[group.label] ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </span>
          </button>

          {(normalizedSectionQuery || openGroups[group.label]) && (
          <div className="grid gap-1">
            {group.items.map((item) => {
              const selected = selectedKey === item.key;
              const complete =
                item.progress.total > 0 &&
                item.progress.used === item.progress.total;
              const Icon = item.Icon || ImageIcon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                    selected
                      ? "border-indigo-200 bg-indigo-50 text-slate-950 shadow-sm"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={[
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                        selected
                          ? "border-indigo-100 bg-white text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500",
                      ].join(" ")}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black">
                        {item.label}
                      </span>
                    </span>
                  </span>
                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-1 text-[10px] font-black",
                      selected
                        ? "bg-white text-indigo-700"
                        : complete
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {loading ? "-" : item.progress.label}
                  </span>
                </button>
              );
            })}
          </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WebsiteImagesSection({ sectionData, selectedKey, headerIcon: HeaderIcon, onSave }) {
  const toast = useToast();
  const [items, setItems] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null);
  const [query, setQuery] = useState("");
  const [openComponents, setOpenComponents] = useState({
    "aboutUs:auroraHero": true,
  });
  const selectedTarget = getWebsiteImageTarget(selectedKey);

  useEffect(() => {
    const src = Array.isArray(sectionData?.images) ? sectionData.images : [];
    const next = src.reduce((acc, item) => {
      if (item?.key) acc[item.key] = item;
      return acc;
    }, {});
    setItems(next);
    setDirty(false);
  }, [sectionData]);

  const setImage = (key, patch) => {
    setItems((prev) => ({
      ...prev,
      [key]: {
        key,
        ...(prev[key] || {}),
        ...patch,
      },
    }));
    setDirty(true);
  };

  const clearImage = (key) => {
    setItems((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDirty(true);
  };

  const handleSelect = (media) => {
    if (!media || !picker) return;
    setImage(picker.key, {
      url: media.url || media.mediumUrl || media.thumbnailUrl || media.path || "",
      mediaId: media._id || media.id || null,
    });
    setPicker(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave("websiteImages", {
        images: Object.values(items)
          .filter((item) => item?.key && item?.url)
          .map(({ key, url, mediaId }) => ({ key, url, mediaId: mediaId || null })),
      });
      setDirty(false);
      toast.success("Website images saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (selectedTarget.type !== "page") return;
    const firstComponent =
      (selectedTarget.components || []).find((component) => component.images?.length) ||
      selectedTarget.components?.[0];
    if (!firstComponent) return;
    const componentKey = `${selectedTarget.key}:${firstComponent.key}`;
    setOpenComponents((prev) => (
      prev[componentKey] ? prev : { ...prev, [componentKey]: true }
    ));
  }, [selectedTarget.key, selectedTarget.type, selectedTarget.components]);

  const normalizedQuery = query.trim().toLowerCase();
  const targetProgress = getWebsiteTargetProgress(selectedTarget, items);

  const visibleOtherImages = selectedTarget.images.filter((item) =>
    searchMatches(
      [item.group, item.label, item.defaultUrl],
      normalizedQuery
    )
  );
  const visibleComponents = (selectedTarget.components || []).filter((component) => {
    const componentMatch = searchMatches(
      [component.label, component.file],
      normalizedQuery
    );
    const imageMatch = (component.images || []).some((item) =>
      searchMatches([item.label, item.defaultUrl], normalizedQuery)
    );
    return componentMatch || imageMatch;
  });

  const toggleComponent = (key) => {
    setOpenComponents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              {HeaderIcon ? <HeaderIcon size={20} /> : <ImageIcon size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  {selectedTarget.label}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  {targetProgress.label}
                </span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">
                  Images
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-500">
                {selectedTarget.hint}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Replace default images here. Changes appear on the website within 5 minutes, or immediately after a hard-reload (Ctrl+Shift+R).
              </p>
            </div>
          </div>

          <div className="sm:w-[min(340px,34vw)]">
            <label className="relative block">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search images..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        </div>
      </div>

      {selectedTarget.type === "other" ? (
        <div>
          {visibleOtherImages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleOtherImages.map((item) => (
                <ImageReplacementCard
                  key={item.key}
                  item={item}
                  override={items[item.key]?.url || ""}
                  saving={saving}
                  onPick={() => setPicker(item)}
                  onClear={() => clearImage(item.key)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-400">
              No other website images match this search.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleComponents.map((component) => {
            const componentKey = `${selectedTarget.key}:${component.key}`;
            const componentTotal = (component.images || []).length;
            const componentConfigured = countConfiguredImages(
              component.images,
              items
            );
            const isComponentOpen = Boolean(
              normalizedQuery || openComponents[componentKey]
            );
            const visibleImages = (component.images || []).filter((item) =>
              searchMatches(
                [component.label, component.file, item.label, item.defaultUrl],
                normalizedQuery
              )
            );

            return (
              <div
                key={componentKey}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleComponent(componentKey)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      {isComponentOpen ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {component.label}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {component.file}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
                    {componentConfigured}/{componentTotal}
                  </span>
                </button>

                {isComponentOpen && (
                  <div className="border-t border-slate-100 p-4">
                    {componentTotal > 0 && visibleImages.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleImages.map((item, index) => (
                          <ImageReplacementCard
                            key={`${componentKey}:${index}:${item.key}`}
                            item={{ ...item, componentLabel: component.label }}
                            override={items[item.key]?.url || ""}
                            saving={saving}
                            onPick={() => setPicker(item)}
                            onClear={() => clearImage(item.key)}
                          />
                        ))}
                      </div>
                    ) : componentTotal > 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-400">
                        No images in this component match this search.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-400">
                        No hardcoded image slots in this component.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visibleComponents.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-400">
              No components match this search.
            </div>
          )}
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} label="Save website images" onSave={save} />

      <MediaPickerModal
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        onSelect={handleSelect}
        title={picker?.label || "Select replacement image"}
        subtitle="Choose from the media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </>
  );
}

function ImageReplacementCard({ item, override, saving, onPick, onClear }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="grid grid-cols-2 border-b border-slate-100">
        <PreviewImage
          label="Default"
          src={item.defaultUrl}
          alt={item.label}
        />
        <PreviewImage
          label={override ? "Replacement" : "Not replaced"}
          src={override}
          alt={`${item.label} replacement`}
          emptyLabel="No override"
        />
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">
              {item.label}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {item.componentLabel || item.group || "Website image"}
            </p>
          </div>
          <span
            className={[
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
              override
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-400",
            ].join(" ")}
          >
            {override ? "Set" : "Default"}
          </span>
        </div>

        <div className="mt-2 truncate font-mono text-[11px] text-slate-400">
          {item.defaultUrl}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onPick}
            disabled={saving}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
          >
            <UploadCloud size={13} />
            {override ? "Change" : "Pick"}
          </button>
          {override && (
            <button
              type="button"
              onClick={onClear}
              disabled={saving}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              title="Clear replacement"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewImage({ label, src, alt, emptyLabel = "No image" }) {
  return (
    <div className="border-r border-slate-100 last:border-r-0">
      <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2">
        <span className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>
      </div>
      <div className="grid aspect-[4/3] place-items-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)]">
        {src ? (
          <img
            src={toWebsiteImageUrl(src)}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid place-items-center gap-1 text-slate-300">
            <ImageIcon size={20} />
            <span className="text-[11px] font-bold text-slate-400">
              {emptyLabel}
            </span>
          </div>
        )}
      </div>
    </div>
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
    const padded = Array.from(
      { length: GALLERY_SIZE },
      (_, i) => src[i] || { url: "", mediaId: null, alt: "" }
    );
    setImages(padded);
    setDirty(false);
  }, [sectionData]);

  const setSlot = (idx, patch) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, ...patch } : img))
    );
    setDirty(true);
  };

  const handleSelect = (media) => {
    if (media && pickerIdx !== null) {
      setSlot(pickerIdx, {
        url: media.url || media.mediumUrl || "",
        mediaId: media._id || null,
      });
    }
    setPickerIdx(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave("gallery", { images: images.filter((i) => i.url) });
      setDirty(false);
      toast.success("Gallery saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-600">
          These images power the draggable gallery section on the homepage.
        </p>
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Up to {GALLERY_SIZE} images
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)]">
              {img.url ? (
                <img
                  src={getAssetUrl(img.url)}
                  alt={img.alt || `Gallery ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-300">
                  <ImageIcon size={24} />
                  <span className="text-[11px] font-semibold text-slate-400">
                    Slot {idx + 1}
                  </span>
                </div>
              )}
            </div>
            <div className="p-2.5">
              <input
                type="text"
                value={img.alt || ""}
                placeholder="Alt text…"
                onChange={(e) => setSlot(idx, { alt: e.target.value })}
                className="mb-2 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-1 focus:ring-indigo-100"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickerIdx(idx)}
                  disabled={saving}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                >
                  <UploadCloud size={12} /> {img.url ? "Change" : "Pick"}
                </button>
                {img.url && (
                  <button
                    type="button"
                    onClick={() => setSlot(idx, { url: "", mediaId: null })}
                    disabled={saving}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                    title="Clear slot"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveBar dirty={dirty} saving={saving} label="Save gallery" onSave={save} />

      <MediaPickerModal
        open={pickerIdx !== null}
        onClose={() => setPickerIdx(null)}
        onSelect={handleSelect}
        title={`Gallery slot ${(pickerIdx ?? 0) + 1}`}
        subtitle="Pick an image from the media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload
      />
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
    setBrands((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b))
    );
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
      setBrand(pickerIdx, {
        imageUrl: media.url || media.mediumUrl || "",
        mediaId: media._id || null,
      });
    }
    setPickerIdx(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave("marquee", {
        brands: brands.filter((b) => b.imageUrl || b.label),
      });
      setDirty(false);
      toast.success("Brands strip saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-600">
          These cards scroll in the homepage brands marquee strip.
        </p>
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Up to {MARQUEE_SIZE} brands
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {brands.map((brand, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setPickerIdx(idx)}
              disabled={saving}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-indigo-300"
            >
              {brand.imageUrl ? (
                <img
                  src={getAssetUrl(brand.imageUrl)}
                  alt={brand.label || `Brand ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] text-slate-300">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition hover:bg-black/20">
                <UploadCloud
                  size={14}
                  className="text-white opacity-0 transition group-hover:opacity-100"
                />
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={brand.label || ""}
                placeholder="Brand name…"
                onChange={(e) => setBrand(idx, { label: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-1 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setPickerIdx(idx)}
                className="mt-1.5 text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                {brand.imageUrl ? "Change image" : "Pick image"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeBrand(idx)}
              disabled={saving}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              title="Remove brand"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {brands.length < MARQUEE_SIZE && (
        <button
          type="button"
          onClick={addBrand}
          className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-black text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Plus size={15} /> Add brand
        </button>
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        label="Save brands strip"
        onSave={save}
      />

      <MediaPickerModal
        open={pickerIdx !== null}
        onClose={() => setPickerIdx(null)}
        onSelect={handleSelect}
        title={`Brand image — ${
          brands[pickerIdx]?.label || `slot ${(pickerIdx ?? 0) + 1}`
        }`}
        subtitle="Pick the brand card image from the media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebsiteSettingsPage() {
  const toast = useToast();
  const [activeWebsiteImagePage, setActiveWebsiteImagePage] = useState("branding");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSiteSettings();
      setSettings(res.settings || {});
    } catch {
      toast.error("Failed to load site settings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (section, data) => {
    const res = await updateSiteSettings(section, data);
    setSettings(res.settings || {});
    return res;
  };

  const currentTab = TABS.find((t) => t.key === "websiteImages") || TABS[0];
  const currentData = (settings || {})[currentTab.key] || {};
  const currentProgress = getSectionProgress(currentTab, currentData);
  const activeWebsiteBrandingTab =
    activeWebsiteImagePage === "branding"
      ? TABS.find((tab) => tab.key === "branding")
      : null;
  const activeWebsiteBrandingData = activeWebsiteBrandingTab
    ? (settings || {})[activeWebsiteBrandingTab.key] || {}
    : {};
  const websiteImageTarget =
    !activeWebsiteBrandingTab
      ? getWebsiteImageTarget(activeWebsiteImagePage)
      : null;
  const websiteImageItems = websiteImageTarget
    ? getWebsiteItemsMap((settings || {}).websiteImages || {})
    : {};
  const websiteImageProgress = websiteImageTarget
    ? getWebsiteTargetProgress(websiteImageTarget, websiteImageItems)
    : null;
  const brandingProgress = activeWebsiteBrandingTab
    ? getSectionProgress(activeWebsiteBrandingTab, activeWebsiteBrandingData)
    : null;
  const headerLabel =
    activeWebsiteBrandingTab?.label || websiteImageTarget?.label || currentTab.label;
  const headerHint =
    activeWebsiteBrandingTab?.hint || websiteImageTarget?.hint || currentTab.hint;
  const headerProgress = brandingProgress || websiteImageProgress || currentProgress;
  const HeaderIcon = activeWebsiteBrandingTab
    ? activeWebsiteBrandingTab.Icon
    : websiteImageTarget
      ? getWebsiteSectionIcon(websiteImageTarget.key)
      : currentTab.Icon;
  const websiteImagesProgress = getWebsiteWorkspaceProgress(
    settings || {},
    (settings || {}).websiteImages || {}
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-full gap-0">
      {/* Sidebar */}
      <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white lg:block xl:w-96">
        <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
          <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10">
                <ImageIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">Website Images</div>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Page and component image replacements.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black">
                      {loading ? "-" : websiteImagesProgress.label}
                    </span>
                    <button
                      type="button"
                      onClick={load}
                      disabled={loading}
                      className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-60"
                      title="Refresh"
                    >
                      {loading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <WebsiteImagesSidebarMenu
            settings={settings || {}}
            sectionData={(settings || {}).websiteImages || {}}
            selectedKey={activeWebsiteImagePage}
            onSelect={setActiveWebsiteImagePage}
            loading={loading}
          />
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-5 overflow-x-auto lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 p-3 text-white">
            <div className="min-w-0">
              <div className="text-sm font-black">Website Images</div>
              <p className="truncate text-xs text-slate-300">
                Page and component image replacements
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black">
              {loading ? "-" : websiteImagesProgress.label}
            </span>
          </div>
          <WebsiteImagesSidebarMenu
            settings={settings || {}}
            sectionData={(settings || {}).websiteImages || {}}
            selectedKey={activeWebsiteImagePage}
            onSelect={setActiveWebsiteImagePage}
            loading={loading}
            compact
          />
        </div>

        <div
          className={[
            currentTab.type === "websiteImages"
              ? ""
              : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6",
          ].join(" ")}
        >
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : activeWebsiteBrandingTab ? (
            <>
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                      <HeaderIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          {headerLabel}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                          {loading ? "..." : headerProgress.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{headerHint}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <ImagesSection
                  key={activeWebsiteBrandingTab.key}
                  tab={activeWebsiteBrandingTab}
                  sectionData={activeWebsiteBrandingData}
                  onSave={handleSave}
                />
              </div>
            </>
          ) : currentTab.type === "gallery" ? (
            <GallerySection
              key={currentTab.key}
              sectionData={currentData}
              onSave={handleSave}
            />
          ) : currentTab.type === "marquee" ? (
            <MarqueeSection
              key={currentTab.key}
              sectionData={currentData}
              onSave={handleSave}
            />
          ) : currentTab.type === "websiteImages" ? (
            <WebsiteImagesSection
              key={currentTab.key}
              sectionData={currentData}
              selectedKey={activeWebsiteImagePage}
              headerIcon={HeaderIcon}
              onSave={handleSave}
            />
          ) : (
            <ImagesSection
              key={currentTab.key}
              tab={currentTab}
              sectionData={currentData}
              onSave={handleSave}
            />
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
