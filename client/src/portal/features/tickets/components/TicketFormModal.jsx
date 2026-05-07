import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import {
  Plus,
  X,
  Headphones,
  RefreshCw,
  Lock,
  ShoppingCart,
} from "lucide-react";
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SLA_OPTIONS,
  TYPE_OPTIONS,
} from "../constants";

const TYPE_ICONS = {
  support: Headphones,
  change_request: RefreshCw,
  internal: Lock,
  procurement: ShoppingCart,
};

const TYPE_DESCRIPTIONS = {
  support: "General support, questions, or bug reports from clients.",
  change_request: "Scope changes or new features requiring approval.",
  internal: "Internal team tasks not visible to clients.",
  procurement: "Vendor purchases, quotes, and purchase orders.",
};

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
    />
  );
}

function NumberInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
    />
  );
}

const INITIAL = {
  type: "support",
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  slaLevel: "standard",
  dueDate: "",
  estimatedHours: "",
  estimatedCost: "",
  vendor: "",
  vendorContact: "",
  budgetAmount: "",
  currency: "USD",
  purchaseOrderRef: "",
  deliveryDate: "",
  tags: "",
};

export default function TicketFormModal({ open, onClose, onSubmit, busy }) {
  const [f, setF] = useState(INITIAL);

  useEffect(() => {
    if (open) setF(INITIAL);
  }, [open]);

  if (!open) return null;

  const set = (key) => (val) => setF((prev) => ({ ...prev, [key]: val }));

  const canSubmit =
    f.title.trim().length >= 3 && f.description.trim().length >= 10;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const tags = f.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit?.({
      type: f.type,
      title: f.title.trim(),
      description: f.description.trim(),
      category: f.category,
      priority: f.priority,
      slaLevel: f.slaLevel,
      dueDate: f.dueDate || null,
      estimatedHours: f.estimatedHours ? Number(f.estimatedHours) : null,
      estimatedCost: f.estimatedCost ? Number(f.estimatedCost) : null,
      vendor: f.vendor || null,
      vendorContact: f.vendorContact || null,
      budgetAmount: f.budgetAmount ? Number(f.budgetAmount) : null,
      currency: f.currency || "USD",
      purchaseOrderRef: f.purchaseOrderRef || null,
      deliveryDate: f.deliveryDate || null,
      tags,
    });
  };

  const TypeIcon = TYPE_ICONS[f.type] || Headphones;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => onClose?.()}
    >
      <div
        className="flex w-[min(760px,96vw)] max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">New Ticket</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Create a request and track it end-to-end.
            </p>
          </div>
          <button
            onClick={() => onClose?.()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid gap-5">
          {/* Type selector */}
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Ticket Type
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPE_OPTIONS.map(({ value, label }) => {
                const Icon = TYPE_ICONS[value];
                const active = f.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("type")(value)}
                    className={[
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-bold transition",
                      active
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {TYPE_DESCRIPTIONS[f.type]}
            </p>
          </div>

          {/* Core fields */}
          <Field label="Title">
            <TextInput
              value={f.title}
              onChange={set("title")}
              placeholder="Short, clear summary of the request"
              disabled={busy}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={f.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Context, links, expected outcome, deadline…"
              rows={4}
              disabled={busy}
              className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category">
              <Select
                value={f.category}
                onChange={set("category")}
                options={CATEGORY_OPTIONS.filter((o) => o.value)}
                disabled={busy}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={f.priority}
                onChange={set("priority")}
                options={PRIORITY_OPTIONS.filter((o) => o.value)}
                disabled={busy}
              />
            </Field>
            <Field label="SLA Level">
              <Select
                value={f.slaLevel}
                onChange={set("slaLevel")}
                options={SLA_OPTIONS}
                disabled={busy}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due Date">
              <input
                type="date"
                value={f.dueDate}
                onChange={(e) => set("dueDate")(e.target.value)}
                disabled={busy}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
              />
            </Field>
            <Field label="Tags (comma-separated)">
              <TextInput
                value={f.tags}
                onChange={set("tags")}
                placeholder="e.g. urgent, client-abc, phase-2"
                disabled={busy}
              />
            </Field>
          </div>

          {/* Change Request extra fields */}
          {f.type === "change_request" && (
            <div className="grid gap-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4 sm:grid-cols-2">
              <p className="col-span-2 text-xs font-bold text-violet-700 uppercase tracking-wider">
                Change Request Details
              </p>
              <Field label="Estimated Hours">
                <NumberInput
                  value={f.estimatedHours}
                  onChange={set("estimatedHours")}
                  placeholder="0"
                  disabled={busy}
                />
              </Field>
              <Field label="Estimated Cost (USD)">
                <NumberInput
                  value={f.estimatedCost}
                  onChange={set("estimatedCost")}
                  placeholder="0.00"
                  disabled={busy}
                />
              </Field>
            </div>
          )}

          {/* Procurement extra fields */}
          {f.type === "procurement" && (
            <div className="grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-2">
              <p className="col-span-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Procurement Details
              </p>
              <Field label="Vendor Name">
                <TextInput
                  value={f.vendor}
                  onChange={set("vendor")}
                  placeholder="Supplier / vendor name"
                  disabled={busy}
                />
              </Field>
              <Field label="Vendor Contact">
                <TextInput
                  value={f.vendorContact}
                  onChange={set("vendorContact")}
                  placeholder="Email or phone"
                  disabled={busy}
                />
              </Field>
              <Field label="Budget Amount">
                <NumberInput
                  value={f.budgetAmount}
                  onChange={set("budgetAmount")}
                  placeholder="0.00"
                  disabled={busy}
                />
              </Field>
              <Field label="Currency">
                <Select
                  value={f.currency}
                  onChange={set("currency")}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" },
                    { value: "SAR", label: "SAR" },
                    { value: "AED", label: "AED" },
                  ]}
                  disabled={busy}
                />
              </Field>
              <Field label="PO Reference">
                <TextInput
                  value={f.purchaseOrderRef}
                  onChange={set("purchaseOrderRef")}
                  placeholder="PO-2026-001"
                  disabled={busy}
                />
              </Field>
              <Field label="Expected Delivery Date">
                <input
                  type="date"
                  value={f.deliveryDate}
                  onChange={(e) => set("deliveryDate")(e.target.value)}
                  disabled={busy}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TypeIcon size={13} />
            <span>{TYPE_DESCRIPTIONS[f.type]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onClose?.()}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={busy || !canSubmit}>
              <Plus size={15} />
              Create ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
