import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { listJobs } from "../../jobs/api";
import {
  Clapperboard,
  Film,
  CalendarDays,
  Globe,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const STATUS_CLS = {
  brief: "bg-slate-100 text-slate-600",
  content_ready: "bg-slate-100 text-slate-600",
  script: "bg-sky-50 text-sky-700",
  pre_production: "bg-sky-50 text-sky-700",
  designing: "bg-indigo-50 text-indigo-700",
  shooting: "bg-indigo-50 text-indigo-700",
  editing: "bg-indigo-50 text-indigo-700",
  internal_review: "bg-amber-50 text-amber-700",
  client_review: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-teal-50 text-teal-700",
  published: "bg-violet-50 text-violet-700",
  delivered: "bg-violet-50 text-violet-700",
  on_hold: "bg-rose-50 text-rose-600",
  archived: "bg-slate-100 text-slate-400",
};

const TYPE_CLS = {
  reel: "border-violet-200 bg-violet-50 text-violet-700",
  video: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function CustomerProductionsTab({ customerId }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError("");
    try {
      const res = await listJobs({ customerId, limit: 100, page: 1, sort: "-createdAt" });
      const all = Array.isArray(res?.items) ? res.items : [];
      setItems(all.filter((j) => ["reel", "video"].includes(j.type)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load productions");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
        <EmptyState
          icon={Clapperboard}
          title="No productions yet"
          message="Reels and videos linked to this client will appear here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div>
          <div className="text-sm font-black text-slate-900">Productions</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {items.length} reel{items.length !== 1 ? "s" : ""} &amp; video{items.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-slate-400 transition hover:text-slate-700"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="divide-y divide-black/[0.05]">
        {items.map((item) => {
          const statusCls = STATUS_CLS[item.status] || "bg-slate-100 text-slate-600";
          const typeCls = TYPE_CLS[item.type] || TYPE_CLS.reel;
          const isOverdue =
            item.dueDate &&
            !["published", "delivered", "archived"].includes(item.status) &&
            new Date(item.dueDate) < new Date();

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => nav(`/portal/productions/${item._id}`)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-slate-50">
                <Film size={16} className="text-slate-500" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wide ${typeCls}`}>
                    {item.type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${statusCls}`}>
                    {String(item.status || "").replace(/_/g, " ")}
                  </span>
                  {item.websiteVisible && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      <Globe size={8} /> Live
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-sm font-black text-slate-900">
                  {item.title || "Untitled"}
                </div>
                {item.platform && (
                  <div className="text-[10px] capitalize text-slate-400">{item.platform}</div>
                )}
              </div>

              {item.dueDate && (
                <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold ${isOverdue ? "text-rose-500" : "text-slate-400"}`}>
                  <CalendarDays size={11} />
                  {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              )}

              <ArrowRight size={14} className="flex-shrink-0 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
