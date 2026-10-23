import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Power, RefreshCw, SearchX, Trash2 } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

import { createCategory, deleteCategory, listCategories, updateCategory } from "../api";
import CategoryFormDialog from "../components/CategoryFormDialog";

const LEVEL_LABEL = { 1: "Main", 2: "Category", 3: "Subcategory" };

// Procurement categories (PUI-4, internal, procurement.read; changes need
// procurement.write, deleting needs procurement.delete). The API returns
// every category, so search and filters work on the complete set.
export default function ProcurementCategoriesPage() {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("procurement.write");
  const canDelete = access.can("procurement.delete");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [active, setActive] = useState("");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCategories();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => Object.fromEntries(items.map((c) => [String(c._id), c])), [items]);
  const path = (c) => {
    const parts = [];
    let p = c.parentId ? byId[String(c.parentId?._id || c.parentId)] : null;
    while (p && parts.length < 3) {
      parts.unshift(p.name);
      p = p.parentId ? byId[String(p.parentId?._id || p.parentId)] : null;
    }
    return parts.join(" › ");
  };
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((c) => (!t || [c.name, c.code, c.subtitle].filter(Boolean).join(" ").toLowerCase().includes(t)) && (!level || String(c.level || 1) === level) && (!active || String(c.isActive !== false) === active));
  }, [items, q, level, active]);

  const save = async (payload) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      if (editing?._id) await updateCategory(editing._id, payload);
      else await createCategory(payload);
      toast.success(editing?._id ? "Category updated." : "Category created.");
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The category wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const runPending = async () => {
    const { kind, item } = pending;
    try {
      if (kind === "toggle") await updateCategory(item._id, { isActive: item.isActive === false });
      else await deleteCategory(item._id);
      toast.success(kind === "delete" ? "Category deleted." : item.isActive === false ? "Category activated." : "Category deactivated.");
      setPending(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Try again.");
    }
  };

  let content;
  if (error) content = <ErrorState title="Categories didn't load" message={error} onRetry={load} />;
  else if (!loading && !rows.length)
    content = items.length ? (
      <EmptyState icon={SearchX} title="No categories match" action={<Button variant="outline" onClick={() => { setQ(""); setLevel(""); setActive(""); }}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={FolderTree} title="No categories yet" action={canWrite ? <Button onClick={() => { setFormError(""); setEditing({}); }}><Plus size={14} aria-hidden="true" />New category</Button> : null} />
    );
  else
    content = (
      <table className="px-table px-table--stack" aria-label="Categories" aria-busy={loading || undefined}>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Level</th>
            <th scope="col" className="px-num px-hide-tab">Order</th>
            <th scope="col">Status</th>
            {canWrite || canDelete ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows rows={6} cols={5} label="Loading categories" />
          ) : (
            rows.map((c) => (
              <tr key={c._id}>
                <td className="px-primary">
                  <div className="px-cell-main">
                    <b>{c.name}</b>
                    <span>{[c.code, path(c), c.subtitle].filter(Boolean).join(", ") || "Top level"}</span>
                  </div>
                </td>
                <td data-label="Level">{LEVEL_LABEL[c.level] || "Main"}</td>
                <td data-label="Order" className="px-num px-hide-tab">{c.order ?? 0}</td>
                <td data-label="Status">
                  <Badge tone={c.isActive === false ? "idle" : "ok"} dot>{c.isActive === false ? "Inactive" : "Active"}</Badge>
                </td>
                {canWrite || canDelete ? (
                  <td className="px-actions-cell">
                    <RowActions
                      label={c.name}
                      actions={[
                        canWrite ? { key: "edit", label: "Edit category", icon: Pencil, onSelect: () => { setFormError(""); setEditing(c); } } : null,
                        canWrite ? { key: "toggle", label: c.isActive === false ? "Activate" : "Deactivate", icon: Power, onSelect: () => setPending({ kind: "toggle", item: c }) } : null,
                        canDelete ? { key: "sep", separator: true } : null,
                        canDelete ? { key: "delete", label: "Delete category", icon: Trash2, tone: "muted", onSelect: () => setPending({ kind: "delete", item: c }) } : null,
                      ]}
                    />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

  const p = pending?.item;
  return (
    <>
      <PageFrame
        title="Categories"
        description="What Expresso sources, from main areas down to subcategories. Vendors and RFQs are matched on them."
        breadcrumb={[{ label: "Procurement", to: access.canOpen("/portal/procurement") ? "/portal/procurement" : undefined }, { label: "Categories" }]}
        secondaryActions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => { setFormError(""); setEditing({}); }}><Plus size={14} aria-hidden="true" />New category</Button> : null}
      >
        <Panel flush bare label="Categories" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter categories">
            <SearchField label="Search categories" value={q} onChange={setQ} placeholder="Name, code or subtitle" />
            <SelectField label="Level" value={level} onChange={setLevel} options={[{ value: "", label: "Any level" }, { value: "1", label: "Main" }, { value: "2", label: "Category" }, { value: "3", label: "Subcategory" }]} />
            <SelectField label="Status" value={active} onChange={setActive} options={[{ value: "", label: "Any status" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading categories…" : error ? "Categories unavailable" : `${rows.length} of ${items.length} categor${items.length === 1 ? "y" : "ies"}`}</span>
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? <CategoryFormDialog open={Boolean(editing)} initial={editing?._id ? editing : null} busy={busy} error={formError} onClose={() => setEditing(null)} onSubmit={save} /> : null}
      <ConfirmDialog
        open={Boolean(pending)}
        icon={pending?.kind === "delete" ? Trash2 : Power}
        tone={pending?.kind === "delete" ? "bad" : "warn"}
        danger={pending?.kind === "delete"}
        title={pending?.kind === "delete" ? "Delete this category?" : p?.isActive === false ? "Activate this category?" : "Deactivate this category?"}
        confirmLabel={pending?.kind === "delete" ? "Delete category" : p?.isActive === false ? "Activate" : "Deactivate"}
        details={
          pending?.kind === "delete"
            ? ["The category is deleted permanently. One used by a procurement request can't be deleted.", "Vendors, RFQs, vendor applications and subcategories that point to it are not updated. To retire a category, deactivate it instead."]
            : p?.isActive === false
              ? ["It shows on the public site and in category pickers again."]
              : ["It is hidden from the public site and from category pickers. Records that use it keep it."]
        }
        onClose={() => setPending(null)}
        onConfirm={runPending}
      >
        {p ? `${p.name}.` : ""}
      </ConfirmDialog>
    </>
  );
}
