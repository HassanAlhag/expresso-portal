import React, { useEffect, useState } from "react";
import { Save, UserPlus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import JobStaffField, { useCanChooseStaff } from "./JobStaffField";
import { JOB_STATUSES, JOB_PRIORITIES, JOB_PLATFORMS } from "../constants";
import { dateInput, idOf } from "../format";

const STATUS_OPTIONS = JOB_STATUSES.filter((o) => o.value);

/**
 * Edit a job's main fields (PI tail). Assignees are sent only when the user
 * can choose staff, so editing never clears assignments by accident.
 * `onSubmit(patch)` must throw on failure; the dialog then stays open.
 */
export function JobEditDialog({ open, job, onClose, onSubmit }) {
  const canChooseStaff = useCanChooseStaff();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !job) return;
    setError("");
    setBusy(false);
    setForm({
      title: job.title || "",
      status: job.status || "brief",
      priority: job.priority || "normal",
      platform: job.platform || "",
      dueDate: dateInput(job.dueDate),
      assignees: Array.isArray(job.assignees) ? job.assignees : [],
    });
  }, [open, job]);

  if (!open || !form) return null;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const submit = async () => {
    if (!form.title.trim()) return setError("Add a title.");
    const patch = {
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      platform: form.platform || "",
      dueDate: form.dueDate || null,
    };
    if (canChooseStaff) patch.assignees = form.assignees.map(idOf);
    setBusy(true);
    setError("");
    try {
      await onSubmit?.(patch);
      setBusy(false);
    } catch (e) {
      setError(e?.response?.data?.message || "The job wasn't saved. Try again.");
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title="Edit job"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      canSubmit={Boolean(form.title.trim())}
      submitLabel="Save changes"
      submitIcon={Save}
      error={error}
    >
      <fieldset className="px-form-section">
        <legend>The work</legend>
        <TextField label="Title" required value={form.title} onChange={set("title")} maxLength={180} />
        <div className="px-form-grid px-form-grid--2">
          <SelectField label="Status" value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />
          <SelectField label="Priority" value={form.priority} onChange={set("priority")} options={JOB_PRIORITIES} />
          <SelectField label="Platform" value={form.platform} onChange={set("platform")} options={JOB_PLATFORMS} />
          <TextField label="Due date" type="date" value={form.dueDate} onChange={set("dueDate")} />
        </div>
      </fieldset>
      <JobStaffField value={form.assignees} onChange={set("assignees")} disabled={busy} active={open} />
    </FormDialog>
  );
}

/** Assign staff to several jobs at once (add to, or replace, their staff). */
export function BulkAssignDialog({ open, count, onClose, onSubmit }) {
  const canChooseStaff = useCanChooseStaff();
  const [assignees, setAssignees] = useState([]);
  const [mode, setMode] = useState("add");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAssignees([]);
    setMode("add");
    setBusy(false);
    setError("");
  }, [open]);

  const submit = async () => {
    if (!assignees.length) return setError("Choose at least one staff member.");
    setBusy(true);
    setError("");
    try {
      await onSubmit?.({ assignees: assignees.map(idOf), mode });
      setBusy(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Staff weren't assigned. Try again.");
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={`Assign staff to ${count} job${count === 1 ? "" : "s"}`}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      canSubmit={canChooseStaff && assignees.length > 0}
      submitLabel="Assign staff"
      submitIcon={UserPlus}
      error={error}
    >
      {canChooseStaff ? (
        <fieldset className="px-form-section">
          <legend>How</legend>
          <div className="px-choice-row" role="radiogroup" aria-label="Assignment mode">
            <button type="button" role="radio" aria-checked={mode === "add"} className="px-choice" onClick={() => setMode("add")}>
              Add to current staff
            </button>
            <button type="button" role="radio" aria-checked={mode === "replace"} className="px-choice" onClick={() => setMode("replace")}>
              Replace current staff
            </button>
          </div>
        </fieldset>
      ) : null}
      <JobStaffField label="Staff to assign" value={assignees} onChange={setAssignees} disabled={busy} active={open} />
    </FormDialog>
  );
}
