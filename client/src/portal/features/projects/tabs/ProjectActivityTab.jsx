import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listJobs } from "../../jobs/api";
import { useToast } from "../../../shared/ui/Toast";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { Activity, Clock, ChevronRight } from "lucide-react";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_CLS = {
  published:      "text-emerald-600 bg-emerald-50 border-emerald-200",
  approved:       "text-indigo-600  bg-indigo-50  border-indigo-200",
  in_review:      "text-orange-600  bg-orange-50  border-orange-200",
  client_review:  "text-orange-600  bg-orange-50  border-orange-200",
  editing:        "text-sky-600     bg-sky-50     border-sky-200",
  designing:      "text-sky-600     bg-sky-50     border-sky-200",
  draft:          "text-slate-500   bg-slate-50   border-slate-200",
  cancelled:      "text-rose-600    bg-rose-50    border-rose-200",
  on_hold:        "text-amber-600   bg-amber-50   border-amber-200",
};

export default function ProjectActivityTab({ projectId }) {
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listJobs({ projectId, limit: 30, sort: "-createdAt" });
        if (!cancelled) setItems(res?.items || []);
      } catch (e) {
        if (!cancelled)
          toast.error(e?.response?.data?.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, toast]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
        <EmptyState
          icon={Activity}
          title="No activity yet"
          message="Jobs and delivery events for this project will appear here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
      <div className="mb-4 text-[11px] font-extrabold tracking-[0.18em] text-slate-500">
        RECENT JOBS · {items.length}
      </div>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100" />
        <div className="grid gap-3 pl-8">
          {items.map((job) => (
            <button
              key={job._id}
              type="button"
              onClick={() => nav(`/portal/jobs/${job._id}`)}
              className="relative group text-left"
            >
              <div className="absolute -left-5 top-2 h-2 w-2 rounded-full border-2 border-indigo-300 bg-white group-hover:border-indigo-500 transition" />
              <div className="flex items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-black/[0.07] hover:bg-black/[0.02] transition">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900 group-hover:underline">
                    {job.title || "Untitled job"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]",
                        STATUS_CLS[job.status] || STATUS_CLS.draft,
                      ].join(" ")}
                    >
                      {String(job.status || "draft").replaceAll("_", " ")}
                    </span>
                    {job.type && (
                      <span>{String(job.type).replaceAll("_", " ")}</span>
                    )}
                    {job.customerId?.companyName && (
                      <span className="text-slate-400">
                        · {job.customerId.companyName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                  <Clock size={10} />
                  {fmtDate(job.createdAt)}
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
