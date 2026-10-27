import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Palette,
  Type,
  Image,
  FileText,
  Layers,
  Star,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Search,
  RefreshCw,
  Copy,
  ExternalLink,
  Link2,
} from "lucide-react";

import {
  listBrandAssets,
  createBrandAsset,
  updateBrandAsset,
  deleteBrandAsset,
} from "../api";
import { listCustomers } from "../../customers/api";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

const BRAND = "#6F7FD9";

const TYPE_ICONS = {
  logo: {
    Icon: Image,
    label: "Logos",
    singular: "Logo",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  color: {
    Icon: Palette,
    label: "Colors",
    singular: "Color",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  font: {
    Icon: Type,
    label: "Fonts",
    singular: "Font",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  guideline: {
    Icon: FileText,
    label: "Guidelines",
    singular: "Guideline",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  template: {
    Icon: Layers,
    label: "Templates",
    singular: "Template",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  icon: {
    Icon: Star,
    label: "Icons",
    singular: "Icon",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

const ASSET_TYPES = Object.keys(TYPE_ICONS);
const EMPTY = {
  type: "color",
  name: "",
  value: "#6F7FD9",
  url: "",
  isPrimary: false,
  notes: "",
};

function assetUrl(asset) {
  return asset?.url || asset?.mediaId?.url || asset?.mediaId?.thumbnailUrl || "";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ColorSwatch({ hex }) {
  if (!hex) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div
        className="h-7 w-7 rounded-lg border border-black/10"
        style={{ backgroundColor: hex }}
      />
      <span className="font-mono text-[12px] font-bold text-slate-600">
        {hex}
      </span>
    </div>
  );
}

function TypeFilterButton({ type, active, count, onClick }) {
  const meta = TYPE_ICONS[type];
  const Icon = meta.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-black/[0.07] bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon size={14} className={active ? "text-indigo-600" : meta.color} />
      {meta.label}
      <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500">
        {count || 0}
      </span>
    </button>
  );
}

function AssetCard({ asset, onCopy, onEdit, onDelete }) {
  const meta = TYPE_ICONS[asset.type] || TYPE_ICONS.logo;
  const Icon = meta.Icon;
  const link = assetUrl(asset);

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${meta.bg}`}>
          <Icon size={18} className={meta.color} />
        </div>
        <div className="flex items-center gap-1.5">
          {asset.isPrimary && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
              <Star size={10} className="fill-amber-500" />
              Primary
            </span>
          )}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              title="Edit asset"
              aria-label={`Edit ${asset.name || "asset"}`}
            >
              <Edit3 size={14} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(asset)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 text-rose-500 transition hover:bg-rose-50"
              title="Delete asset"
              aria-label={`Delete ${asset.name || "asset"}`}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {asset.mediaId?.url ? (
        <img
          src={asset.mediaId.url}
          alt={asset.name}
          className="mb-3 h-20 w-full rounded-xl border border-black/[0.05] bg-slate-50 object-contain"
        />
      ) : null}

      <div className="min-w-0">
        <div className="truncate text-sm font-black text-slate-900">
          {asset.name}
        </div>
        <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {meta.singular}
        </div>
      </div>

      {asset.type === "color" && <ColorSwatch hex={asset.value} />}

      {asset.type === "font" && asset.value ? (
        <div className="mt-2 rounded-xl border border-black/[0.07] bg-slate-50 px-3 py-2">
          <div
            className="truncate text-sm font-black text-slate-800"
            style={{ fontFamily: asset.value }}
          >
            {asset.value}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Aa Bb Cc 123
          </div>
        </div>
      ) : null}

      {link && asset.type !== "color" ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-slate-50 px-3 py-2">
          <Link2 size={13} className="shrink-0 text-slate-400" />
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-[12px] font-bold text-indigo-600 hover:underline"
          >
            {link}
          </a>
        </div>
      ) : null}

      {asset.notes ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
          {asset.notes}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
        <span className="text-[11px] font-bold text-slate-400">
          {formatDate(asset.updatedAt || asset.createdAt)}
        </span>
        <div className="flex items-center gap-1.5">
          {(asset.type === "color" || asset.type === "font") && asset.value ? (
            <button
              type="button"
              onClick={() => onCopy(asset.value)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              title={`Copy ${asset.type}`}
            >
              <Copy size={14} />
            </button>
          ) : null}
          {link ? (
            <>
              <button
                type="button"
                onClick={() => onCopy(link)}
                className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                title="Copy link"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => window.open(link, "_blank")}
                className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.07] text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                title="Open link"
              >
                <ExternalLink size={14} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AssetFormModal({ initial, customerId, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        customerId,
        name: form.name.trim(),
        value: String(form.value || "").trim(),
        url: String(form.url || "").trim(),
        notes: String(form.notes || "").trim(),
      };
      await onSave(payload);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Could not save asset"
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedMeta = TYPE_ICONS[form.type] || TYPE_ICONS.color;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {form._id ? "Edit Brand Asset" : "Add Brand Asset"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedMeta.singular} for this client brand system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((type) => {
                const meta = TYPE_ICONS[type];
                const Icon = meta.Icon;
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("type", type)}
                    className={[
                      "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                      active
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-black/[0.07] bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon
                      size={13}
                      className={active ? "text-indigo-600" : meta.color}
                    />
                    {meta.singular}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Name
            </span>
            <input
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Primary logo, Brand blue, Heading font"
              className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          {form.type === "color" ? (
            <label className="grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Hex Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.value || "#6F7FD9"}
                  onChange={(e) => setField("value", e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
                <input
                  value={form.value}
                  onChange={(e) => setField("value", e.target.value)}
                  placeholder="#6F7FD9"
                  className="h-11 flex-1 rounded-xl border border-slate-200 px-3.5 font-mono text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </label>
          ) : null}

          {form.type === "font" ? (
            <label className="grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Font Family
              </span>
              <input
                value={form.value}
                onChange={(e) => setField("value", e.target.value)}
                placeholder="Inter, Helvetica Neue"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          ) : null}

          {["logo", "guideline", "template", "icon"].includes(form.type) ? (
            <label className="grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                URL / Link
              </span>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://..."
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          ) : null}

          <label className="grid gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Notes
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              placeholder="Usage rules, do-not-use notes, campaign context"
              className="resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[0.07] bg-slate-50 px-4 py-3">
            <span
              className={[
                "grid h-5 w-5 place-items-center rounded-md border transition",
                form.isPrimary
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-slate-300 bg-white",
              ].join(" ")}
            >
              {form.isPrimary ? <Check size={12} className="text-white" /> : null}
            </span>
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setField("isPrimary", e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm font-bold text-slate-700">
              Mark as primary {selectedMeta.singular.toLowerCase()}
            </span>
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} style={{ backgroundColor: BRAND }}>
              {form._id ? "Save changes" : "Add asset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BrandKitPage() {
  const toast = useToast();
  // PI closure: client vs staff view comes from the user's internal flag
  // (as the API decides), not role names. Create, edit and delete all use
  // brand_kit.write on the API (there is no brand_kit.delete).
  const access = useAccess();
  const me = access.user || {};
  const isClient = !access.isInternal;
  const canWrite = access.can("brand_kit.write");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    isClient ? me.clientId || "" : ""
  );
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    if (isClient) return;
    let mounted = true;
    setCustomersLoading(true);
    listCustomers({ limit: 500 })
      .then((res) => {
        if (mounted) setCustomers(res?.items || []);
      })
      .catch((err) => {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to load clients"
        );
      })
      .finally(() => {
        if (mounted) setCustomersLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isClient, toast]);

  const loadAssets = useCallback(async () => {
    if (!selectedCustomerId) {
      setAssets([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await listBrandAssets({ customerId: selectedCustomerId });
      setAssets(res?.items || []);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load brand kit";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, toast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c._id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const counts = useMemo(() => {
    const next = ASSET_TYPES.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {});
    assets.forEach((asset) => {
      if (next[asset.type] !== undefined) next[asset.type] += 1;
    });
    return next;
  }, [assets]);

  const stats = useMemo(() => {
    const primary = assets.filter((asset) => asset.isPrimary).length;
    const linked = assets.filter((asset) => assetUrl(asset)).length;
    return { total: assets.length, primary, linked };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter && asset.type !== typeFilter) return false;
      if (!term) return true;
      return [asset.name, asset.value, asset.url, asset.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [assets, query, typeFilter]);

  const grouped = useMemo(() => {
    return ASSET_TYPES.reduce((acc, type) => {
      acc[type] = filteredAssets.filter((asset) => asset.type === type);
      return acc;
    }, {});
  }, [filteredAssets]);

  const mergeAsset = useCallback((item, wasUpdate) => {
    setAssets((prev) => {
      const base = wasUpdate
        ? prev.map((asset) => (asset._id === item._id ? item : asset))
        : [item, ...prev];
      if (!item.isPrimary) return base;
      return base.map((asset) =>
        asset._id !== item._id && asset.type === item.type
          ? { ...asset, isPrimary: false }
          : asset
      );
    });
  }, []);

  async function handleSave(payload) {
    if (!canWrite) return;
    const isUpdate = Boolean(payload._id);
    const response = isUpdate
      ? await updateBrandAsset(payload._id, payload)
      : await createBrandAsset(payload);
    mergeAsset(response.item, isUpdate);
    setModal(null);
    toast.success(isUpdate ? "Brand asset updated" : "Brand asset added");
  }

  function handleDelete(asset) {
    if (!canWrite) return;
    setConfirmState({
      title: "Delete brand asset",
      message: `Delete "${asset.name}" from the brand kit? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteBrandAsset(asset._id);
          setAssets((prev) => prev.filter((item) => item._id !== asset._id));
          setConfirmState(null);
          toast.success("Brand asset deleted");
        } catch (err) {
          toast.error(
            err?.response?.data?.message || err?.message || "Delete failed"
          );
        }
      },
    });
  }

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  const visibleGroups = ASSET_TYPES.filter((type) => grouped[type].length > 0);
  const clientLabel =
    selectedCustomer?.companyName ||
    selectedCustomer?.contactName ||
    me.companyName ||
    me.clientName ||
    "Selected client";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CORE"
        title="Brand Kit"
        subtitle="Client brand assets, color tokens, fonts, logos, templates, and usage notes."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Brand Kit" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {!isClient ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setQuery("");
                  setTypeFilter("");
                }}
                disabled={customersLoading}
                className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  {customersLoading ? "Loading clients..." : "Select client..."}
                </option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName || customer.contactName}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              variant="outline"
              onClick={loadAssets}
              disabled={!selectedCustomerId || loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            {canWrite ? (
              <Button
                onClick={() => setModal({ initial: null })}
                disabled={!selectedCustomerId}
                style={{ backgroundColor: BRAND }}
              >
                <Plus size={15} />
                Add asset
              </Button>
            ) : null}
          </div>
        }
      />

      {!selectedCustomerId ? (
        <EmptyState
          icon={Palette}
          title="Select a client"
          message="Choose a client to view and manage their brand kit."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Assets", value: stats.total, icon: Layers },
              { label: "Primary", value: stats.primary, icon: Star },
              { label: "Linked", value: stats.linked, icon: Link2 },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums text-slate-900">
                    {value}
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-900">
                  {clientLabel}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {filteredAssets.length} of {assets.length} asset
                  {assets.length === 1 ? "" : "s"} shown
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                <div className="relative min-w-[220px] flex-1 lg:max-w-xs">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="h-10 w-full rounded-xl border border-black/[0.07] bg-white pl-9 pr-9 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("")}
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                  !typeFilter
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-black/[0.07] bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                All
                <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500">
                  {assets.length}
                </span>
              </button>
              {ASSET_TYPES.map((type) => (
                <TypeFilterButton
                  key={type}
                  type={type}
                  active={typeFilter === type}
                  count={counts[type]}
                  onClick={() =>
                    setTypeFilter((current) => (current === type ? "" : type))
                  }
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-black/[0.07] bg-white p-4"
                >
                  <Skeleton className="h-36 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
              {error}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={Palette}
              title="No brand assets yet"
              message={canWrite ? "Add the first color, logo, font, or guideline for this client." : "No colors, logos, fonts or guidelines have been added yet."}
              actionLabel={canWrite ? "Add asset" : undefined}
              onAction={canWrite ? () => setModal({ initial: null }) : undefined}
            />
          ) : filteredAssets.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching assets"
              message="Adjust the search or type filter to see more brand assets."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery("");
                setTypeFilter("");
              }}
            />
          ) : (
            <div className="grid gap-7">
              {visibleGroups.map((type) => {
                const meta = TYPE_ICONS[type];
                const Icon = meta.Icon;
                return (
                  <section key={type} className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-xl ${meta.bg}`}
                      >
                        <Icon size={15} className={meta.color} />
                      </div>
                      <h2 className="text-sm font-black text-slate-800">
                        {meta.label}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        {grouped[type].length}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {grouped[type].map((asset) => (
                        <AssetCard
                          key={asset._id}
                          asset={asset}
                          onCopy={handleCopy}
                          onEdit={canWrite ? (item) => setModal({ initial: item }) : undefined}
                          onDelete={canWrite ? handleDelete : undefined}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {modal && canWrite ? (
        <AssetFormModal
          initial={modal.initial}
          customerId={selectedCustomerId}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        confirmLabel="Delete"
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
