import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";

import {
  ArrowLeft,
  Pencil,
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
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { getService, deleteService, openServiceTemplateFile } from "../api";
import { useAccess } from "../../../shared/hooks/useAccess";
import ServiceStatusPill from "../components/ServiceStatusPill";

// ── Creative type helpers ─────────────────────────────────────────────────────

const CREATIVE_CHIP = {
  post:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  reel:     { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  story:    { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  video:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  design:   { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  carousel: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  page:     { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  phase:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  task:     { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200" },
  other:    { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200" },
};

function countCreativesByType(scopeGroups) {
  const groups = Array.isArray(scopeGroups) ? scopeGroups : [];
  const counts = {};
  for (const group of groups) {
    const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
    for (const job of jobs) {
      const type = job.type || "task";
      const qty = Math.max(1, Number(job.quantity || 1));
      counts[type] = (counts[type] || 0) + qty;
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
}

function CreativeChip({ type, count }) {
  const style = CREATIVE_CHIP[type] || CREATIVE_CHIP.other;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black capitalize",
        style.bg, style.text, style.border,
      ].join(" ")}
    >
      {count} {type}
    </span>
  );
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function money(x) {
  if (typeof x !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(x);
  } catch { return String(x); }
}

function executionModeLabel(value) {
  const labels = {
    recurring: "Recurring / Monthly",
    phased_project: "Phased Service Delivery",
    one_time: "One-time Simple",
  };
  return labels[value] || value || "—";
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
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
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
          {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
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
      <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">{title}</div>
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
        <div className="mt-3 text-sm leading-6 text-slate-600">{group.description}</div>
      ) : null}

      {jobs.length === 0 ? (
        <div className="mt-4 text-sm text-slate-500">No items in this group.</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50/60">
          <div className="divide-y divide-slate-200">
            {jobs.map((job, jobIndex) => (
              <div key={job.id || `${job.title}-${jobIndex}`} className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-black text-slate-900">
                    {job.title || "Untitled item"}
                  </div>
                  <CreativeChip type={job.type || "task"} count={job.quantity ?? 1} />
                  {job.unit ? <MetaPill>{job.unit}</MetaPill> : null}
                  <MetaPill>Due in {job.dueDays ?? 0} days</MetaPill>
                  {job.priority ? <MetaPill>{job.priority}</MetaPill> : null}
                  {job.seoBoardStatus ? <MetaPill>{job.seoBoardStatus}</MetaPill> : null}
                  {job.seoTaskType ? <MetaPill>{job.seoTaskType}</MetaPill> : null}
                  {job.seoTarget ? <MetaPill>Target: {job.seoTarget}</MetaPill> : null}
                  {job.funnelStage ? <MetaPill>Funnel: {job.funnelStage}</MetaPill> : null}
                  {job.contentPhase ? <MetaPill>Content: {job.contentPhase}</MetaPill> : null}
                  {job.seoQuarter ? <MetaPill>{job.seoQuarter}</MetaPill> : null}
                  {job.parentGoalName ? <MetaPill>Parent: {job.parentGoalName}</MetaPill> : null}
                </div>
                {job.description ? (
                  <div className="mt-2 text-sm leading-6 text-slate-600">{job.description}</div>
                ) : null}
                {Array.isArray(job.checklist) && job.checklist.length > 0 ? (
                  <ChecklistBlock title="ITEM CHECKLIST" items={job.checklist} />
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
        <div className="mt-3 text-sm leading-6 text-slate-600">{step.instructions}</div>
      ) : null}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServiceDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  // PI closure: editing needs services.write; delete needs services.delete.
  const access = useAccess();
  const canWrite = access.can("services.write");
  const canDelete = access.can("services.delete");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getService(id);
      setItem(res?.item || res?.service || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const scopeGroups = useMemo(() => Array.isArray(item?.scopeGroups) ? item.scopeGroups : [], [item]);

  const creatives = useMemo(() => countCreativesByType(scopeGroups), [scopeGroups]);

  const approvalStepsCount = useMemo(() =>
    Array.isArray(item?.approvals?.steps) ? item.approvals.steps.length : 0,
    [item]
  );

  const coverSrc = item?.coverImageId?.thumbnailUrl || item?.coverImageId?.url || null;

  const handleDelete = () => {
    if (!canDelete) return;
    setConfirmState({
      title: "Delete service",
      message: `Delete "${item?.name || item?.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirmState(null);
        try {
          await deleteService(id);
          nav("/portal/services");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
      },
    });
  };

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
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />

      {/* ── Back nav ── */}
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => nav("/portal/services")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 transition hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          Back to services
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={load} disabled={busy}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          {canWrite ? (
            <Button variant="outline" onClick={() => nav(`/portal/services/${id}/edit`)} disabled={busy}>
              <Pencil size={16} />
              Edit in builder
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="outline" onClick={handleDelete} disabled={busy} aria-label="Delete service">
              <Trash2 size={16} />
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Hero card ── */}
      <Card className="overflow-hidden p-0">
        {/* Cover image */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-100 sm:h-72">
          {coverSrc ? (
            <img src={coverSrc} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top_right,rgba(127,138,209,0.18),transparent_50%)]">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-black/5 bg-white/60 text-slate-300">
                <ImageIcon size={28} />
              </div>
              <div className="text-lg font-black text-slate-200">
                {(item.name || "SV").slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            <ServiceStatusPill status={item.status} />
          </div>
        </div>

        {/* Meta row */}
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <MetaPill>/{item.slug || "—"}</MetaPill>
            <MetaPill>{item.billingCycle || "—"}</MetaPill>
            <MetaPill>{executionModeLabel(item.executionMode)}</MetaPill>
          </div>

          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {item.name || item.title}
          </div>

          <div className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            {item.summary || item.description || "No summary added."}
          </div>

          {/* Creative breakdown */}
          {creatives.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-black tracking-[0.18em] text-slate-400">
                CREATIVES
              </div>
              <div className="flex flex-wrap gap-2">
                {creatives.map(([type, count]) => (
                  <CreativeChip key={type} type={type} count={count} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="PRICING"
          value={`${money(item.price)}${item.billingCycle ? ` / ${item.billingCycle}` : ""}`}
          hint="billing model"
          Icon={Clock3}
        />
        <StatTile
          label="SCOPE GROUPS"
          value={String(scopeGroups.length)}
          hint="delivery blocks"
          Icon={Layers3}
        />
        <StatTile
          label="CREATIVES"
          value={String(creatives.reduce((sum, [, c]) => sum + c, 0))}
          hint="total deliverables"
          Icon={FileCheck2}
        />
        <StatTile
          label="APPROVALS"
          value={item.approvals?.required === false ? "Optional" : "Required"}
          hint={`${approvalStepsCount} step${approvalStepsCount === 1 ? "" : "s"}`}
          Icon={ShieldCheck}
        />
      </div>

      {/* ── Scope structure ── */}
      <Card className="p-6">
        <SectionHeader
          Icon={Layers3}
          title="Scope structure"
          subtitle="The delivery blocks and items included in this service."
        />

        {scopeGroups.length === 0 ? (
          <div className="mt-5 text-sm text-slate-500">No scope groups defined.</div>
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

      {/* ── SLA + Approvals ── */}
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
              value={`${item.sla?.responseTime ?? 24} ${item.sla?.responseUnit || "hours"}`}
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

          {Array.isArray(item.approvals?.steps) && item.approvals.steps.length > 0 ? (
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
            <div className="mt-4 text-sm text-slate-500">No approval steps defined.</div>
          )}

          <ChecklistBlock title="APPROVAL CHECKLIST" items={item.approvals?.checklist || []} />
        </Card>
      </div>

      {/* ── Files ── */}
      <Card className="p-6">
        <SectionHeader
          Icon={Paperclip}
          title="Files & references"
          subtitle="Attachments and internal media references."
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">UPLOADS</div>
            {Array.isArray(item.files?.uploads) && item.files.uploads.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/60">
                <div className="divide-y divide-slate-200">
                  {item.files.uploads.map((u, i) => (
                    <button
                      type="button"
                      key={u.id || u.name || i}
                      disabled={!u.id}
                      onClick={() =>
                        openServiceTemplateFile(item._id, u.id).catch(() =>
                          toast.error("Could not open file")
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">{u.name || "File"}</div>
                        <div className="truncate text-xs text-slate-500">
                          {u.size ? `${Math.max(1, Math.round(u.size / 1024))} KB` : "Private file"}
                        </div>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">No uploaded files.</div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">MEDIA REFERENCES</div>
            {Array.isArray(item.files?.mediaRefs) && item.files.mediaRefs.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/60">
                <div className="divide-y divide-slate-200">
                  {item.files.mediaRefs.map((m, i) => (
                    <div key={m.mediaId || i} className="px-4 py-3 text-sm text-slate-700">
                      • {m.mediaId || "Media ref"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">No media refs attached.</div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Operational summary ── */}
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
              {executionModeLabel(item.executionMode)}
            </div>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
              <Clock3 size={14} />
              BILLING CYCLE
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">{item.billingCycle || "—"}</div>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
              <BadgeCheck size={14} />
              STATUS
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">{item.status || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
