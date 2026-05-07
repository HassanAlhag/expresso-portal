import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import FilterBar from "../../../shared/ui/FilterBar";
import StatCard from "../../../shared/ui/StatCard";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import {
  listCareers, createCareer, updateCareer, deleteCareer,
  listAllApplications, updateApplicationStatus,
} from "../api";
import {
  Plus, RefreshCw, Pencil, Trash2, BriefcaseBusiness,
  MapPin, Clock, ToggleLeft, ToggleRight, FileText,
  Mail, Phone, ExternalLink, ChevronDown, Users, CheckCircle2,
} from "lucide-react";

/* ─── Career form modal ─────────────────────────────────────────────── */

const EMPTY_FORM = {
  title: "", department: "", type: "Full-Time", location: "Dubai, UAE",
  summary: "", responsibilities: "", requirements: "", order: 0, isActive: true,
};

function CareerFormModal({ open, initial, busy, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...initial, responsibilities: (initial.responsibilities || []).join("\n"), requirements: (initial.requirements || []).join("\n") }
        : EMPTY_FORM
      );
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    onSubmit({
      ...form,
      order: Number(form.order) || 0,
      responsibilities: form.responsibilities.split("\n").map(s => s.trim()).filter(Boolean),
      requirements:     form.requirements.split("\n").map(s => s.trim()).filter(Boolean),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">{initial ? "Edit opening" : "New opening"}</div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2 col-span-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">JOB TITLE *</label>
              <input value={form.title} onChange={set("title")} placeholder="Social Media Manager" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">DEPARTMENT *</label>
              <input value={form.department} onChange={set("department")} placeholder="Marketing" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">TYPE</label>
              <select value={form.type} onChange={set("type")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5">
                <option>Full-Time</option><option>Part-Time</option><option>Freelance</option><option>Internship</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">LOCATION</label>
              <input value={form.location} onChange={set("location")} placeholder="Dubai, UAE" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">ORDER</label>
              <input type="number" value={form.order} onChange={set("order")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">SUMMARY</label>
            <textarea value={form.summary} onChange={set("summary")} rows={2} placeholder="One-line description shown on careers page" className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5" />
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">RESPONSIBILITIES <span className="font-normal text-slate-400">(one per line)</span></label>
            <textarea value={form.responsibilities} onChange={set("responsibilities")} rows={4} placeholder={"Manage content calendars\nGrow brand communities"} className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:ring-4 focus:ring-black/5" />
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">REQUIREMENTS <span className="font-normal text-slate-400">(one per line)</span></label>
            <textarea value={form.requirements} onChange={set("requirements")} rows={3} placeholder={"3+ years experience\nFluent in English"} className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:ring-4 focus:ring-black/5" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded" />
            Active (visible on website)
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy || !form.title.trim() || !form.department.trim()}>
            {busy ? "Saving…" : initial ? "Save changes" : "Create opening"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Application status pill ───────────────────────────────────────── */

const APP_STATUS_TONES = {
  new:        "border-sky-200 bg-sky-50 text-sky-700",
  reviewing:  "border-amber-200 bg-amber-50 text-amber-700",
  interview:  "border-violet-200 bg-violet-50 text-violet-700",
  rejected:   "border-rose-200 bg-rose-50 text-rose-700",
  hired:      "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const APP_STATUS_OPTIONS = [
  { value: "",          label: "All statuses" },
  { value: "new",       label: "New"          },
  { value: "reviewing", label: "Reviewing"    },
  { value: "interview", label: "Interview"    },
  { value: "rejected",  label: "Rejected"     },
  { value: "hired",     label: "Hired"        },
];

function StatusPill({ status }) {
  const v = String(status || "new").toLowerCase();
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] ${APP_STATUS_TONES[v] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {v}
    </span>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */

export default function CareersAdminPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("openings");

  // Openings state
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [confirmState, setConfirmState]       = useState(null);

  // Applications state
  const [appItems, setAppItems]     = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatus, setAppStatus]   = useState("");
  const [appMeta, setAppMeta]       = useState({ total: 0, page: 1, pages: 1 });
  const [appPage, setAppPage]       = useState(1);
  const [updatingApp, setUpdatingApp] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCareers();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      toast.error("Failed to load career openings.");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    setAppLoading(true);
    try {
      const res = await listAllApplications({ status: appStatus, page: appPage, limit: 20 });
      setAppItems(Array.isArray(res?.items) ? res.items : []);
      setAppMeta({ total: res?.total ?? 0, page: res?.page || 1, pages: res?.pages || 1 });
    } catch {
      toast.error("Failed to load applications.");
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === "applications") loadApplications();
  }, [activeTab, appStatus, appPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const appStats = useMemo(() => ({
    total:     appMeta.total,
    newCount:  appItems.filter(x => x.status === "new").length,
    interview: appItems.filter(x => x.status === "interview").length,
    hired:     appItems.filter(x => x.status === "hired").length,
  }), [appItems, appMeta.total]);

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (selected) { await updateCareer(selected._id, payload); toast.success("Opening updated."); }
      else { await createCareer(payload); toast.success("Opening created."); }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await updateCareer(item._id, { isActive: !item.isActive });
      setItems((prev) => prev.map((x) => x._id === item._id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast.error("Failed to update status."); }
  };

  const handleDelete = (item) => {
    setConfirmState({
      title: "Delete opening",
      message: `Delete "${item.title}"?`,
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteCareer(item._id);
          setItems((prev) => prev.filter((x) => x._id !== item._id));
        } catch { toast.error("Delete failed."); }
      },
    });
  };

  const handleAppStatus = async (app, newStatus) => {
    setUpdatingApp(app._id);
    try {
      await updateApplicationStatus(app._id, { status: newStatus });
      setAppItems((prev) => prev.map(x => x._id === app._id ? { ...x, status: newStatus } : x));
    } catch { toast.error("Update failed."); }
    finally { setUpdatingApp(""); }
  };

  const tabBtn = (id, label, count) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition",
        activeTab === id
          ? "border-black/10 bg-black/[0.04] text-slate-900 shadow-sm"
          : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]",
      ].join(" ")}
    >
      {label}
      {count != null && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">{count}</span>
      )}
    </button>
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="WEBSITE"
        title="Careers"
        subtitle="Manage job openings and review candidate applications."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Careers" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={activeTab === "openings" ? load : loadApplications} disabled={loading || appLoading || busy}>
              <RefreshCw size={16} /> Refresh
            </Button>
            {activeTab === "openings" && (
              <Button onClick={() => { setSelected(null); setModalOpen(true); }} disabled={busy}>
                <Plus size={16} /> New opening
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {tabBtn("openings",     "Openings",     items.length)}
        {tabBtn("applications", "Applications", appMeta.total || null)}
      </div>

      {/* ── Openings tab ── */}
      {activeTab === "openings" && (
        loading ? (
          <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
            <div className="grid gap-3">
              <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="No openings yet"
            message="Create your first career opening and it will appear on the public careers page."
            actionLabel="New opening"
            onAction={() => { setSelected(null); setModalOpen(true); }}
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">Openings ({items.length})</div>
              <div className="text-xs text-slate-500">Shown on public careers page when active</div>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{item.title}</span>
                      <span className={["inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        item.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500",
                      ].join(" ")}>{item.isActive ? "Active" : "Hidden"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{item.department}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{item.type}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{item.location}</span>
                    </div>
                    {item.summary && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.summary}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => handleToggle(item)} className="text-slate-400 transition hover:text-slate-700">
                      {item.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => { setSelected(item); setModalOpen(true); }}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* ── Applications tab ── */}
      {activeTab === "applications" && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard icon={Users}       label="Total"     value={appStats.total}     color="indigo"  />
            <StatCard icon={FileText}    label="New"       value={appStats.newCount}  color="blue"    />
            <StatCard icon={ChevronDown} label="Interview" value={appStats.interview} color="violet"  />
            <StatCard icon={CheckCircle2}label="Hired"     value={appStats.hired}     color="emerald" />
          </div>

          <FilterBar
            searchValue=""
            onSearchChange={() => {}}
            searchPlaceholder="Search applications…"
            filters={[
              { label: "status", value: appStatus, onChange: (v) => { setAppStatus(v); setAppPage(1); }, options: APP_STATUS_OPTIONS },
            ]}
            onClear={() => { setAppStatus(""); setAppPage(1); }}
          />

          {appLoading ? (
            <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
              <div className="grid gap-3">
                <Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" />
              </div>
            </div>
          ) : appItems.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" message="Applications submitted via the public careers page will appear here." />
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 p-4">
                <div className="text-sm font-black text-slate-900">Applications ({appMeta.total})</div>
                <div className="text-xs text-slate-500">Page {appMeta.page} of {appMeta.pages}</div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-black/10">
                      <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">APPLICANT</th>
                      <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">POSITION</th>
                      <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">STATUS</th>
                      <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">CV</th>
                      <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">APPLIED</th>
                      <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">MOVE TO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appItems.map((app) => (
                      <tr key={app._id} className="border-b border-slate-100 hover:bg-black/[0.02]">
                        <td className="px-4 py-4 align-top">
                          <div className="text-sm font-black text-slate-900">{app.fullName}</div>
                          {app.email && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Mail size={10} />{app.email}
                            </div>
                          )}
                          {app.phone && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={10} />{app.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-sm text-slate-700">{app.careerId?.title || "—"}</div>
                          {app.careerId?.department && (
                            <div className="text-xs text-slate-400">{app.careerId.department}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusPill status={app.status} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          {app.cvUrl ? (
                            <a href={app.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100">
                              <ExternalLink size={10} /> View CV
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No CV</span>
                          )}
                          {app.coverLetter && (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500" title={app.coverLetter}>
                              {app.coverLetter.slice(0, 60)}…
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <select
                            value={app.status}
                            disabled={updatingApp === app._id}
                            onChange={(e) => handleAppStatus(app, e.target.value)}
                            className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 disabled:opacity-50"
                          >
                            <option value="new">New</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="interview">Interview</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {appMeta.pages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <span className="text-xs text-slate-500">Page {appMeta.page} of {appMeta.pages} · {appMeta.total} total</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAppPage(p => Math.max(1, p - 1))} disabled={appMeta.page <= 1}>Prev</Button>
                    <Button variant="outline" size="sm" onClick={() => setAppPage(p => Math.min(appMeta.pages, p + 1))} disabled={appMeta.page >= appMeta.pages}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CareerFormModal
        open={modalOpen}
        initial={selected}
        busy={busy}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
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
