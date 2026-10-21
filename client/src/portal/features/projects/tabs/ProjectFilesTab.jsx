import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileImage, FileText, FileVideo, FolderOpen, Upload } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import LoadingState from "../../../shared/ui/LoadingState";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useToast } from "../../../shared/ui/Toast";
import { listFiles, uploadFiles, withFileLinks } from "../../files/api";
import { formatDate } from "../format";

function kindOf(item) {
  const mime = String(item?.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}
const ICON = { image: FileImage, video: FileVideo, document: FileText };

// Files attached to this project (PUI-2), from GET /api/files?projectId=… .
// Clients only ever receive files marked visible to them (server rule).
// Uploading is offered only with files.write; new uploads stay internal and
// unapproved, as before.
export default function ProjectFilesTab({ project, canUpload }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!project?._id) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await listFiles({ projectId: project._id, limit: 60, page: 1, sort: "-createdAt" });
      setItems(await withFileLinks(Array.isArray(res?.items) ? res.items : []));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [project?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = async (e) => {
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
      toast.success(`${files.length} file${files.length === 1 ? "" : "s"} added.`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "The upload didn't finish. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const upload = canUpload ? (
    <>
      <input ref={inputRef} type="file" multiple hidden onChange={onFiles} aria-hidden="true" tabIndex={-1} />
      <Button size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
        <Upload size={14} aria-hidden="true" />
        Add files
      </Button>
    </>
  ) : null;

  if (loading) return <LoadingState rows={4} label="Loading files" />;
  if (failed) return <ErrorState title="Files didn't load" onRetry={load} />;
  if (!items.length) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No files yet"
        message="Briefs, references, proposals and deliverables attached to this project appear here."
        action={upload}
      />
    );
  }

  const approved = items.filter((x) => x.approved).length;
  const shared = items.filter((x) => x.visibility === "client").length;

  return (
    <Panel
      title="Files"
      sub={`${items.length} file${items.length === 1 ? "" : "s"}, ${approved} approved, ${shared} visible to the client`}
      flush
      action={upload}
    >
      <ul className="px-files">
        {items.map((item) => {
          const kind = kindOf(item);
          const Icon = ICON[kind];
          const src = item?.src ?? item?.url ?? "";
          const name = item?.title || item?.originalName || "Untitled file";
          return (
            <li key={item._id}>
              <span className="px-thumb" aria-hidden="true">
                {kind === "image" && src ? <img src={src} alt="" /> : <Icon size={18} />}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="px-t">{name}</div>
                <div className="px-s">
                  {[item?.originalName && item.originalName !== name ? item.originalName : null, formatDate(item?.createdAt)]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
              <div className="px-tags">
                <Badge tone={item?.visibility === "client" ? "info" : "neutral"}>
                  {item?.visibility === "client" ? "Client visible" : "Internal"}
                </Badge>
                {item?.approved ? (
                  <Badge tone="ok" dot>
                    Approved
                  </Badge>
                ) : null}
                {src ? (
                  <a className="px-btn px-btn--ghost px-btn--sm" href={src} target="_blank" rel="noreferrer">
                    <Eye size={14} aria-hidden="true" />
                    Open<span className="sr-only"> {name} (opens in a new tab)</span>
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
