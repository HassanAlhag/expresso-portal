import React from "react";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import {
  FolderKanban,
  BriefcaseBusiness,
  FileClock,
  Settings2,
} from "lucide-react";
import ProjectStatusPill from "./ProjectStatusPill";
import ProjectPriorityPill from "./ProjectPriorityPill";

function humanize(value) {
  return String(value || "—").replaceAll("_", " ");
}

function getModeIcon(mode) {
  if (mode === "internal") return Settings2;
  if (mode === "pre_contract") return FileClock;
  return BriefcaseBusiness;
}

function getModeTone(mode) {
  if (mode === "internal") return "warning";
  if (mode === "pre_contract") return "danger";
  if (mode === "contracted") return "success";
  return "info";
}

function MetaBadge({ children, tone = "neutral" }) {
  return <Badge tone={tone}>{children}</Badge>;
}

export default function ProjectList({
  items = [],
  meta,
  loading,
  error,
  onOpen,
  onCreate,
  onPrev,
  onNext,
}) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
        {error}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        message="Create a project for client work, custom work, pre-contract work, or internal initiatives."
        actionLabel="New project"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="divide-y divide-black/10">
        {items.map((p) => {
          const isInternal = p.projectMode === "internal";
          const ModeIcon = getModeIcon(p.projectMode);

          return (
            <button
              key={p._id}
              className="w-full p-4 text-left transition hover:bg-black/[0.02]"
              onClick={() => onOpen?.(p)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-extrabold text-slate-900">
                      {p.name}
                    </div>

                    <ProjectStatusPill status={p.status} />
                    <ProjectPriorityPill priority={p.priority} />

                    <MetaBadge tone="neutral">
                      {String(p.type || "delivery").toUpperCase()}
                    </MetaBadge>

                    {p.projectMode ? (
                      <MetaBadge tone={getModeTone(p.projectMode)}>
                        <span className="inline-flex items-center gap-1.5">
                          <ModeIcon size={12} />
                          {humanize(p.projectMode)}
                        </span>
                      </MetaBadge>
                    ) : null}

                    {p.source ? (
                      <MetaBadge tone="neutral">{humanize(p.source)}</MetaBadge>
                    ) : null}
                  </div>

                  <div className="mt-1 truncate text-sm text-slate-600">
                    {isInternal ? (
                      <>
                        Internal project
                        {p.team ? (
                          <>
                            {" • "}Team:{" "}
                            <span className="font-semibold text-slate-900">
                              {p.team}
                            </span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <>
                        Client:{" "}
                        <span className="font-semibold text-slate-900">
                          {p.customerId?.companyName || "—"}
                        </span>
                        {" • "}
                        {p.customerId?.contactName || "—"}
                      </>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {p.code ? (
                      <span>
                        Code: <span className="font-semibold">{p.code}</span>
                      </span>
                    ) : null}

                    {p.team ? (
                      <span>
                        Team: <span className="font-semibold">{p.team}</span>
                      </span>
                    ) : null}

                    {p.ownerUserId?.fullName ? (
                      <span>
                        Owner:{" "}
                        <span className="font-semibold">
                          {p.ownerUserId.fullName}
                        </span>
                      </span>
                    ) : null}

                    {p.budget ? (
                      <span>
                        Budget:{" "}
                        <span className="font-semibold">
                          {p.currency || "AED"} {p.budget}
                        </span>
                      </span>
                    ) : null}

                    {p.targetLaunchDate ? (
                      <span>
                        Launch:{" "}
                        <span className="font-semibold">
                          {new Date(p.targetLaunchDate).toLocaleDateString()}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-right text-xs text-slate-500">
                  <div>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-black/10 px-4 py-3">
        <div className="text-xs text-slate-500">
          Showing page <span className="font-extrabold">{meta.page}</span> of{" "}
          <span className="font-extrabold">{meta.pages}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={meta.page <= 1}
          >
            Prev
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={meta.page >= meta.pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
