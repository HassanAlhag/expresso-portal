import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";
import { Layers3 } from "lucide-react";

function executionModeLabel(mode) {
  const raw = String(mode || "").trim();
  if (raw === "phased_project") return "Phased project";
  if (raw === "one_time") return "One-time";
  if (raw === "recurring") return "Recurring";
  return raw || "—";
}

export default function CustomerEnrollmentsTab({
  enrollmentsLoading,
  enrollmentsError,
  enrollments,
  selectedEnrollmentId,
  busy,
  convertingEnrollmentId,
  onOpenJobs,
  onConvert,
}) {
  if (enrollmentsLoading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (enrollmentsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {enrollmentsError}
      </div>
    );
  }

  if (!enrollments.length) {
    return (
      <EmptyState
        icon={Layers3}
        title="No enrollments yet"
        message="This client is not enrolled in any fixed service yet."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {enrollments.map((item) => {
        const serviceName = item?.serviceTemplateId?.name || "Unknown service";
        const mode =
          item?.serviceTemplateId?.executionMode ||
          item?.finalScope?.mode ||
          "";

        const groups = Array.isArray(item?.finalScope?.groups)
          ? item.finalScope.groups
          : [];

        const jobsCount = groups.reduce((sum, group) => {
          const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
          return (
            sum +
            jobs.reduce(
              (jobSum, job) => jobSum + Math.max(1, Number(job?.quantity || 1)),
              0
            )
          );
        }, 0);

        const groupsCount = groups.length;
        const isSelected = String(selectedEnrollmentId) === String(item._id);

        return (
          <div
            key={item._id}
            className={[
              "rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm transition hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]",
              isSelected ? "ring-2 ring-[rgba(111,127,217,0.30)]" : "",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-black text-slate-900">
                    {serviceName}
                  </div>

                  <Badge tone="neutral">{executionModeLabel(mode)}</Badge>

                  <Badge tone="success">
                    {String(item?.status || "active").toUpperCase()}
                  </Badge>

                  {isSelected ? <Badge tone="info">SELECTED</Badge> : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    Groups:{" "}
                    <span className="font-black text-slate-900">
                      {groupsCount}
                    </span>
                  </span>

                  <span>
                    Jobs:{" "}
                    <span className="font-black text-slate-900">
                      {jobsCount}
                    </span>
                  </span>

                  <span>
                    Start:{" "}
                    <span className="font-black text-slate-900">
                      {item?.startDate
                        ? new Date(item.startDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </span>
                </div>

                {item?.notes ? (
                  <div className="mt-3 text-sm text-slate-600">
                    {item.notes}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" onClick={() => onOpenJobs(item)}>
                  Open jobs
                </Button>

                <Button
                  onClick={() => onConvert(item._id)}
                  disabled={busy || convertingEnrollmentId === item._id}
                >
                  {convertingEnrollmentId === item._id
                    ? "Converting..."
                    : "Convert to jobs"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
