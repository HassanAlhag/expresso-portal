import React, { useEffect, useState } from "react";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import EmptyState from "../../../shared/ui/EmptyState";
import DataTable from "../../../shared/ui/DataTable";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../api";
import {
  Tag,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const BRAND = "#6F7FD9";

const ICON_META = {
  software:     { label: "Software Licensing",   color: "#6366f1" },
  erp:          { label: "ERP Solution",          color: "#0ea5e9" },
  crm:          { label: "CRM Solution",          color: "#10b981" },
  queue:        { label: "Queue Management",      color: "#f59e0b" },
  iot:          { label: "IoT Solutions",         color: "#8b5cf6" },
  vas:          { label: "VAS Solutions",         color: "#ec4899" },
  cloud:        { label: "Cloud Services",        color: "#14b8a6" },
  hosting:      { label: "Web Hosting & Domains", color: "#3b82f6" },
  datacenter:   { label: "Data Center",           color: "#64748b" },
  consultation: { label: "IT Consultation",       color: "#d97706" },
  networking:   { label: "Networking Hardware",   color: "#7c3aed" },
  hardware:     { label: "Data Center Hardware",  color: "#0f172a" },
};

function IconBadge({ iconKey }) {
  const meta = ICON_META[iconKey];
  if (!meta) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Tag size={16} className="text-slate-400" />
      </div>
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
      style={{ backgroundColor: meta.color }}
      title={meta.label}
    >
      {(iconKey || "").slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Category Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", subtitle: "", description: "",
  icon: "software", order: "", isActive: true,
};

function CategoryModal({ open, onClose, onSubmit, busy, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? {
      name:        initial.name || "",
      subtitle:    initial.subtitle || "",
      description: initial.description || "",
      icon:        initial.icon || "software",
      order:       initial.order ?? "",
      isActive:    initial.isActive !== false,
    } : EMPTY_FORM);
  }, [open, initial]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, order: form.order !== "" ? Number(form.order) : undefined });
  };

  if (!open) return null;

  const isEdit = Boolean(initial);
  const selectedMeta = ICON_META[form.icon];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">{isEdit ? "Edit Category" : "New Category"}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{isEdit ? "Update category details." : "Add a new procurement category."}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="category-form" onSubmit={handleSubmit} className="grid gap-5">
            <Input label="NAME *" value={form.name} onChange={set("name")} placeholder="Category name" required />
            <Input label="SUBTITLE" value={form.subtitle} onChange={set("subtitle")} placeholder="Short tagline" />

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">DESCRIPTION</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Optional description..."
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">ICON</span>
                <select
                  value={form.icon}
                  onChange={set("icon")}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  {Object.entries(ICON_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label} ({key})</option>
                  ))}
                </select>
              </label>
              <Input
                label="DISPLAY ORDER"
                type="number"
                min="0"
                value={form.order}
                onChange={set("order")}
                placeholder="e.g. 1"
              />
            </div>

            {selectedMeta && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <IconBadge iconKey={form.icon} />
                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedMeta.label}</div>
                  <div className="text-xs text-slate-500">Key: {form.icon} · Color: {selectedMeta.color}</div>
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={setCheck("isActive")}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm font-semibold text-slate-700">Active category</span>
            </label>
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            type="submit"
            form="category-form"
            disabled={busy || !form.name.trim()}
            loading={busy}
            style={{ backgroundColor: BRAND }}
          >
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProcurementCategoriesPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCategories({ limit: 200, sort: "order" });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load categories.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await updateCategory(editing._id, payload);
        toast.success("Category updated.");
      } else {
        await createCategory(payload);
        toast.success("Category created.");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Operation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { isActive: !cat.isActive });
      setItems(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
      toast.success(cat.isActive ? "Category deactivated." : "Category activated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Toggle failed.");
    }
  };

  const handleDelete = (cat) => {
    setConfirmState({
      title: "Delete Category",
      message: `Delete category "${cat.name}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteCategory(cat._id);
          setItems(prev => prev.filter(c => c._id !== cat._id));
          toast.success("Category deleted.");
        } catch (e) {
          toast.error(e?.response?.data?.message || "Delete failed.");
        } finally {
          setBusy(false);
          setConfirmState(null);
        }
      },
    });
  };

  const columns = [
    {
      key: "order",
      label: "#",
      align: "center",
      render: (row, i) => (
        <span className="text-xs font-black text-slate-400">{row.order ?? i + 1}</span>
      ),
    },
    {
      key: "name",
      label: "CATEGORY",
      render: (row) => (
        <div className="flex items-center gap-3">
          <IconBadge iconKey={row.icon} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900">{row.name}</span>
              {ICON_META[row.icon] && (
                <span className="text-xs font-bold text-slate-400">({row.icon})</span>
              )}
            </div>
            {row.subtitle && (
              <div className="mt-0.5 truncate text-xs text-slate-500">{row.subtitle}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "STATUS",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          className={[
            "rounded-full border px-3 py-1 text-xs font-bold transition",
            row.isActive !== false
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
          ].join(" ")}
        >
          {row.isActive !== false ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      align: "right",
      stopPropagation: true,
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditing(row); setModalOpen(true); }}
            disabled={busy}
          >
            <Pencil size={13} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row)}
            disabled={busy}
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="PROCUREMENT"
        title="Categories"
        subtitle="Manage procurement categories for organizing requests."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "Categories" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              style={{ backgroundColor: BRAND }}
              disabled={busy}
            >
              <Plus size={15} />
              New Category
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        title="All Categories"
        hint={loading ? "Loading…" : `${items.length} categor${items.length === 1 ? "y" : "ies"}`}
        empty={
          <EmptyState
            icon={Tag}
            title="No categories yet"
            message="Create your first procurement category to organize requests."
            actionLabel="New Category"
            onAction={() => { setEditing(null); setModalOpen(true); }}
          />
        }
      />

      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        busy={busy}
        initial={editing}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
