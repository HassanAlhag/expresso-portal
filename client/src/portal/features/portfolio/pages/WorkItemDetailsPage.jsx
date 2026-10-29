import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Eye, Film, Image as ImageIcon, Images, Link2, RefreshCw, Save, Star, Trash2, UploadCloud, X } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { getAssetUrl } from "../../../shared/utils/assetUrl";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { WORK_TYPES } from "../../../../data/workTypes";
import { workVideos } from "../../../../data/workVideos";
import { listPortfolio } from "../api";
import { deleteWorkItem, getWorkItem, updateWorkItem } from "../workApi";
import { WorkStatusPill, missingWorkFields, slugify } from "../workAdminShared";

// Portfolio work editor. Saving needs work.write; deleting needs work.delete
// and is offered for drafts and archived items only (the API refuses a
// published item). Images and videos come from the Media Library.
const BASE = "/portal/website/work";
const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
const label = "text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500";

const toList = (s) => [...new Set(String(s || "").split(",").map((x) => x.trim()).filter(Boolean))];
const mediaRef = (m) => (m && typeof m === "object" ? m._id : m) || null;

function formFrom(item = {}) {
  return {
    title: item.title || "",
    slug: item.slug || "",
    clientName: item.clientName || "",
    workType: item.workType || "website",
    industry: item.industry || "",
    year: item.year ? String(item.year) : "",
    shortDescription: item.shortDescription || "",
    cover: { src: item.cover?.src || "", alt: item.cover?.alt || "", media: mediaRef(item.cover?.media) },
    gallery: (item.gallery || []).map((g) => ({ src: g.src, alt: g.alt || "", media: mediaRef(g.media) })),
    // The list, with any legacy single video read in as the first entry.
    videos: workVideos(item).map((v) => ({ src: v.src || "", poster: v.poster || "", title: v.title || "", media: mediaRef(v.media) })),
    services: (item.services || []).join(", "),
    technologies: (item.technologies || []).join(", "),
    featured: Boolean(item.featured),
    sortOrder: String(item.sortOrder ?? 0),
    status: item.status || "draft",
    caseStudy: mediaRef(item.caseStudy) || "",
    seo: { metaTitle: item.seo?.metaTitle || "", metaDesc: item.seo?.metaDesc || "" },
  };
}

function TextArea({ title, value, onChange, rows = 3, max, placeholder }) {
  return (
    <label className="grid gap-1.5">
      <span className={label}>{title}</span>
      <textarea value={value} onChange={onChange} rows={rows} maxLength={max} placeholder={placeholder} className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
      {max ? <span className="text-right text-[11px] text-slate-400">{value.length}/{max}</span> : null}
    </label>
  );
}

function Thumb({ src, className = "" }) {
  return src ? (
    <img src={getAssetUrl(src)} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <span className="grid h-full w-full place-items-center text-slate-300"><ImageIcon size={26} /></span>
  );
}

export default function WorkItemDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("work.write");
  const canDelete = access.can("work.delete");

  const [item, setItem] = useState(null);
  const [form, setForm] = useState(formFrom());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(null); // {kind: "cover"|"gallery"|"videos"|"video"|"poster", index?}
  const [caseStudies, setCaseStudies] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWorkItem(id);
      if (!res?.item) throw new Error("missing");
      setItem(res.item);
      setForm(formFrom(res.item));
      setDirty(false);
    } catch (err) {
      setError(err?.response?.status === 404 ? "Portfolio work not found." : "Failed to load portfolio work.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    listPortfolio({ limit: 50, sort: "sortOrder" })
      .then((res) => setCaseStudies(Array.isArray(res?.items) ? res.items : []))
      .catch(() => setCaseStudies([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const set = (k) => (e) => update({ [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const missing = useMemo(() => missingWorkFields({ ...form, year: form.year ? Number(form.year) : null }), [form]);

  // A linked case study the list cannot show (e.g. a draft the user cannot read) stays selectable.
  const caseOptions = useMemo(() => {
    const opts = caseStudies.map((cs) => ({ value: cs._id, label: `${cs.title}${cs.status && cs.status !== "published" ? ` (${cs.status})` : ""}` }));
    if (form.caseStudy && !opts.some((o) => o.value === form.caseStudy)) {
      opts.unshift({ value: form.caseStudy, label: item?.caseStudy?.title || "Linked case study" });
    }
    return opts;
  }, [caseStudies, form.caseStudy, item]);

  const payload = () => ({
    title: form.title.trim(),
    slug: form.slug.trim(),
    clientName: form.clientName.trim(),
    workType: form.workType,
    industry: form.industry.trim(),
    year: form.year ? Number(form.year) : null,
    shortDescription: form.shortDescription.trim(),
    cover: form.cover,
    gallery: form.gallery,
    videos: form.videos.filter((v) => v.src.trim()).map((v) => ({ ...v, src: v.src.trim(), title: v.title.trim() })),
    // Saving the list retires the legacy single-video field.
    video: { src: "", poster: "", media: null },
    services: toList(form.services),
    technologies: toList(form.technologies),
    featured: form.featured,
    sortOrder: Number(form.sortOrder) || 0,
    status: form.status,
    caseStudy: form.caseStudy || null,
    seo: form.seo,
  });

  const save = async (extra = {}) => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const res = await updateWorkItem(id, { ...payload(), ...extra });
      setItem(res.item);
      setForm(formFrom(res.item));
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete portfolio work",
      message: `Permanently delete "${item?.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        setBusy(true);
        try {
          await deleteWorkItem(id);
          nav(BASE);
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed.");
          setBusy(false);
        }
      },
    });
  };

  const setVideo = (i, patch) => update({ videos: form.videos.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const moveVideo = (i, d) => {
    const next = [...form.videos];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update({ videos: next });
  };

  const onMedia = (sel) => {
    const kind = picker?.kind;
    setPicker(null);
    if (!sel) return;
    if (kind === "gallery") {
      const picked = (Array.isArray(sel) ? sel : [sel]).filter((m) => m?.url).map((m) => ({ src: m.url, alt: m.title || "", media: m._id || null }));
      const known = new Set(form.gallery.map((g) => g.src));
      update({ gallery: [...form.gallery, ...picked.filter((g) => !known.has(g.src))] });
    } else if (kind === "cover") {
      update({ cover: { src: sel.url, alt: form.cover.alt || sel.title || "", media: sel._id || null } });
    } else if (kind === "videos") {
      const picked = (Array.isArray(sel) ? sel : [sel]).filter((m) => m?.url).map((m) => ({ src: m.url, poster: "", title: m.title || "", media: m._id || null }));
      const known = new Set(form.videos.map((v) => v.src));
      update({ videos: [...form.videos, ...picked.filter((v) => !known.has(v.src))] });
    } else if (kind === "video") {
      setVideo(picker.index, { src: sel.url, media: sel._id || null });
    } else if (kind === "poster") {
      setVideo(picker.index, { poster: sel.url });
    }
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
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>;
  }

  const publicHref = item?.status === "published" ? `/portfolio/${item.slug}` : "";

  return (
    <div className="grid gap-6">
      <ConfirmModal open={!!confirmState} title={confirmState?.title} message={confirmState?.message} danger={confirmState?.danger} onConfirm={confirmState?.onConfirm} onClose={() => setConfirmState(null)} />
      <PageHeader
        eyebrow="CONTENT"
        title={item?.title || "Portfolio work"}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <WorkStatusPill status={item?.status} />
            <span className="font-mono text-xs text-slate-400">/portfolio/{item?.slug}</span>
          </span>
        }
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Website" }, { label: "Portfolio", to: BASE }, { label: item?.title || "Work" }]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => nav(BASE)} disabled={busy} aria-label="Back to portfolio"><ArrowLeft size={15} /></Button>
            <Button variant="outline" onClick={load} disabled={busy} aria-label="Reload"><RefreshCw size={15} /></Button>
            {publicHref ? (
              <a href={publicHref} target="_blank" rel="noopener noreferrer" className="px-btn"><ExternalLink size={15} /> View on website</a>
            ) : null}
            {canWrite && item?.status !== "published" ? (
              <Button variant="outline" onClick={() => save({ status: "published" })} disabled={busy}><Eye size={15} /> Publish</Button>
            ) : null}
            {canWrite && item?.status !== "archived" ? (
              <Button variant="outline" onClick={() => save({ status: "archived" })} disabled={busy}><Archive size={15} /> Archive</Button>
            ) : null}
            {canDelete && item?.status !== "published" ? (
              <Button variant="outline" onClick={handleDelete} disabled={busy} aria-label="Delete portfolio work"><Trash2 size={15} /></Button>
            ) : null}
            {canWrite && dirty ? <Button onClick={() => save()} loading={busy}><Save size={15} /> Save</Button> : null}
          </div>
        }
      />

      {!canWrite ? <p className="text-sm font-semibold text-slate-500">View only. Your role can't edit portfolio work.</p> : null}
      {missing.length ? (
        <p className="m-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-black">Still to complete:</span> {missing.join(", ")}. Leave a fact blank rather than guessing it.
        </p>
      ) : null}

      <fieldset disabled={!canWrite} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <div className="grid min-w-0 gap-6">
            <Card>
              <CardHeader title="Work" subtitle="What it is and who it was for." />
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="TITLE" value={form.title} onChange={set("title")} />
                  <Input label="CLIENT" value={form.clientName} onChange={set("clientName")} placeholder="Leave blank if unknown" />
                  <label className="grid gap-1.5">
                    <span className={label}>WORK TYPE</span>
                    <select value={form.workType} onChange={set("workType")} className={field}>
                      {WORK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </label>
                  <Input label="INDUSTRY" value={form.industry} onChange={set("industry")} placeholder="Optional" />
                  <Input label="YEAR" type="number" min="1990" max="2100" value={form.year} onChange={set("year")} placeholder="Optional" />
                  <Input label="URL SLUG" value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} />
                </div>
                <div className="mt-4">
                  <TextArea title="SHORT DESCRIPTION" value={form.shortDescription} onChange={set("shortDescription")} max={320} placeholder="One or two sentences about the work." />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Visuals" subtitle="Real screenshots, posts and project imagery from the Media Library." />
              <CardBody>
                <div className="grid gap-5">
                  <div className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[180px,1fr]">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><Thumb src={form.cover.src} /></div>
                    <div className="grid content-start gap-3">
                      <p className="m-0 text-sm font-black text-slate-900">Cover</p>
                      <Input label="ALT TEXT" value={form.cover.alt} onChange={(e) => update({ cover: { ...form.cover, alt: e.target.value } })} />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPicker({ kind: "cover" })}><UploadCloud size={15} /> Choose cover</Button>
                        {form.cover.src ? <Button variant="outline" onClick={() => update({ cover: { src: "", alt: "", media: null } })}>Remove</Button> : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="m-0 text-sm font-black text-slate-900">Gallery <span className="font-semibold text-slate-400">({form.gallery.length})</span></p>
                      <Button variant="outline" onClick={() => setPicker({ kind: "gallery" })}><Images size={15} /> Add images</Button>
                    </div>
                    {form.gallery.length ? (
                      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                        {form.gallery.map((g, i) => (
                          <li key={`${g.src}-${i}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="relative aspect-[4/3] bg-slate-100">
                              <Thumb src={g.src} />
                              <button type="button" onClick={() => update({ gallery: form.gallery.filter((_, j) => j !== i) })} aria-label={`Remove gallery image ${i + 1}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:text-rose-600">
                                <X size={15} />
                              </button>
                            </div>
                            <input aria-label={`Alt text for gallery image ${i + 1}`} value={g.alt} onChange={(e) => update({ gallery: form.gallery.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} placeholder="Alt text" className="w-full border-0 border-t border-slate-100 px-3 py-2 text-xs outline-none" />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No gallery images yet.</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="m-0 flex items-center gap-2 text-sm font-black text-slate-900"><Film size={15} /> Videos and reels <span className="font-semibold text-slate-400">({form.videos.length})</span></p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setPicker({ kind: "videos" })}><Film size={15} /> Add videos</Button>
                        <Button variant="outline" onClick={() => update({ videos: [...form.videos, { src: "", poster: "", title: "", media: null }] })}><Link2 size={15} /> Add link</Button>
                      </div>
                    </div>
                    {form.videos.length ? (
                      <ul className="m-0 grid list-none gap-3 p-0">
                        {form.videos.map((v, i) => (
                          <li key={i} className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[140px,1fr]">
                            <div className="aspect-video overflow-hidden rounded-xl bg-slate-100"><Thumb src={v.poster} /></div>
                            <div className="grid min-w-0 content-start gap-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Input label={`VIDEO ${i + 1}`} value={v.src} onChange={(e) => setVideo(i, { src: e.target.value, media: null })} placeholder="Media Library video, or an https:// link" />
                                <Input label="TITLE (OPTIONAL)" maxLength={120} value={v.title} onChange={(e) => setVideo(i, { title: e.target.value })} placeholder="e.g. Launch reel" />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" onClick={() => setPicker({ kind: "video", index: i })}><Film size={15} /> {v.src ? "Replace video" : "Choose video"}</Button>
                                <Button variant="outline" onClick={() => setPicker({ kind: "poster", index: i })}><ImageIcon size={15} /> {v.poster ? "Replace poster" : "Choose poster"}</Button>
                                {v.poster ? <Button variant="outline" onClick={() => setVideo(i, { poster: "" })}>Remove poster</Button> : null}
                                <span className="ml-auto flex items-center gap-1">
                                  <button type="button" disabled={i === 0} onClick={() => moveVideo(i, -1)} aria-label={`Move video ${i + 1} up`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={14} /></button>
                                  <button type="button" disabled={i === form.videos.length - 1} onClick={() => moveVideo(i, 1)} aria-label={`Move video ${i + 1} down`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={14} /></button>
                                  <button type="button" onClick={() => update({ videos: form.videos.filter((_, j) => j !== i) })} aria-label={`Remove video ${i + 1}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button>
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No videos yet. Add Media Library videos or links to hosted videos.</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Services and technologies" subtitle="Comma separated. Shown as tags on the project page." />
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="SERVICES" value={form.services} onChange={set("services")} placeholder="Website Design, Social Media" />
                  <Input label="TECHNOLOGIES" value={form.technologies} onChange={set("technologies")} placeholder="React, Tailwind CSS" />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid content-start gap-6">
            <Card>
              <CardHeader title="Publishing" subtitle="Drafts and archived work never appear on the website." />
              <CardBody>
                <div className="grid gap-4">
                  <label className="grid gap-1.5">
                    <span className={label}>STATUS</span>
                    <select value={form.status} onChange={set("status")} className={field}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={form.featured} onChange={set("featured")} className="h-4 w-4" />
                    <Star size={14} className="text-amber-500" aria-hidden="true" /> Featured on the Portfolio page
                  </label>
                  <Input label="DISPLAY ORDER" type="number" value={form.sortOrder} onChange={set("sortOrder")} />
                  <label className="grid gap-1.5">
                    <span className={label}>LINKED CASE STUDY</span>
                    <select value={form.caseStudy} onChange={set("caseStudy")} className={field}>
                      <option value="">None</option>
                      {caseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span className="text-xs text-slate-500">Shows “View case study” on the website while that case study is published.</span>
                  </label>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Search engines" subtitle="Optional. Defaults to the title and short description." />
              <CardBody>
                <div className="grid gap-4">
                  <Input label="META TITLE" maxLength={120} value={form.seo.metaTitle} onChange={(e) => update({ seo: { ...form.seo, metaTitle: e.target.value } })} />
                  <TextArea title="META DESCRIPTION" max={320} value={form.seo.metaDesc} onChange={(e) => update({ seo: { ...form.seo, metaDesc: e.target.value } })} />
                </div>
              </CardBody>
            </Card>

            {canWrite && dirty ? (
              <Button onClick={() => save()} loading={busy} className="w-full"><Save size={15} /> Save changes</Button>
            ) : null}
          </div>
        </div>
      </fieldset>

      <MediaPickerModal
        open={Boolean(picker) && canWrite}
        onClose={() => setPicker(null)}
        onSelect={onMedia}
        title={picker?.kind === "videos" ? "Select videos" : picker?.kind === "video" ? "Select a video" : "Select media"}
        subtitle={picker?.kind === "gallery" ? "Choose one or more images for the gallery." : picker?.kind === "videos" ? "Choose one or more videos." : "Choose from the media library or upload a new file."}
        onlyType={picker?.kind === "video" || picker?.kind === "videos" ? "video" : "image"}
        multiple={picker?.kind === "gallery" || picker?.kind === "videos"}
        allowUpload
      />
    </div>
  );
}
