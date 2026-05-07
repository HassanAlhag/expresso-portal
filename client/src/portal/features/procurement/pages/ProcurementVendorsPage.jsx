import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { listVendors, createVendor, updateVendor, deleteVendor, listCategories } from "../api";
import {
  Building2,
  Plus,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  Pencil,
  Trash2,
  X,
  MapPin,
  Users,
  Tag,
} from "lucide-react";

const BRAND = "#6F7FD9";


// ── Vendor Modal ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", website: "", email: "", phone: "",
  contactPerson: "", country: "", notes: "", isActive: true,
  categories: [],
};

function VendorModal({ open, onClose, onSubmit, busy, initial }) {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? {
      name:          initial.name || "",
      website:       initial.website || "",
      email:         initial.email || "",
      phone:         initial.phone || "",
      contactPerson: initial.contactPerson || "",
      country:       initial.country || "",
      notes:         initial.notes || "",
      isActive:      initial.isActive !== false,
      categories:    Array.isArray(initial.categories)
        ? initial.categories.map(c => (typeof c === "object" ? c._id : c))
        : [],
    } : EMPTY_FORM);

    let ignore = false;
    setLoadingCats(true);
    listCategories({ limit: 100 })
      .then(res => { if (!ignore) setCategories(Array.isArray(res?.items) ? res.items : []); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingCats(false); });
    return () => { ignore = true; };
  }, [open, initial]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }));

  const toggleCategory = (catId) => {
    setForm(f => {
      const has = f.categories.includes(catId);
      return { ...f, categories: has ? f.categories.filter(c => c !== catId) : [...f.categories, catId] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  if (!open) return null;

  const isEdit = Boolean(initial);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">{isEdit ? "Edit Vendor" : "New Vendor"}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{isEdit ? "Update vendor details." : "Add a new vendor to your directory."}</p>
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
          <form id="vendor-form" onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="NAME *" value={form.name} onChange={set("name")} placeholder="Vendor name" required />
              <Input label="CONTACT PERSON" value={form.contactPerson} onChange={set("contactPerson")} placeholder="Full name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="EMAIL" type="email" value={form.email} onChange={set("email")} placeholder="vendor@example.com" />
              <Input label="PHONE" value={form.phone} onChange={set("phone")} placeholder="+971 50 000 0000" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="WEBSITE" value={form.website} onChange={set("website")} placeholder="https://..." />
              <Input label="COUNTRY" value={form.country} onChange={set("country")} placeholder="UAE" />
            </div>

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">NOTES</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Any internal notes about this vendor..."
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            {/* Categories multi-select */}
            <div>
              <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">CATEGORIES</div>
              {loadingCats ? (
                <div className="grid gap-2 grid-cols-2">
                  {[0,1,2,3].map(i => <Skeleton key={i} className="h-9 w-full" />)}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-slate-400">No categories available.</p>
              ) : (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {categories.map(cat => {
                    const selected = form.categories.includes(cat._id);
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCategory(cat._id)}
                        className={[
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition text-left",
                          selected
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className={["h-2 w-2 rounded-full shrink-0", selected ? "bg-indigo-500" : "bg-slate-300"].join(" ")} />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={setCheck("isActive")}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm font-semibold text-slate-700">Active vendor</span>
            </label>
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            type="submit"
            form="vendor-form"
            disabled={busy || !form.name.trim()}
            loading={busy}
            style={{ backgroundColor: BRAND }}
          >
            {isEdit ? "Save Changes" : "Create Vendor"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProcurementVendorsPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendors({ limit: 200 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load vendors.";
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
        await updateVendor(editing._id, payload);
        toast.success("Vendor updated.");
      } else {
        await createVendor(payload);
        toast.success("Vendor created.");
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

  const handleToggleActive = async (vendor) => {
    try {
      await updateVendor(vendor._id, { isActive: !vendor.isActive });
      setItems(prev => prev.map(v => v._id === vendor._id ? { ...v, isActive: !v.isActive } : v));
      toast.success(vendor.isActive ? "Vendor deactivated." : "Vendor activated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Toggle failed.");
    }
  };

  const handleDelete = (vendor) => {
    setConfirm({
      title: "Delete Vendor",
      message: `Delete vendor "${vendor.name}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteVendor(vendor._id);
          setItems(prev => prev.filter(v => v._id !== vendor._id));
          toast.success("Vendor deleted.");
        } catch (e) {
          toast.error(e?.response?.data?.message || "Delete failed.");
        } finally {
          setBusy(false);
          setConfirm(null);
        }
      },
    });
  };

  const stats = useMemo(() => {
    const active = items.filter(v => v.isActive !== false).length;
    const catSet = new Set(
      items.flatMap(v =>
        Array.isArray(v.categories)
          ? v.categories.map(c => (typeof c === "object" ? c._id : c))
          : []
      )
    );
    return { total: items.length, active, categories: catSet.size };
  }, [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="PROCUREMENT"
        title="Vendor Directory"
        subtitle="Manage all procurement vendors and their details."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "Vendors" },
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
              New Vendor
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "TOTAL VENDORS",      value: stats.total,      icon: Building2 },
          { label: "ACTIVE",             value: stats.active,     icon: Users },
          { label: "CATEGORIES COVERED", value: stats.categories, icon: Tag },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">{s.label}</div>
                  <div className="mt-1.5 text-3xl font-black text-slate-900">{loading ? "—" : s.value}</div>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/5 bg-[rgba(111,127,217,0.10)]">
                  <Icon size={18} className="text-slate-700" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
      )}

      {/* Vendor grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0,1,2,3,4,5].map(i => (
            <Card key={i} className="p-5">
              <div className="grid gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No vendors yet"
          message="Add your first vendor to start building your procurement directory."
          actionLabel="New Vendor"
          onAction={() => { setEditing(null); setModalOpen(true); }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(vendor => {
            const cats = Array.isArray(vendor.categories) ? vendor.categories : [];
            const visibleCats = cats.slice(0, 3);
            const extraCount  = cats.length - 3;

            return (
              <Card key={vendor._id} className="flex flex-col">
                <CardBody className="flex flex-1 flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-black text-slate-900 leading-snug">{vendor.name}</div>
                      {vendor.contactPerson && (
                        <div className="mt-0.5 text-xs text-slate-500">{vendor.contactPerson}</div>
                      )}
                    </div>
                    {vendor.country && (
                      <span className="shrink-0 flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                        <MapPin size={11} />
                        {vendor.country}
                      </span>
                    )}
                  </div>

                  {/* Contact links */}
                  <div className="grid gap-1.5 text-sm">
                    {vendor.email && (
                      <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-slate-600 transition hover:text-indigo-600 truncate">
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{vendor.email}</span>
                      </a>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={13} className="shrink-0 text-slate-400" />
                        {vendor.phone}
                      </div>
                    )}
                    {vendor.website && (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-600 transition hover:text-indigo-600 truncate"
                      >
                        <Globe size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{vendor.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>

                  {/* Category pills */}
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleCats.map(cat => {
                        const catName = typeof cat === "object" ? cat.name : cat;
                        return (
                          <span key={typeof cat === "object" ? cat._id : cat} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            {catName}
                          </span>
                        );
                      })}
                      {extraCount > 0 && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(vendor)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        vendor.isActive !== false
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {vendor.isActive !== false ? "Active" : "Inactive"}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditing(vendor); setModalOpen(true); }}
                        disabled={busy}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(vendor)}
                        disabled={busy}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <VendorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        busy={busy}
        initial={editing}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
