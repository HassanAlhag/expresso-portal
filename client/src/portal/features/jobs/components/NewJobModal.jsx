import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import RecordPicker from "../../../shared/ui/RecordPicker";
import JobStaffField, { useCanChooseStaff } from "./JobStaffField";
import { JOB_TYPES, JOB_STATUSES, JOB_PRIORITIES, JOB_PLATFORMS } from "../constants";
import { idOf } from "../format";

// New job (PI tail). FormDialog shell, the same props as before so the Jobs,
// Project and Client pages share it. A failed create keeps the dialog open
// with everything typed and shows the server's message; only a successful
// create closes it (onClose(true)).
const TYPE_OPTIONS = JOB_TYPES.filter((o) => o.value);
// A new job starts somewhere between brief and approved, as before.
const START_STATUSES = JOB_STATUSES.filter((o) => o.value && !["scheduled", "published", "delivered", "on_hold", "archived"].includes(o.value));

const BLANK = { customer: null, projectId: "", enrollmentId: "", title: "", type: "post", platform: "", status: "brief", priority: "normal", dueDate: "", assignees: [], notes: "" };

export default function NewJobModal({
  open,
  onClose,
  listCustomers,
  listProjects,
  listEnrollments,
  createJob,
  initialCustomer = null,
  initialProject = null,
  initialEnrollment = null,
  lockCustomer = false,
  lockProject = false,
}) {
  const canChooseStaff = useCanChooseStaff();
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState({ status: "idle", items: [] });
  const [enrollments, setEnrollments] = useState({ status: "idle", items: [] });

  useEffect(() => {
    if (!open) return;
    setError("");
    setBusy(false);
    setForm({ ...BLANK, customer: initialCustomer || null, projectId: idOf(initialProject), enrollmentId: idOf(initialEnrollment) });
  }, [open, initialCustomer, initialProject, initialEnrollment]);

  const customerId = idOf(form.customer);

  useEffect(() => {
    if (!open || !customerId || !listProjects) {
      setProjects({ status: "idle", items: [] });
      return undefined;
    }
    let dead = false;
    setProjects({ status: "loading", items: [] });
    Promise.resolve(listProjects({ customerId, limit: 100 }))
      .then((r) => !dead && setProjects({ status: "ready", items: Array.isArray(r?.items) ? r.items : [] }))
      .catch(() => !dead && setProjects({ status: "failed", items: [] }));
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per client only
  }, [open, customerId]);

  useEffect(() => {
    // Not every caller offers enrollments (the project page doesn't).
    if (!open || !customerId || !listEnrollments) {
      setEnrollments({ status: "idle", items: [] });
      return undefined;
    }
    let dead = false;
    setEnrollments({ status: "loading", items: [] });
    Promise.resolve(listEnrollments({ customerId, limit: 100 }))
      .then((r) => !dead && setEnrollments({ status: "ready", items: Array.isArray(r?.items) ? r.items : [] }))
      .catch(() => !dead && setEnrollments({ status: "failed", items: [] }));
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per client only
  }, [open, customerId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const projectOptions = useMemo(() => {
    const first = { value: "", label: projects.status === "loading" ? "Loading projects…" : projects.status === "failed" ? "Projects didn't load" : "No project" };
    const items = projects.items.map((p) => ({ value: p._id, label: p.name || p.title || "Project" }));
    if (initialProject && !items.some((o) => o.value === idOf(initialProject))) items.unshift({ value: idOf(initialProject), label: initialProject.name || "This project" });
    return [first, ...items];
  }, [projects, initialProject]);

  const enrollmentOptions = useMemo(
    () => [
      { value: "", label: enrollments.status === "loading" ? "Loading services…" : enrollments.status === "failed" ? "Services didn't load" : "No service enrollment" },
      ...enrollments.items.map((e) => ({ value: e._id, label: e.serviceTemplateId?.name || e.name || "Service" })),
    ],
    [enrollments]
  );

  const canSubmit = Boolean(form.title.trim() && customerId) && !busy;

  const submit = async () => {
    if (!form.title.trim()) return setError("Add a title.");
    if (!customerId) return setError("Choose a client.");
    setBusy(true);
    setError("");
    const payload = {
      customerId,
      projectId: form.enrollmentId ? undefined : form.projectId || undefined,
      enrollmentId: form.projectId ? undefined : form.enrollmentId || undefined,
      title: form.title.trim(),
      type: form.type,
      platform: form.platform || "",
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      notes: form.notes.trim(),
      publishStatus: "not_ready",
    };
    if (canChooseStaff) payload.assignees = form.assignees.map(idOf);
    try {
      await createJob(payload);
      setBusy(false);
      onClose?.(true);
    } catch (e) {
      setError(e?.response?.data?.message || "The job wasn't created. Check the details and try again.");
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title="New job"
      description="A piece of delivery work for a client. It starts at the status you choose."
      onClose={() => onClose?.(false)}
      onSubmit={submit}
      busy={busy}
      canSubmit={canSubmit}
      submitLabel="Create job"
      submitIcon={Plus}
      error={error}
    >
      <fieldset className="px-form-section">
        <legend>Where it belongs</legend>
        {lockCustomer ? (
          <TextField label="Client" value={form.customer?.companyName || "This client"} readOnly disabled />
        ) : (
          <RecordPicker
            label="Client"
            required
            value={form.customer}
            onChange={(c) => setForm((f) => ({ ...f, customer: c, projectId: "", enrollmentId: "" }))}
            load={(q) => listCustomers({ q, limit: 20 })}
            getLabel={(c) => c?.companyName || "Client"}
            getSub={(c) => c?.contactName || c?.primaryEmail}
            searchLabel="Search clients"
          />
        )}
        <div className="px-form-grid px-form-grid--2">
          <SelectField
            label="Project"
            value={form.projectId}
            onChange={(v) => setForm((f) => ({ ...f, projectId: v, enrollmentId: v ? "" : f.enrollmentId }))}
            options={projectOptions}
            disabled={!customerId || lockProject || Boolean(form.enrollmentId)}
          />
          {listEnrollments ? (
            <SelectField
              label="Service enrollment"
              value={form.enrollmentId}
              onChange={(v) => setForm((f) => ({ ...f, enrollmentId: v, projectId: v ? "" : f.projectId }))}
              options={enrollmentOptions}
              disabled={!customerId || lockProject || Boolean(form.projectId)}
            />
          ) : null}
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>The work</legend>
        <TextField label="Title" required value={form.title} onChange={set("title")} maxLength={180} />
        <div className="px-form-grid px-form-grid--2">
          <SelectField label="Type" value={form.type} onChange={set("type")} options={TYPE_OPTIONS} />
          <SelectField label="Platform" value={form.platform} onChange={set("platform")} options={JOB_PLATFORMS} />
          <SelectField label="Status" value={form.status} onChange={set("status")} options={START_STATUSES} />
          <SelectField label="Priority" value={form.priority} onChange={set("priority")} options={JOB_PRIORITIES} />
          <TextField label="Due date" type="date" value={form.dueDate} onChange={set("dueDate")} />
        </div>
        <TextField label="Notes" multiline rows={3} value={form.notes} onChange={set("notes")} />
      </fieldset>
      <JobStaffField value={form.assignees} onChange={set("assignees")} disabled={busy} active={open} />
    </FormDialog>
  );
}
