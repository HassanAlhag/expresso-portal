import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { X } from "lucide-react";
import { BRAND, TYPE_OPTIONS } from "../constants";

export default function ServiceFormModal({
  open,
  mode = "create",
  initial,
  busy,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("service");
  const [status, setStatus] = useState("draft");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initial) {
      setName(initial.name || "");
      setSlug(initial.slug || "");
      setType(initial.type || "service");
      setStatus(initial.status || "draft");
      setPrice(
        typeof initial.price === "number"
          ? String(initial.price)
          : initial.price || ""
      );
      setBillingCycle(initial.billingCycle || "monthly");
      setSummary(initial.summary || "");
    } else {
      setName("");
      setSlug("");
      setType("service");
      setStatus("draft");
      setPrice("");
      setBillingCycle("monthly");
      setSummary("");
    }
  }, [open, mode, initial]);

  if (!open) return null;

  const canSubmit = name.trim().length >= 3;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => onClose?.(false)}
    >
      <div
        className="w-[min(920px,96vw)] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-black/10 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">
                {mode === "edit" ? "Edit service" : "New service"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Quick create for your catalog. Use the Builder later for full
                operational setup.
              </div>
            </div>

            <button
              className="h-11 w-11 rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
              onClick={() => onClose?.(false)}
              title="Close"
            >
              <X className="mx-auto" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Social Media Management"
            />
            <Input
              label="SLUG (optional)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="social-media-management"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                TYPE
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                STATUS
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                BILLING
              </span>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                <option value="monthly">Monthly</option>
                <option value="one_time">One-time</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="PRICE (optional)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 2500"
            />

            <Input
              label="SUMMARY"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short description for listing and scope..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/10 bg-white p-6">
          <Button
            variant="outline"
            onClick={() => onClose?.(false)}
            disabled={busy}
          >
            Cancel
          </Button>

          <Button
            onClick={() =>
              onSubmit?.({
                name: name.trim(),
                slug: slug.trim() || undefined,
                type,
                status,
                billingCycle,
                price: price === "" ? undefined : Number(price),
                summary: summary.trim(),
              })
            }
            disabled={busy || !canSubmit}
            style={{ backgroundColor: BRAND }}
          >
            {mode === "edit" ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
