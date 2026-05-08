import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import Skeleton from "./Skeleton";
import {
  UploadCloud,
  Search,
  X,
  Image as Img,
  Film,
  FileText,
} from "lucide-react";

function typeIcon(type) {
  if (type === "image") return Img;
  if (type === "video") return Film;
  return FileText;
}

export default function AttachmentPicker({
  open,
  onClose,
  listMedia, // async ({ q, limit }) => { items: [] }
  uploadFiles, // async (files) => { items: [] } OR return uploaded objects
  onPick, // (pickedItems[]) => void
  title = "Attach files",
}) {
  const inputRef = useRef(null);
  const [tab, setTab] = useState("library"); // library | upload
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({}); // id -> item
  const [busy, setBusy] = useState(false);

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const load = async () => {
    if (!listMedia) return;
    setLoading(true);
    try {
      const res = await listMedia({ q, limit: 30 });
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setTab("library");
    setQ("");
    setItems([]);
    setSelected({});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || tab !== "library") return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tab, open]);

  const toggle = (m) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[m._id]) delete next[m._id];
      else next[m._id] = m;
      return next;
    });
  };

  const pick = () => {
    onPick?.(selectedList);
    onClose?.();
  };

  const onUploadPick = async (files) => {
    if (!uploadFiles) return;
    setBusy(true);
    try {
      const res = await uploadFiles(files);
      const uploaded = res?.items || res?.uploaded || [];
      // auto-select uploaded
      setSelected((s) => {
        const next = { ...s };
        uploaded.forEach((u) => (next[u._id] = u));
        return next;
      });
      setTab("library");
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-[min(980px,96vw)] portal-glass p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">
              Upload new files or pick approved media from your library.
            </div>
          </div>
          <button
            className="portal-btn h-11 w-11 border border-black/10 bg-white"
            onClick={onClose}
          >
            <X className="mx-auto" />
          </button>
        </div>

        {/* tabs */}
        <div className="mt-4 flex gap-2">
          <button
            className={[
              "portal-btn px-4 h-10",
              tab === "library" ? "bg-white" : "bg-white/60",
            ].join(" ")}
            onClick={() => setTab("library")}
          >
            Library
          </button>
          <button
            className={[
              "portal-btn px-4 h-10",
              tab === "upload" ? "bg-white" : "bg-white/60",
            ].join(" ")}
            onClick={() => setTab("upload")}
          >
            Upload
          </button>

          <div className="ml-auto text-xs text-slate-600 flex items-center gap-2">
            Selected: <b>{selectedList.length}</b>
          </div>
        </div>

        {tab === "upload" ? (
          <Card className="p-5 mt-4">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => onUploadPick(e.target.files)}
            />
            <button
              type="button"
              className="w-full rounded-2xl border-2 border-dashed border-black/10 bg-white p-6 hover:bg-black/[0.02] transition text-left"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Click to upload
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Images, videos, PDF.
                  </div>
                </div>
              </div>
            </button>
          </Card>
        ) : (
          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search media..."
                className="w-full h-11 rounded-2xl border border-black/10 px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (items || []).length === 0 ? (
                <div className="text-sm text-slate-500 p-6 text-center">
                  No media found.
                </div>
              ) : (
                <div className="grid gap-2 max-h-[360px] overflow-y-auto no-scrollbar">
                  {items.map((m) => {
                    const Icon = typeIcon(m.type);
                    const isSel = Boolean(selected[m._id]);
                    return (
                      <button
                        key={m._id}
                        onClick={() => toggle(m)}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 text-left flex items-center justify-between gap-3 transition",
                          isSel
                            ? "border-black/10 bg-black/[0.03]"
                            : "border-black/10 bg-white hover:bg-black/[0.02]",
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white">
                            <Icon size={18} />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-slate-900">
                              {m.title || "Untitled"}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {m.category || m.type || ""}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-600">
                          {isSel ? "Selected" : "Pick"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={pick} disabled={busy || selectedList.length === 0}>
            Attach ({selectedList.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
