import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CheckSquare, Mail, MessageCircle, MoreHorizontal, Phone, Send, StickyNote, Trash2, Users } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Timeline from "../../../shared/ui/Timeline";
import TextField from "../../../shared/ui/TextField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import Alert from "../../../shared/ui/Alert";
import { useToast } from "../../../shared/ui/Toast";
import { listActivities, createActivity, updateActivity, deleteActivity } from "../api";
import { ACTIVITY_TYPE_LABEL } from "../format";
import { formatDate } from "../../projects/format";

const TYPES = [
  { value: "note", icon: StickyNote },
  { value: "call", icon: Phone },
  { value: "email", icon: Mail },
  { value: "meeting", icon: Users },
  { value: "task", icon: CheckSquare },
  { value: "whatsapp", icon: MessageCircle },
  { value: "other", icon: MoreHorizontal },
];
const ICON = Object.fromEntries(TYPES.map((t) => [t.value, t.icon]));

function isOverdue(a, now = new Date()) {
  return a.status === "pending" && a.dueAt && new Date(a.dueAt) < now;
}

// CRM activity (PUI-3) for a lead, deal, account or contact: log what
// happened, or schedule a follow-up (an activity with a due date stays
// pending until marked done — existing CRM fields, now usable from the UI).
export default function CrmActivityPanel({ entityType, entityId, canWrite = false, canDelete = false }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [type, setType] = useState("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [completing, setCompleting] = useState("");

  const load = useCallback(async () => {
    if (!entityId) return;
    setState("loading");
    try {
      const res = await listActivities({ entityType, entityId, limit: 100, sort: "-createdAt" });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setState("ready");
    } catch {
      setState("failed");
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError("Add a subject.");
      return;
    }
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      await createActivity({
        type,
        subject: subject.trim(),
        body: body.trim(),
        outcome: outcome.trim(),
        entityType,
        entityId,
        ...(dueAt ? { status: "pending", dueAt } : { status: "done" }),
      });
      setSubject("");
      setBody("");
      setOutcome("");
      setDueAt("");
      toast.success(dueAt ? "Follow-up scheduled." : "Activity logged.");
      await load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "The activity wasn't saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (a) => {
    setCompleting(a._id);
    try {
      await updateActivity(a._id, { status: "done" });
      toast.success("Follow-up marked done.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "It wasn't updated. Try again.");
    } finally {
      setCompleting("");
    }
  };

  const pending = items.filter((a) => a.status === "pending");

  return (
    <div className="px-stack">
      {canWrite ? (
        <Panel title="Log activity" sub="Leave the due date empty to log something that happened, or set it to schedule a follow-up">
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }} aria-label="Log activity">
            <div className="px-choice-row" role="radiogroup" aria-label="Activity type">
              {TYPES.map((t) => (
                <button key={t.value} type="button" role="radio" aria-checked={type === t.value} className="px-choice" onClick={() => setType(t.value)}>
                  <t.icon size={14} aria-hidden="true" />
                  {ACTIVITY_TYPE_LABEL[t.value]}
                </button>
              ))}
            </div>
            <div className="px-form-grid px-form-grid--2">
              <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
              <TextField label="Follow-up due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} hint="Optional." />
            </div>
            <TextField label="Details" multiline rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
            {!dueAt ? <TextField label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} /> : null}
            {formError ? (
              <div className="px-form-error" role="alert" style={{ margin: 0 }}>
                {formError}
              </div>
            ) : null}
            <div>
              <Button type="submit" loading={saving}>
                {dueAt ? <CalendarClock size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
                {dueAt ? "Schedule follow-up" : "Log activity"}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {state === "loading" ? <LoadingState rows={4} label="Loading activity" /> : null}
      {state === "failed" ? <ErrorState title="Activity didn't load" onRetry={load} /> : null}
      {state === "ready" ? (
        <Panel title="Activity" sub={items.length ? `${items.length} item${items.length === 1 ? "" : "s"}${pending.length ? `, ${pending.length} follow-up${pending.length === 1 ? "" : "s"} open` : ""}` : undefined}>
          {items.length ? (
            <Timeline
              label="Activity"
              items={items.map((a) => {
                const Icon = ICON[a.type] || MoreHorizontal;
                const overdue = isOverdue(a);
                return {
                  key: a._id,
                  icon: Icon,
                  tone: a.status === "pending" ? (overdue ? "bad" : "warn") : a.status === "cancelled" ? undefined : "info",
                  dateTime: a.createdAt,
                  when: formatDate(a.createdAt),
                  content: (
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <b>{a.subject}</b>
                        <span className="px-muted" style={{ fontSize: 13 }}>{ACTIVITY_TYPE_LABEL[a.type] || a.type}</span>
                        {a.status === "pending" ? (
                          <Badge tone={overdue ? "bad" : "warn"} dot>
                            {a.dueAt ? `${overdue ? "Overdue" : "Due"} ${formatDate(a.dueAt, { year: false })}` : "Open follow-up"}
                          </Badge>
                        ) : a.status === "cancelled" ? (
                          <Badge>Cancelled</Badge>
                        ) : null}
                      </div>
                      {a.body ? <p className="px-prose" style={{ fontSize: 14 }}>{a.body}</p> : null}
                      {a.outcome ? <span className="px-muted" style={{ fontSize: 13 }}>Outcome: {a.outcome}</span> : null}
                      <span className="px-muted" style={{ fontSize: 12.5 }}>
                        {a.createdBy?.fullName ? `By ${a.createdBy.fullName}` : ""}
                        {a.completedAt && a.dueAt ? `${a.createdBy?.fullName ? ", " : ""}done ${formatDate(a.completedAt, { year: false })}` : ""}
                      </span>
                      {(canWrite && a.status === "pending") || canDelete ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {canWrite && a.status === "pending" ? (
                            <Button size="sm" variant="outline" onClick={() => markDone(a)} loading={completing === a._id}>
                              <CheckCircle2 size={14} aria-hidden="true" />
                              Mark done
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button size="sm" variant="ghost" onClick={() => setRemoving(a)} aria-label={`Delete activity: ${a.subject}`}>
                              <Trash2 size={14} aria-hidden="true" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ),
                };
              })}
            />
          ) : (
            <Alert tone="info" title="No activity yet">
              {canWrite ? "Log a call, email, meeting or note above, or schedule a follow-up." : "Calls, emails, meetings and notes appear here."}
            </Alert>
          )}
        </Panel>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        icon={Trash2}
        tone="bad"
        danger
        title="Delete this activity?"
        confirmLabel="Delete activity"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          try {
            await deleteActivity(removing._id);
            toast.success("Activity deleted.");
            setRemoving(null);
            await load();
          } catch (err) {
            toast.error(err?.response?.data?.message || "It wasn't deleted. Try again.");
          }
        }}
        details={["It is removed permanently from this record's history."]}
      >
        {removing?.subject}
      </ConfirmDialog>
    </div>
  );
}
