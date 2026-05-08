import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  UserRound,
  ArrowRightCircle,
  TrendingUp,
  Mail,
  Building2,
} from "lucide-react";

import { listLeads, createLead, updateLead, deleteLead, convertLeadToDeal } from "../api";
import LeadFormModal from "../components/LeadFormModal";

const STATUS_TONES = {
  new:          "border-sky-200 bg-sky-50 text-sky-700",
  contacted:    "border-amber-200 bg-amber-50 text-amber-700",
  qualified:    "border-emerald-200 bg-emerald-50 text-emerald-700",
  unqualified:  "border-rose-200 bg-rose-50 text-rose-700",
  converted:    "border-violet-200 bg-violet-50 text-violet-700",
};

function StatusPill({ value }) {
  const v = String(value || "new").toLowerCase();
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
        STATUS_TONES[v] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {v.replaceAll("_", " ")}
    </span>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "",            label: "All statuses"  },
  { value: "new",         label: "New"           },
  { value: "contacted",   label: "Contacted"     },
  { value: "qualified",   label: "Qualified"     },
  { value: "unqualified", label: "Unqualified"   },
  { value: "converted",   label: "Converted"     },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt",  label: "Oldest first" },
  { value: "fullName",   label: "Name A → Z"   },
  { value: "-fullName",  label: "Name Z → A"   },
];

export default function LeadsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [confirmState, setConfirmState] = useState(null);
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort]     = useState("-createdAt");
  const [page, setPage]     = useState(1);
  const limit = 20;

  const [items, setItems] = useState([]);
  const [meta, setMeta]   = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const [converting, setConverting] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [selected, setSelected]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listLeads({ q, status, sort, limit, page });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0 });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, sort, page]);

  const stats = useMemo(() => {
    const by = (s) => items.filter((x) => x.status === s).length;
    return {
      total:     meta.total,
      newCount:  by("new"),
      qualified: by("qualified"),
      converted: by("converted"),
    };
  }, [items, meta.total]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      await createLead(payload);
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (payload) => {
    if (!selected?._id) return;
    setBusy(true);
    try {
      await updateLead(selected._id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (lead) => {
    if (!lead?._id) return;
    setConfirmState({
      title: "Delete lead",
      message: `Delete "${lead.fullName}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteLead(lead._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
        setConfirmState(null);
      },
    });
  };

  const onConvert = (lead) => {
    if (!lead?._id) return;
    setConfirmState({
      title: "Convert to Deal",
      message: `Convert "${lead.fullName}" to a Deal?`,
      danger: false,
      onConfirm: async () => {
        setConverting(lead._id);
        try {
          const res = await convertLeadToDeal(lead._id);
          const dealId = res?.deal?._id || res?.item?._id;
          await load();
          if (dealId) nav(`/portal/crm/deals/${dealId}`);
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Convert failed");
        } finally {
          setConverting("");
        }
        setConfirmState(null);
      },
    });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        subtitle="Capture and qualify incoming opportunities."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Leads" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={16} />
              New lead
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserRound}   label="Total"     value={stats.total}     color="indigo"  />
        <StatCard icon={UserRound}   label="New"       value={stats.newCount}  color="blue"    />
        <StatCard icon={TrendingUp}  label="Qualified" value={stats.qualified} color="emerald" />
        <StatCard icon={ArrowRightCircle} label="Converted" value={stats.converted} color="violet" />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="Search name, company, email…"
        filters={[
          { label: "status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS_FILTER_OPTIONS },
          { label: "sort",   value: sort,   onChange: (v) => { setSort(v);   setPage(1); }, options: SORT_OPTIONS          },
        ]}
        onClear={() => { setQ(""); setStatus(""); setSort("-createdAt"); setPage(1); }}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No leads yet"
          message="Add your first lead to begin CRM tracking."
          actionLabel="New lead"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 p-4">
            <div className="text-sm font-black text-slate-900">Leads ({items.length})</div>
            <div className="text-xs text-slate-500">Page {meta.page} of {meta.pages} · {meta.total} total</div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="border-b border-black/10">
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">LEAD</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">COMPANY</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">SOURCE</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">CREATED</th>
                  <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-slate-100 hover:bg-black/[0.02]"
                  >
                    <td className="px-4 py-4 align-top">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => nav(`/portal/crm/leads/${lead._id}`)}
                      >
                        <div className="text-sm font-black text-slate-900 hover:underline">
                          {lead.fullName || "—"}
                        </div>
                        {lead.email && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Mail size={10} />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="mt-0.5 text-xs text-slate-500">{lead.phone}</div>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-4 align-top">
                      {lead.companyName ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Building2 size={13} className="shrink-0 text-slate-400" />
                          {lead.companyName}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <StatusPill value={lead.status} />
                    </td>

                    <td className="px-4 py-4 align-top text-sm capitalize text-slate-600">
                      {lead.source || "manual"}
                    </td>

                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                    </td>

                    <td className="px-4 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        {lead.status !== "converted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConvert(lead)}
                            disabled={busy || converting === lead._id}
                          >
                            <ArrowRightCircle size={14} />
                            {converting === lead._id ? "Converting…" : "To Deal"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelected(lead); setEditOpen(true); }}
                          disabled={busy}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(lead)}
                          disabled={busy}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page <b>{meta.page}</b> of <b>{meta.pages}</b> · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1 || loading}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={meta.page >= meta.pages || loading}>Next</Button>
          </div>
        </div>
      )}

      <LeadFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />

      <LeadFormModal
        open={editOpen}
        mode="edit"
        initial={selected}
        onClose={() => { setEditOpen(false); setSelected(null); }}
        onSubmit={onEdit}
        busy={busy}
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
