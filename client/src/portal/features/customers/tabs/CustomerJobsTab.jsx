import React, { useMemo } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import {
  ClipboardList,
  RefreshCw,
  Plus,
  CalendarDays,
  User2,
  BriefcaseBusiness,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

function StatusPill({ status }) {
  const value = String(status || "planned").toLowerCase();

  const map = {
    draft: "border-slate-200 bg-slate-50 text-slate-700",
    planned: "border-sky-200 bg-sky-50 text-sky-700",
    in_progress: "border-amber-200 bg-amber-50 text-amber-700",
    review: "border-violet-200 bg-violet-50 text-violet-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    delivered: "border-green-200 bg-green-50 text-green-700",
    published: "border-indigo-200 bg-indigo-50 text-indigo-700",
    cancelled: "border-red-200 bg-red-50 text-red-700",
    blocked: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
        map[value] || "border-slate-200 bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function PriorityPill({ priority }) {
  const value = String(priority || "normal").toLowerCase();

  const map = {
    low: "border-slate-200 bg-slate-50 text-slate-700",
    normal: "border-sky-200 bg-sky-50 text-sky-700",
    medium: "border-sky-200 bg-sky-50 text-sky-700",
    high: "border-amber-200 bg-amber-50 text-amber-700",
    urgent: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
        map[value] || "border-slate-200 bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

function TypePill({ type }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
      {String(type || "other").replaceAll("_", " ")}
    </span>
  );
}

function StatPill({ label, value, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black",
        tones[tone] || tones.default,
      ].join(" ")}
    >
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatMonth(date) {
  if (!date) return "No month";
  try {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "No month";
  }
}

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "—";
  }
}

function getAssigneeText(job) {
  const assignees = Array.isArray(job?.assignees) ? job.assignees : [];
  if (!assignees.length) return "Unassigned";

  if (assignees.length === 1) {
    return assignees[0]?.fullName || assignees[0]?.email || "1 assignee";
  }

  const first = assignees[0]?.fullName || assignees[0]?.email || "Assigned";
  return `${first} +${assignees.length - 1}`;
}

function getSourceText(job) {
  return (
    job?.enrollmentId?.serviceTemplateId?.name ||
    job?.projectId?.name ||
    "Manual job"
  );
}

function groupJobsByMonth(jobs = []) {
  const map = new Map();

  jobs.forEach((job) => {
    const key = formatMonth(job?.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(job);
  });

  return Array.from(map.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function HeaderRow() {
  return (
    <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_0.8fr_0.8fr_0.9fr_36px] items-center gap-4 border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 md:grid">
      <div>Job</div>
      <div>Assignee / Source</div>
      <div>Status</div>
      <div>Priority</div>
      <div>Date</div>
      <div />
    </div>
  );
}

function JobRow({ job, onOpenJob }) {
  const assignee = getAssigneeText(job);
  const source = getSourceText(job);
  const created = formatDate(job?.createdAt);

  return (
    <button
      type="button"
      onClick={() => onOpenJob(job._id)}
      className="grid w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50/80 md:grid-cols-[minmax(0,2.2fr)_1fr_0.8fr_0.8fr_0.9fr_36px] md:items-center md:gap-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-black text-slate-900">
            {job.title || "Untitled job"}
          </div>
          <TypePill type={job.type} />
        </div>

        <div className="mt-1 line-clamp-1 text-xs text-slate-500">
          {job.notes || "No notes added"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <User2 size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{assignee}</span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <BriefcaseBusiness size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{source}</span>
        </div>
      </div>

      <div>
        <StatusPill status={job.status} />
      </div>

      <div>
        <PriorityPill priority={job.priority} />
      </div>

      <div className="text-sm text-slate-700">
        <div className="font-semibold">{created}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {formatMonth(job?.createdAt)}
        </div>
      </div>

      <div className="hidden justify-end md:flex">
        <ChevronRight size={16} className="text-slate-400" />
      </div>
    </button>
  );
}

export default function CustomerJobsTab({
  jobQ,
  setJobQ,
  jobsLoading,
  jobsError,
  jobs,
  busy,
  onLoadJobs,
  onOpenNewJob,
  onOpenJob,
}) {
  const groups = useMemo(() => groupJobsByMonth(jobs), [jobs]);

  const stats = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];

    return {
      total: list.length,
      planned: list.filter((j) => j?.status === "planned").length,
      progress: list.filter((j) => j?.status === "in_progress").length,
      review: list.filter((j) => j?.status === "review").length,
      delivered: list.filter((j) =>
        ["approved", "delivered", "published"].includes(j?.status)
      ).length,
    };
  }, [jobs]);

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1">
            <Input
              label="Search jobs"
              value={jobQ}
              onChange={(e) => setJobQ(e.target.value)}
              placeholder="Search by title or notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onLoadJobs}
              disabled={jobsLoading || busy}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>

            <Button onClick={onOpenNewJob} disabled={busy}>
              <Plus size={16} />
              New job
            </Button>
          </div>
        </div>

        {!jobsLoading && !jobsError && jobs.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Planned" value={stats.planned} tone="sky" />
            <StatPill label="In progress" value={stats.progress} tone="amber" />
            <StatPill label="Review" value={stats.review} tone="violet" />
            <StatPill label="Done" value={stats.delivered} tone="green" />
          </div>
        ) : null}
      </Card>

      {jobsLoading ? (
        <Card className="p-4">
          <div className="grid gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </Card>
      ) : jobsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {jobsError}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No jobs yet"
          message="Create a job to start execution for this customer."
          actionLabel="Create Job"
          onAction={onOpenNewJob}
        />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.label} className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-slate-400" />
                  <div className="text-sm font-black text-slate-900">
                    {group.label}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  {group.items.length} job{group.items.length === 1 ? "" : "s"}
                </div>
              </div>

              <HeaderRow />

              <div>
                {group.items.map((job) => (
                  <JobRow key={job._id} job={job} onOpenJob={onOpenJob} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!jobsLoading && !jobsError && jobs.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-slate-400" />
            Click any row to open the job details.
          </div>
        </div>
      ) : null}
    </div>
  );
}
