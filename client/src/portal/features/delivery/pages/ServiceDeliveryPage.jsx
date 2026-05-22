import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Globe2,
  RefreshCw,
  SearchCheck,
  TimerReset,
} from "lucide-react";

import { listProjects } from "../../projects/api";
import { listJobs } from "../../jobs/api";
import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import StatCard from "../../../shared/ui/StatCard";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";

const DONE_STATUSES = new Set(["approved", "scheduled", "published", "delivered"]);
const ACTIVE_STATUSES = new Set([
  "content_ready",
  "script",
  "pre_production",
  "designing",
  "shooting",
  "editing",
  "internal_review",
  "client_review",
]);

const SERVICE_CONFIG = {
  website: {
    label: "Website",
    Icon: Globe2,
    tone: "info",
    phases: [
      {
        key: "discovery",
        label: "Discovery",
        keywords: ["discovery", "sitemap", "inventory", "requirements", "workshop"],
      },
      {
        key: "design",
        label: "UX/UI",
        keywords: ["wireframe", "ui", "design", "homepage", "page"],
      },
      {
        key: "build",
        label: "Build",
        keywords: ["build", "frontend", "content loading", "forms", "analytics", "setup"],
      },
      {
        key: "launch",
        label: "QA & Launch",
        keywords: ["qa", "fixes", "launch", "handover"],
      },
    ],
  },
  seo: {
    label: "SEO",
    Icon: SearchCheck,
    tone: "success",
    phases: [
      {
        key: "audit",
        label: "Audit",
        keywords: ["audit", "baseline", "competitor", "keyword"],
      },
      {
        key: "onpage",
        label: "On-page",
        keywords: ["on-page", "optimization", "technical seo", "metadata", "schema"],
      },
      {
        key: "content",
        label: "Content",
        keywords: ["content", "brief", "blog", "landing page"],
      },
      {
        key: "reporting",
        label: "Reporting",
        keywords: ["report", "monthly", "performance"],
      },
    ],
  },
};

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(job) {
  if (!job?.dueDate || DONE_STATUSES.has(job.status)) return false;
  const end = new Date(job.dueDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
}

function projectIdOf(job) {
  return String(job?.projectId?._id || job?.projectId || "");
}

function matchPhase(job, phases) {
  const text = `${job?.title || ""} ${job?.notes || ""}`.toLowerCase();
  return (
    phases.find((phase) =>
      phase.keywords.some((keyword) => text.includes(keyword))
    ) || phases[0]
  );
}

function ProgressBar({ value }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
        style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
      />
    </div>
  );
}

function ServiceSegment({ value, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "h-9 rounded-xl px-3 text-xs font-black transition",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function enrichProject(project, jobs) {
  const config = SERVICE_CONFIG[project.type] || SERVICE_CONFIG.website;
  const projectJobs = jobs.filter((job) => projectIdOf(job) === String(project._id));
  const completedJobs = projectJobs.filter((job) => DONE_STATUSES.has(job.status));
  const activeJobs = projectJobs.filter((job) => ACTIVE_STATUSES.has(job.status));
  const overdueJobs = projectJobs.filter(isOverdue);
  const nextJob = projectJobs
    .filter((job) => job.dueDate && !DONE_STATUSES.has(job.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const phaseMap = config.phases.map((phase) => {
    const phaseJobs = projectJobs.filter((job) => matchPhase(job, config.phases).key === phase.key);
    const done = phaseJobs.filter((job) => DONE_STATUSES.has(job.status)).length;
    const active = phaseJobs.filter((job) => ACTIVE_STATUSES.has(job.status)).length;
    return {
      ...phase,
      total: phaseJobs.length,
      done,
      active,
      progress: pct(done, phaseJobs.length),
    };
  });

  const progress = projectJobs.length
    ? pct(completedJobs.length, projectJobs.length)
    : project.status === "completed"
    ? 100
    : project.status === "active"
    ? 25
    : 0;

  const currentPhase =
    phaseMap.find((phase) => phase.active > 0) ||
    phaseMap.find((phase) => phase.total > 0 && phase.done < phase.total) ||
    phaseMap.find((phase) => phase.total === 0) ||
    phaseMap[phaseMap.length - 1];

  return {
    ...project,
    serviceConfig: config,
    jobs: projectJobs,
    completedJobs,
    activeJobs,
    overdueJobs,
    nextJob,
    phaseMap,
    progress,
    currentPhase,
  };
}

function ProjectDeliveryRow({ project }) {
  const Icon = project.serviceConfig.Icon;
  const client = project.customerId?.companyName || project.customerId?.contactName || "Internal";
  return (
    <tr className="align-top transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <Link
              to={`/portal/projects/${project._id}`}
              className="block truncate text-sm font-black text-slate-900 transition hover:text-indigo-600"
            >
              {project.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{client}</span>
              {project.targetLaunchDate ? (
                <span>Launch {formatDate(project.targetLaunchDate)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge tone={project.serviceConfig.tone}>{project.serviceConfig.label}</Badge>
        <div className="mt-1 text-xs text-slate-400 capitalize">
          {String(project.status || "draft").replace("_", " ")}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="min-w-[130px] flex-1">
            <ProgressBar value={project.progress} />
          </div>
          <span className="w-10 text-right text-xs font-black tabular-nums text-slate-700">
            {project.progress}%
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {project.phaseMap.map((phase) => (
            <span
              key={phase.key}
              className={[
                "rounded-lg border px-2 py-1 text-[10px] font-black",
                phase.total && phase.done === phase.total
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : phase.active
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-500",
              ].join(" ")}
            >
              {phase.label}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="text-sm font-black text-slate-800">
          {project.currentPhase?.label || "Plan"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {project.completedJobs.length}/{project.jobs.length || 0} jobs complete
        </div>
      </td>
      <td className="px-5 py-4">
        {project.nextJob ? (
          <Link
            to={`/portal/jobs/${project.nextJob._id}`}
            className="text-sm font-bold text-slate-800 transition hover:text-indigo-600"
          >
            {project.nextJob.title}
            <span className="mt-1 block text-xs font-medium text-slate-400">
              Due {formatDate(project.nextJob.dueDate)}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-slate-400">No open job</span>
        )}
      </td>
      <td className="px-5 py-4 text-right">
        {project.overdueJobs.length ? (
          <Badge tone="warning">{project.overdueJobs.length} overdue</Badge>
        ) : project.progress >= 100 ? (
          <Badge tone="success">Delivered</Badge>
        ) : (
          <Badge tone="neutral">On track</Badge>
        )}
      </td>
    </tr>
  );
}

export default function ServiceDeliveryPage() {
  const toast = useToast();
  const [service, setService] = useState("all");
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [websiteProjects, seoProjects, websiteJobs, seoJobs] = await Promise.all([
        listProjects({ type: "website", limit: 100, sort: "-updatedAt" }),
        listProjects({ type: "seo", limit: 100, sort: "-updatedAt" }),
        listJobs({ projectType: "website", limit: 100, sort: "dueDate" }),
        listJobs({ projectType: "seo", limit: 100, sort: "dueDate" }),
      ]);
      setProjects([...(websiteProjects?.items || []), ...(seoProjects?.items || [])]);
      setJobs([...(websiteJobs?.items || []), ...(seoJobs?.items || [])]);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load service delivery.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    return projects
      .filter((project) => service === "all" || project.type === service)
      .map((project) => enrichProject(project, jobs))
      .sort((a, b) => {
        if (b.overdueJobs.length !== a.overdueJobs.length) {
          return b.overdueJobs.length - a.overdueJobs.length;
        }
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
  }, [jobs, projects, service]);

  const stats = useMemo(() => {
    const active = rows.filter((project) => !["completed", "archived", "cancelled"].includes(project.status)).length;
    const delivered = rows.filter((project) => project.progress >= 100 || project.status === "completed").length;
    const overdue = rows.reduce((sum, project) => sum + project.overdueJobs.length, 0);
    const avg = rows.length
      ? Math.round(rows.reduce((sum, project) => sum + project.progress, 0) / rows.length)
      : 0;
    return { total: rows.length, active, delivered, overdue, avg };
  }, [rows]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="DELIVERY"
        title="Website & SEO Delivery"
        subtitle="Track service projects, phase progress, open jobs, and launch/reporting readiness."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Delivery" },
          { label: "Website & SEO" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <ServiceSegment value="all" active={service === "all"} onClick={setService}>
                All
              </ServiceSegment>
              <ServiceSegment value="website" active={service === "website"} onClick={setService}>
                Website
              </ServiceSegment>
              <ServiceSegment value="seo" active={service === "seo"} onClick={setService}>
                SEO
              </ServiceSegment>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Service Projects" value={stats.total} color="indigo" />
        <StatCard icon={TimerReset} label="Active" value={stats.active} color="blue" />
        <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} color="emerald" />
        <StatCard icon={AlertTriangle} label="Overdue Jobs" value={stats.overdue} color={stats.overdue ? "amber" : "slate"} />
      </div>

      {loading ? (
        <Card className="p-5">
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No website or SEO delivery projects"
          message="Create website or SEO projects, then link jobs to track service delivery here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">Service Delivery Pipeline</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Average progress {stats.avg}% across the selected service view.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Current Phase</th>
                  <th className="px-5 py-3">Next Job</th>
                  <th className="px-5 py-3 text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((project) => (
                  <ProjectDeliveryRow key={project._id} project={project} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
