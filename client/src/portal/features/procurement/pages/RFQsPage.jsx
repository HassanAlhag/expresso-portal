import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, FileText, Clock, CheckCircle } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import Card from "../../../shared/ui/Card";
import { useToast } from "../../../shared/ui/Toast";
import { listRfqs } from "../api";
import { me } from "../../../shared/api/auth.api";

const BRAND = "#6F7FD9";

const STATUS_TONES = {
  draft:     "border-slate-200 bg-slate-50 text-slate-600",
  published: "border-indigo-200 bg-indigo-50 text-indigo-700",
  closed:    "border-amber-200 bg-amber-50 text-amber-700",
  awarded:   "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const QUOTATION_TONES = {
  submitted:    "border-blue-200 bg-blue-50 text-blue-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  accepted:     "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected:     "border-rose-200 bg-rose-50 text-rose-700",
};

function StatusPill({ value, map = STATUS_TONES }) {
  return (
    <span className={[
      "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
      map[value] || "border-slate-200 bg-slate-50 text-slate-600",
    ].join(" ")}>
      {value?.replace("_", " ") || "—"}
    </span>
  );
}

function RFQCard({ rfq, isVendor, onClick }) {
  const cats = rfq.subcategoryIds || [];
  return (
    <div
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-black text-slate-500 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
          {rfq.rfqNumber}
        </span>
        {!isVendor && <StatusPill value={rfq.status} />}
        {isVendor && rfq.myQuotationStatus && (
          <StatusPill value={rfq.myQuotationStatus} map={QUOTATION_TONES} />
        )}
        {isVendor && !rfq.myQuotationStatus && (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
            Not submitted
          </span>
        )}
      </div>

      <div className="mt-3 text-base font-black leading-snug text-slate-900">
        {rfq.title}
      </div>

      {cats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cats.slice(0, 3).map((c) => (
            <span key={c._id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {c.name}
            </span>
          ))}
          {cats.length > 3 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-400">
              +{cats.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        {rfq.deadline ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock size={12} />
            Deadline: {new Date(rfq.deadline).toLocaleDateString("en-GB")}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No deadline</span>
        )}
        <span className="text-xs text-slate-400">
          {new Date(rfq.createdAt).toLocaleDateString("en-GB")}
        </span>
      </div>
    </div>
  );
}

export default function RFQsPage() {
  const nav   = useNavigate();
  const toast = useToast();

  const [role, setRole]   = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    me().then((r) => setRole(r?.user?.role || null)).catch(() => {});
  }, []);

  const isVendor = role === "vendor";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRfqs({ limit: 200 });
      setItems(res.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      const text = [r.title, r.rfqNumber, ...(r.subcategoryIds || []).map((c) => c.name)]
        .filter(Boolean).join(" ").toLowerCase();
      const matchQ      = !q || text.includes(q.toLowerCase());
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [items, q, statusFilter]);

  const stats = useMemo(() => ({
    total:     items.length,
    published: items.filter((r) => r.status === "published").length,
    awarded:   items.filter((r) => r.status === "awarded").length,
  }), [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="PROCUREMENT"
        title={isVendor ? "Available RFQs" : "Requests for Quotation"}
        subtitle={
          isVendor
            ? "RFQs matching your registered categories."
            : "Create and publish RFQs to automatically reach matched vendors."
        }
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "RFQs" },
        ]}
        right={
          !isVendor && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw size={15} /> Refresh
              </Button>
              <Button
                onClick={() => nav("/portal/procurement/rfqs/new")}
                style={{ backgroundColor: BRAND }}
              >
                <Plus size={15} /> New RFQ
              </Button>
            </div>
          )
        }
      />

      {!isVendor && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={FileText}     label="Total"     value={loading ? "—" : stats.total}     color="indigo"  />
          <StatCard icon={Clock}        label="Published" value={loading ? "—" : stats.published} color="blue"    />
          <StatCard icon={CheckCircle}  label="Awarded"   value={loading ? "—" : stats.awarded}   color="emerald" />
        </div>
      )}

      <FilterBar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search by title, number, category…"
        filters={
          !isVendor
            ? [
                {
                  label: "status",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "", label: "All statuses" },
                    { value: "draft",     label: "Draft"     },
                    { value: "published", label: "Published" },
                    { value: "closed",    label: "Closed"    },
                    { value: "awarded",   label: "Awarded"   },
                  ],
                },
              ]
            : []
        }
        onClear={() => { setQ(""); setStatusFilter(""); }}
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="grid gap-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={isVendor ? "No matching RFQs" : "No RFQs yet"}
          message={
            isVendor
              ? "You'll see RFQs here once they're published in your registered categories."
              : "Create your first RFQ to get started."
          }
          actionLabel={!isVendor ? "New RFQ" : undefined}
          onAction={!isVendor ? () => nav("/portal/procurement/rfqs/new") : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((rfq) => (
            <RFQCard
              key={rfq._id}
              rfq={rfq}
              isVendor={isVendor}
              onClick={() => nav(`/portal/procurement/rfqs/${rfq._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
