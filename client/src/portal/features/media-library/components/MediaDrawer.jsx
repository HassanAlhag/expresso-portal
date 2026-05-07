import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import { X, Trash2, Save, Copy, ExternalLink } from "lucide-react";
import { updateMedia, deleteMedia } from "../api";

const BRAND = "#7F8AD1";

export default function MediaDrawer({ open, item, onClose, onChanged }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title || "");
    setTags((item.tags || []).join(", "));
    setCategory(item.category || "");
    setStatus(item.status || "draft");
  }, [item]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const save = async () => {
    setBusy(true);
    try {
      const res = await updateMedia(item._id, {
        title,
        category,
        tags,
        status,
      });
      onChanged?.(res?.item);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    setConfirm({
      title: "Delete Media",
      message: "Delete this media item?",
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteMedia(item._id);
          setConfirm(null);
          onChanged?.(null, { deleted: true, id: item._id });
          onClose?.();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setConfirm(null);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
        onMouseDown={onClose}
      />

      <div
        className="absolute right-0 top-0 flex h-full w-[min(560px,94vw)] flex-col border-l border-black/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.20)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-4">
          <div className="min-w-0">
            <div className="truncate text-base font-black text-slate-900">
              Media Details
            </div>
            <div className="text-xs text-slate-500">Press Esc to close</div>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 transition hover:bg-black/[0.03]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[24px] border border-black/10 bg-slate-50">
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={item.title}
                  className="max-h-[320px] w-full object-contain bg-black"
                />
              ) : (
                <div className="grid h-[240px] place-items-center text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                  Preview not supported for {item.type}
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <Input
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma separated…"
              />

              <label className="grid gap-2">
                <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  STATUS
                </span>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            <div className="rounded-[22px] border border-black/10 bg-slate-50 p-4">
              <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                FILE
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <div className="break-all text-slate-700">
                  <span className="font-black text-slate-900">URL:</span>{" "}
                  {item.url}
                </div>

                <div className="text-slate-700">
                  <span className="font-black text-slate-900">Type:</span>{" "}
                  {item.type || "—"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyUrl}>
                  <Copy size={16} />
                  Copy URL
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(item.url, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink size={16} />
                  Open file
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/10 bg-white p-4">
          <Button variant="outline" onClick={remove} disabled={busy}>
            <Trash2 size={16} />
            Delete
          </Button>

          <Button
            onClick={save}
            disabled={busy}
            style={{ backgroundColor: BRAND }}
          >
            <Save size={16} />
            Save changes
          </Button>
        </div>
      </div>

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
