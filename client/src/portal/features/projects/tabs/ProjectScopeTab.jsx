import React, { useMemo, useState } from "react";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import {
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

function PhasePanel({ phase, index, existingTitles }) {
  const jobs = phase.jobs || [];
  const done = jobs.filter((job) => existingTitles.has(titleKey(job.title))).length;
  const complete = done === jobs.length && jobs.length > 0;
  return (
    <Panel
      title={`${index + 1}. ${phase.title}`}
      sub={phase.outcome}
      flush
      action={
        <Badge tone={complete ? "ok" : done ? "info" : "neutral"} dot>
          {done} of {jobs.length} jobs created
        </Badge>
      }
    >
      <table className="px-table px-table--stack" aria-label={`${phase.title} jobs`}>
        <thead>
          <tr>
            <th scope="col">Planned job</th>
            <th scope="col">Type</th>
            <th scope="col">Due</th>
            <th scope="col">In project</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const exists = existingTitles.has(titleKey(job.title));
            return (
              <tr key={job.title}>
                <td className="px-primary">
                  <div className="px-cell-main">
                    <b>{job.title}</b>
                  </div>
                </td>
                <td data-label="Type">{String(job.type || "other").replaceAll("_", " ")}</td>
                <td data-label="Due" className="px-num">
                  Day {job.dueDays || 0}
                </td>
                <td data-label="In project">
                  <span>
                    {exists ? (
                      <Badge tone="ok" dot>
                        Created
                      </Badge>
                    ) : (
                      <Badge tone="outline">Not yet</Badge>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

// Scope (PUI-2): a suggested delivery plan for the project type, compared
// with the jobs that already exist. Generating creates only the missing
// jobs, after a confirmation. Offered only to users who can create jobs.
export default function ProjectScopeTab({
  project,
  customer,
  jobs = [],
  loading,
  error,
  onRetry,
  busy,
  generating,
  canCreateJobs,
  onCreateJob,
  createBlockedReason,
  onGeneratePlanJobs,
}) {
  const [confirming, setConfirming] = useState(false);
  const plan = useMemo(() => resolvePlan(project), [project]);
  const plannedJobs = useMemo(() => flattenPhaseJobs(plan.phases), [plan]);
  const existingTitles = useMemo(() => new Set((jobs || []).map((job) => titleKey(job.title))), [jobs]);
  const missingJobs = plannedJobs.filter((job) => !existingTitles.has(titleKey(job.title)));
  const PlanIcon = plan.Icon || ClipboardList;
  const canGenerate = Boolean(canCreateJobs && customer?._id && project?._id && missingJobs.length);

  if (loading) return <LoadingState rows={5} label="Loading the delivery plan" />;
  if (error) return <ErrorState title="The plan didn't load" message={error} onRetry={onRetry} />;

  return (
    <div className="px-stack">
      <section className="px-panel px-plan-head" aria-labelledby="px-plan-title">
        <span className="px-plan-icon" aria-hidden="true">
          <PlanIcon size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 id="px-plan-title">{plan.title}</h2>
          <p>{plan.subtitle}</p>
          <div className="px-plan-meta">
            <Badge>{plan.phases.length} phases</Badge>
            <Badge tone={missingJobs.length ? "warn" : "ok"} dot>
              {missingJobs.length ? `${missingJobs.length} planned jobs not created yet` : "Every planned job exists"}
            </Badge>
          </div>
        </div>
        {canCreateJobs ? (
          <div className="px-plan-actions">
            <Button variant="outline" onClick={onCreateJob} disabled={busy || Boolean(createBlockedReason)} title={createBlockedReason || undefined}>
              <Plus size={15} aria-hidden="true" />
              Create job
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={busy || generating || !canGenerate} loading={generating}>
              <Sparkles size={15} aria-hidden="true" />
              {missingJobs.length ? "Create missing jobs" : "Plan complete"}
            </Button>
          </div>
        ) : null}
      </section>

      {plan.phases.map((phase, i) => (
        <PhasePanel key={phase.title} phase={phase} index={i} existingTitles={existingTitles} />
      ))}

      <ConfirmDialog
        open={confirming}
        tone="info"
        icon={Sparkles}
        title={`Create ${missingJobs.length} job${missingJobs.length === 1 ? "" : "s"}?`}
        confirmLabel={`Create ${missingJobs.length} job${missingJobs.length === 1 ? "" : "s"}`}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false);
          await onGeneratePlanJobs?.(missingJobs);
        }}
        details={missingJobs.slice(0, 6).map((j) => j.title).concat(missingJobs.length > 6 ? [`and ${missingJobs.length - 6} more`] : [])}
      >
        These planned jobs will be added to the project as briefs, with due dates counted from the project start date.
      </ConfirmDialog>
    </div>
  );
}
