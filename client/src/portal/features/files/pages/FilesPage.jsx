import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Modal from "../../../shared/ui/Modal";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import {
  UploadCloud,
  RefreshCw,
  Files as FilesIcon,
  CheckCircle2,
  Globe,
  Lock,
  Copy,
  Trash2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileGeneric,
  ExternalLink,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react";

import {
  listFiles,
  uploadFiles as apiUploadFiles,
  updateFile,
  deleteFile,
  openFile,
} from "../api";

const BRAND = "#7F8AD1";

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(2)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileIconMeta(mimeType) {
  const m = String(mimeType || "");
  if (m.startsWith("image/"))
    return {
      Icon: FileImage,
      bg: "bg-violet-50",
      text: "text-violet-500",
      border: "border-violet-100",
    };
  if (m.startsWith("video/"))
    return {
      Icon: FileVideo,
      bg: "bg-blue-50",
      text: "text-blue-500",
      border: "border-blue-100",
    };
  if (m.startsWith("audio/"))
    return {
      Icon: FileAudio,
      bg: "bg-amber-50",
      text: "text-amber-500",
      border: "border-amber-100",
    };
  if (
    m.includes("pdf") ||
    m.includes("document") ||
    m.includes("text") ||
    m.includes("word") ||
    m.includes("sheet")
  )
    return {
      Icon: FileText,
      bg: "bg-rose-50",
      text: "text-rose-500",
      border: "border-rose-100",
    };
  return {
    Icon: FileGeneric,
    bg: "bg-slate-50",
    text: "text-slate-400",
    border: "border-slate-100",
  };
}

/* ─── Upload Modal ─────────────────────────────────────────── */

function UploadModal({ open, onClose, onUpload, busy }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [visibility, setVisibility] = useState("internal");
  const [approved, setApproved] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!open) return;
    setVisibility("internal");
    setApproved(false);
    setTitle("");
    setNotes("");
    setTags("");
    setFiles([]);
  }, [open]);

  const addFiles = (picked) => {
    const arr = Array.from(picked || []);
    if (!arr.length) return;
    setFiles((prev) => {
      const next = [...prev];
      arr.forEach((f) => {
        if (!next.some((x) => x.name === f.name && x.size === f.size))
          next.push(f);
      });
      return next;
    });
  };

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button
        disabled={busy || !files.length}
        onClick={() => onUpload({ files, visibility, approved, title, notes, tags })}
        style={{ backgroundColor: BRAND }}
      >
        <UploadCloud size={15} />
        {busy
          ? "Uploading…"
          : files.length > 0
          ? `Upload ${files.length} file${files.length > 1 ? "s" : ""}`
          : "Upload"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Files"
      subtitle="Upload assets, briefs, and approvals. Mark as client-visible when ready."
      width="680px"
      footer={footer}
    >
      <div className="grid gap-4">
        {/* Options row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              VISIBILITY
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="internal">Internal only</option>
              <option value="client">Client-visible</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              TITLE (optional)
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. February campaign"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
              TAGS
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="branding, brief"
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-black/[0.07] bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100">
          <input
            type="checkbox"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          Mark as approved
        </label>

        <label className="grid gap-1.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
            NOTES (optional)
          </span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="Anything to note for the team or client…"
          />
        </label>

        {/* Drop zone */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
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
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={[
            "cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition",
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-black/[0.09] bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30",
          ].join(" ")}
        >
          <div className="flex flex-col items-center gap-2">
            <UploadCloud
              size={22}
              className={dragging ? "text-indigo-500" : "text-slate-400"}
            />
            <div className="text-sm font-extrabold text-slate-700">
              {dragging
                ? "Release to add files"
                : "Drop files here or click to browse"}
            </div>
            <div className="text-xs text-slate-400">
              Supports any file type
            </div>
          </div>
        </div>

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="grid gap-2">
            {files.map((f, idx) => {
              const { Icon, bg, text } = fileIconMeta(f.type);
              return (
                <div
                  key={f.name + f.size}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.07] bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${bg} ${text}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatSize(f.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/[0.07] text-slate-400 transition hover:text-slate-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── Files Page ────────────────────────────────────────────── */

export default function FilesPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [pageDragging, setPageDragging] = useState(false);
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("");
  const [approved, setApproved] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listFiles({ q, visibility, approved, sort, page, limit });
      setItems(res?.items || []);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? 0,
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, visibility, approved, sort, page]);

  const stats = useMemo(() => {
    const total = meta.total || 0;
    const approvedCount = items.filter((x) => x.approved).length;
    const clientVisible = items.filter((x) => x.visibility === "client").length;
    return { total, approved: approvedCount, clientVisible };
  }, [items, meta.total]);

  const onUpload = async (fd) => {
    setBusy(true);
    try {
      await apiUploadFiles(fd);
      setUploadOpen(false);
      setPage(1);
      await load();
      toast.success("Files uploaded successfully");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onQuickUpload = async (files) => {
    if (!files.length) return;
    setBusy(true);
    try {
      await apiUploadFiles({
        files: Array.from(files),
        visibility: "internal",
        approved: false,
        title: "",
        notes: "",
        tags: "",
      });
      await load();
      toast.success(
        `${files.length} file${files.length > 1 ? "s" : ""} uploaded`
      );
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const onToggleApprove = async (f) => {
    setBusy(true);
    try {
      const res = await updateFile(f._id, { approved: !f.approved });
      setItems((prev) => prev.map((x) => (x._id === f._id ? res.item : x)));
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onToggleVisibility = async (f) => {
    setBusy(true);
    try {
      const res = await updateFile(f._id, {
        visibility: f.visibility === "client" ? "internal" : "client",
      });
      setItems((prev) => prev.map((x) => (x._id === f._id ? res.item : x)));
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (f) => {
    if (!f?._id) return;
    setConfirmState({
      title: "Delete file",
      message: `Delete "${f.title || f.originalName}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deleteFile(f._id);
          await load();
          toast.success("File deleted");
        } catch (e) {
          toast.error(
            e?.response?.data?.message || e?.message || "Delete failed"
          );
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const hasFilters = q || visibility || approved || sort !== "-createdAt";

  return (
    <div
      className="grid gap-6"
      onDragOver={(e) => {
        e.preventDefault();
        setPageDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget))
          setPageDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setPageDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length) onQuickUpload(files);
      }}
    >
      <PageHeader
        eyebrow="CORE"
        title="Files"
        subtitle="Uploads, approvals, and client-visible assets."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Files" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading || busy}
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setUploadOpen(true)}
              disabled={busy}
              style={{ backgroundColor: BRAND }}
            >
              <UploadCloud size={15} />
              Upload files
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: FilesIcon,
            label: "Total Files",
            value: stats.total,
            iconCls: "bg-indigo-50 text-indigo-600",
          },
          {
            icon: CheckCircle2,
            label: "Approved",
            value: stats.approved,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            icon: Globe,
            label: "Client-visible",
            value: stats.clientVisible,
            iconCls: "bg-sky-50 text-sky-600",
          },
        ].map(({ icon: Icon, label, value, iconCls }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm"
          >
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconCls}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-black tabular-nums text-slate-900">
                {value}
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Page-level drop zone hint */}
      <div
        className={[
          "flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-all duration-200",
          pageDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-black/[0.08] bg-slate-50/40",
        ].join(" ")}
      >
        <div
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/[0.07] bg-white transition",
            pageDragging ? "text-indigo-500" : "text-slate-400",
          ].join(" ")}
        >
          <UploadCloud size={18} />
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-700">
            {pageDragging
              ? "Release to upload files"
              : "Drop files anywhere on this page to upload instantly"}
          </div>
          <div className="text-xs text-slate-400">
            Uploads as Internal · or use the button above for more options
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="File name, title, tags…"
            className="h-10 w-full rounded-2xl border border-black/[0.07] bg-white pl-9 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {q && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              onClick={() => {
                setQ("");
                setPage(1);
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value);
            setPage(1);
          }}
          className="h-10 appearance-none rounded-2xl border border-black/[0.07] bg-white px-3 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All visibility</option>
          <option value="internal">Internal</option>
          <option value="client">Client</option>
        </select>

        <select
          value={approved}
          onChange={(e) => {
            setApproved(e.target.value);
            setPage(1);
          }}
          className="h-10 appearance-none rounded-2xl border border-black/[0.07] bg-white px-3 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All approval</option>
          <option value="true">Approved</option>
          <option value="false">Not approved</option>
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="h-10 appearance-none rounded-2xl border border-black/[0.07] bg-white px-3 pr-8 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-size">Largest first</option>
          <option value="size">Smallest first</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              setVisibility("");
              setApproved("");
              setSort("-createdAt");
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-black/[0.07] bg-white px-3 py-2 text-xs font-extrabold text-slate-600 shadow-sm transition hover:bg-black/[0.03]"
          >
            <X size={12} />
            Clear filters
          </button>
        )}
      </div>

      {/* File list */}
      {loading ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FilesIcon}
          title="No files found"
          message="Upload files or adjust your search filters."
          actionLabel="Upload files"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(320px,1fr)_190px_220px_120px_176px] gap-4 border-b border-black/[0.06] bg-slate-50/70 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                <div>File</div>
                <div>Status</div>
                <div>Context</div>
                <div>Size</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="divide-y divide-black/[0.06]">
                {items.map((f) => {
                  const { Icon, bg, text } = fileIconMeta(f.mimeType);
                  return (
                    <div
                      key={f._id}
                      className="grid grid-cols-[minmax(320px,1fr)_190px_220px_120px_176px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg} ${text}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => openFile(f).catch(() => toast.error("Could not open file"))}
                            className="block max-w-full truncate text-left text-sm font-black text-slate-900 transition hover:text-indigo-600"
                            title={f.title || f.originalName}
                          >
                            {f.title || f.originalName}
                          </button>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {f.originalName}
                          </div>
                          {f.tags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {f.tags.slice(0, 4).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full border border-black/[0.07] bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-600"
                                >
                                  #{t}
                                </span>
                              ))}
                              {f.tags.length > 4 && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">
                                  +{f.tags.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2">
                        <button
                          onClick={() => onToggleVisibility(f)}
                          disabled={busy}
                          title={`Click to make ${
                            f.visibility === "client"
                              ? "internal"
                              : "client-visible"
                          }`}
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] transition disabled:opacity-50",
                            f.visibility === "client"
                              ? "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100"
                              : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
                          ].join(" ")}
                        >
                          {f.visibility === "client" ? (
                            <>
                              <Globe size={10} />
                              Client
                            </>
                          ) : (
                            <>
                              <Lock size={10} />
                              Internal
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onToggleApprove(f)}
                          disabled={busy}
                          title={
                            f.approved ? "Mark unapproved" : "Mark approved"
                          }
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] transition disabled:opacity-50",
                            f.approved
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-black/[0.07] bg-slate-50 text-slate-500 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {f.approved ? (
                            <>
                              <CheckCircle2 size={10} />
                              Approved
                            </>
                          ) : (
                            <>
                              <Circle size={10} />
                              Approve
                            </>
                          )}
                        </button>
                      </div>

                      <div className="min-w-0 text-xs text-slate-500">
                        {f.customerId?.companyName ? (
                          <div className="truncate">
                            <span className="font-extrabold text-slate-700">
                              {f.customerId.companyName}
                            </span>
                          </div>
                        ) : (
                          <div className="font-extrabold text-slate-500">
                            General upload
                          </div>
                        )}
                        {f.jobId?.title && (
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            Job: {f.jobId.title}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-black text-slate-800">
                          {formatSize(f.size)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {formatDate(f.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5">
                        {!f.isPrivate && (
                        <button
                          onClick={() => onCopy(f.url)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] bg-white text-slate-500 transition hover:bg-black/[0.03] hover:text-slate-900"
                          title="Copy link"
                        >
                          <Copy size={14} />
                        </button>
                        )}
                        <button
                          onClick={() => openFile(f).catch(() => toast.error("Could not open file"))}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] bg-white text-slate-500 transition hover:bg-black/[0.03] hover:text-slate-900"
                          title="Open file"
                        >
                          <ExternalLink size={14} />
                        </button>
                        {f.customerId?._id && (
                          <button
                            onClick={() =>
                              nav(`/portal/customers/${f.customerId._id}`)
                            }
                            className="rounded-xl border border-black/[0.07] bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03]"
                          >
                            Client
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(f)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-white text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t border-black/[0.06] bg-slate-50/40 px-5 py-3">
            <div className="text-xs font-extrabold text-slate-500">
              {meta.total} file{meta.total !== 1 ? "s" : ""} &nbsp;·&nbsp; Page{" "}
              {meta.page} of {meta.pages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] bg-white text-slate-500 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(meta.pages, p + 1))
                }
                disabled={meta.page >= meta.pages}
                className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] bg-white text-slate-500 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={onUpload}
        busy={busy}
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
