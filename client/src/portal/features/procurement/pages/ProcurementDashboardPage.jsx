import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { getProcurementStats } from "../api";
import {
  Plus,
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Inbox,
} from "lucide-react";

const BRAND = "#6F7FD9";

const STATUS_TONES = {
  new:        "border-slate-200 bg-slate-50 text-slate-700",
  assessing:  "border-amber-200 bg-amber-50 text-amber-700",
  quoted:     "border-blue-200 bg-blue-50 text-blue-700",
  approved:   "border-violet-200 bg-violet-50 text-violet-700",
  ordered:    "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered:  "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:  "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_DOT = {
  new:        "bg-slate-400",
  assessing:  "bg-amber-400",
  quoted:     "bg-blue-400",
  approved:   "bg-violet-500",
  ordered:    "bg-indigo-500",
  delivered:  "bg-emerald-500",
  cancelled:  "bg-rose-500",
};

const PRIORITY_TONES = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  high:   "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-slate-200 bg-slate-50 text-slate-600",
  low:    "border-slate-100 bg-slate-50 text-slate-400",
};

const STATUS_ORDER = ["new", "assessing", "quoted", "approved", "ordered", "delivered", "cancelled"];

function StatusPill({ value }) {
  return (
    <span className={[
      "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
      STATUS_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
    ].join(" ")}>
      {value || "—"}
    </span>
  );
}

function PriorityPill({ value }) {
  return (
    <span className={[
      "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
      PRIORITY_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
    ].join(" ")}>
      {value || "—"}
    </span>
  );
}

function StatCard({ label, value, hint, Icon, accent }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-1.5 text-3xl font-black text-slate-900">{value ?? "—"}</div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/5"
          style={{ backgroundColor: accent || "rgba(111,127,217,0.10)" }}
        >
          <Icon size={18} className="text-slate-700" />
        </div>
      </div>
    </Card>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function ProcurementDashboardPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProcurementStats();
      setStats(res?.stats || res);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load procurement stats.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const byStatus  = stats?.byStatus  || {};
  const recent    = stats?.recent    || [];

  const totalRequests = Object.values(byStatus).reduce((s, n) => s + (n || 0), 0);
  const pending       = (byStatus.new || 0) + (byStatus.assessing || 0) + (byStatus.quoted || 0);
  const inProgress    = (byStatus.approved || 0) + (byStatus.ordered || 0);
  const delivered     = byStatus.delivered || 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="OPERATIONS"
        title="Procurement"
        subtitle="Overview of all procurement requests, vendors, and categories."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button
              onClick={() => nav("/portal/procurement/requests")}
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={15} />
              New Request
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0,1,2,3].map(i => <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="TOTAL REQUESTS" value={totalRequests} hint="all time" Icon={ShoppingCart} />
          <StatCard label="NEW / PENDING" value={pending} hint="new, assessing, quoted" Icon={Inbox} accent="rgba(251,191,36,0.12)" />
          <StatCard label="IN PROGRESS" value={inProgress} hint="approved + ordered" Icon={Clock} accent="rgba(99,102,241,0.10)" />
          <StatCard label="DELIVERED" value={delivered} hint="completed requests" Icon={CheckCircle2} accent="rgba(16,185,129,0.10)" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Recent Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Recent Requests" subtitle="Latest procurement requests" />
              <CardBody className="p-0">
                {recent.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center p-6 text-sm text-slate-400">
                    No requests yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          {["Ref", "Title", "Category", "Status", "Priority", "Client", "Date"].map(h => (
                            <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {recent.map((req) => {
                          const ref = req.ref || (req._id ? `PR-${req._id.slice(-4).toUpperCase()}` : "—");
                          const categoryName = req.categoryId?.name || req.category || "—";
                          const customerName = req.customerId?.companyName || req.customerId?.contactName || req.customer || "—";
                          return (
                            <tr
                              key={req._id}
                              className="cursor-pointer transition hover:bg-slate-50"
                              onClick={() => nav(`/portal/procurement/requests/${req._id}`)}
                            >
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className="font-mono text-xs font-bold text-slate-600">{ref}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-semibold text-slate-900 line-clamp-1">{req.title || "Untitled"}</span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{categoryName}</td>
                              <td className="whitespace-nowrap px-4 py-3"><StatusPill value={req.status} /></td>
                              <td className="whitespace-nowrap px-4 py-3"><PriorityPill value={req.priority} /></td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{customerName}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(req.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right: By Status */}
          <div>
            <Card>
              <CardHeader title="By Status" subtitle="Request breakdown" />
              <CardBody>
                <div className="grid gap-2">
                  {STATUS_ORDER.map((s) => {
                    const count = byStatus[s] || 0;
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={["h-2.5 w-2.5 rounded-full", STATUS_DOT[s] || "bg-slate-300"].join(" ")} />
                          <span className="text-sm font-semibold capitalize text-slate-700">{s}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
