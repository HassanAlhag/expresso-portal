import React from "react";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileClock,
  FolderKanban,
  Settings2,
  UserRound,
} from "lucide-react";
import ProjectStatusPill from "./ProjectStatusPill";
import ProjectPriorityPill from "./ProjectPriorityPill";

function humanize(value) {
  return String(value || "-").replaceAll("_", " ");
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

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(currency, amount) {
  if (amount === null || amount === undefined || amount === "") return "-";
  return `${currency || "AED"} ${Number(amount).toLocaleString()}`;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="grid gap-2 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
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
  if (loading) return <TableSkeleton />;

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
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-black/10 text-[10.5px] font-black uppercase tracking-[0.18em] text-slate-400">
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Client / Mode</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Timeline</th>
              <th className="px-5 py-3 text-right">Budget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {items.map((p) => {
              const isInternal = p.projectMode === "internal";
              const ModeIcon = getModeIcon(p.projectMode);
              const clientName = isInternal
                ? "Internal project"
                : p.customerId?.companyName || p.customerId?.contactName || "-";

              return (
                <tr
                  key={p._id}
                  onClick={() => onOpen?.(p)}
                  className="cursor-pointer transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="max-w-[320px] truncate text-sm font-black text-slate-900">
                          {p.name}
                        </span>
                        {p.code ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                            {p.code}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="neutral" size="xs">{humanize(p.type)}</Badge>
                        {p.source ? <Badge tone="neutral" size="xs">{humanize(p.source)}</Badge> : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-800">{clientName}</div>
                    <Badge tone={getModeTone(p.projectMode)} size="xs" className="mt-1">
                      <ModeIcon size={11} className="mr-1" />
                      {humanize(p.projectMode)}
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <ProjectStatusPill status={p.status} />
                      <ProjectPriorityPill priority={p.priority} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <UserRound size={14} className="text-slate-300" />
                      <span className="max-w-[170px] truncate">
                        {p.ownerUserId?.fullName || p.team || "-"}
                      </span>
                    </div>
                    {p.team && p.ownerUserId?.fullName ? (
                      <div className="mt-1 text-xs text-slate-400">{p.team}</div>
                    ) : null}
                  </td>

                  <td className="px-5 py-4">
                    <div className="grid gap-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} className="text-slate-300" />
                        Start: <span className="font-semibold text-slate-700">{formatDate(p.startDate)}</span>
                      </span>
                      <span>
                        Launch: <span className="font-semibold text-slate-700">{formatDate(p.targetLaunchDate || p.endDate)}</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right text-sm font-bold text-slate-700">
                    {formatMoney(p.currency, p.budget)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-black/10 bg-slate-50/60 px-4 py-3">
        <div className="text-xs text-slate-500">
          Page <span className="font-extrabold">{meta.page}</span> of{" "}
          <span className="font-extrabold">{meta.pages}</span> · {meta.total} total
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={meta.page <= 1}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={meta.page >= meta.pages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
