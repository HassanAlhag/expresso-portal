// src/portal/features/media-library/components/MediaPickerModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { X, Search, Image as ImageIcon, Check, RefreshCw } from "lucide-react";

import { listMedia } from "../api";
import MediaUploader from "./MediaUploader";

import { getAssetUrl } from "../../../shared/utils/assetUrl";

export default function MediaPickerModal({
  open,
  onClose,
  onSelect, // single => item, multiple => items[]
  title = "Select media",
  subtitle = "Choose assets from the media library.",
  onlyType = "", // "image" | "video" | ...
  multiple = false,
  allowUpload = true,
  limit = 48,
  status = "", // keep empty for internal/admin usage
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (search = "") => {
      if (!open) return;

      setLoading(true);
      try {
        const params = {
          q: search,
          limit,
        };

        if (onlyType) params.type = onlyType;
        if (status) params.status = status;

        const res = await listMedia(params);
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        console.error("MediaPickerModal load failed:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [open, onlyType, limit, status]
  );

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSelectedIds([]);
    load("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      load(q);
    }, 250);

    return () => clearTimeout(timer);
  }, [q, open, load]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selectedItems = useMemo(() => {
    return items.filter((x) => selectedIds.includes(String(x._id)));
  }, [items, selectedIds]);

  const toggle = (item) => {
    const id = String(item._id);

    if (!multiple) {
      setSelectedIds([id]);
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm p-4 sm:p-6"
      onMouseDown={() => onClose?.()}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex w-full max-w-6xl max-h-[92vh] flex-col overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-black/10 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {title}
                </div>
                <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-black/[0.03]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Upload */}
          {allowUpload ? (
            <div className="shrink-0 border-b border-black/10 bg-white p-4">
              <MediaUploader
                onUploaded={(it) => {
                  if (!it?._id) return;
                  if (onlyType && it.type !== onlyType) return;

                  setItems((prev) => [it, ...prev]);

                  if (multiple) {
                    setSelectedIds((prev) => [
                      ...new Set([...prev, String(it._id)]),
                    ]);
                  } else {
                    setSelectedIds([String(it._id)]);
                  }
                }}
              />
            </div>
          ) : null}

          {/* Search */}
          <div className="shrink-0 border-b border-black/10 bg-white p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr,auto] items-end">
              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  SEARCH
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search title, category, tags..."
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none shadow-sm transition focus:ring-4 focus:ring-black/5"
                  />
                </div>
              </label>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => load(q)}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-64 w-full rounded-[24px]" />
                <Skeleton className="h-64 w-full rounded-[24px]" />
                <Skeleton className="h-64 w-full rounded-[24px]" />
                <Skeleton className="h-64 w-full rounded-[24px]" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No media found"
                message="Upload a new file or change your search."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((m) => {
                  const checked = selectedIds.includes(String(m._id));

                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggle(m)}
                      className={`group relative overflow-hidden rounded-[24px] border bg-white text-left transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)] ${
                        checked
                          ? "border-[var(--brand)] ring-4 ring-[rgba(111,127,217,0.15)]"
                          : "border-black/10"
                      }`}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                        {m.type === "image" ? (
                          <img
                            src={getAssetUrl(m.thumbnailUrl || m.url)}
                            alt={m.title || "Media"}
                            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                            {m.type || "FILE"}
                          </div>
                        )}
                      </div>

                      {checked ? (
                        <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--brand)] text-white shadow-lg">
                          <Check size={16} />
                        </div>
                      ) : null}

                      <div className="p-4">
                        <div className="truncate text-sm font-black text-slate-900">
                          {m.title || "Untitled"}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {m.category || "Uncategorized"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-black/10 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Selected:{" "}
                <span className="font-black text-slate-900">
                  {selectedIds.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onClose?.()}>
                  Cancel
                </Button>
                <Button
                  disabled={!selectedIds.length}
                  onClick={() => {
                    onSelect?.(
                      multiple ? selectedItems : selectedItems[0] || null
                    );
                    onClose?.();
                  }}
                >
                  {multiple ? "Use selected media" : "Use this media"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
