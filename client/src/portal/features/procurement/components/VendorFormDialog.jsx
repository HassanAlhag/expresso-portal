import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import SearchField from "../../../shared/ui/SearchField";
import { getCategoryTree } from "../api";
import { idOf } from "../format";
import { flattenTree } from "./RequestFormDialog";

const BLANK = { name: "", contactPerson: "", email: "", phone: "", website: "", country: "UAE", notes: "", categories: [], isActive: "true" };

// Vendor form (PUI-4): the same fields as before. A vendor's categories are
// what RFQ matching uses: it sees published RFQs in those categories.
export default function VendorFormDialog({ open, initial, busy, error, onClose, onSubmit }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(BLANK);
  const [cats, setCats] = useState({ status: "loading", items: [] });
  const [catQ, setCatQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setCatQ("");
    setForm(
      initial
        ? {
            ...BLANK,
            ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, initial[k] ?? BLANK[k]])),
            categories: (initial.categories || []).map(idOf),
            isActive: String(initial.isActive !== false),
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

  // Categories already on the vendor stay listed even if no longer active.
  const all = useMemo(() => {
    const extra = (initial?.categories || []).filter((c) => typeof c === "object" && !cats.items.some((i) => i.value === c._id)).map((c) => ({ value: c._id, label: `${c.name} (inactive)` }));
    return [...cats.items, ...extra];
  }, [cats.items, initial]);
  const shown = catQ.trim() ? all.filter((c) => c.label.toLowerCase().includes(catQ.trim().toLowerCase())) : all;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const toggle = (id) => setForm((f) => ({ ...f, categories: f.categories.includes(id) ? f.categories.filter((x) => x !== id) : [...f.categories, id] }));

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit vendor" : "New vendor"}
      onClose={onClose}
      onSubmit={() => onSubmit?.({ ...form, name: form.name.trim(), isActive: form.isActive === "true" })}
      busy={busy}
      error={error}
      canSubmit={Boolean(form.name.trim())}
      submitLabel={isEdit ? "Save changes" : "Create vendor"}
      submitIcon={isEdit ? Pencil : Plus}
    >
      <fieldset className="px-form-section">
        <legend>Vendor</legend>
        <TextField label="Name" required value={form.name} onChange={set("name")} />
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Contact person" value={form.contactPerson} onChange={set("contactPerson")} />
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
          <TextField label="Phone" value={form.phone} onChange={set("phone")} />
          <TextField label="Website" value={form.website} onChange={set("website")} placeholder="https://" />
          <TextField label="Country" value={form.country} onChange={set("country")} />
          <SelectField label="Status" value={form.isActive} onChange={set("isActive")} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>{`Categories (${form.categories.length} chosen)`}</legend>
        <SearchField label="Find a category" value={catQ} onChange={setCatQ} placeholder="Category name" />
        {cats.status === "failed" ? <p className="px-muted" style={{ margin: 0 }}>Categories didn't load. Saving keeps the vendor's current categories.</p> : null}
        <div className="px-checklist" role="group" aria-label="Vendor categories">
          {cats.status === "loading" ? (
            <span className="px-muted" style={{ padding: "8px 0" }}>Loading categories…</span>
          ) : shown.length ? (
            shown.map((c) => (
              <label key={c.value} className="px-check">
                <input type="checkbox" checked={form.categories.includes(c.value)} onChange={() => toggle(c.value)} />
                {c.label}
              </label>
            ))
          ) : (
            <span className="px-muted" style={{ padding: "8px 0" }}>No categories match.</span>
          )}
        </div>
      </fieldset>
      <fieldset className="px-form-section">
        <legend>Notes</legend>
        <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </fieldset>
    </FormDialog>
  );
}
