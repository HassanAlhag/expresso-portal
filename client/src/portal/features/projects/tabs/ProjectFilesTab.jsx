import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../../shared/ui/Toast";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";
import { listFiles, uploadFiles } from "../../files/api";
import {
  FolderOpen,
  RefreshCw,
  FileImage,
  FileVideo,
  FileText,
  Eye,
  Upload,
} from "lucide-react";

function getFileUrl(item) {
  return item?.url || "";
}

function getTypeFromMime(item) {
  const mime = String(item?.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function getTypeIcon(type) {
  if (type === "video") return FileVideo;
  if (type === "image") return FileImage;
  return FileText;
}

function FileTypeBadge({ type }) {
  const toneMap = {
    image: "info",
    video: "warning",
    document: "neutral",
  };

  return <Badge tone={toneMap[type] || "neutral"}>{type}</Badge>;
}

function FileCard({ item }) {
  const fileType = getTypeFromMime(item);
  const Icon = getTypeIcon(fileType);
  const src = getFileUrl(item);

  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-[16/10] overflow-hidden border-b border-black/10 bg-slate-50">
        {fileType === "image" && src ? (
          <img
            src={src}
            alt={item?.title || "File"}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : fileType === "video" && src ? (
          <video
            className="h-full w-full bg-black object-cover"
            src={src}
            controls
            playsInline
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-500">
            <Icon size={28} />
          </div>
        )}
      </div>

      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-900">
              {item?.title || item?.originalName || "Untitled file"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {item?.originalName || "—"}
            </div>
          </div>

          <FileTypeBadge type={fileType} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={item?.approved ? "success" : "neutral"}>
            {item?.approved ? "approved" : "internal"}
          </Badge>

          <Badge tone="neutral">{item?.visibility || "internal"}</Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-xs text-slate-500">
            {(item?.tags || []).slice(0, 3).join(", ") || "No tags"}
          </div>

          {src ? (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              <Eye size={14} />
              Open
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function ProjectFilesTab({ project }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!project?._id) return;

    setLoading(true);
    setError("");

    try {
      const res = await listFiles({
        projectId: project._id,
        limit: 60,
        page: 1,
        sort: "-createdAt",
      });

      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load files"
      );
    } finally {
      setLoading(false);
    }
  }, [project?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      approved: items.filter((x) => x.approved).length,
      clientVisible: items.filter((x) => x.visibility === "client").length,
    };
  }, [items]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !project?._id) return;

    setUploading(true);
    try {
      await uploadFiles({
        files,
        customerId: project?.customerId?._id || project?.customerId || "",
        projectId: project._id,
        visibility: "internal",
        approved: false,
        title: "",
        notes: "",
        tags: project?.name || "",
      });

      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900">
              Project files
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Files directly attached to this project, including briefs,
              references, proposals, calendars, deliverables, and approvals.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading || uploading}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">
              <Upload size={16} />
              Add file
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Files: {stats.total}</Badge>
        <Badge tone="success">Approved: {stats.approved}</Badge>
        <Badge tone="info">Client visible: {stats.clientVisible}</Badge>
        {project?.projectMode ? (
          <Badge tone="neutral">
            {String(project.projectMode).replaceAll("_", " ")}
          </Badge>
        ) : null}
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={FolderOpen}
            title="No project files yet"
            message="Upload files directly into this project. They will stay properly linked to the project instead of being guessed from media titles."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <FileCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
