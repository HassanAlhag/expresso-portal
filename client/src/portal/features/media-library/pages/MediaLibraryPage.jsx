import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";

import {
  Image as ImageIcon,
  RefreshCw,
  Images,
  FileImage,
  Video,
  FileText,
} from "lucide-react";

import { listMedia } from "../api";
import MediaUploader from "../components/MediaUploader";
import MediaGrid from "../components/MediaGrid";
import MediaDrawer from "../components/MediaDrawer";

export default function MediaLibraryPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMedia({ q, type, status, category, limit: 48 });
      setItems(res?.items || []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load media"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, type, status, category]);

  const openDrawer = (m) => {
    setActive(m);
    setOpen(true);
  };

  const onChanged = (updated, meta) => {
    if (meta?.deleted) {
      setItems((prev) => prev.filter((x) => x._id !== meta.id));
      setActive(null);
      return;
    }

    if (!updated?._id) return;

    setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    setActive(updated);
  };

  const stats = useMemo(() => {
    const total = items.length;
    const images = items.filter((x) => x.type === "image").length;
    const videos = items.filter((x) => x.type === "video").length;
    const published = items.filter((x) => x.status === "published").length;

    return { total, images, videos, published };
  }, [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Media Library"
        subtitle="Upload, organize, and manage assets for productions."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Media Library" },
        ]}
        right={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Images}    label="Total Assets" value={stats.total}     color="indigo"  />
        <StatCard icon={FileImage} label="Images"       value={stats.images}    color="blue"    />
        <StatCard icon={Video}     label="Videos"       value={stats.videos}    color="violet"  />
        <StatCard icon={FileText}  label="Published"    value={stats.published} color="emerald" />
      </div>

      <MediaUploader
        onUploaded={(it) => {
          if (!it?._id) return;
          setItems((prev) => [it, ...prev]);
        }}
      />

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Title, tags, category…"
        filters={[
          { label: "type", value: type, onChange: (v) => setType(v), options: [
            { value: "", label: "All types" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
            { value: "pdf", label: "PDF" },
            { value: "audio", label: "Audio" },
            { value: "other", label: "Other" },
          ]},
          { label: "status", value: status, onChange: (v) => setStatus(v), options: [
            { value: "", label: "All status" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]},
        ]}
        onClear={() => { setQ(""); setType(""); setStatus(""); setCategory(""); }}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <Skeleton className="h-64 w-full rounded-[24px]" />
            <Skeleton className="h-64 w-full rounded-[24px]" />
            <Skeleton className="h-64 w-full rounded-[24px]" />
            <Skeleton className="h-64 w-full rounded-[24px]" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media found"
          message="Upload new files or adjust your filters."
          actionLabel="Upload"
          onAction={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      ) : (
        <MediaGrid items={items} onOpen={openDrawer} />
      )}

      <MediaDrawer
        open={open}
        item={active}
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
        onChanged={onChanged}
      />
    </div>
  );
}
