import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
];

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "campaign", label: "Campaign" },
  { value: "other", label: "Other" },
];

export default function LeadFormModal({
  open,
  mode = "create",
  initial = null,
  busy = false,
  onClose,
  onSubmit,
}) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("manual");
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setFullName(initial?.fullName || "");
    setCompanyName(initial?.companyName || "");
    setEmail(initial?.email || "");
    setPhone(initial?.phone || "");
    setSource(initial?.source || "manual");
    setStatus(initial?.status || "new");
    setNotes(initial?.notes || "");
  }, [open, initial]);

  const canSubmit = useMemo(() => fullName.trim().length >= 2, [fullName]);

  if (!open) return null;

  const title = mode === "edit" ? "Edit lead" : "New lead";
  const subtitle =
    mode === "edit"
      ? "Update the lead details and qualification status."
      : "Add a new opportunity into the CRM pipeline.";

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onSubmit?.({
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      source,
      status,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden p-0">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-xl font-black text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="FULL NAME"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Lead name"
            />

            <Input
              label="COMPANY"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />

            <Input
              label="PHONE"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                SOURCE
              </span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {SOURCE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                STATUS
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              NOTES
            </span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              placeholder="Context, requirement, source details, urgency..."
            />
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-5">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={busy || !canSubmit}>
              {busy
                ? "Saving..."
                : mode === "edit"
                ? "Save changes"
                : "Create lead"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
