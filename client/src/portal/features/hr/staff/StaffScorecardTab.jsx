import React, { useEffect, useRef, useState } from "react";
import { FileText, Plus, Star, Trash2 } from "lucide-react";
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
import { addStaffScorecard, createScorecardTemplate, deleteScorecardTemplate, listScorecardTemplates, removeStaffScorecard } from "../api";
import { date } from "../format";

const RATINGS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} of 5` }));
const BLANK = { period: "", rating: "3", notes: "", reviewerName: "" };
const TPL_BLANK = { name: "", period: "", notes: "", defaultRating: "3" };

function Rating({ value }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="px-rating" role="img" aria-label={`Rated ${v} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} aria-hidden="true" data-on={i <= v || undefined} />
      ))}
    </span>
  );
}

// Scorecard tab of a staff record (PUI-4): the review entries already
// recorded on the record, and the shared review templates. Reading needs
// hr.scorecards.read; adding and removing needs hr.scorecards.write.
export default function StaffScorecardTab({ staff, onUpdated }) {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.scorecards.write");
  const entries = Array.isArray(staff.scorecards) ? [...staff.scorecards].reverse() : [];

  const [templates, setTemplates] = useState({ status: "loading", items: [] });
  const [entryOpen, setEntryOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplForm, setTplForm] = useState(TPL_BLANK);
  const [removing, setRemoving] = useState(null); // { kind, item }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;
    listScorecardTemplates()
      .then((r) => !cancelled && setTemplates({ status: "ready", items: r?.items || [] }))
      .catch(() => !cancelled && setTemplates({ status: "failed", items: [] }));
    return () => {
      cancelled = true;
    };
  }, []);

  const guarded = async (fn) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e?.response?.data?.message || "That wasn't saved. Try again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const openEntry = (tpl = null) => {
    setError("");
    setForm(tpl ? { period: tpl.period || "", rating: String(tpl.defaultRating || 3), notes: tpl.notes || "", reviewerName: "" } : BLANK);
    setEntryOpen(true);
  };

  const addEntry = () =>
    guarded(async () => {
      const res = await addStaffScorecard(staff._id, { ...form, rating: Number(form.rating) });
      onUpdated(res.item);
      toast.success("Review added.");
      setEntryOpen(false);
    });

  const addTemplate = () =>
    guarded(async () => {
      const res = await createScorecardTemplate({ name: tplForm.name.trim(), period: tplForm.period.trim(), notes: tplForm.notes.trim(), defaultRating: Number(tplForm.defaultRating) || 3 });
      setTemplates((t) => ({ ...t, items: [...t.items, res.item] }));
      toast.success("Template created.");
      setTplOpen(false);
    });

  const remove = async () => {
    const { kind, item } = removing;
    try {
      if (kind === "entry") {
        const res = await removeStaffScorecard(staff._id, item._id);
        onUpdated(res.item);
      } else {
        await deleteScorecardTemplate(item._id);
        setTemplates((t) => ({ ...t, items: t.items.filter((x) => x._id !== item._id) }));
      }
      toast.success(kind === "entry" ? "Review removed." : "Template deleted.");
      setRemoving(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Try again.");
    }
  };

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const setT = (k) => (v) => setTplForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const tplItems = templates.items;

  return (
    <>
      <div className="px-grid px-cols-detail">
        <Panel
          title="Reviews"
          sub={`${entries.length} review${entries.length === 1 ? "" : "s"}, newest first`}
          flush
          action={canWrite ? <Button size="sm" onClick={() => openEntry()}><Plus size={14} aria-hidden="true" />Add review</Button> : null}
        >
          {entries.length ? (
            <ul className="px-list" aria-label={`Reviews of ${staff.fullName}`}>
              {entries.map((sc) => (
                <li key={sc._id}>
                  <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
                    <div className="px-t" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Rating value={sc.rating} />
                      <span>{sc.rating} of 5</span>
                      {sc.period ? <Badge tone="neutral">{sc.period}</Badge> : null}
                    </div>
                    {sc.notes ? <div className="px-s">{sc.notes}</div> : null}
                    <div className="px-s">{[sc.reviewerName ? `Reviewed by ${sc.reviewerName}` : null, date(sc.createdAt)].filter(Boolean).join(", ")}</div>
                  </div>
                  {canWrite ? (
                    <RowActions label={`review ${sc.period || date(sc.createdAt)}`} actions={[{ key: "rm", label: "Remove review", icon: Trash2, tone: "muted", onSelect: () => setRemoving({ kind: "entry", item: sc }) }]} />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-inline-empty">
              <Star size={18} aria-hidden="true" />
              <span>No reviews recorded yet.</span>
            </div>
          )}
        </Panel>

        <Panel
          title="Review templates"
          sub="Shared by every staff record"
          flush
          action={canWrite ? <Button size="sm" variant="outline" onClick={() => { setError(""); setTplForm(TPL_BLANK); setTplOpen(true); }}><Plus size={14} aria-hidden="true" />New template</Button> : null}
        >
          {templates.status === "failed" ? (
            <p className="px-muted" style={{ margin: 0, padding: "12px 20px" }}>Templates didn't load.</p>
          ) : tplItems.length ? (
            <ul className="px-list" aria-label="Review templates">
              {tplItems.map((t) => (
                <li key={t._id}>
                  <div style={{ minWidth: 0 }}>
                    <div className="px-t">{t.name}</div>
                    <div className="px-s">{[t.period, `starts at ${t.defaultRating || 3} of 5`].filter(Boolean).join(", ")}</div>
                  </div>
                  {canWrite ? (
                    <RowActions
                      label={`template ${t.name}`}
                      actions={[
                        { key: "use", label: "Add a review from it", icon: FileText, onSelect: () => openEntry(t) },
                        { key: "sep", separator: true },
                        { key: "rm", label: "Delete template", icon: Trash2, tone: "muted", onSelect: () => setRemoving({ kind: "template", item: t }) },
                      ]}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-muted" style={{ margin: 0, padding: "12px 20px" }}>{templates.status === "loading" ? "Loading…" : "No templates yet."}</p>
          )}
        </Panel>
      </div>

      {canWrite ? (
        <>
          <FormDialog open={entryOpen} title="Add a review" description={`For ${staff.fullName}.`} onClose={() => setEntryOpen(false)} onSubmit={addEntry} busy={busy} error={error} submitLabel="Add review" submitIcon={Plus}>
            <fieldset className="px-form-section">
              <legend>Review</legend>
              <div className="px-form-grid px-form-grid--2">
                <TextField label="Period" value={form.period} onChange={setF("period")} placeholder="Q1 2026, H1 2026" />
                <SelectField label="Rating" value={form.rating} onChange={setF("rating")} options={RATINGS} />
              </div>
              <TextField label="Reviewer" value={form.reviewerName} onChange={setF("reviewerName")} placeholder="Optional" />
              <TextField label="Notes" multiline rows={3} value={form.notes} onChange={setF("notes")} />
            </fieldset>
          </FormDialog>
          <FormDialog open={tplOpen} title="New review template" onClose={() => setTplOpen(false)} onSubmit={addTemplate} busy={busy} error={error} canSubmit={Boolean(tplForm.name.trim())} submitLabel="Create template" submitIcon={Plus}>
            <fieldset className="px-form-section">
              <legend>Template</legend>
              <TextField label="Name" required value={tplForm.name} onChange={setT("name")} placeholder="Annual review" />
              <div className="px-form-grid px-form-grid--2">
                <TextField label="Default period" value={tplForm.period} onChange={setT("period")} />
                <SelectField label="Default rating" value={tplForm.defaultRating} onChange={setT("defaultRating")} options={RATINGS} />
              </div>
              <TextField label="Default notes" multiline rows={2} value={tplForm.notes} onChange={setT("notes")} />
            </fieldset>
          </FormDialog>
          <ConfirmDialog
            open={Boolean(removing)}
            icon={Trash2}
            tone="bad"
            danger
            title={removing?.kind === "entry" ? "Remove this review?" : "Delete this template?"}
            confirmLabel={removing?.kind === "entry" ? "Remove review" : "Delete template"}
            details={removing?.kind === "entry" ? ["The review is deleted from the record and can't be restored."] : ["The template is deleted for everyone. Reviews already added from it are kept."]}
            onClose={() => setRemoving(null)}
            onConfirm={remove}
          >
            {removing?.kind === "entry" ? `${removing.item.rating} of 5${removing.item.period ? `, ${removing.item.period}` : ""}.` : removing ? `${removing.item.name}.` : ""}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
