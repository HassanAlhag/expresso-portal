import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import CustomerSelect from "./CustomerSelect";
import { BRAND } from "../constants";
import { Plus } from "lucide-react";

const PROJECT_MODE_OPTIONS = [
  { value: "custom", label: "Custom" },
  { value: "pre_contract", label: "Pre-contract" },
  { value: "contracted", label: "Contracted" },
  { value: "internal", label: "Internal" },
];

const PROJECT_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "sales", label: "Sales" },
  { value: "enrollment", label: "Enrollment" },
  { value: "internal", label: "Internal" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "delivery", label: "Delivery" },
  { value: "campaign", label: "Campaign" },
  { value: "branding", label: "Branding" },
  { value: "website", label: "Website" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

const PROJECT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "in_review", label: "In review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PROJECT_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5 disabled:bg-slate-50 disabled:text-slate-500"
      >
        {options.map((o) => (
          <option key={`${o.value}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function ProjectFormModal({ open, onClose, onSubmit, busy }) {
  const [customer, setCustomer] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [projectMode, setProjectMode] = useState("custom");
  const [source, setSource] = useState("manual");
  const [type, setType] = useState("delivery");
  const [status, setStatus] = useState("draft");
  const [priority, setPriority] = useState("medium");
  const [team, setTeam] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setCustomer(null);
    setName("");
    setCode("");
    setProjectMode("custom");
    setSource("manual");
    setType("delivery");
    setStatus("draft");
    setPriority("medium");
    setTeam("");
    setCurrency("AED");
    setBudget("");
    setStartDate("");
    setEndDate("");
    setTargetLaunchDate("");
    setTags("");
    setDescription("");
    setNotes("");
  }, [open]);

  useEffect(() => {
    if (projectMode === "internal") {
      setSource("internal");
      setCustomer(null);
    } else if (source === "internal") {
      setSource("manual");
    }
  }, [projectMode, source]);

  const isInternal = projectMode === "internal";

  const canSubmit = useMemo(() => {
    if (name.trim().length < 3) return false;
    if (!isInternal && !customer?._id) return false;
    return true;
  }, [name, isInternal, customer]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => onClose?.()}
    >
      <div
        className="w-[min(980px,96vw)] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-black/10 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">
                New Project
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Use projects as the main container for client work, custom work,
                pre-contract work, or internal initiatives.
              </div>
            </div>

            <button
              type="button"
              className="h-11 w-11 rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
              onClick={() => onClose?.()}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="PROJECT MODE"
              value={projectMode}
              onChange={(e) => setProjectMode(e.target.value)}
              options={PROJECT_MODE_OPTIONS}
            />

            <SelectField
              label="SOURCE"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              options={PROJECT_SOURCE_OPTIONS}
              disabled={isInternal}
            />
          </div>

          {!isInternal ? (
            <CustomerSelect value={customer} onChange={setCustomer} />
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This is an internal project. No customer is required.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="PROJECT NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sah Launch Campaign — Q2 2026"
            />

            <Input
              label="CODE"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Optional short code"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="TYPE"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={PROJECT_TYPE_OPTIONS}
            />

            <SelectField
              label="STATUS"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={PROJECT_STATUS_OPTIONS}
            />

            <SelectField
              label="PRIORITY"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PROJECT_PRIORITY_OPTIONS}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              label="TEAM"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Development"
            />

            <Input
              label="CURRENCY"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="AED"
            />

            <Input
              label="BUDGET"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 25000"
            />

            <Input
              label="TAGS"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="branding, urgent, proposal"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="START DATE"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="DUE DATE"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Input
              label="TARGET LAUNCH"
              type="date"
              value={targetLaunchDate}
              onChange={(e) => setTargetLaunchDate(e.target.value)}
            />
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              DESCRIPTION
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              placeholder="What is this project about?"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              INTERNAL NOTES
            </span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
              placeholder="Contract notes, payment terms, key decisions, links..."
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/10 bg-white p-6">
          <Button variant="outline" onClick={() => onClose?.()} disabled={busy}>
            Cancel
          </Button>

          <Button
            disabled={!canSubmit || busy}
            style={{ backgroundColor: BRAND }}
            onClick={() =>
              onSubmit?.({
                customerId: isInternal ? null : customer?._id || null,
                name: name.trim(),
                code: code.trim(),
                projectMode,
                source,
                type,
                status,
                priority,
                team: team.trim(),
                currency: currency.trim() || "AED",
                budget: budget === "" ? null : Number(budget),
                startDate: startDate || null,
                endDate: endDate || null,
                targetLaunchDate: targetLaunchDate || null,
                tags: parseTags(tags),
                description: description.trim(),
                notes: notes.trim(),
              })
            }
          >
            <Plus size={16} />
            Create project
          </Button>
        </div>
      </div>
    </div>
  );
}
