import React, { useRef, useState } from "react";
import { useToast } from "../../../shared/ui/Toast";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { Upload } from "lucide-react";
import { uploadMedia } from "../api";

const BRAND = "#7F8AD1";

export default function MediaUploader({ onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const res = await uploadMedia({
        file,
        title: title || file.name,
        tags,
        category,
        status: "draft",
      });
      onUploaded?.(res?.item);
      setTitle("");
      setTags("");
      setCategory("");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-12 items-end">
        <div className="md:col-span-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title…"
          />
        </div>

        <div className="md:col-span-4">
          <Input
            label="Tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma separated…"
          />
        </div>

        <div className="md:col-span-3">
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Branding"
          />
        </div>

        <div className="md:col-span-1">
          <input
            ref={inputRef}
            type="file"
            onChange={onFile}
            className="hidden"
          />
          <Button
            onClick={pick}
            disabled={busy}
            className="w-full"
            style={{ backgroundColor: BRAND }}
          >
            <Upload size={16} />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Upload images/videos/pdf. Saved as{" "}
        <span className="font-extrabold">draft</span> by default.
      </div>
    </div>
  );
}
