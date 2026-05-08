import React from "react";
import Button from "../../../shared/ui/Button";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  FolderKanban,
  Layers,
  Activity,
  Pencil,
  Plus,
  RefreshCw,
  BriefcaseBusiness,
  FileClock,
  Settings2,
  Trash2,
} from "lucide-react";
import ProjectStatusPill from "./ProjectStatusPill";
import ProjectPriorityPill from "./ProjectPriorityPill";

function humanize(value) {
  return String(value || "—").replaceAll("_", " ");
}

function TabButton({ active, children, onClick, Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition",
        active
          ? "border-black/10 bg-black/[0.04] text-slate-900"
          : "border-black/10 bg-white text-slate-700 hover:bg-black/[0.02]",
      ].join(" ")}
      style={active ? { boxShadow: "0 10px 28px rgba(0,0,0,0.06)" } : {}}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function MetaPill({ children, tone = "neutral" }) {
  const toneClass =
    tone === "indigo"
      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function getModeIcon(mode) {
  if (mode === "internal") return Settings2;
  if (mode === "pre_contract") return FileClock;
  return BriefcaseBusiness;
}

function getModeTone(mode) {
  if (mode === "internal") return "amber";
  if (mode === "pre_contract") return "rose";
  if (mode === "contracted") return "emerald";
  return "indigo";
}

export default function ProjectHeader({
  project,
  customer,
  title,
  tab,
  onBack,
  onRefresh,
  onEdit,
  onCreateJob,
  onArchive,
  setTab,
  busy,
}) {
  const isInternal = project?.projectMode === "internal";
  const canCreateJob = Boolean(project?._id && customer?._id);
  const ModeIcon = getModeIcon(project?.projectMode);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900 transition hover:bg-black/[0.03]"
        >
          <ArrowLeft size={14} />
          Back to projects
        </button>

        <div className="mt-3 flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white">
            <FolderKanban size={20} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-2xl font-black tracking-tight text-slate-900">
              {title}
            </div>

            <div className="mt-1 truncate text-sm text-slate-600">
              {isInternal ? (
                <>
                  Internal project
                  {project?.team ? (
                    <>
                      {" • "}Team:{" "}
                      <span className="font-semibold text-slate-900">
                        {project.team}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  Client:{" "}
                  <span className="font-semibold text-slate-900">
                    {customer?.companyName || "—"}
                  </span>
                  {" • "}
                  {customer?.contactName || "—"}
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProjectStatusPill status={project?.status} />
              <ProjectPriorityPill priority={project?.priority} />

              <MetaPill tone="indigo">
                {String(project?.type || "delivery").toUpperCase()}
              </MetaPill>

              <MetaPill tone={getModeTone(project?.projectMode)}>
                <span className="inline-flex items-center gap-1.5">
                  <ModeIcon size={12} />
                  {humanize(project?.projectMode)}
                </span>
              </MetaPill>

              {project?.source ? (
                <MetaPill>{humanize(project.source)}</MetaPill>
              ) : null}

              {project?.team ? <MetaPill>{project.team}</MetaPill> : null}

              {project?.budget ? (
                <MetaPill>
                  {project.currency || "AED"} {project.budget}
                </MetaPill>
              ) : null}
            </div>

            {!canCreateJob ? (
              <div className="mt-3 inline-flex rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                This project is not linked to a client yet, so job creation is
                disabled.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
            Icon={Building2}
          >
            Overview
          </TabButton>

          <TabButton
            active={tab === "scope"}
            onClick={() => setTab("scope")}
            Icon={Layers}
          >
            Scope
          </TabButton>

          <TabButton
            active={tab === "jobs"}
            onClick={() => setTab("jobs")}
            Icon={ClipboardList}
          >
            Jobs
          </TabButton>

          <TabButton
            active={tab === "files"}
            onClick={() => setTab("files")}
            Icon={FileText}
          >
            Files
          </TabButton>

          <TabButton
            active={tab === "billing"}
            onClick={() => setTab("billing")}
            Icon={CreditCard}
          >
            Billing
          </TabButton>

          <TabButton
            active={tab === "activity"}
            onClick={() => setTab("activity")}
            Icon={Activity}
          >
            Activity
          </TabButton>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={busy}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        {onEdit && (
          <Button variant="outline" onClick={onEdit} disabled={busy}>
            <Pencil size={16} />
            Edit
          </Button>
        )}

        <Button onClick={onCreateJob} disabled={busy || !canCreateJob}>
          <Plus size={16} />
          Create Job
        </Button>

        {onArchive && (
          <Button variant="outline" onClick={onArchive} disabled={busy}>
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
