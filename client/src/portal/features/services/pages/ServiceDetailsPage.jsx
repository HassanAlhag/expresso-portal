import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";

import {
  ArrowLeft,
  Pencil,
  Sparkles,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Paperclip,
  Layers3,
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { getService } from "../api";
import ServiceStatusPill from "../components/ServiceStatusPill";

function money(x) {
  if (typeof x !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(x);
  } catch {
    return String(x);
  }
}

function MetaPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
      {children}
    </span>
  );
}

function StatTile({ label, value, hint, Icon }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500">{hint}</div>
          ) : null}
        </div>

        {Icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
            <Icon size={16} className="text-slate-700" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, Icon, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
            <Icon size={18} className="text-slate-700" />
          </div>
        ) : null}

        <div>
          <div className="text-base font-black text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          ) : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ChecklistBlock({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="mt-3 grid gap-2">
        {items.map((c, index) => (
          <div
            key={c?.id || c?.text || c || index}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            • {typeof c === "string" ? c : c?.text || "Checklist item"}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScopeGroupCard({ group, index }) {
  const jobs = Array.isArray(group?.jobs) ? group.jobs : [];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-black text-slate-900">
          {group.title || `Group ${index + 1}`}
        </div>
        <MetaPill>{group.type || "group"}</MetaPill>
        <MetaPill>{jobs.length} items</MetaPill>
        <MetaPill>Due in {group.dueDays ?? 0} days</MetaPill>
      </div>

      {group.description ? (
        <div className="mt-3 text-sm leading-6 text-slate-600">
          {group.description}
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <div className="mt-4 text-sm text-slate-500">
          No items in this group.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50/60">
          <div className="divide-y divide-slate-200">
            {jobs.map((job, jobIndex) => (
              <div
                key={job.id || `${job.title}-${jobIndex}`}
                className="px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-black text-slate-900">
                    {job.title || "Untitled item"}
                  </div>
                  <MetaPill>{job.type || "job"}</MetaPill>
                  <MetaPill>
                    {job.quantity ?? 1} {job.unit || "item"}
                  </MetaPill>
                  <MetaPill>Due in {job.dueDays ?? 0} days</MetaPill>
                </div>

                {job.description ? (
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {job.description}
                  </div>
                ) : null}

                {Array.isArray(job.checklist) && job.checklist.length > 0 ? (
                  <ChecklistBlock
                    title="ITEM CHECKLIST"
                    items={job.checklist}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalStepCard({ step, index }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-black text-slate-900">
          Step {index + 1}: {step.title || "Approval step"}
        </div>
        <MetaPill>{step.role || "client"}</MetaPill>
        <MetaPill>{step.required !== false ? "Required" : "Optional"}</MetaPill>
      </div>

      {step.instructions ? (
        <div className="mt-3 text-sm leading-6 text-slate-600">
          {step.instructions}
        </div>
      ) : null}
    </div>
  );
}

export default function ServiceDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getService(id);
      setItem(res?.item || res?.service || null);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load service"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const scopeGroups = useMemo(() => {
    return Array.isArray(item?.scopeGroups) ? item.scopeGroups : [];
  }, [item]);

  const groupsCount = useMemo(() => scopeGroups.length, [scopeGroups]);

  const jobsCount = useMemo(() => {
    return scopeGroups.reduce((sum, group) => {
      const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
      return (
        sum +
        jobs.reduce(
          (jobSum, job) => jobSum + Math.max(1, Number(job?.quantity || 1)),
          0
        )
      );
    }, 0);
  }, [scopeGroups]);

  const approvalStepsCount = useMemo(() => {
    return Array.isArray(item?.approvals?.steps)
      ? item.approvals.steps.length
      : 0;
  }, [item]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-32 w-full" />
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

  if (!item) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">
        Service not found.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => nav("/portal/services")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 transition hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            Back to services
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ServiceStatusPill status={item.status} />
            <MetaPill>/{item.slug || "—"}</MetaPill>
            <MetaPill>{item.billingCycle || "—"}</MetaPill>
            <MetaPill>{item.executionMode || "—"}</MetaPill>
          </div>

          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {item.name || item.title}
          </div>

          <div className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            {item.summary || item.description || "No summary added."}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => nav(`/portal/services/${id}/edit`)}
          >
            <Pencil size={16} />
            Edit in builder
          </Button>

          <Button variant="outline" onClick={load}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(127,138,209,0.12),transparent_42%)]" />

        <div className="relative grid gap-5 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700">
                <Sparkles size={14} />
                Service blueprint
              </div>

              {item.description ? (
                <div className="mt-4">
                  <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                    DESCRIPTION
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {item.description}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="xl:col-span-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="PRICING"
              value={`${money(item.price)}${
                item.billingCycle ? ` / ${item.billingCycle}` : ""
              }`}
              hint="billing model"
              Icon={Clock3}
            />
            <StatTile
              label="GROUPS"
              value={String(groupsCount)}
              hint="scope sections"
              Icon={Layers3}
            />
            <StatTile
              label="JOBS"
              value={String(jobsCount)}
              hint="template items"
              Icon={FileCheck2}
            />
            <StatTile
              label="APPROVALS"
              value={
                item.approvals?.required === false ? "Optional" : "Required"
              }
              hint={`${approvalStepsCount} step${
                approvalStepsCount === 1 ? "" : "s"
              }`}
              Icon={ShieldCheck}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          Icon={Layers3}
          title="Scope structure"
          subtitle="The delivery blocks and items included in this service."
        />

        {scopeGroups.length === 0 ? (
          <div className="mt-5 text-sm text-slate-500">
            No scope groups defined.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {scopeGroups.map((group, index) => (
              <ScopeGroupCard
                key={group.id || `${group.title}-${index}`}
                group={group}
                index={index}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <SectionHeader
            Icon={Clock3}
            title="Service SLA"
            subtitle="Delivery expectations and support boundaries."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatTile
              label="RESPONSE"
              value={`${item.sla?.responseTime ?? 24} ${
                item.sla?.responseUnit || "hours"
              }`}
              hint="response expectation"
              Icon={Clock3}
            />
            <StatTile
              label="DELIVERY"
              value={`${item.sla?.deliveryDays ?? 7} days`}
              hint="target turnaround"
              Icon={FileCheck2}
            />
            <StatTile
              label="REVISIONS"
              value={`${item.sla?.revisionRounds ?? 2}`}
              hint="included rounds"
              Icon={BadgeCheck}
            />
            <StatTile
              label="SUPPORT WINDOW"
              value={item.sla?.supportWindow || "—"}
              hint="availability"
              Icon={ShieldCheck}
            />
          </div>

          {item.sla?.notes ? (
            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {item.sla.notes}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <SectionHeader
            Icon={ShieldCheck}
            title="Approval flow"
            subtitle="Who signs off before delivery or publishing."
          />

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {item.approvals?.required === false
              ? "Approval is optional for this service."
              : "Approval is required before final delivery or publishing."}
          </div>

          {Array.isArray(item.approvals?.steps) &&
          item.approvals.steps.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {item.approvals.steps.map((step, index) => (
                <ApprovalStepCard
                  key={step.id || `${step.title}-${index}`}
                  step={step}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">
              No approval steps defined.
            </div>
          )}

          <ChecklistBlock
            title="APPROVAL CHECKLIST"
            items={item.approvals?.checklist || []}
          />
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader
          Icon={Paperclip}
          title="Files & references"
          subtitle="Attachments and internal media references."
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              UPLOADS
            </div>

            {Array.isArray(item.files?.uploads) &&
            item.files.uploads.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/60">
                <div className="divide-y divide-slate-200">
                  {item.files.uploads.map((u, i) => (
                    <div
                      key={u.id || u.name || i}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {u.name || "File"}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {u.url || "—"}
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className="shrink-0 text-slate-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No uploaded files.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
              MEDIA REFERENCES
            </div>

            {Array.isArray(item.files?.mediaRefs) &&
            item.files.mediaRefs.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/60">
                <div className="divide-y divide-slate-200">
                  {item.files.mediaRefs.map((m, i) => (
                    <div
                      key={m.mediaId || i}
                      className="px-4 py-3 text-sm text-slate-700"
                    >
                      • {m.mediaId || "Media ref"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No media refs attached.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          Icon={BriefcaseBusiness}
          title="Operational summary"
          subtitle="Quick snapshot of how this service is meant to run."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
              <Building2 size={14} />
              EXECUTION MODE
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {item.executionMode || "—"}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
              <Clock3 size={14} />
              BILLING CYCLE
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {item.billingCycle || "—"}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
              <BadgeCheck size={14} />
              STATUS
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {item.status || "—"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
