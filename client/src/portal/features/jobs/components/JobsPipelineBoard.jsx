import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { JOB_STAGES, getColumnKey, nextStage, prevStage } from "../pipeline";

const TYPE_COLORS = {
  video:      "border-violet-200 bg-violet-50 text-violet-700",
  reel:       "border-violet-200 bg-violet-50 text-violet-700",
  photo:      "border-sky-200 bg-sky-50 text-sky-700",
  design:     "border-indigo-200 bg-indigo-50 text-indigo-700",
  post:       "border-slate-200 bg-slate-50 text-slate-600",
  carousel:   "border-slate-200 bg-slate-50 text-slate-600",
  case_study: "border-amber-200 bg-amber-50 text-amber-700",
};

const PRIORITY_DOT = {
  urgent: "bg-rose-500",
  high:   "bg-orange-400",
  normal: "bg-slate-300",
  low:    "bg-slate-200",
};

function Initials({ name }) {
  return (
    <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black flex items-center justify-center flex-shrink-0">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function JobCard({ job, onOpen, onMove, busy }) {
  const typeCls = TYPE_COLORS[job.type] || "border-slate-200 bg-slate-50 text-slate-600";
  const dotCls = PRIORITY_DOT[job.priority] || PRIORITY_DOT.normal;
  const assignees = Array.isArray(job.assignees) ? job.assignees.slice(0, 3) : [];
  const overflowCount = Array.isArray(job.assignees) ? Math.max(0, job.assignees.length - 3) : 0;

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-3 shadow-sm">
      <button className="w-full text-left" onClick={() => onOpen?.(job)} type="button">
        <div className="flex items-start gap-2">
          <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${dotCls}`} />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-black text-slate-900 leading-snug line-clamp-2">
              {job.title}
            </div>
            <div className="mt-0.5 text-[10.5px] text-slate-400 truncate">
              {job.customerId?.companyName || "—"}
            </div>
          </div>
        </div>

        {/* Type pill + due date */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {job.type && (
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] ${typeCls}`}>
              {job.type.replace(/_/g, " ")}
            </span>
          )}
          {job.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <CalendarDays size={9} />
              {new Date(job.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Assignees */}
        {(assignees.length > 0 || overflowCount > 0) && (
          <div className="mt-2 flex items-center gap-1">
            {assignees.map((a) => (
              <Initials key={a._id || a} name={a?.fullName || "?"} />
            ))}
            {overflowCount > 0 && (
              <span className="text-[9px] font-black text-slate-400">+{overflowCount}</span>
            )}
          </div>
        )}
      </button>

      {/* Move buttons */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onMove?.(job, nextStage(job.status))}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 py-1 text-[10px] font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"
        >
          Next <ChevronRight size={10} />
        </button>
        <button
          type="button"
          onClick={() => onMove?.(job, prevStage(job.status))}
          disabled={busy}
          className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronLeft size={10} />
        </button>
      </div>
    </div>
  );
}

export default function JobsPipelineBoard({ items, onOpen, onMove, busy }) {
  const byStage = useMemo(() => {
    const map = {};
    JOB_STAGES.forEach((s) => (map[s.key] = []));
    (items || []).forEach((j) => {
      const col = getColumnKey(j.status || "brief");
      if (!map[col]) map[col] = [];
      map[col].push(j);
    });
    return map;
  }, [items]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-[900px]">
        {JOB_STAGES.map((col) => {
          const colItems = byStage[col.key] || [];
          return (
            <div key={col.key} className="flex-1 min-w-[160px] overflow-hidden rounded-2xl border border-black/[0.07] bg-slate-50/50">
              <div className="px-3 py-2.5 border-b border-black/[0.07] bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    {col.label}
                  </span>
                  <span className="min-w-[18px] rounded-full bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-black text-slate-600">
                    {colItems.length}
                  </span>
                </div>
              </div>

              <div className="p-2 grid gap-2">
                {colItems.map((j) => (
                  <JobCard key={j._id} job={j} onOpen={onOpen} onMove={onMove} busy={busy} />
                ))}
                {colItems.length === 0 && (
                  <div className="py-6 text-center text-[10px] text-slate-400">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
