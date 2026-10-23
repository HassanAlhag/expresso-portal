import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, Plus, Save, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import TextField from "../../../shared/ui/TextField";
import SearchField from "../../../shared/ui/SearchField";
import Alert from "../../../shared/ui/Alert";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";

import { createRfq, getCategoryTree, getRfq, updateRfq } from "../api";
import { idOf } from "../format";

/** Subcategories (third level) from the category tree, labelled with their path. */
export function subcategoriesOf(tree = []) {
  const out = [];
  tree.forEach((main) =>
    (main.children || []).forEach((cat) =>
      (cat.children || []).forEach((sub) => out.push({ value: sub._id, label: `${main.code || main.name} › ${cat.code || cat.name} › ${sub.name}` }))
    )
  );
  return out;
}

// New or edit RFQ (PUI-4, internal, procurement.write). Only drafts can be
// edited (the API's rule). Vendors see a published RFQ when it lists one of
// their categories.
export default function RFQFormPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const access = useAccess();
  const allowed = access.isInternal && access.can("procurement.write");

  const [form, setForm] = useState({ title: "", description: "", deadline: "", subcategoryIds: [], attachments: [] });
  const [loaded, setLoaded] = useState(null); // the RFQ being edited
  const [state, setState] = useState(isEdit ? "loading" : "ready");
  const [subs, setSubs] = useState({ status: "loading", items: [] });
  const [catQ, setCatQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  usePageCrumbs(isEdit && loaded ? [{ label: "Procurement", to: "/portal/procurement" }, { label: "RFQs", to: "/portal/procurement/rfqs" }, { label: loaded.rfqNumber || "RFQ", to: `/portal/procurement/rfqs/${id}` }, { label: "Edit" }] : []);

  useEffect(() => {
    if (!allowed) return undefined;
    let cancelled = false;
    getCategoryTree()
      .then((r) => !cancelled && setSubs({ status: "ready", items: subcategoriesOf(r?.tree || []) }))
      .catch(() => !cancelled && setSubs({ status: "failed", items: [] }));
    if (isEdit)
      getRfq(id)
        .then((r) => {
          if (cancelled) return;
          const it = r?.item;
          if (!it) return setState("failed");
          setLoaded(it);
          setForm({
            title: it.title || "",
            description: it.description || "",
            deadline: it.deadline ? String(it.deadline).slice(0, 10) : "",
            subcategoryIds: (it.subcategoryIds || []).map((c) => String(idOf(c))),
            attachments: (it.attachments || []).map((a) => ({ name: a.name || "", url: a.url || "" })),
          });
          setState("ready");
        })
        .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, allowed]);

  // Categories already on the RFQ stay listed even if not a current subcategory.
  const options = useMemo(() => {
    const extra = (loaded?.subcategoryIds || []).filter((c) => typeof c === "object" && !subs.items.some((s) => s.value === c._id)).map((c) => ({ value: c._id, label: c.name }));
    return [...subs.items, ...extra];
  }, [subs.items, loaded]);
  const shown = catQ.trim() ? options.filter((o) => o.label.toLowerCase().includes(catQ.trim().toLowerCase())) : options;

  if (!allowed)
    return <EmptyState icon={Lock} title="RFQs are created by Expresso staff" message="You need procurement write access to create or edit an RFQ." />;
  if (state === "loading") return <LoadingState rows={6} label="Loading RFQ" />;
  if (state === "failed") return <ErrorState title="This RFQ didn't load" message="It may have been removed, or the link is wrong." />;

  const locked = isEdit && loaded && loaded.status !== "draft";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSub = (v) => setForm((f) => ({ ...f, subcategoryIds: f.subcategoryIds.includes(v) ? f.subcategoryIds.filter((x) => x !== v) : [...f.subcategoryIds, v] }));
  const setAttachment = (i, patch) => setForm((f) => ({ ...f, attachments: f.attachments.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const canSave = Boolean(form.title.trim()) && form.subcategoryIds.length > 0 && !locked;

  const save = async (e) => {
    e?.preventDefault();
    if (!canSave || running.current) return;
    running.current = true;
    setSaving(true);
    setError("");
    try {
      const payload = { title: form.title.trim(), description: form.description, deadline: form.deadline || null, subcategoryIds: form.subcategoryIds, attachments: form.attachments.filter((a) => a.url.trim()).map((a) => ({ name: a.name.trim(), url: a.url.trim() })) };
      const res = isEdit ? await updateRfq(id, payload) : await createRfq(payload);
      toast.success(isEdit ? "RFQ saved." : "Draft RFQ created.");
      nav(`/portal/procurement/rfqs/${res?.item?._id || id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "The RFQ wasn't saved. Check the details and try again.");
    } finally {
      running.current = false;
      setSaving(false);
    }
  };

  return (
    <PageFrame
      title={isEdit ? `Edit ${loaded?.rfqNumber || "RFQ"}` : "New RFQ"}
      description="A request for quotation. It stays a draft, visible only to staff, until it is published."
      breadcrumb={isEdit ? undefined : [{ label: "Procurement", to: "/portal/procurement" }, { label: "RFQs", to: "/portal/procurement/rfqs" }, { label: "New" }]}
    >
      <form className="px-stack" onSubmit={save} aria-label={isEdit ? "Edit RFQ" : "New RFQ"}>
        {locked ? (
          <Alert tone="warn" icon={Lock} title="Only draft RFQs can be edited">
            This RFQ is {loaded.status}. <Link to={`/portal/procurement/rfqs/${id}`}>Back to the RFQ</Link>
          </Alert>
        ) : null}
        {error ? <Alert tone="bad" title="Not saved">{error}</Alert> : null}
        <Panel title="Details">
          <div className="px-stack">
            <TextField label="Title" required value={form.title} onChange={set("title")} disabled={locked} />
            <TextField label="Deadline" type="date" value={form.deadline} onChange={set("deadline")} disabled={locked} hint="Optional. Shown to vendors." />
            <TextField label="Description" multiline rows={6} value={form.description} onChange={set("description")} disabled={locked} hint="Shown to matched vendors once published. Keep internal budgets and client details out of it." />
          </div>
        </Panel>
        <Panel title={`Categories (${form.subcategoryIds.length} chosen)`} sub="Required. Vendors registered in these subcategories see the RFQ once it is published.">
          <div className="px-stack">
            <SearchField label="Find a subcategory" value={catQ} onChange={setCatQ} placeholder="Name or code" />
            <div className="px-checklist" role="group" aria-label="RFQ subcategories">
              {subs.status === "loading" ? (
                <span className="px-muted" style={{ padding: "8px 0" }}>Loading categories…</span>
              ) : subs.status === "failed" ? (
                <span className="px-muted" style={{ padding: "8px 0" }}>Categories didn't load. Refresh the page to try again.</span>
              ) : shown.length ? (
                shown.map((o) => (
                  <label key={o.value} className="px-check">
                    <input type="checkbox" checked={form.subcategoryIds.includes(o.value)} onChange={() => toggleSub(o.value)} disabled={locked} />
                    {o.label}
                  </label>
                ))
              ) : (
                <span className="px-muted" style={{ padding: "8px 0" }}>No subcategories match.</span>
              )}
            </div>
          </div>
        </Panel>
        <Panel title="Attachments" sub="Links to specifications, BOQs or reference documents. Shown to vendors once published." action={locked ? null : <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, attachments: [...f.attachments, { name: "", url: "" }] }))}><Plus size={14} aria-hidden="true" />Add link</Button>}>
          {form.attachments.length ? (
            <div className="px-stack">
              {form.attachments.map((a, i) => (
                <div key={i} className="px-form-grid px-form-grid--2" style={{ alignItems: "end" }}>
                  <TextField label={`Link ${i + 1} name`} value={a.name} onChange={(e) => setAttachment(i, { name: e.target.value })} disabled={locked} />
                  <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <TextField label={`Link ${i + 1} address`} value={a.url} onChange={(e) => setAttachment(i, { url: e.target.value })} placeholder="https://" disabled={locked} />
                    </div>
                    {locked ? null : (
                      <Button variant="ghost" aria-label={`Remove link ${i + 1}`} onClick={() => setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))}>
                        <X size={14} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-muted" style={{ margin: 0 }}>No attachments. Links without an address are not saved.</p>
          )}
        </Panel>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button variant="outline" onClick={() => nav(isEdit ? `/portal/procurement/rfqs/${id}` : "/portal/procurement/rfqs")} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={!canSave || saving}>
            <Save size={14} aria-hidden="true" />
            {saving ? "Saving…" : isEdit ? "Save RFQ" : "Create draft RFQ"}
          </Button>
        </div>
      </form>
    </PageFrame>
  );
}
