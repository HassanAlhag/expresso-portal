import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { listPortfolio, updatePortfolio, deletePortfolio } from "../api";
import {
  ArrowLeft, RefreshCw, Trash2, Globe, Eye, EyeOff,
  Archive, Save, Layers, Tag,
} from "lucide-react";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STATUS_META = {
  published: { label: "Published", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", Icon: Eye },
  draft:     { label: "Draft",     bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-600",   Icon: EyeOff },
  archived:  { label: "Archived",  bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    Icon: Archive },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const { Icon } = meta;
  return (
    <span className={["inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]", meta.bg, meta.border, meta.text].join(" ")}>
      <Icon size={10} />{meta.label}
    </span>
  );
}

export default function PortfolioDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState(null);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", description: "",
    category: "", status: "draft", tags: "",
    seoTitle: "", seoDesc: "",
  });
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // The portfolio backend has get-by-slug; we use the list API and filter by id
      const res = await listPortfolio({ limit: 100 });
      const found = (res?.items || []).find((x) => x._id === id);
      if (!found) { setError("Portfolio item not found."); return; }
      setItem(found);
      setForm({
        title: found.title || "",
        slug: found.slug || "",
        excerpt: found.excerpt || "",
        description: found.description || "",
        category: found.category || "",
        status: found.status || "draft",
        tags: Array.isArray(found.tags) ? found.tags.join(", ") : "",
        seoTitle: found.seo?.metaTitle || "",
        seoDesc: found.seo?.metaDesc || "",
      });
      setDirty(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load item.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug),
        excerpt: form.excerpt.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        status: form.status,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        seo: { metaTitle: form.seoTitle.trim(), metaDesc: form.seoDesc.trim() },
      };
      const res = await updatePortfolio(id, payload);
      setItem(res?.item);
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const res = await updatePortfolio(id, { status: "published" });
      setItem(res?.item);
      setForm((f) => ({ ...f, status: "published" }));
      toast.success("Published.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to publish.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete portfolio item",
      message: `Delete "${item?.title}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deletePortfolio(id);
          nav("/portal/portfolio");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed.");
          setBusy(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>
    );
  }

  return (
    <div className="grid gap-6">
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
      <PageHeader
        eyebrow="CONTENT"
        title={item?.title || "Portfolio item"}
        subtitle={
          <div className="flex items-center gap-2">
            <StatusPill status={item?.status} />
            <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
              <Globe size={11} />/{item?.slug}
            </span>
          </div>
        }
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Portfolio", to: "/portal/portfolio" },
          { label: item?.title || "Item" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/portfolio")} disabled={busy}>
              <ArrowLeft size={15} />
            </Button>
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
            </Button>
            {item?.status !== "published" && (
              <Button variant="outline" onClick={handlePublish} disabled={busy}>
                <Eye size={15} /> Publish
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={15} />
            </Button>
            {dirty && (
              <Button onClick={handleSave} loading={busy}>
                <Save size={15} /> Save
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main editor */}
        <div className="lg:col-span-2 grid gap-6">
          <Card>
            <CardHeader title="Content" />
            <CardBody>
              <div className="grid gap-4">
                <Input label="TITLE" value={form.title} onChange={set("title")} placeholder="Portfolio title" />
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">SLUG</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
                    <span className="text-sm text-slate-400">/</span>
                    <input
                      value={form.slug}
                      onChange={set("slug")}
                      className="h-11 flex-1 bg-transparent font-mono text-sm text-slate-900 outline-none"
                      placeholder="my-case-study"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">EXCERPT</label>
                  <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} placeholder="Short summary shown on listing pages..." className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5" />
                </div>
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">DESCRIPTION</label>
                  <textarea value={form.description} onChange={set("description")} rows={8} placeholder="Full description, story, results..." className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="SEO" subtitle="Controls how this item appears in search results" />
            <CardBody>
              <div className="grid gap-4">
                <Input label="META TITLE" value={form.seoTitle} onChange={set("seoTitle")} placeholder="Override the default page title..." />
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">META DESCRIPTION</label>
                  <textarea value={form.seoDesc} onChange={set("seoDesc")} rows={3} placeholder="Brief description for search results (under 160 chars)..." className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start">
          <Card>
            <CardHeader title="Settings" />
            <CardBody>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">STATUS</label>
                  <select value={form.status} onChange={set("status")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <Input label="CATEGORY" value={form.category} onChange={set("category")} placeholder="Branding, Social, Video..." />
                <div className="grid gap-2">
                  <label className="flex items-center gap-1 text-[11px] font-black tracking-[0.18em] text-slate-500">
                    <Tag size={11} /> TAGS (comma separated)
                  </label>
                  <input value={form.tags} onChange={set("tags")} placeholder="branding, video, social media" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Cover placeholder */}
          <Card>
            <CardHeader title="Cover image" subtitle="Upload via Media Library" />
            <CardBody>
              {item?.coverMedia?.url ? (
                <div className="overflow-hidden rounded-2xl">
                  <img src={item.coverMedia.url} alt={item.title} className="w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <div className="text-center">
                    <Layers size={24} className="mx-auto text-slate-300" />
                    <p className="mt-1 text-xs text-slate-400">No cover image set</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {dirty && (
            <Button onClick={handleSave} loading={busy} className="w-full">
              <Save size={15} /> Save changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
