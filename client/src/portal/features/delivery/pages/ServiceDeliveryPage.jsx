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

import { listEnrollments } from "../../enrollments/api";
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
  "in_progress",
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
        key: "kw-research",
        label: "KW Research",
        keywords: ["kw research", "keyword", "competitor"],
      },
      {
        key: "goals",
        label: "Goals",
        keywords: ["goal", "quarter", "traffic", "authority"],
      },
      {
        key: "link-building",
        label: "Link Building",
        keywords: ["backlink", "link building", "authority"],
      },
      {
        key: "optimize",
        label: "Optimize",
        keywords: ["optimize", "optimization", "technical seo", "metadata", "schema"],
      },
      {
        key: "reporting",
        label: "Reporting",
        keywords: ["report", "analytics", "performance", "score"],
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getServiceTemplate(enrollment) {
  return enrollment?.serviceTemplateId && typeof enrollment.serviceTemplateId === "object"
    ? enrollment.serviceTemplateId
    : {};
}

function getServiceKind(enrollment) {
  const template = getServiceTemplate(enrollment);
  const text = [
    template.name,
    template.slug,
    template.summary,
    template.description,
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");

  if (/\bseo\b|search engine|technical seo|on-page/.test(text)) return "seo";
  if (/\bweb\b|website|web-dev|web development|landing page|ecommerce|e-commerce/.test(text)) {
    return "website";
  }

  return null;
}

function getServiceName(enrollment) {
  const template = getServiceTemplate(enrollment);
  return template.name || "Service enrollment";
}

function isDelivered(job) { return job.operatingModelVersion === 1 ? job.operating?.disposition === "delivered" : DONE_STATUSES.has(job.status); }

function isOverdue(job) {
  if (!job?.dueDate || isDelivered(job)) return false;
  const end = new Date(job.dueDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
}

function enrollmentIdOf(job) {
  return String(job?.enrollmentId?._id || job?.enrollmentId || "");
}

function buildPhaseList(enrollment, config) {
  const groups = Array.isArray(enrollment?.finalScope?.groups)
    ? enrollment.finalScope.groups
    : [];

  if (!groups.length) return config.phases;

  return groups.map((group, index) => {
    const scopedJobs = Array.isArray(group?.jobs) ? group.jobs : [];
    return {
      key: group.id || `scope-${index}`,
      label: group.title || `Scope ${index + 1}`,
      keywords: [
        group.title,
        group.description,
        ...scopedJobs.map((job) => job?.title),
      ]
        .map(normalize)
        .filter(Boolean),
    };
  });
}

function matchPhase(job, phases) {
  if (job.operatingModelVersion === 1) return phases.find((p) => p.key === job.phaseId) || { key: "unallocated" };
  const text = normalize(`${job?.title || ""} ${job?.notes || ""}`);
  return (
    phases.find((phase) =>
      (phase.keywords || []).some((keyword) => keyword && text.includes(keyword))
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

function enrichEnrollment(enrollment, jobs) {
  const kind = getServiceKind(enrollment) || "website";
  const config = SERVICE_CONFIG[kind] || SERVICE_CONFIG.website;
  const enrollmentJobs = jobs.filter(
    (job) => enrollmentIdOf(job) === String(enrollment._id)
  );
  const completedJobs = enrollmentJobs.filter((job) => isDelivered(job));
  const activeJobs = enrollmentJobs.filter((job) => ACTIVE_STATUSES.has(job.status));
  const overdueJobs = enrollmentJobs.filter(isOverdue);
  const nextJob = enrollmentJobs
    .filter((job) => job.dueDate && !isDelivered(job))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const phases = buildPhaseList(enrollment, config);
  const phaseMap = phases.map((phase) => {
    const phaseJobs = enrollmentJobs.filter(
      (job) => matchPhase(job, phases).key === phase.key
    );
    const done = phaseJobs.filter((job) => isDelivered(job)).length;
    const active = phaseJobs.filter((job) => ACTIVE_STATUSES.has(job.status)).length;
    return {
      ...phase,
      total: phaseJobs.length,
      done,
      active,
      progress: pct(done, phaseJobs.length),
    };
  });

  const progress = enrollmentJobs.length
    ? pct(completedJobs.length, enrollmentJobs.length)
    : enrollment.status === "completed"
    ? 100
    : 0;

  const currentPhase =
    phaseMap.find((phase) => phase.active > 0) ||
    phaseMap.find((phase) => phase.total > 0 && phase.done < phase.total) ||
    phaseMap.find((phase) => phase.total === 0) ||
    phaseMap[phaseMap.length - 1];

  return {
    ...enrollment,
    serviceKind: kind,
    serviceConfig: config,
    jobs: enrollmentJobs,
    completedJobs,
    activeJobs,
    overdueJobs,
    nextJob,
    phaseMap,
    progress,
    currentPhase,
  };
}

function EnrollmentDeliveryRow({ enrollment }) {
  const Icon = enrollment.serviceConfig.Icon;
  const client =
    enrollment.customerId?.companyName ||
    enrollment.customerId?.contactName ||
    "Client";

  return (
    <tr className="align-top transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <Link
              to={`/portal/enrollments/${enrollment._id}`}
              className="block truncate text-sm font-black text-slate-900 transition hover:text-indigo-600"
            >
              {getServiceName(enrollment)}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{client}</span>
              {enrollment.startDate ? (
                <span>Started {formatDate(enrollment.startDate)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge tone={enrollment.serviceConfig.tone}>
          {enrollment.serviceConfig.label}
        </Badge>
        <div className="mt-1 text-xs text-slate-400 capitalize">
          {String(enrollment.status || "active").replace("_", " ")}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="min-w-[130px] flex-1">
            <ProgressBar value={enrollment.progress} />
          </div>
          <span className="w-10 text-right text-xs font-black tabular-nums text-slate-700">
            {enrollment.progress}%
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {enrollment.phaseMap.map((phase) => (
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
          {enrollment.currentPhase?.label || "Scope"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {enrollment.completedJobs.length}/{enrollment.jobs.length || 0} jobs complete
        </div>
      </td>
      <td className="px-5 py-4">
        {enrollment.nextJob ? (
          <Link
            to={`/portal/jobs/${enrollment.nextJob._id}`}
            className="text-sm font-bold text-slate-800 transition hover:text-indigo-600"
          >
            {enrollment.nextJob.title}
            <span className="mt-1 block text-xs font-medium text-slate-400">
              Due {formatDate(enrollment.nextJob.dueDate)}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-slate-400">No open job</span>
        )}
      </td>
      <td className="px-5 py-4 text-right">
        {enrollment.overdueJobs.length ? (
          <Badge tone="warning">{enrollment.overdueJobs.length} overdue</Badge>
        ) : enrollment.progress >= 100 ? (
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
  const [enrollments, setEnrollments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const enrollmentsRes = await listEnrollments({
        limit: 100,
        sort: "-updatedAt",
      });
      const serviceEnrollments = (enrollmentsRes?.items || []).filter(getServiceKind);
      const jobResponses = await Promise.all(
        serviceEnrollments.map((enrollment) =>
          listJobs({ enrollmentId: enrollment._id, limit: 100, sort: "dueDate" })
        )
      );

      setEnrollments(serviceEnrollments);
      setJobs(jobResponses.flatMap((res) => res?.items || []));
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
    return enrollments
      .filter(
        (enrollment) =>
          service === "all" || getServiceKind(enrollment) === service
      )
      .map((enrollment) => enrichEnrollment(enrollment, jobs))
      .sort((a, b) => {
        if (b.overdueJobs.length !== a.overdueJobs.length) {
          return b.overdueJobs.length - a.overdueJobs.length;
        }
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
  }, [jobs, enrollments, service]);

  const stats = useMemo(() => {
    const active = rows.filter(
      (enrollment) => !["completed", "archived", "cancelled"].includes(enrollment.status)
    ).length;
    const delivered = rows.filter(
      (enrollment) => enrollment.progress >= 100 || enrollment.status === "completed"
    ).length;
    const overdue = rows.reduce((sum, enrollment) => sum + enrollment.overdueJobs.length, 0);
    const avg = rows.length
      ? Math.round(rows.reduce((sum, enrollment) => sum + enrollment.progress, 0) / rows.length)
      : 0;
    return { total: rows.length, active, delivered, overdue, avg };
  }, [rows]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="DELIVERY"
        title="Website & SEO Delivery"
        subtitle="Track active service enrollments, contracted scope, open jobs, and launch/reporting readiness."
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
        <StatCard icon={ClipboardList} label="Service Enrollments" value={stats.total} color="indigo" />
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
          title="No website or SEO service enrollments"
          message="Enroll a client in a Website or SEO service, then generate jobs from that enrollment's scope."
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
                  <th className="px-5 py-3">Enrollment</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Current Scope</th>
                  <th className="px-5 py-3">Next Job</th>
                  <th className="px-5 py-3 text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((enrollment) => (
                  <EnrollmentDeliveryRow key={enrollment._id} enrollment={enrollment} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
