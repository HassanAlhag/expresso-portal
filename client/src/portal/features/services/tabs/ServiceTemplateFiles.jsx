// client/src/portal/features/services/components/ServiceTemplateFiles.jsx
import React, { useRef, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { UploadCloud, Paperclip, Trash2 } from "lucide-react";
import { useToast } from "../../../shared/ui/Toast";

export default function ServiceTemplateFiles({
  value,
  onChange,
  onUploadFiles, // optional async(files)
}) {
  const toast = useToast();
  const v = value || { uploads: [], mediaRefs: [] };
  const set = (patch) => onChange({ ...v, ...patch });

  const inputRef = useRef(null);
  const [mediaIds, setMediaIds] = useState("");

  const pick = () => inputRef.current?.click();

  const addMediaRefs = () => {
    const ids = mediaIds
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (ids.length === 0) return;

    const next = [
      ...(v.mediaRefs || []),
      ...ids.map((id) => ({ mediaId: id })),
    ];
    set({ mediaRefs: next });
    setMediaIds("");
  };

  const removeMediaRef = (mediaId) =>
    set({
      mediaRefs: (v.mediaRefs || []).filter((m) => m.mediaId !== mediaId),
    });

  const removeUpload = (id) =>
    set({ uploads: (v.uploads || []).filter((u) => u.id !== id) });

  const upload = async (files) => {
    if (!onUploadFiles) { toast.warning("Upload endpoint not connected yet."); return; }
    await onUploadFiles(files);
  };

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="text-sm font-extrabold text-slate-900">Files</div>
        <div className="mt-1 text-sm text-slate-600">
          Add references (from Media Library) or upload template attachments
          (brief, guidelines, examples).
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Upload */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-sm font-extrabold text-slate-900">Upload</div>
            <div className="mt-1 text-xs text-slate-500">
              Requires backend: POST /service/:id/files
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />

            <Button variant="outline" onClick={pick} className="mt-3">
              <UploadCloud size={16} />
              Upload files
            </Button>

            {(v.uploads || []).length ? (
              <div className="mt-3 grid gap-2">
                {(v.uploads || []).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-black/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900">
                        {u.name}
                      </div>
                      <div className="text-xs text-slate-500">{u.url}</div>
                    </div>
                    <button
                      className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/[0.03]"
                      onClick={() => removeUpload(u.id)}
                      title="Remove"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Media refs */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-sm font-extrabold text-slate-900">
              Media Library refs
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Paste Media IDs (later we can add a proper picker).
            </div>

            <div className="mt-3 grid gap-2">
              <Input
                label="MEDIA IDS (comma separated)"
                value={mediaIds}
                onChange={(e) => setMediaIds(e.target.value)}
                placeholder="65ab..., 65ac..."
              />

              <Button variant="outline" onClick={addMediaRefs}>
                <Paperclip size={16} />
                Attach refs
              </Button>
            </div>

            {(v.mediaRefs || []).length ? (
              <div className="mt-3 grid gap-2">
                {(v.mediaRefs || []).map((m) => (
                  <div
                    key={m.mediaId}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-black/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900">
                        Media ID
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {m.mediaId}
                      </div>
                    </div>
                    <button
                      className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/[0.03]"
                      onClick={() => removeMediaRef(m.mediaId)}
                      title="Remove"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
