import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import {
  getEnrollment, updateEnrollment, deleteEnrollment, generateJobsFromEnrollment,
} from "../api";
import {
  ArrowLeft, RefreshCw, Trash2, Building2, BriefcaseBusiness,
  FolderKanban, CalendarDays, Zap, Layers3, ChevronRight, AlertCircle,
} from "lucide-react";

const STATUS_TONES = {
  active:    "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused:    "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-sky-200 bg-sky-50 text-sky-700",
  archived:  "border-rose-200 bg-rose-50 text-rose-700",
};

function StatusPill({ value }) {
  return (
    <span className={[
      "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
      STATUS_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
    ].join(" ")}>
      {value || "—"}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="mt-0.5 text-slate-400"><Icon size={15} /></div>
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

function InlineConfirm({ message, confirmLabel = "Confirm", busy, onConfirm, onCancel }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <AlertCircle size={15} className="flex-shrink-0 text-rose-500" />
      <span className="flex-1 text-sm font-semibold text-rose-700">{message}</span>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-600 disabled:opacity-60"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600"
      >
        Cancel
      </button>
    </div>
  );
}

function executionModeLabel(mode) {
  if (mode === "phased_project") return "Phased project";
  if (mode === "one_time") return "One-time";
  if (mode === "recurring") return "Recurring";
  return mode || "—";
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function EnrollmentDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEnrollment(id);
      const enrollment = res?.item || res?.enrollment || res;
      setItem(enrollment);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load enrollment.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusBusy(true);
    try {
      const res = await updateEnrollment(id, { status: newStatus });
      const updated = res?.item || res;
      setItem(updated);
      toast.success(`Status updated to ${newStatus}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed.");
    } finally {
      setStatusBusy(false);
    }
  };

  const handleGenerateJobs = async () => {
    setBusy(true);
    setConfirmGenerate(false);
    try {
      const res = await generateJobsFromEnrollment(id);
      const count = res?.jobs?.length || res?.created || 0;
      toast.success(`${count} job(s) generated from enrollment.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Job generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setConfirmDelete(false);
    try {
      await deleteEnrollment(id);
      toast.success("Enrollment deleted.");
      nav("/portal/enrollments");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed.");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error || "Enrollment not found."}
      </div>
    );
  }

  const customerName = item.customerId?.companyName || item.customerId?.contactName || "Unknown client";
  const serviceName = item.serviceTemplateId?.name || "Unknown service";
  const projectName = item.projectId?.name || null;
  const mode = item.serviceTemplateId?.executionMode || item.finalScope?.mode || "recurring";
  const groups = item.finalScope?.groups || [];
  const totalJobs = groups.reduce((sum, g) => sum + (g.jobs?.length || 0), 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="COMMERCIAL"
        title={serviceName}
        subtitle={customerName}
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Enrollments", to: "/portal/enrollments" },
          { label: serviceName },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/enrollments")} disabled={busy}>
              <ArrowLeft size={15} />
            </Button>
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
            </Button>
            <Button variant="outline" onClick={() => setConfirmGenerate(true)} disabled={busy}>
              <Zap size={15} /> Generate jobs
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(true)} disabled={busy}>
              <Trash2 size={15} />
            </Button>
          </div>
        }
      />

      {confirmGenerate && (
        <InlineConfirm
          message="Generate jobs from this enrollment's scope? New job records will be created."
          confirmLabel="Generate jobs"
          busy={busy}
          onConfirm={handleGenerateJobs}
          onCancel={() => setConfirmGenerate(false)}
        />
      )}

      {confirmDelete && (
        <InlineConfirm
          message="Delete this enrollment? This cannot be undone."
          confirmLabel="Delete enrollment"
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: details */}
        <div className="lg:col-span-2 grid gap-6">
          <Card>
            <CardHeader title="Enrollment details" right={<StatusPill value={item.status} />} />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Building2} label="CLIENT" value={customerName} />
                <InfoRow icon={BriefcaseBusiness} label="SERVICE" value={serviceName} />
                <InfoRow icon={Layers3} label="EXECUTION MODE" value={executionModeLabel(mode)} />
                {projectName && <InfoRow icon={FolderKanban} label="LINKED PROJECT" value={projectName} />}
                {item.startDate && <InfoRow icon={CalendarDays} label="START DATE" value={formatDate(item.startDate)} />}
                {item.endDate && <InfoRow icon={CalendarDays} label="END DATE" value={formatDate(item.endDate)} />}
              </div>

              {item.notes && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[11px] font-black tracking-[0.18em] text-slate-500 mb-2">NOTES</div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{item.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Scope */}
          {groups.length > 0 && (
            <Card>
              <CardHeader
                title="Active scope"
                subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} · ${totalJobs} job${totalJobs !== 1 ? "s" : ""}`}
              />
              <CardBody>
                <div className="grid gap-3">
                  {groups.map((group, gi) => (
                    <div key={group.id || gi} className="rounded-2xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{group.title || `Group ${gi + 1}`}</div>
                          {group.description && (
                            <div className="text-xs text-slate-500 mt-0.5">{group.description}</div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-500">{group.jobs?.length || 0} job{(group.jobs?.length || 0) !== 1 ? "s" : ""}</span>
                      </div>
                      {(group.jobs || []).map((job, ji) => (
                        <div key={job.id || ji} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="text-sm text-slate-800">{job.title || "Untitled job"}</div>
                          {job.quantity > 1 && (
                            <span className="text-xs font-bold text-slate-500">×{job.quantity}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column: actions */}
        <div className="grid gap-6 self-start">
          <Card>
            <CardHeader title="Update status" />
            <CardBody>
              <div className="grid gap-2">
                {["active", "paused", "completed", "archived"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusBusy || item.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={[
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
                      item.status === s
                        ? "border-slate-900 bg-slate-900 text-white cursor-default"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                    ].join(" ")}
                  >
                    <span className="capitalize">{s}</span>
                    {item.status === s ? (
                      <span className="text-xs font-black opacity-70">current</span>
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <CardBody>
              <div className="grid gap-2">
                {item.customerId?._id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => nav(`/portal/customers/${item.customerId._id}`)}
                  >
                    <Building2 size={14} /> View customer
                  </Button>
                )}
                {item.projectId?._id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => nav(`/portal/projects/${item.projectId._id}`)}
                  >
                    <FolderKanban size={14} /> View project
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setConfirmGenerate(true)}
                  disabled={busy}
                >
                  <Zap size={14} /> Generate jobs from scope
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
