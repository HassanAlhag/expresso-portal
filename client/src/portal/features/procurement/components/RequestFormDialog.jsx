import React, { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import RecordPicker from "../../../shared/ui/RecordPicker";
import { useAccess } from "../../../shared/hooks/useAccess";
import { listCustomers } from "../../customers/api";
import { getCategoryTree } from "../api";
import { PRIORITIES, PRIORITY_LABEL, idOf, options } from "../format";

const BLANK = { customer: null, categoryId: "", title: "", description: "", requirements: "", budget: "", currency: "AED", priority: "normal" };

/** Active categories from the public tree, labelled with their path. */
export function flattenTree(nodes = [], path = []) {
  return nodes.flatMap((n) => {
    const here = [...path, n.name];
    return [{ value: n._id, label: here.join(" › ") }, ...flattenTree(n.children || [], here)];
  });
}

// Procurement request form (PUI-4). Staff pick the client; client users file
// for their own company (the API sets it). Edit mode changes the request's
// own fields only; status, vendor and assignment have their own controls.
export default function RequestFormDialog({ open, initial, busy, error, onClose, onSubmit }) {
  const access = useAccess();
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(BLANK);
  const [cats, setCats] = useState({ status: "loading", items: [] });

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            customer: initial.customerId && typeof initial.customerId === "object" ? initial.customerId : null,
            categoryId: idOf(initial.categoryId),
            title: initial.title || "",
            description: initial.description || "",
            requirements: initial.requirements || "",
            budget: initial.budget ?? "",
            currency: initial.currency || "AED",
            priority: initial.priority || "normal",
          }
        : BLANK
    );
  }, [open, initial]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    getCategoryTree()
      .then((r) => !cancelled && setCats({ status: "ready", items: flattenTree(r?.tree || []) }))
      .catch(() => !cancelled && setCats({ status: "failed", items: [] }));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  // Keep a current category that is no longer active selectable in edit mode.
  const current = initial?.categoryId && typeof initial.categoryId === "object" ? initial.categoryId : null;
  const catOptions = [
    { value: "", label: cats.status === "loading" ? "Loading categories…" : cats.status === "failed" ? "Categories didn't load" : "Choose a category" },
    ...(current && !cats.items.some((c) => c.value === current._id) ? [{ value: current._id, label: current.name }] : []),
    ...cats.items,
  ];
  const needsClient = access.isInternal && !isEdit;

  const submit = () => {
    const payload = {
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description,
      requirements: form.requirements,
      currency: form.currency.trim() || "AED",
      priority: form.priority,
    };
    if (form.budget !== "" && form.budget !== null) payload.budget = Number(form.budget);
    if (needsClient) payload.customerId = idOf(form.customer);
    onSubmit?.(payload);
  };

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit request" : "New procurement request"}
      description={isEdit ? undefined : access.isInternal ? "Logged for a client. It starts as New." : "Sent to Expresso. It starts as New and we'll pick it up from there."}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      canSubmit={Boolean(form.title.trim()) && Boolean(form.categoryId) && (!needsClient || Boolean(form.customer))}
      submitLabel={isEdit ? "Save changes" : "Create request"}
      submitIcon={isEdit ? Pencil : Plus}
    >
      <fieldset className="px-form-section">
        <legend>Request</legend>
        {needsClient ? (
          <RecordPicker label="Client" required value={form.customer} onChange={set("customer")} load={(q) => listCustomers({ q, limit: 20 })} getLabel={(c) => c.companyName || "Client"} getSub={(c) => c.contactName || c.primaryEmail} searchLabel="Search clients" />
        ) : null}
        <TextField label="Title" required value={form.title} onChange={set("title")} />
        <SelectField label="Category" value={form.categoryId} onChange={set("categoryId")} options={catOptions} />
        <SelectField label="Priority" value={form.priority} onChange={set("priority")} options={options(PRIORITIES, PRIORITY_LABEL)} />
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Details</legend>
        <TextField label="Description" multiline rows={3} value={form.description} onChange={set("description")} />
        <TextField label="Requirements" multiline rows={3} value={form.requirements} onChange={set("requirements")} />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Budget" type="number" min="0" inputMode="decimal" value={String(form.budget ?? "")} onChange={set("budget")} hint={access.isInternal ? "Internal: not shown to vendors." : undefined} />
          <TextField label="Currency" value={form.currency} onChange={set("currency")} />
        </div>
      </fieldset>
    </FormDialog>
  );
}
