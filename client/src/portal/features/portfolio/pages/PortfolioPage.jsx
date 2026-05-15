import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import ViewToggle from "../../../shared/ui/ViewToggle";
import { listPortfolio, createPortfolio, deletePortfolio } from "../api";
import {
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  Globe,
  Archive,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  CalendarDays,
  Image as ImageIcon,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

const CATEGORY_OPTIONS = [
  { value: "Website Design", label: "Website Design" },
  { value: "Website", label: "Website" },
  { value: "Social Media", label: "Social Media" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "SEO", label: "SEO" },
];

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

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const { Icon } = meta;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
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

function resolveItemImage(item) {
  return (
    item.coverMedia?.thumbnailUrl ||
    item.coverMedia?.mediumUrl ||
    item.coverMedia?.url ||
    item.thumbnailImg ||
    item.bannerImage ||
    item.solutionImage ||
    ""
  );
}

function getReadiness(item) {
  const checks = [
    Boolean(item.title && item.slug),
    Boolean(item.clientName || item.title),
    Boolean(item.bannerTitle && item.bannerDesc),
    Boolean(resolveItemImage(item)),
    Boolean(item.introDescription && item.problems),
    Boolean((item.solutions || []).length || item.result),
  ];
  return {
    done: checks.filter(Boolean).length,
    total: checks.length,
  };
}

function PortfolioRecordCard({ item, onOpen, onDelete, view = "grid" }) {
  const image = resolveItemImage(item);
  const readiness = getReadiness(item);
  const progress = Math.round((readiness.done / readiness.total) * 100);

  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
        }}
        className="group grid cursor-pointer gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:grid-cols-[108px,1fr,auto]"
      >
        <div className="overflow-hidden rounded-xl bg-slate-100">
          {image ? (
            <img
              src={getAssetUrl(image)}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-slate-300">
              <ImageIcon size={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={item.status} />
            {item.category && (
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">
                {item.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
              <CalendarDays size={11} />
              {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Not dated"}
            </span>
          </div>
          <h3 className="mt-2 truncate text-base font-black text-slate-950 group-hover:text-indigo-700">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {item.excerpt || item.bannerDesc || "No summary yet."}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="hidden min-w-[96px] text-right sm:block">
            <div className="text-xs font-bold text-slate-500">Readiness</div>
            <div className="mt-1 font-black text-slate-950">{readiness.done}/{readiness.total}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="group grid cursor-pointer overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:grid-cols-[220px,1fr]"
    >
      <div className="relative min-h-[210px] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={getAssetUrl(image)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ImageIcon size={34} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusPill status={item.status} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {item.category && (
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">
                  {item.category}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                <CalendarDays size={11} />
                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Not dated"}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-black leading-tight text-slate-950 group-hover:text-indigo-700">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
              {item.excerpt || item.bannerDesc || "No summary yet. Open the item to complete the case-study content."}
            </p>
          </div>
          <ExternalLink size={16} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
        </div>

        <div className="mt-auto grid gap-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Readiness</span>
              <span className="font-black text-slate-900">{readiness.done}/{readiness.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex min-w-0 items-center gap-1 font-mono text-xs text-slate-400">
              <Globe size={11} />
              <span className="truncate">/{item.slug}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-xs font-bold text-slate-400 sm:inline-flex">
                <CheckCircle2 size={13} className={image ? "text-emerald-500" : "text-slate-300"} />
                {image ? "Visual set" : "Needs visual"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function NewPortfolioModal({ open, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    category: CATEGORY_OPTIONS[0].value,
    status: "draft",
  });
  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: val,
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div className="text-lg font-black text-slate-950">
            New portfolio item
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create the shell first. Add images and full case-study content in the editor with the media picker.
          </p>
        </div>
        <div className="grid gap-4 p-6">
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              TITLE *
            </label>
            <input
              value={form.title}
              onChange={set("title")}
              placeholder="Brand Campaign for Acme Co."
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              WEBSITE URL
            </div>
            <div className="mt-1 font-mono text-sm text-slate-600">
              /{slugify(form.title) || "generated-from-title"}
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              EXCERPT
            </label>
            <textarea
              value={form.excerpt}
              onChange={set("excerpt")}
              rows={2}
              placeholder="Short description shown in listings..."
              className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
                CATEGORY
              </label>
              <select
                value={form.category}
                onChange={set("category")}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            loading={busy}
            disabled={!form.title.trim()}
          >
            <Plus size={14} /> Create
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPortfolio({ limit: 50 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      toast.error("Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (form) => {
    setBusy(true);
    try {
      const res = await createPortfolio({
        ...form,
        slug: slugify(form.title),
      });
      setItems((prev) => [res.item, ...prev]);
      setAddOpen(false);
      toast.success("Portfolio item created.");
      nav(`/portal/website/portfolio/${res.item._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (id, title) => {
    setConfirmState({
      title: "Delete portfolio item",
      message: `Delete "${title}"?`,
      danger: true,
      onConfirm: async () => {
        try {
          await deletePortfolio(id);
          setItems((prev) => prev.filter((x) => x._id !== id));
          toast.success("Deleted.");
        } catch {
          toast.error("Delete failed.");
        }
        setConfirmState(null);
      },
    });
  };

  const filtered = useMemo(() => {
    return items.filter((x) => {
      const matchQ =
        !q ||
        [x.title, x.excerpt, x.category, ...(x.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      const matchStatus = !statusFilter || x.status === statusFilter;
      const matchCategory = !categoryFilter || x.category === categoryFilter;
      return matchQ && matchStatus && matchCategory;
    });
  }, [items, q, statusFilter, categoryFilter]);

  const categoryOptions = useMemo(() => {
    const current = items
      .map((item) => item.category)
      .filter(Boolean)
      .map((category) => ({ value: category, label: category }));
    const merged = [...CATEGORY_OPTIONS, ...current];
    return merged.filter(
      (option, index, list) =>
        list.findIndex((candidate) => candidate.value === option.value) === index
    );
  }, [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CONTENT OPERATIONS"
        title="Portfolio"
        subtitle="Manage the case studies shown on the public website."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Website" },
          { label: "Portfolio" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={15} /> New item
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr,180px,180px,auto,auto]">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, client, category, tag..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              setStatusFilter("");
              setCategoryFilter("");
            }}
          >
            Clear
          </Button>
          <div className="flex items-center justify-end">
            <ViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: "grid", icon: LayoutGrid, label: "Grid view" },
                { value: "list", icon: LayoutList, label: "List view" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[28px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={Layers}
            title="No portfolio items"
            message="Add case studies and work samples to showcase on your website."
            actionLabel="New item"
            onAction={() => setAddOpen(true)}
          />
        </Card>
      ) : (
        <div className={view === "grid" ? "grid gap-5 xl:grid-cols-2" : "grid gap-3"}>
          {filtered.map((item) => (
            <PortfolioRecordCard
              key={item._id}
              item={item}
              view={view}
              onOpen={() => nav(`/portal/website/portfolio/${item._id}`)}
              onDelete={() => handleDelete(item._id, item.title)}
            />
          ))}
        </div>
      )}

      <NewPortfolioModal
        open={addOpen}
        busy={busy}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
