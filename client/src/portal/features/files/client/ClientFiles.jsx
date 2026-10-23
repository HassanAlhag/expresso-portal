import React, { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, RefreshCw, SearchX, UploadCloud } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import SearchField from "../../../shared/ui/SearchField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import RecordPicker from "../../../shared/ui/RecordPicker";
import RowActions from "../../../shared/ui/RowActions";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listFiles, openFile, uploadFiles } from "../api";
import { listProjects } from "../../projects/api";

const LIMIT = 12;

export function fileSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
const date = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export function buildClientFileParams({ q, page }) {
  const p = { page, limit: LIMIT, sort: "-createdAt" };
  if (q) p.q = q;
  return p;
}

// Files, client view (PUI-5): documents shared with the company. The API
// returns only the company's files marked for the client; uploads are
// stored for the company and shared with Expresso.
export default function ClientFiles() {
  const toast = useToast();
  const access = useAccess();
  const canUpload = access.can("files.write");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const [form, setForm] = useState({ title: "", notes: "", project: null });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listFiles(buildClientFileParams({ q: dq.trim(), page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const open = async (f) => {
    try {
      await openFile(f);
    } catch {
      toast.error("That file couldn't be opened. Try again.");
    }
  };

  const startUpload = () => {
    setPicked([]);
    setForm({ title: "", notes: "", project: null });
    setFormError("");
    setUploadOpen(true);
  };

  const upload = async () => {
    setBusy(true);
    setFormError("");
    try {
      await uploadFiles({ files: picked, projectId: form.project?._id || "", title: form.title.trim(), notes: form.notes.trim(), visibility: "client" });
      toast.success(picked.length === 1 ? "File shared with Expresso." : `${picked.length} files shared with Expresso.`);
      setUploadOpen(false);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The upload didn't finish. Try again.");
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (error) content = <ErrorState title="Your files didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = dq.trim() ? (
      <EmptyState icon={SearchX} title="No files match that search" action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>} />
    ) : (
      <EmptyState icon={FileText} title="No files shared yet" message="Documents Expresso shares with you, and files you send, appear here." action={canUpload ? <Button onClick={startUpload}><UploadCloud size={14} aria-hidden="true" />Share a file</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Files" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">File</th>
              <th scope="col" className="px-hide-tab">Project</th>
              <th scope="col" className="px-num">Shared</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={4} label="Loading files" />
            ) : (
              items.map((f) => (
                <tr key={f._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <button type="button" onClick={() => open(f)}>{f.title || f.originalName || "File"}</button>
                      <span>{[f.title && f.originalName && f.title !== f.originalName ? f.originalName : null, fileSize(f.size), f.notes].filter(Boolean).join(", ")}</span>
                    </div>
                  </td>
                  <td data-label="Project" className="px-hide-tab">{f.projectId?.name || "—"}</td>
                  <td data-label="Shared" className="px-num">{date(f.createdAt)}</td>
                  <td className="px-actions-cell">
                    <RowActions label={f.title || f.originalName || "file"} actions={[{ key: "open", label: "Open", icon: ExternalLink, onSelect: () => open(f) }]} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="files" label="File pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Files"
        description="Documents shared between you and Expresso."
        breadcrumb={[{ label: "Files" }]}
        secondaryActions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canUpload ? <Button onClick={startUpload}><UploadCloud size={14} aria-hidden="true" />Share a file</Button> : null}
      >
        <Panel flush bare label="Files" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Search files">
            <SearchField label="Search files" value={q} onChange={setQ} placeholder="Name, title or note" />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading files…" : error ? "Files unavailable" : `${meta.total} file${meta.total === 1 ? "" : "s"}, newest first`}</span>
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canUpload ? (
        <FormDialog open={uploadOpen} title="Share files with Expresso" description="Up to 20 files at a time. Expresso can see them straight away." onClose={() => setUploadOpen(false)} onSubmit={upload} busy={busy} error={formError} canSubmit={picked.length > 0 && picked.length <= 20} submitLabel={picked.length > 1 ? `Share ${picked.length} files` : "Share file"} submitIcon={UploadCloud}>
          <fieldset className="px-form-section">
            <legend>Files</legend>
            <div className="px-field">
              <label htmlFor="px-client-files">Choose files</label>
              <input id="px-client-files" ref={inputRef} type="file" multiple className="px-input" onChange={(e) => setPicked(Array.from(e.target.files || []))} />
            </div>
            {picked.length ? (
              <ul className="px-list" aria-label="Chosen files">
                {picked.map((f, i) => (
                  <li key={`${f.name}-${i}`} style={{ padding: "6px 0" }}>
                    <span className="px-t">{f.name}</span>
                    <span className="px-muted">{fileSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </fieldset>
          <fieldset className="px-form-section">
            <legend>About them</legend>
            <TextField label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} hint="Optional. Each file's name is used if you leave this empty." />
            <TextField label="Note for Expresso" multiline rows={2} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
            {access.can("projects.read") ? (
              <RecordPicker label="Project" value={form.project} onChange={(p) => setForm((s) => ({ ...s, project: p }))} load={(q) => listProjects({ q, limit: 20 })} getLabel={(p) => p?.name || "Project"} searchLabel="Search your projects" hint="Optional. Link the files to one of your projects." />
            ) : null}
          </fieldset>
        </FormDialog>
      ) : null}
    </>
  );
}
