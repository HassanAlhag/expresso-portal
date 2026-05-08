import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
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
} from "lucide-react";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

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
    slug: "",
    excerpt: "",
    category: "",
    status: "draft",
  });
  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: val,
      ...(k === "title" && !f._slugEdited ? { slug: slugify(val) } : {}),
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">
          New portfolio item
        </div>
        <div className="grid gap-4">
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
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              SLUG *
            </label>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: slugify(e.target.value),
                  _slugEdited: true,
                }))
              }
              placeholder="brand-campaign-acme"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 font-mono text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
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
              <input
                value={form.category}
                onChange={set("category")}
                placeholder="Branding, Social, Video..."
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
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
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            loading={busy}
            disabled={!form.title.trim() || !form.slug.trim()}
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
      const res = await createPortfolio(form);
      setItems((prev) => [res.item, ...prev]);
      setAddOpen(false);
      toast.success("Portfolio item created.");
      nav(`/portal/portfolio/${res.item._id}`);
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
      return matchQ && matchStatus;
    });
  }, [items, q, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter((x) => x.status === "published").length,
      draft: items.filter((x) => x.status === "draft").length,
      archived: items.filter((x) => x.status === "archived").length,
    }),
    [items]
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Portfolio"
        subtitle="Published case studies and work samples for the website."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
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

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Total"
          value={stats.total}
          color="indigo"
        />
        <StatCard
          icon={Eye}
          label="Published"
          value={stats.published}
          color="emerald"
        />
        <StatCard
          icon={EyeOff}
          label="Draft"
          value={stats.draft}
          color="slate"
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archived}
          color="rose"
        />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Title, category, tag…"
        filters={[
          {
            label: "status",
            value: statusFilter,
            onChange: (v) => setStatusFilter(v),
            options: [
              { value: "", label: "All status" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ],
          },
        ]}
        onClear={() => {
          setQ("");
          setStatusFilter("");
        }}
      />

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item._id}
              role="button"
              tabIndex={0}
              onClick={() => nav(`/portal/portfolio/${item._id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") nav(`/portal/portfolio/${item._id}`);
              }}
              className="group flex flex-col gap-4 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm transition cursor-pointer hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
            >
              {/* Cover image */}
              {item.coverMedia?.url ? (
                <div className="h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={getAssetUrl(item.coverMedia.url)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-slate-100">
                  <Layers size={28} className="text-slate-300" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                {item.category && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {item.category}
                  </span>
                )}
              </div>

              <div>
                <div className="text-base font-black text-slate-900 group-hover:text-slate-700">
                  {item.title}
                </div>
                {item.excerpt && (
                  <div className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {item.excerpt}
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                  <Globe size={11} />/{item.slug}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id, item.title);
                    }}
                    className="text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ExternalLink
                    size={14}
                    className="text-slate-400 group-hover:text-slate-700 transition"
                  />
                </div>
              </div>
            </div>
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
