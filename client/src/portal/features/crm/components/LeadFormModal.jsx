import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { X } from "lucide-react";
import { listLeadAssignees } from "../api";
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from "../constants";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
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
  const [service, setService] = useState("");
  const [source, setSource] = useState("manual");
  const [status, setStatus] = useState("new");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFullName(initial?.fullName || "");
    setCompanyName(initial?.companyName || "");
    setEmail(initial?.email || "");
    setPhone(initial?.phone || "");
    setService(initial?.service || "");
    setSource(initial?.source || "manual");
    setStatus(initial?.status || "new");
    setOwnerUserId(initial?.ownerUserId?._id || initial?.ownerUserId || "");
    setNotes(initial?.notes || "");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setAssigneesLoading(true);
    listLeadAssignees()
      .then((res) => {
        if (cancelled) return;
        setAssignees(Array.isArray(res?.items) ? res.items : res?.users || []);
      })
      .catch(() => {
        if (!cancelled) setAssignees([]);
      })
      .finally(() => {
        if (!cancelled) setAssigneesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const canSubmit = useMemo(() => fullName.trim().length >= 2, [fullName]);

  if (!open) return null;

  const title = mode === "edit" ? "Edit lead" : "New lead";
  const subtitle =
    mode === "edit"
      ? "Update the lead details and qualification status."
      : "Add a new opportunity into the CRM pipeline.";
  const sourceLocked = mode === "edit" && source === "plan_builder";
  const editableSourceOptions = LEAD_SOURCE_OPTIONS.filter(
    (item) => item.value !== "plan_builder"
  );
  const hasSourceOption = LEAD_SOURCE_OPTIONS.some((item) => item.value === source);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onSubmit?.({
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service: service.trim(),
      source,
      status,
      ownerUserId: ownerUserId || null,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-3xl overflow-hidden p-0">
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

        <form
          onSubmit={handleSubmit}
          className="grid max-h-[calc(92vh-104px)] gap-5 overflow-y-auto px-6 py-6"
        >
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
            <Input
              label="SERVICE"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Website, SEO, Google Ads..."
            />

            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                ASSIGN STAFF
              </span>
              <select
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              >
                <option value="">
                  {assigneesLoading ? "Loading staff..." : "Unassigned"}
                </option>
                {assignees.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.fullName || item.email || "Staff member"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                SOURCE
              </span>
              {sourceLocked ? (
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
                  {leadSourceLabel(source)}
                </div>
              ) : (
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
                >
                  {!hasSourceOption && source && (
                    <option value={source}>{leadSourceLabel(source)}</option>
                  )}
                  {editableSourceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
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
