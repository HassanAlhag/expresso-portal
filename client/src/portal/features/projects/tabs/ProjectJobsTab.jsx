import React from "react";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  CalendarDays,
  Globe,
  Film,
  PenTool,
  Camera,
} from "lucide-react";

function StatusBadge({ value }) {
  const toneMap = {
    brief: "neutral",
    content_ready: "neutral",
    script: "neutral",
    pre_production: "warning",
    designing: "info",
    shooting: "warning",
    editing: "info",
    internal_review: "warning",
    client_review: "warning",
    approved: "success",
    scheduled: "info",
    published: "success",
    delivered: "success",
    archived: "neutral",
    on_hold: "danger",
  };

  return (
    <Badge tone={toneMap[value] || "neutral"}>
      {String(value || "unknown").replaceAll("_", " ")}
    </Badge>
  );
}

function PriorityBadge({ value }) {
  const toneMap = {
    low: "neutral",
    normal: "info",
    high: "warning",
    urgent: "danger",
  };

  return <Badge tone={toneMap[value] || "neutral"}>{value || "normal"}</Badge>;
}

function TypeBadge({ value }) {
  const toneMap = {
    post: "neutral",
    carousel: "info",
    story: "warning",
    reel: "info",
    video: "success",
    photo: "warning",
    design: "neutral",
    case_study: "info",
    other: "neutral",
  };

  return (
    <Badge tone={toneMap[value] || "neutral"}>
      {String(value || "other").replaceAll("_", " ")}
    </Badge>
  );
}

function WorkflowIcon({ workflowType }) {
  if (workflowType === "video") return <Film size={16} />;
  if (workflowType === "photo") return <Camera size={16} />;
  return <PenTool size={16} />;
}

export default function ProjectJobsTab({
  loading,
  error,
  items,
  q,
  setQ,
  busy,
  onApply,
  onCreate,
  onOpenJob,
}) {
  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-12 items-end">
          <div className="lg:col-span-8">
            <Input
              label="Search jobs"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="title, notes, concept, script..."
            />
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onApply}
              disabled={loading || busy}
            >
              <RefreshCw size={16} />
              Apply
            </Button>

            <Button onClick={onCreate} disabled={busy}>
              <Plus size={16} />
              New job
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No jobs yet"
          message="Create jobs to execute this project's deliverables."
          actionLabel="Create job"
          onAction={onCreate}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((j) => (
            <button
              key={j._id}
              type="button"
              onClick={() => onOpenJob?.(j)}
              className="w-full text-left"
            >
              <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-base font-black text-slate-900">
                        {j.title}
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                        <WorkflowIcon workflowType={j.workflowType} />
                        {j.workflowType || "design"}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <TypeBadge value={j.type} />
                      <StatusBadge value={j.status} />
                      <PriorityBadge value={j.priority} />

                      {j.websiteVisible ? (
                        <Badge tone="success">
                          <span className="inline-flex items-center gap-1">
                            <Globe size={12} />
                            website visible
                          </span>
                        </Badge>
                      ) : null}

                      {j.publishStatus ? (
                        <Badge tone="neutral">
                          {String(j.publishStatus).replaceAll("_", " ")}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                      {j.platform ? (
                        <span>
                          Platform:{" "}
                          <span className="font-semibold text-slate-700">
                            {j.platform}
                          </span>
                        </span>
                      ) : null}

                      {j.dueDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={13} />
                          Due:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(j.dueDate).toLocaleDateString()}
                          </span>
                        </span>
                      ) : null}

                      {j.createdAt ? (
                        <span>
                          Created:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(j.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
