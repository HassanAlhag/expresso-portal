import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Archive, BookOpen, GalleryVerticalEnd, Image as ImageIcon, Link2, Plus, RefreshCw, Search, Star, Trash2 } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { getAssetUrl } from "../../../shared/utils/assetUrl";
import { WORK_TYPES, workTypeLabel } from "../../../../data/workTypes";
import { listPortfolio } from "../api";
import { createWorkItem, createWorkItemFromCaseStudy, deleteWorkItem, listWorkItems, reorderWorkItems, updateWorkItem } from "../workApi";
import { WorkStatusPill, missingWorkFields, workCover } from "../workAdminShared";

// Portfolio (visual work) admin. Permissions match the API: work.read views
// (including drafts), work.write creates/edits/archives/reorders, work.delete
// permanently deletes drafts and archived items.
const BASE = "/portal/website/work";
const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

function WorkCard({ item, canWrite, canDelete, onOpen, onArchive, onDelete, onMove, first, last }) {
  const cover = workCover(item);
  const missing = missingWorkFields(item);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
      <button type="button" onClick={onOpen} aria-label={`Open ${item.title}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid h-full place-items-center text-slate-300"><ImageIcon size={32} /></span>
        )}
        <span className="absolute left-3 top-3"><WorkStatusPill status={item.status} /></span>
        {item.featured ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-amber-950">
            <Star size={11} aria-hidden="true" /> Featured
          </span>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-indigo-700">{workTypeLabel(item.workType) || item.workType}</span>
          {item.caseStudy ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
              <Link2 size={11} aria-hidden="true" /> Case study
            </span>
          ) : null}
        </div>
        <h3 className="m-0 text-base font-black leading-tight text-slate-950">{item.title}</h3>
        <p className="m-0 text-sm text-slate-500">{item.clientName || "Client not set"}</p>
        {missing.length ? (
          <p className="m-0 text-xs font-semibold text-amber-700">Needs: {missing.join(", ")}</p>
        ) : (
          <p className="m-0 text-xs font-semibold text-emerald-700">Complete</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          {canWrite && onMove ? (
            <div className="flex gap-1">
              <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${item.title} earlier`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" disabled={last} onClick={() => onMove(1)} aria-label={`Move ${item.title} later`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={14} /></button>
            </div>
          ) : <span />}
          <div className="flex gap-1">
            {canWrite && item.status !== "archived" ? (
              <button type="button" onClick={onArchive} aria-label={`Archive ${item.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Archive size={14} /></button>
            ) : null}
            {canDelete && item.status !== "published" ? (
              <button type="button" onClick={onDelete} aria-label={`Delete ${item.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={14} /></button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <div className="text-lg font-black text-slate-950">{title}</div>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function NewWorkModal({ open, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", workType: "website", clientName: "" });
  useEffect(() => { if (open) setForm({ title: "", workType: "website", clientName: "" }); }, [open]);
  return (
    <Modal open={open} title="New portfolio work" subtitle="Start with a title and type; add visuals in the editor." onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title.trim()) onSubmit(form);
        }}
      >
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Title
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={field} placeholder="Project or account name" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Work type
          <select value={form.workType} onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))} className={field}>
            {WORK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Client (optional)
          <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className={field} />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Create draft</Button>
        </div>
      </form>
    </Modal>
  );
}

function FromCaseStudyModal({ open, busy, onClose, onPick }) {
  const [state, setState] = useState({ loading: true, items: [] });
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setState({ loading: true, items: [] });
    listPortfolio({ limit: 50, sort: "sortOrder" })
      .then((res) => alive && setState({ loading: false, items: Array.isArray(res?.items) ? res.items : [] }))
      .catch(() => alive && setState({ loading: false, items: [] }));
    return () => { alive = false; };
  }, [open]);
  return (
    <Modal
      open={open}
      title="Create from case study"
      subtitle="Creates a new draft linked to the case study, using its title, client, summary and images. The case study itself is not changed."
      onClose={onClose}
    >
      {state.loading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : state.items.length ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {state.items.map((cs) => {
            const img = cs.thumbnailImg || cs.bannerImage || cs.coverMedia?.url || "";
            return (
              <li key={cs._id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onPick(cs)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-60"
                >
                  <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {img ? <img src={getAssetUrl(img)} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-900">{cs.title}</span>
                    <span className="block truncate text-xs text-slate-500">{[cs.category, cs.status].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No case studies are available to you.</p>
      )}
    </Modal>
  );
}

export default function WorkItemsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("work.write");
  const canDelete = access.can("work.delete");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState(null); // "new" | "case"
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listWorkItems({ limit: 100, sort: "sortOrder" });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      toast.error("Failed to load portfolio work.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((x) => {
      const matchQ = !needle || [x.title, x.clientName, x.industry, ...(x.services || []), ...(x.technologies || [])].join(" ").toLowerCase().includes(needle);
      return matchQ && (!statusFilter || x.status === statusFilter) && (!typeFilter || x.workType === typeFilter);
    });
  }, [items, q, statusFilter, typeFilter]);
  const unfiltered = !q && !statusFilter && !typeFilter;

  const handleCreate = async (form) => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const res = await createWorkItem({ title: form.title, workType: form.workType, clientName: form.clientName, status: "draft" });
      toast.success("Draft created.");
      nav(`${BASE}/${res.item._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleFromCaseStudy = async (cs) => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const res = await createWorkItemFromCaseStudy(cs._id);
      toast.success("Draft created from the case study.");
      nav(`${BASE}/${res.item._id}`);
    } catch (err) {
      const existing = err?.response?.data?.existingId;
      toast.error(err?.response?.data?.message || "Create failed.");
      if (existing) nav(`${BASE}/${existing}`);
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = (item) => {
    setConfirmState({
      title: "Archive portfolio work",
      message: `Archive "${item.title}"? It is removed from the website and kept in the portal.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await updateWorkItem(item._id, { status: "archived" });
          setItems((prev) => prev.map((x) => (x._id === item._id ? { ...x, ...res.item } : x)));
          toast.success("Archived.");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Archive failed.");
        }
      },
    });
  };

  const handleDelete = (item) => {
    setConfirmState({
      title: "Delete portfolio work",
      message: `Permanently delete "${item.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteWorkItem(item._id);
          setItems((prev) => prev.filter((x) => x._id !== item._id));
          toast.success("Deleted.");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed.");
        }
      },
    });
  };

  const handleMove = async (index, dir) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try {
      await reorderWorkItems(next.map((x) => x._id));
    } catch {
      toast.error("Reorder failed.");
      load();
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CONTENT OPERATIONS"
        title="Portfolio"
        subtitle="Manage the visual work shown in the public Portfolio."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Website" }, { label: "Portfolio" }]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading} aria-label="Refresh">
              <RefreshCw size={15} />
            </Button>
            {canWrite ? (
              <>
                <Button variant="outline" onClick={() => setModal("case")}>
                  <BookOpen size={15} /> From case study
                </Button>
                <Button onClick={() => setModal("new")}>
                  <Plus size={15} /> New work
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr,180px,200px,auto]">
          <label className="relative">
            <span className="sr-only">Search portfolio work</span>
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, client, service…" className={`${field} pl-10`} />
          </label>
          <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={field}>
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select aria-label="Work type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={field}>
            <option value="">All work types</option>
            {WORK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <Button variant="outline" onClick={() => { setQ(""); setStatusFilter(""); setTypeFilter(""); }}>Clear</Button>
        </div>
        {canWrite && !unfiltered ? (
          <p className="m-0 mt-3 text-xs text-slate-500">Clear the filters to change the display order.</p>
        ) : null}
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 w-full rounded-[24px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="overflow-hidden p-0">
          <EmptyState
            icon={GalleryVerticalEnd}
            title="No portfolio work"
            message="Add websites, social media accounts, videos and other visual work to the public Portfolio."
            actionLabel={canWrite ? "New work" : undefined}
            onAction={canWrite ? () => setModal("new") : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((item, i) => (
            <WorkCard
              key={item._id}
              item={item}
              canWrite={canWrite}
              canDelete={canDelete}
              first={i === 0}
              last={i === filtered.length - 1}
              onOpen={() => nav(`${BASE}/${item._id}`)}
              onArchive={() => handleArchive(item)}
              onDelete={() => handleDelete(item)}
              onMove={unfiltered ? (dir) => handleMove(i, dir) : undefined}
            />
          ))}
        </div>
      )}

      <NewWorkModal open={modal === "new" && canWrite} busy={busy} onClose={() => setModal(null)} onSubmit={handleCreate} />
      <FromCaseStudyModal open={modal === "case" && canWrite} busy={busy} onClose={() => setModal(null)} onPick={handleFromCaseStudy} />
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
