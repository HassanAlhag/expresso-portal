import React, { useMemo } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import EmptyState from "../../../shared/ui/EmptyState";
import {
  CheckCircle2,
  ClipboardList,
  Globe2,
  Plus,
  SearchCheck,
  Sparkles,
} from "lucide-react";

const WEBSITE_PLAN = {
  key: "website",
  title: "Website Delivery Plan",
  subtitle: "Plan phases from discovery through launch, then turn them into project jobs.",
  Icon: Globe2,
  phases: [
    {
      title: "Discovery and sitemap",
      outcome: "Requirements, pages, content sources, and sitemap approved.",
      jobs: [
        { title: "Website discovery workshop", type: "other", dueDays: 2 },
        { title: "Sitemap and page inventory", type: "design", dueDays: 4 },
      ],
    },
    {
      title: "UX and visual design",
      outcome: "Wireframes, responsive design direction, and core page UI.",
      jobs: [
        { title: "Homepage wireframe", type: "design", dueDays: 7 },
        { title: "Key page UI design", type: "design", dueDays: 12 },
      ],
    },
    {
      title: "Build and content",
      outcome: "Responsive pages, CMS/content entry, integrations, and tracking.",
      jobs: [
        { title: "Frontend website build", type: "other", dueDays: 18 },
        { title: "Content loading and media pass", type: "other", dueDays: 21 },
        { title: "Forms, analytics, and technical setup", type: "other", dueDays: 24 },
      ],
    },
    {
      title: "QA, launch, and handover",
      outcome: "Cross-device QA, launch checklist, backups, and client handover.",
      jobs: [
        { title: "Website QA and fixes", type: "other", dueDays: 27 },
        { title: "Website launch and handover", type: "other", dueDays: 30 },
      ],
    },
  ],
};

const SEO_PLAN = {
  key: "seo",
  title: "SEO Delivery Plan",
  subtitle: "Structure SEO as recurring monthly work with an onboarding setup phase.",
  Icon: SearchCheck,
  phases: [
    {
      title: "Audit and baseline",
      outcome: "Technical audit, analytics baseline, Search Console status, and priority issues.",
      jobs: [
        { title: "SEO technical audit", type: "other", dueDays: 3 },
        { title: "Keyword and competitor baseline", type: "other", dueDays: 5 },
      ],
    },
    {
      title: "On-page setup",
      outcome: "Metadata, headings, internal links, schema notes, and page-level fixes.",
      jobs: [
        { title: "Priority page on-page optimization", type: "other", dueDays: 10 },
        { title: "Technical SEO fixes batch", type: "other", dueDays: 14 },
      ],
    },
    {
      title: "Content plan",
      outcome: "Monthly content topics, briefs, and publishing cadence.",
      jobs: [
        { title: "SEO content calendar and briefs", type: "post", dueDays: 18 },
        { title: "Blog or landing page optimization", type: "post", dueDays: 24 },
      ],
    },
    {
      title: "Monthly reporting",
      outcome: "Performance notes, ranking movement, traffic, actions, and next priorities.",
      jobs: [
        { title: "SEO monthly performance report", type: "other", dueDays: 30 },
      ],
    },
  ],
};

const GENERIC_PLAN = {
  key: "delivery",
  title: "Project Delivery Plan",
  subtitle: "Use phases to break the project into accountable jobs.",
  Icon: ClipboardList,
  phases: [
    {
      title: "Plan",
      outcome: "Scope, schedule, owner, and acceptance criteria.",
      jobs: [{ title: "Project kickoff and delivery plan", type: "other", dueDays: 2 }],
    },
    {
      title: "Execute",
      outcome: "Core delivery tasks are created and assigned.",
      jobs: [{ title: "Core delivery task", type: "other", dueDays: 10 }],
    },
    {
      title: "Review and close",
      outcome: "Client/internal review, fixes, and completion notes.",
      jobs: [{ title: "Final review and closure", type: "other", dueDays: 14 }],
    },
  ],
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function resolvePlan(project) {
  const type = normalize(project?.type);
  const text = `${project?.name || ""} ${project?.description || ""} ${(project?.tags || []).join(" ")}`.toLowerCase();
  if (type === "website" || text.includes("website")) return WEBSITE_PLAN;
  if (type === "seo" || text.includes("seo")) return SEO_PLAN;
  return GENERIC_PLAN;
}

function flattenPhaseJobs(phases = []) {
  return phases.flatMap((phase, phaseIndex) =>
    (phase.jobs || []).map((job, jobIndex) => ({
      ...job,
      phase: phase.title,
      order: `${phaseIndex + 1}.${jobIndex + 1}`,
      notes: `Phase: ${phase.title}\nOutcome: ${phase.outcome || ""}`,
    }))
  );
}

function titleKey(value) {
  return normalize(value).replace(/\s+/g, " ");
}

function PhaseCard({ phase, existingTitles }) {
  const jobs = phase.jobs || [];
  const completedCount = jobs.filter((job) => existingTitles.has(titleKey(job.title))).length;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">{phase.title}</h3>
            <Badge tone={completedCount === jobs.length && jobs.length ? "success" : "neutral"}>
              {completedCount}/{jobs.length} jobs
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">{phase.outcome}</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Due offset</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const exists = existingTitles.has(titleKey(job.title));
              return (
                <tr key={job.title}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{job.title}</td>
                  <td className="px-3 py-2 capitalize text-slate-500">{job.type || "other"}</td>
                  <td className="px-3 py-2 text-slate-500">Day {job.dueDays || 0}</td>
                  <td className="px-3 py-2">
                    {exists ? (
                      <Badge tone="success" size="xs">
                        <CheckCircle2 size={11} className="mr-1" />
                        Created
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="xs">Missing</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ProjectScopeTab({
  project,
  customer,
  jobs = [],
  loading,
  error,
  busy,
  generating,
  onCreateJob,
  onGeneratePlanJobs,
}) {
  const plan = useMemo(() => resolvePlan(project), [project]);

  const plannedJobs = useMemo(() => flattenPhaseJobs(plan.phases), [plan]);
  const existingTitles = useMemo(
    () => new Set((jobs || []).map((job) => titleKey(job.title))),
    [jobs]
  );
  const missingJobs = plannedJobs.filter((job) => !existingTitles.has(titleKey(job.title)));
  const PlanIcon = plan.Icon || ClipboardList;
  const canGenerate = Boolean(customer?._id && project?._id && missingJobs.length);

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
        {error}
      </div>
    );
  }

  if (!plan.phases.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No scope plan yet"
        message="Create jobs manually or generate a project plan for this separate work."
        actionLabel={customer?._id ? "Create Job" : undefined}
        onAction={customer?._id ? onCreateJob : undefined}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <PlanIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{plan.title}</h2>
                <Badge tone="info">{String(project?.type || "delivery").replaceAll("_", " ")}</Badge>
                <Badge tone="neutral">Project plan</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{plan.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="neutral">{plan.phases.length} phases</Badge>
                <Badge tone={missingJobs.length ? "warning" : "success"}>
                  {missingJobs.length} missing jobs
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={onCreateJob} disabled={busy || !customer?._id}>
              <Plus size={15} />
              Create job
            </Button>
            <Button
              onClick={() => onGeneratePlanJobs?.(missingJobs)}
              disabled={busy || generating || !canGenerate}
            >
              <Sparkles size={15} />
              {generating ? "Generating..." : missingJobs.length ? "Generate missing jobs" : "Plan complete"}
            </Button>
          </div>
        </div>
      </Card>

      {plan.phases.map((phase) => (
        <PhaseCard key={phase.title} phase={phase} existingTitles={existingTitles} />
      ))}
    </div>
  );
}
