import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/ui/Toast";

import {
  Images,
  FileImage,
  Film,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  LayoutGrid,
  List,
  Search,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { listMedia, uploadMedia } from "../api";
import { useAccess } from "../../../shared/hooks/useAccess";
import MediaGrid from "../components/MediaGrid";
import MediaDrawer from "../components/MediaDrawer";

const BRAND = "#7F8AD1";

const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "pdf", label: "PDFs" },
  { value: "audio", label: "Audio" },
  { value: "other", label: "Other" },
];

const STAT_CARDS = [
  {
    icon: Images,
    label: "Total Assets",
    getVal: (s) => s.total,
    iconCls: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: FileImage,
    label: "Images",
    getVal: (s) => s.images,
    iconCls: "bg-sky-50 text-sky-600",
  },
  {
    icon: Film,
    label: "Videos",
    getVal: (s) => s.videos,
    iconCls: "bg-violet-50 text-violet-600",
  },
  {
    icon: CheckCircle2,
    label: "Published",
    getVal: (s) => s.published,
    iconCls: "bg-emerald-50 text-emerald-600",
  },
];

export default function MediaLibraryPage() {
  const toast = useToast();
  // PI closure: upload needs media.write (API POST /api/media); browsing
  // needs only media.read (the route permission).
  const canUpload = useAccess().can("media.write");
  const inputRef = useRef(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [dragging, setDragging] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMedia({ q, type, status, limit: 60 });
      setItems(res?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, status]);

  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    if (!canUpload || !arr.length || uploading) return;
    setUploading(true);
    let ok = 0;
    const fresh = [];
    for (const file of arr) {
      try {
        const res = await uploadMedia({
          file,
          title: "",
          tags: "",
          category: "",
          status: "draft",
        });
        if (res?.item) {
          fresh.push(res.item);
          ok++;
        }
      } catch (e) {
        toast.error(
          `${file.name}: ${e?.response?.data?.message || e?.message || "Upload failed"}`
        );
      }
    }
    if (ok > 0) {
      setItems((prev) => [...fresh.reverse(), ...prev]);
      toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      images: items.filter((x) => x.type === "image").length,
      videos: items.filter((x) => x.type === "video").length,
      published: items.filter((x) => x.status === "published").length,
    }),
    [items]
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Media Library"
        subtitle="Upload, organize, and manage all creative assets."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Media Library" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading || uploading}
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
            {canUpload ? (
              <Button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                style={{ backgroundColor: BRAND }}
              >
                <UploadCloud size={15} />
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            ) : null}
          </div>
        }
      />

      {canUpload ? (
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      ) : null}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ icon: Icon, label, getVal, iconCls }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm"
          >
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconCls}`}
            >
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black tabular-nums text-slate-900">
                {getVal(stats)}
              </div>
              <div className="truncate text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drag-and-drop upload zone (only for users who can upload) */}
      {canUpload ? (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          "relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-200",
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-black/[0.09] bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30",
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-3 px-6 py-9 text-center">
          <div
            className={[
              "grid h-14 w-14 place-items-center rounded-2xl border transition",
              dragging
                ? "border-indigo-300 bg-indigo-100 text-indigo-600"
                : "border-black/10 bg-white text-slate-400",
            ].join(" ")}
          >
            {uploading ? (
              <RefreshCw size={22} className="animate-spin text-indigo-500" />
            ) : (
              <UploadCloud size={22} />
            )}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-700">
              {uploading
                ? "Uploading files…"
                : dragging
                ? "Release to upload"
                : "Drag & drop files here, or click to browse"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Images, videos, PDFs, audio — any format supported
            </div>
          </div>
        </div>
        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-indigo-50/80">
            <div className="text-lg font-black text-indigo-600">
              Release to upload
            </div>
          </div>
        )}
      </div>
      ) : null}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter pills */}
        <div className="flex items-center gap-1 rounded-2xl border border-black/[0.07] bg-white p-1 shadow-sm">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={[
                "rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition",
                type === t.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-black/[0.04]",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, tags, category…"
            className="h-10 w-full rounded-2xl border border-black/[0.07] bg-white pl-9 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {q && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              onClick={() => setQ("")}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 appearance-none rounded-2xl border border-black/[0.07] bg-white px-3 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-2xl border border-black/[0.07] bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode("grid")}
            title="Grid view"
            className={[
              "rounded-xl p-2 transition",
              viewMode === "grid"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-black/[0.04]",
            ].join(" ")}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List view"
            className={[
              "rounded-xl p-2 transition",
              viewMode === "list"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-black/[0.04]",
            ].join(" ")}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              : "grid gap-2.5"
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={
                viewMode === "grid" ? "h-64 rounded-3xl" : "h-16 rounded-2xl"
              }
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media found"
          message="Upload files using the zone above, or adjust your filters."
        />
      ) : (
        <MediaGrid
          items={items}
          onOpen={(m) => {
            setActive(m);
            setDrawerOpen(true);
          }}
          viewMode={viewMode}
        />
      )}

      <MediaDrawer
        open={drawerOpen}
        item={active}
        onClose={() => {
          setDrawerOpen(false);
          setActive(null);
        }}
        onChanged={(updated, meta) => {
          if (meta?.deleted) {
            setItems((prev) => prev.filter((x) => x._id !== meta.id));
            setActive(null);
            return;
          }
          if (!updated?._id) return;
          setItems((prev) =>
            prev.map((x) => (x._id === updated._id ? updated : x))
          );
          setActive(updated);
        }}
      />
    </div>
  );
}
