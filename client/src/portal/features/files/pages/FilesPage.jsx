import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import {
  UploadCloud,
  RefreshCw,
  Files as FilesIcon,
  CheckCircle2,
  Lock,
  Globe,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileGeneric,
  ExternalLink,
} from "lucide-react";

import { listFiles, uploadFiles as apiUploadFiles, updateFile, deleteFile } from "../api";

const BRAND = "#7F8AD1";

function Pill({ tone = "slate", children }) {
  const map = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        map[tone] || map.slate,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function FileTypeIcon({ mimeType, size = 18 }) {
  const m = String(mimeType || "");
  if (m.startsWith("image/")) return <FileImage size={size} className="text-violet-500" />;
  if (m.startsWith("video/")) return <FileVideo size={size} className="text-blue-500" />;
  if (m.startsWith("audio/")) return <FileAudio size={size} className="text-amber-500" />;
  if (m.includes("pdf") || m.includes("document") || m.includes("text")) return <FileText size={size} className="text-rose-500" />;
  return <FileGeneric size={size} className="text-slate-400" />;
}

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function UploadModal({ open, onClose, onUploaded, busy }) {
  const inputRef = useRef(null);

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

  if (!open) return null;

  const pick = () => inputRef.current?.click();

  const addFiles = (picked) => {
    const arr = Array.from(picked || []);
    if (!arr.length) return;
    const next = [...files];
    arr.forEach((f) => {
      if (!next.some((x) => x.name === f.name && x.size === f.size))
        next.push(f);
    });
    setFiles(next);
  };

  const remove = (idx) => {
    const next = [...files];
    next.splice(idx, 1);
    setFiles(next);
  };

  const submit = async () => {
    await onUploaded({ files, visibility, approved, title, notes, tags });
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-[min(980px,96vw)] rounded-3xl border border-black/10 bg-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">
                Upload files
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Upload assets, approvals, briefs. Mark as client-visible when
                ready.
              </div>
            </div>
            <button
              className="h-11 w-11 rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                VISIBILITY
              </span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              >
                <option value="internal">Internal</option>
                <option value="client">Client</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                TITLE (optional)
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                placeholder="e.g. February campaign assets"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                TAGS (comma)
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                placeholder="branding, reels, brief"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            Mark as approved
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              NOTES (optional)
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              placeholder="Anything the team/client should know…"
            />
          </label>

          <Card className="p-4">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={pick}
              className="w-full rounded-2xl border-2 border-dashed border-black/10 bg-white p-5 text-left hover:bg-black/[0.02] transition"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                  <UploadCloud size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    Click to select files
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Supports any file type. Max 20 files.
                  </div>
                </div>
              </div>
            </button>

            {files.length ? (
              <div className="mt-3 grid gap-2">
                {files.map((f, idx) => (
                  <div
                    key={f.name + f.size}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900">
                        {f.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatSize(f.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        <div className="p-6 border-t border-black/10 bg-white flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !files.length}
            style={{ backgroundColor: BRAND }}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FilesPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("");
  const [approved, setApproved] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listFiles({
        q,
        visibility,
        approved,
        sort,
        page,
        limit,
      });
      setItems(res?.items || []);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? 0,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load files"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, visibility, approved, sort, page]);

  const stats = useMemo(() => {
    const total = meta.total || 0;
    const approved = items.filter((x) => x.approved).length;
    const clientVisible = items.filter((x) => x.visibility === "client").length;
    return { total, approved, clientVisible };
  }, [items, meta.total]);

  const onUpload = async (fd) => {
    setBusy(true);
    try {
      await apiUploadFiles(fd);
      setUploadOpen(false);
      setPage(1);
      await load();
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
      toast.error(e?.response?.data?.message || e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (f) => {
    if (!f?._id) return;
    setConfirm({
      title: "Delete file",
      message: `Delete "${f.originalName}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirm(null);
        try {
          await deleteFile(f._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CORE"
        title="Files"
        subtitle="Uploads, approvals, and client-visible assets."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Files" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={() => setUploadOpen(true)} disabled={busy} style={{ backgroundColor: BRAND }}>
              <UploadCloud size={16} />
              Upload
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={FilesIcon}    label="Total Files"     value={stats.total}       color="indigo"  />
        <StatCard icon={CheckCircle2} label="Approved"        value={stats.approved}    color="emerald" />
        <StatCard icon={Globe}        label="Client-visible"  value={stats.clientVisible} color="blue"  />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="File name, title, notes, tags…"
        filters={[
          { label: "visibility", value: visibility, onChange: (v) => { setVisibility(v); setPage(1); }, options: [
            { value: "", label: "All visibility" },
            { value: "internal", label: "Internal" },
            { value: "client",   label: "Client"   },
          ]},
          { label: "approved", value: approved, onChange: (v) => { setApproved(v); setPage(1); }, options: [
            { value: "",      label: "All"         },
            { value: "true",  label: "Approved"    },
            { value: "false", label: "Not approved" },
          ]},
          { label: "sort", value: sort, onChange: (v) => { setSort(v); setPage(1); }, options: [
            { value: "-createdAt", label: "Newest"   },
            { value: "createdAt",  label: "Oldest"   },
            { value: "-size",      label: "Largest"  },
            { value: "size",       label: "Smallest" },
          ]},
        ]}
        onClear={() => { setQ(""); setVisibility(""); setApproved(""); setSort("-createdAt"); setPage(1); }}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={FilesIcon}
            title="No files yet"
            description="Upload approvals, briefs, and assets — mark client-visible when ready."
            actionLabel="Upload"
            onAction={() => setUploadOpen(true)}
          />
        </Card>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="divide-y divide-black/10">
            {items.map((f) => (
              <div
                key={f._id}
                className="p-4 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <FileTypeIcon mimeType={f.mimeType} size={20} />
                  </div>

                  <div className="min-w-0">
                    <button
                      className="text-left"
                      onClick={() => window.open(f.url, "_blank")}
                      title="Open file"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          {f.title || f.originalName}
                        </div>
                        <ExternalLink size={12} className="text-slate-400 shrink-0" />
                      </div>
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Pill tone={f.visibility === "client" ? "indigo" : "slate"}>
                        {f.visibility === "client" ? (
                          <span className="inline-flex items-center gap-1">
                            <Globe size={12} /> CLIENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Lock size={12} /> INTERNAL
                          </span>
                        )}
                      </Pill>

                      {f.approved ? (
                        <Pill tone="green">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> APPROVED
                          </span>
                        </Pill>
                      ) : null}

                      <span className="text-xs text-slate-400">{formatSize(f.size)}</span>
                    </div>

                    <div className="mt-1 text-xs text-slate-500 truncate">
                      {f.customerId?.companyName ? `Client: ${f.customerId.companyName}` : ""}
                      {f.jobId?.title ? ` · Job: ${f.jobId.title}` : ""}
                      {!f.customerId?.companyName && !f.jobId?.title ? "—" : ""}
                    </div>

                    {f.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.tags.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full border border-black/10 bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-slate-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleApprove(f)}
                    disabled={busy}
                    title={f.approved ? "Mark unapproved" : "Mark approved"}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-black/[0.03] disabled:opacity-50"
                  >
                    {f.approved
                      ? <><ToggleRight size={14} className="text-emerald-500" /> Approved</>
                      : <><ToggleLeft size={14} className="text-slate-400" /> Approve</>}
                  </button>

                  <Button
                    variant="outline"
                    onClick={() => onCopy(f.url)}
                    disabled={busy}
                  >
                    <Copy size={16} />
                    Copy link
                  </Button>

                  {f.customerId?._id ? (
                    <Button
                      variant="outline"
                      onClick={() => nav(`/portal/customers/${f.customerId._id}`)}
                      disabled={busy}
                    >
                      Client
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    onClick={() => onDelete(f)}
                    disabled={busy}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 px-4 py-3">
            <div className="text-xs text-slate-500">
              Showing page <span className="font-extrabold">{meta.page}</span>{" "}
              of <span className="font-extrabold">{meta.pages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={meta.page >= meta.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={onUpload}
        busy={busy}
      />
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
