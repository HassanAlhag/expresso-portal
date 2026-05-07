import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { Layers, Plus, Trash2, Wand2, ExternalLink } from "lucide-react";

function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        map[tone] || map.slate,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function toneByMode(mode) {
  if (mode === "recurring_quantity") return "indigo";
  if (mode === "milestone_project") return "orange";
  if (mode === "support_sla") return "green";
  return "slate";
}

export default function ProjectScopeTab({
  loading,
  error,
  items,
  busy,
  generatingId,
  onOpenAdd,
  onRemove,
  onViewTemplate,
  onGenerateJobs,
}) {
  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              Scope items
            </div>
            <div className="text-sm text-slate-600">
              Sold services/packages/phases under this project.
            </div>
          </div>

          <Button onClick={onOpenAdd} disabled={busy}>
            <Plus size={16} />
            Add scope item
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : !items?.length ? (
        <EmptyState
          icon={Layers}
          title="No scope items yet"
          message="Add the sold services or phases for this project."
          actionLabel="Add scope item"
          onAction={onOpenAdd}
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const mode =
              item?.finalScope?.mode ||
              item?.serviceTemplateId?.executionMode ||
              "one_time_delivery";

            const selectedLabel =
              item?.selectedPackageKey ||
              item?.selectedBlueprintKey ||
              item?.selectedPhaseKey ||
              "Custom scope";

            const finalJobsCount = Array.isArray(item?.finalScope?.jobTemplates)
              ? item.finalScope.jobTemplates.reduce(
                  (sum, x) => sum + Math.max(1, Number(x.quantity || 1)),
                  0
                )
              : 0;

            const finalDeliverablesCount = Array.isArray(
              item?.finalScope?.deliverables
            )
              ? item.finalScope.deliverables.length
              : 0;

            return (
              <Card key={item._id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-black text-slate-900">
                        {item?.serviceTemplateId?.name || "Service"}
                      </div>

                      <Pill tone={toneByMode(mode)}>
                        {String(mode).replaceAll("_", " ")}
                      </Pill>

                      <Pill>{selectedLabel}</Pill>

                      <Pill tone="green">
                        {String(item?.status || "active").toUpperCase()}
                      </Pill>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {item?.notes || item?.overrides?.notes || "No notes"}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill>{finalDeliverablesCount} deliverables</Pill>
                      <Pill>{finalJobsCount} planned jobs</Pill>

                      {item?.pricing?.price ? (
                        <Pill tone="indigo">
                          {item?.pricing?.billingCycle || "one_time"} •{" "}
                          {item.pricing.price}
                        </Pill>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onViewTemplate?.(item)}
                      disabled={!item?.serviceTemplateId?._id}
                    >
                      <ExternalLink size={16} />
                      View template
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => onGenerateJobs?.(item)}
                      disabled={busy || generatingId === item._id}
                    >
                      <Wand2 size={16} />
                      {generatingId === item._id
                        ? "Generating..."
                        : "Generate jobs"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => onRemove?.(item)}
                      disabled={busy}
                    >
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
