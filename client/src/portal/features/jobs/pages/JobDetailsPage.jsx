import ManagedJobPanel from "../../../shared/operating/ManagedJobPanel";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Globe, MessageSquare, Pencil, Save, Send, Trash2, X } from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import Alert from "../../../shared/ui/Alert";
import KeyValue from "../../../shared/ui/KeyValue";
import Timeline from "../../../shared/ui/Timeline";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import ErrorState from "../../../shared/ui/ErrorState";
import LoadingState from "../../../shared/ui/LoadingState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { listUsers } from "../../iam/users/api";

import CreativeReviewPanel from "../components/CreativeReviewPanel";
import { JobEditDialog } from "../components/JobDialogs";
import { useCanChooseStaff } from "../components/JobStaffField";
import { addApproval, attachMedia, deleteJob, getJob, publishJob, updateJob } from "../api";
import { JOB_STATUSES } from "../constants";
import { JOB_STAGES } from "../pipeline";
import {
  customerName,
  formatDate,
  idOf,
  jobPriorityLabel,
  jobStage,
  jobStatusLabel,
  jobStatusTone,
  jobTypeLabel,
  personName,
  projectName,
} from "../format";

// One job (PI tail, PUI patterns). Stages come from pipeline.js and status
// labels from constants.js: there is no separate stage list here. A user who
// can edit jobs may set any status directly (as before); the board keeps its
// one-column-at-a-time moves. Actions follow effective permissions (R4-A).
// Clients cannot open jobs in the portal, so "client review" is recorded by
// staff; nothing here sends anything to a client.
const STATUS_OPTIONS = JOB_STATUSES.filter((o) => o.value);

const APPROVAL_LABEL = {
  approved: "Approved",
  changes_requested: "Changes requested",
  client_sent: "Marked as in client review",
  client_note: "Client feedback recorded",
  internal_note: "Internal note",
  requested: "Review requested",
};

export default function JobDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("jobs.write");
  const canDelete = access.can("jobs.delete");
  const canChooseStaff = useCanChooseStaff();
  const returnTo = location.state?.returnTo || null;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [planning, setPlanning] = useState({ storyboard: "", shotList: "", notes: "" });
  const [planningDirty, setPlanningDirty] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [staff, setStaff] = useState({ status: "idle", users: [] });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getJob(id);
      const item = res?.item || null;
      setJob(item);
      setPlanning({ storyboard: item?.storyboard || "", shotList: item?.shotList || "", notes: item?.notes || "" });
      setPlanningDirty(false);
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // The staff list needs the user directory (iam.users.read); see JobStaffField.
  useEffect(() => {
    if (!canWrite || !canChooseStaff) return undefined;
    let cancelled = false;
    setStaff({ status: "loading", users: [] });
    listUsers({ isInternal: "true", isActive: "true", limit: 100 })
      .then((r) => !cancelled && setStaff({ status: "ready", users: r?.users || r?.items || [] }))
      .catch(() => !cancelled && setStaff({ status: "failed", users: [] }));
    return () => {
      cancelled = true;
    };
  }, [canWrite, canChooseStaff]);

  const run = async (fn, success) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      if (success) toast.success(success);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const assignees = useMemo(() => (Array.isArray(job?.assignees) ? job.assignees : []), [job]);
  const approvals = Array.isArray(job?.approvals) ? job.approvals : [];
  const media = Array.isArray(job?.media) ? job.media : [];
  const steps = Array.isArray(job?.approvalSteps) ? job.approvalSteps : [];
  const checklist = Array.isArray(job?.approvalChecklist) ? job.approvalChecklist : [];

  if (loading && !job) return <LoadingState rows={6} label="Loading job" />;
  if (loadError || !job) {
    const status = loadError?.status;
    return (
      <ErrorState
        title={status === 404 ? "Job not found" : status === 403 ? "You don't have access to this job" : "This job didn't load"}
        message={status === 404 ? "It may have been deleted, or the link is wrong." : status === 403 ? "Ask an administrator if you need it." : loadError?.message || undefined}
        onRetry={status === 404 || status === 403 ? undefined : load}
      />
    );
  }

  const stage = jobStage(job.status);
  const stageIdx = JOB_STAGES.findIndex((s) => s.key === stage.key);
  const live = job.status === "published" && job.websiteVisible;
  const clientId = idOf(job.customerId);
  const projectId = idOf(job.projectId);

  const setStatus = (status) => status && status !== job.status && run(() => updateJob(job._id, { status }), `Status set to ${jobStatusLabel(status)}.`);
  const markClientReview = () =>
    run(async () => {
      await updateJob(job._id, { status: "client_review" });
      await addApproval(job._id, { status: "client_sent", note: "Marked as in client review." });
    }, "Marked as in client review.");
  const recordApproval = (note = "Approved.") =>
    run(async () => {
      await addApproval(job._id, { status: "approved", note });
      await updateJob(job._id, { status: "approved" });
    }, "Approval recorded.");
  const requestChanges = (note) =>
    run(async () => {
      await addApproval(job._id, { status: "changes_requested", note });
      await updateJob(job._id, { status: "editing" });
    }, "Changes requested. The job is back in editing.");
  const publish = () => run(() => publishJob(job._id, {}), "Published to the website.");
  const savePlanning = () =>
    run(async () => {
      await updateJob(job._id, planning);
      setPlanningDirty(false);
    }, "Planning notes saved.");
  const assigneeIds = assignees.map(idOf);
  const addAssignee = (userId) => userId && !assigneeIds.includes(userId) && run(() => updateJob(job._id, { assignees: [...assigneeIds, userId] }), "Staff member assigned.");
  const removeAssignee = (userId) => run(() => updateJob(job._id, { assignees: assigneeIds.filter((x) => x !== userId) }), "Staff member removed.");
  const toggleCheck = (item) => {
    const key = item.id || String(item._id);
    const updated = checklist.map((c) => ((c.id || String(c._id)) === key ? { ...c, done: !c.done } : c));
    run(() => updateJob(job._id, { approvalChecklist: updated }));
  };
  const saveEdit = async (patch) => {
    await updateJob(job._id, patch); // throws: the dialog shows the error
    setEditOpen(false);
    toast.success("Job saved.");
    await load();
  };
  const confirmDelete = async () => {
    try {
      await deleteJob(job._id);
      toast.success(`${job.title || "Job"} deleted.`);
      nav(returnTo || "/portal/jobs");
    } catch (e) {
      toast.error(e?.response?.data?.message || "The job wasn't deleted. Try again.");
    }
  };

  const sub = [customerName(job), projectName(job), jobTypeLabel(job.type)].filter(Boolean).join(" · ");
  const extra = [
    ["Assignee (text)", job.assigneeName],
    ["SEO status", job.seoBoardStatus],
    ["SEO task type", job.seoTaskType],
    ["Target", job.seoTarget],
    ["Funnel stage", job.funnelStage],
    ["Content phase", job.contentPhase],
    ["Quarter", job.seoQuarter],
    ["Execution page", job.executionPageUrl],
    ["Analytics", job.analyticsUrl],
    ["Parent goal", job.parentGoalName || job.parentGoalId],
    ["Parent goal link", job.parentGoalUrl],
  ].filter(([, v]) => v);

  const staffOptions = [
    { value: "", label: staff.status === "loading" ? "Loading staff…" : staff.status === "failed" ? "The staff list didn't load" : "Add a staff member…" },
    ...staff.users.filter((u) => !assigneeIds.includes(idOf(u))).map((u) => ({ value: idOf(u), label: personName(u) || "Staff member" })),
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title={job.title || "Untitled job"}
        description={sub}
        breadcrumb={[{ label: "Jobs", to: "/portal/jobs" }, { label: job.title || "Job" }]}
        meta={
          <>
            <Badge tone={jobStatusTone(job.status)}>{jobStatusLabel(job.status)}</Badge>
            {job.priority && job.priority !== "normal" ? <Badge tone={job.priority === "urgent" ? "bad" : "warn"}>{`${jobPriorityLabel(job.priority)} priority`}</Badge> : null}
            {live ? <Badge tone="ok">Live on the website</Badge> : null}
          </>
        }
        actions={
          <>
            {canWrite && job.operatingModelVersion !== 1 && job.status !== "client_review" ? (
              <Button variant="outline" onClick={markClientReview} disabled={busy}>
                <Send size={14} aria-hidden="true" />
                Mark as in client review
              </Button>
            ) : null}
            {canWrite ? (
              <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canDelete && job.operatingModelVersion !== 1 ? (
              <Button variant="outline" onClick={() => setDeleteOpen(true)} disabled={busy}>
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </Button>
            ) : null}
            {canWrite && !live ? (
              <Button onClick={publish} disabled={busy}>
                <Globe size={14} aria-hidden="true" />
                Publish to website
              </Button>
            ) : null}
          </>
        }
      />

      {job.operatingModelVersion === 1 && <ManagedJobPanel job={job} onChanged={load} />}

      <Panel title="Stage" sub={`Status: ${jobStatusLabel(job.status)} · on the board under ${stage.label}`}>
        <div className="px-stage-strip" style={{ "--px-stage-n": JOB_STAGES.length }} aria-label="Board stages">
          {JOB_STAGES.map((s, i) => (
            <span key={s.key} data-on={i <= stageIdx ? "true" : undefined} aria-current={i === stageIdx ? "step" : undefined}>
              {s.label}
            </span>
          ))}
        </div>
        {canWrite && job.operatingModelVersion !== 1 ? (
          <div style={{ marginTop: 14, maxWidth: 320 }}>
            <SelectField label="Change status" value={job.status} onChange={setStatus} options={STATUS_OPTIONS} disabled={busy} />
          </div>
        ) : null}
      </Panel>

      {job.operatingModelVersion !== 1 && job.status === "client_review" ? (
        <Alert
          tone="warn"
          icon={MessageSquare}
          title="In client review"
          action={
            canWrite ? (
              <Button onClick={() => recordApproval("Client approved.")} disabled={busy}>
                <CheckCircle2 size={14} aria-hidden="true" />
                Record approval
              </Button>
            ) : null
          }
        >
          Recorded by the team. Clients can't open jobs in the portal, so share the work with them directly and record their answer here. To ask for changes, add their feedback under Creative review and choose Request changes.
        </Alert>
      ) : null}

      <div className="px-grid px-cols-detail">
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <CreativeReviewPanel
            media={media}
            approvals={approvals}
            busy={busy}
            readOnly={!canWrite || job.operatingModelVersion === 1}
            onAttach={() => setPickerOpen(true)}
            onApprove={(msg) => recordApproval(msg)}
            onRequestChanges={(msg) => requestChanges(msg)}
            onSendToClient={markClientReview}
            onAddNote={(type, msg) => run(() => addApproval(job._id, { status: type, note: msg }), "Note added.")}
          />

          <Panel
            title="Planning and content"
            sub={planningDirty ? "Unsaved changes" : undefined}
            action={
              canWrite ? (
                <Button size="sm" onClick={savePlanning} disabled={busy || !planningDirty}>
                  <Save size={14} aria-hidden="true" />
                  Save
                </Button>
              ) : null
            }
          >
            <div className="px-form-grid">
              {[
                ["storyboard", "Storyboard or script"],
                ["shotList", "Shot list"],
                ["notes", "Notes"],
              ].map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  multiline
                  rows={3}
                  value={planning[key]}
                  readOnly={!canWrite}
                  onChange={(e) => {
                    setPlanning((p) => ({ ...p, [key]: e.target.value }));
                    setPlanningDirty(true);
                  }}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 20, alignContent: "start", minWidth: 0 }}>
          <Panel title="Details">
            <KeyValue
              items={[
                { label: "Client", value: clientId && access.canOpen("/portal/customers") ? <Link to={`/portal/customers/${clientId}`}>{customerName(job) || "Client"}</Link> : customerName(job) },
                { label: "Project", value: projectId && access.canOpen("/portal/projects") ? <Link to={`/portal/projects/${projectId}`}>{projectName(job) || "Project"}</Link> : projectName(job) },
                { label: "Service", value: job.enrollmentId?.serviceTemplateId?.name || "" },
                { label: "Type", value: jobTypeLabel(job.type) },
                { label: "Priority", value: jobPriorityLabel(job.priority) },
                { label: "Platform", value: job.platform ? job.platform.charAt(0).toUpperCase() + job.platform.slice(1) : "" },
                { label: "Start", value: formatDate(job.startDate) },
                { label: "Due", value: formatDate(job.dueDate) },
                { label: "Duration", value: job.durationDays ? `${job.durationDays} day${job.durationDays === 1 ? "" : "s"}` : "" },
                { label: "Estimate", value: job.timeEstimate },
                { label: "Effort", value: job.effort },
                { label: "Process owner", value: job.processOwner },
                { label: "Depends on", value: (job.dependencies || []).join(", ") },
                ...extra.map(([label, value]) => ({ label, value })),
                { label: "Created", value: formatDate(job.createdAt) },
              ]}
            />
          </Panel>

          <Panel title="Assigned staff" sub={assignees.length ? `${assignees.length} assigned` : "No one assigned yet"}>
            {assignees.length ? (
              <div className="px-chip-list">
                {assignees.map((a) => (
                  <span key={idOf(a)} className="px-filter-chip" data-static={!canWrite ? "true" : undefined}>
                    {personName(a) || "Staff member"}
                    {canWrite ? (
                      <button type="button" className="px-chip-x" onClick={() => removeAssignee(idOf(a))} disabled={busy} aria-label={`Remove ${personName(a) || "staff member"}`}>
                        <X size={12} aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
            {canWrite ? (
              canChooseStaff ? (
                <div style={{ marginTop: 12 }}>
                  <SelectField label="Add staff" value="" onChange={addAssignee} options={staffOptions} disabled={busy || staff.status !== "ready"} />
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <Alert title="Staff can't be added here">Adding staff needs access to the user directory, which your role doesn't include. You can still remove an assignment.</Alert>
                </div>
              )
            ) : null}
          </Panel>

          {steps.length ? (
            <Panel title="Approval steps">
              <ol className="px-steps">
                {steps.map((s, i) => (
                  <li key={s.id || i}>
                    <b>{s.title}</b>
                    {[s.role ? s.role.replace(/_/g, " ") : null, s.required ? "required" : null].filter(Boolean).length ? (
                      <small className="px-muted">{` · ${[s.role ? s.role.replace(/_/g, " ") : null, s.required ? "required" : null].filter(Boolean).join(", ")}`}</small>
                    ) : null}
                    {s.instructions ? <p className="px-muted" style={{ margin: "2px 0 0" }}>{s.instructions}</p> : null}
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          {checklist.length ? (
            <Panel title="QA checklist" sub={`${checklist.filter((c) => c.done).length} of ${checklist.length} done`}>
              <div style={{ display: "grid", gap: 4 }}>
                {checklist.map((c) => (
                  <label key={c.id || String(c._id)} className="px-check">
                    <input type="checkbox" checked={Boolean(c.done)} disabled={!canWrite || busy} onChange={() => toggleCheck(c)} />
                    {c.text}
                    {c.required && !c.done ? <small className="px-muted"> (required)</small> : null}
                  </label>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="Review history" sub={approvals.length ? undefined : "Nothing recorded yet"}>
            {approvals.length ? (
              <Timeline
                label="Review history"
                items={[...approvals].reverse().map((a, i) => ({
                  key: a._id || i,
                  tone: a.status === "approved" ? "ok" : a.status === "changes_requested" ? "warn" : undefined,
                  content: (
                    <>
                      <b>{APPROVAL_LABEL[a.status] || "Note"}</b>
                      {a.createdBy && typeof a.createdBy === "object" ? ` by ${personName(a.createdBy)}` : ""}
                      {a.note ? <p className="px-muted" style={{ margin: "2px 0 0", whiteSpace: "pre-wrap" }}>{a.note}</p> : null}
                    </>
                  ),
                  when: formatDate(a.at || a.createdAt),
                  dateTime: a.at || a.createdAt,
                }))}
              />
            ) : null}
          </Panel>
        </div>
      </div>

      {canWrite ? <JobEditDialog open={editOpen} job={job} onClose={() => setEditOpen(false)} onSubmit={saveEdit} /> : null}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this job?"
        confirmLabel="Delete job"
        icon={Trash2}
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
        details={["It is removed permanently, with its notes and approval history.", "To keep it but take it off the board, set its status to Archived instead."]}
      >
        {`"${job.title || "This job"}" will be deleted.`}
      </ConfirmDialog>
      {canWrite ? (
        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(m) => {
            if (!m?._id) return;
            setPickerOpen(false);
            run(() => attachMedia(job._id, [m._id]), "Media attached.");
          }}
          title="Attach media to job"
          subtitle="Choose media from the Media Library."
          onlyType=""
          multiple={false}
          allowUpload
        />
      ) : null}
    </div>
  );
}
