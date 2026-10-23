import React, { useRef, useState } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import RowActions from "../../../shared/ui/RowActions";
import FormDialog from "../../../shared/ui/FormDialog";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { addStaffLearningGoal, removeStaffLearningGoal, updateStaffLearningGoal } from "../api";
import { date } from "../format";

const STATUSES = [
  { value: "active", label: "Active", tone: "info" },
  { value: "completed", label: "Completed", tone: "ok" },
  { value: "on_hold", label: "On hold", tone: "warn" },
];
const status = (v) => STATUSES.find((s) => s.value === v) || { label: v, tone: "neutral" };
const BLANK = { title: "", description: "", targetDate: "", status: "active", progress: 0 };

// Learning goals tab of a staff record (PUI-4). Read with the record;
// adding, editing and removing need hr.staff.write (the API's permission).
export default function StaffLearningGoalsTab({ staff, onUpdated }) {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.staff.write");
  const goals = Array.isArray(staff.learningGoals) ? staff.learningGoals : [];
  const [editing, setEditing] = useState(null); // goal, or {} for new
  const [form, setForm] = useState(BLANK);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  const open = (g = null) => {
    setError("");
    setEditing(g || {});
    setForm(
      g
        ? { title: g.title || "", description: g.description || "", targetDate: g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : "", status: g.status || "active", progress: g.progress ?? 0 }
        : BLANK
    );
  };
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const progress = Number(form.progress);

  const submit = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const payload = { ...form, title: form.title.trim(), progress, targetDate: form.targetDate || null };
      const res = editing?._id ? await updateStaffLearningGoal(staff._id, editing._id, payload) : await addStaffLearningGoal(staff._id, payload);
      onUpdated(res.item);
      toast.success(editing?._id ? "Goal updated." : "Goal added.");
      setEditing(null);
    } catch (e) {
      setError(e?.response?.data?.message || "The goal wasn't saved. Try again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      const res = await removeStaffLearningGoal(staff._id, removing._id);
      onUpdated(res.item);
      toast.success("Goal removed.");
      setRemoving(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "The goal wasn't removed. Try again.");
    }
  };

  return (
    <>
      <Panel
        title="Learning goals"
        sub={`${goals.length} goal${goals.length === 1 ? "" : "s"}`}
        flush
        action={canWrite ? <Button size="sm" onClick={() => open()}><Plus size={14} aria-hidden="true" />Add goal</Button> : null}
      >
        {goals.length ? (
          <ul className="px-list" aria-label={`Learning goals of ${staff.fullName}`}>
            {goals.map((g) => (
              <li key={g._id}>
                <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                  <div className="px-t">
                    {g.title} <Badge tone={status(g.status).tone}>{status(g.status).label}</Badge>
                  </div>
                  {g.description ? <div className="px-s">{g.description}</div> : null}
                  <div className="px-bar" data-tone={g.status === "completed" ? "ok" : undefined} aria-hidden="true">
                    <i style={{ width: `${Math.min(100, Math.max(0, Number(g.progress) || 0))}%` }} />
                  </div>
                  <div className="px-s">{[`${Math.round(Number(g.progress) || 0)}% done`, g.targetDate ? `target ${date(g.targetDate)}` : null].filter(Boolean).join(", ")}</div>
                </div>
                {canWrite ? (
                  <RowActions
                    label={`goal ${g.title}`}
                    actions={[
                      { key: "edit", label: "Edit goal", icon: Pencil, onSelect: () => open(g) },
                      { key: "sep", separator: true },
                      { key: "rm", label: "Remove goal", icon: Trash2, tone: "muted", onSelect: () => setRemoving(g) },
                    ]}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-inline-empty">
            <Target size={18} aria-hidden="true" />
            <span>No learning goals yet.</span>
          </div>
        )}
      </Panel>

      {canWrite ? (
        <>
          <FormDialog
            open={Boolean(editing)}
            title={editing?._id ? "Edit learning goal" : "New learning goal"}
            onClose={() => setEditing(null)}
            onSubmit={submit}
            busy={busy}
            error={error}
            canSubmit={Boolean(form.title.trim()) && progress >= 0 && progress <= 100}
            submitLabel={editing?._id ? "Save changes" : "Add goal"}
            submitIcon={editing?._id ? Pencil : Plus}
          >
            <fieldset className="px-form-section">
              <legend>Goal</legend>
              <TextField label="Title" required value={form.title} onChange={set("title")} />
              <TextField label="Description" multiline rows={2} value={form.description} onChange={set("description")} />
              <div className="px-form-grid px-form-grid--3">
                <TextField label="Target date" type="date" value={form.targetDate} onChange={set("targetDate")} />
                <SelectField label="Status" value={form.status} onChange={set("status")} options={STATUSES} />
                <TextField label="Progress (%)" type="number" min="0" max="100" value={String(form.progress)} onChange={set("progress")} />
              </div>
            </fieldset>
          </FormDialog>
          <ConfirmDialog
            open={Boolean(removing)}
            icon={Trash2}
            tone="bad"
            danger
            title="Remove this learning goal?"
            confirmLabel="Remove goal"
            details={["The goal is deleted from the record and can't be restored."]}
            onClose={() => setRemoving(null)}
            onConfirm={remove}
          >
            {removing ? `${removing.title}.` : ""}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
