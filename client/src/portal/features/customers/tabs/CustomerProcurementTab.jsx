import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Button from "../../../shared/ui/Button";
import { Package, ChevronRight, RefreshCw, Plus } from "lucide-react";
import { listRequests } from "../../procurement/api";

const STATUS_TONES = {
  new: "border-slate-200 bg-slate-50 text-slate-700",
  assessing: "border-amber-200 bg-amber-50 text-amber-700",
  quoted: "border-blue-200 bg-blue-50 text-blue-700",
  approved: "border-violet-200 bg-violet-50 text-violet-700",
  ordered: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const PRIORITY_TONES = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-slate-200 bg-slate-50 text-slate-600",
  low: "border-slate-100 bg-slate-50 text-slate-400",
};

function StatusPill({ value }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
        STATUS_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value || "—"}
    </span>
  );
}

function PriorityPill({ value }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
        PRIORITY_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value || "normal"}
    </span>
  );
}

export default function CustomerProcurementTab({ customer }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!customer?._id) return;
    setLoading(true);
    setError("");
    try {
      const res = await listRequests({ customerId: customer._id, limit: 100, sort: "-createdAt" });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?._id]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No procurement requests"
        message="This client has no procurement requests yet."
        actionLabel="New request"
        onAction={() => nav("/portal/procurement/requests")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/10 p-4">
        <div className="text-sm font-black text-slate-900">
          Procurement Requests ({items.length})
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button onClick={() => nav("/portal/procurement/requests")}>
            <Plus size={14} />
            New Request
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-slate-50">
            <tr className="border-b border-black/10">
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">ITEM</th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">CATEGORY</th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">STATUS</th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">PRIORITY</th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">BUDGET</th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">NEEDED BY</th>
              <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((req) => (
              <tr
                key={req._id}
                className="cursor-pointer border-b border-slate-100 hover:bg-black/[0.02]"
                onClick={() => nav(`/portal/procurement/requests/${req._id}`)}
              >
                <td className="px-4 py-4 align-top">
                  <div className="text-sm font-black text-slate-900">{req.itemName || "—"}</div>
                  {req.description && (
                    <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{req.description}</div>
                  )}
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-700">
                  {req.categoryId?.name || req.category || "—"}
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusPill value={req.status} />
                </td>
                <td className="px-4 py-4 align-top">
                  <PriorityPill value={req.priority} />
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-700">
                  {req.estimatedBudget != null
                    ? `${req.currency || "AED"} ${Number(req.estimatedBudget).toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-700">
                  {req.neededBy ? new Date(req.neededBy).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-4 text-right align-top">
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
