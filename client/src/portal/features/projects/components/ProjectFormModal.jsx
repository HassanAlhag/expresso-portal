import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../../shared/ui/Button";
import IconButton from "../../../shared/ui/IconButton";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import CustomerSelect from "./CustomerSelect";
import { Pencil, Plus, X } from "lucide-react";

const PROJECT_MODE_OPTIONS = [
  { value: "custom", label: "Custom" },
  { value: "pre_contract", label: "Pre-contract" },
  { value: "contracted", label: "Contracted" },
  { value: "internal", label: "Internal" },
];

const PROJECT_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "sales", label: "Sales" },
  { value: "enrollment", label: "Service follow-up" },
  { value: "internal", label: "Internal" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "delivery", label: "Delivery" },
  { value: "website", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "campaign", label: "Campaign" },
  { value: "branding", label: "Branding" },
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

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function fmtDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

export default function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  busy,
  initialCustomer = null,
  initialProject = null,
}) {
  const isEdit = Boolean(initialProject);

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

    if (initialProject) {
      const p = initialProject;
      const resolvedCustomer =
        p.customerId && typeof p.customerId === "object"
          ? p.customerId
          : initialCustomer || null;
      setCustomer(resolvedCustomer);
      setName(p.name || "");
      setCode(p.code || "");
      setProjectMode(p.projectMode || "custom");
      setSource(p.source || "manual");
      setType(p.type || "delivery");
      setStatus(p.status || "draft");
      setPriority(p.priority || "medium");
      setTeam(p.team || "");
      setCurrency(p.currency || "AED");
      setBudget(p.budget != null ? String(p.budget) : "");
      setStartDate(fmtDate(p.startDate));
      setEndDate(fmtDate(p.endDate));
      setTargetLaunchDate(fmtDate(p.targetLaunchDate));
      setTags((p.tags || []).join(", "));
      setDescription(p.description || "");
      setNotes(p.notes || "");
    } else {
      setCustomer(initialCustomer || null);
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
    }
  }, [open, initialCustomer, initialProject]);

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

  const titleId = useId();
  const dialogRef = useRef(null);
  const firstRef = useRef(null);
  const returnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnRef.current = document.activeElement;
    const t = setTimeout(() => firstRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      const el = returnRef.current;
      if (el && el.isConnected && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  // An archived project keeps "Archived" selectable so the form shows its
  // real status; choosing another status brings it back.
  const statusOptions = useMemo(
    () =>
      initialProject?.status === "archived"
        ? [{ value: "archived", label: "Archived" }, ...PROJECT_STATUS_OPTIONS]
        : PROJECT_STATUS_OPTIONS,
    [initialProject?.status]
  );

  if (!open) return null;

  const close = () => {
    if (!busy) onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = [
      ...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []),
    ];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const submit = () =>
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
    });

  const dialog = (
    <div className="px-dialog-scrim px-form-scrim" onMouseDown={close}>
      <div
        ref={dialogRef}
        className="px-dialog px-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="px-form-head">
          <div>
            <h2 id={titleId}>{isEdit ? "Edit project" : "New project"}</h2>
            <p>
              {isEdit
                ? "Update the project details."
                : "Use projects for separate or larger client work. Service contract work stays under enrollments."}
            </p>
          </div>
          <IconButton label="Close" onClick={close} disabled={busy}>
            <X size={18} aria-hidden="true" />
          </IconButton>
        </div>

        <form
          className="px-form-body"
          id={`${titleId}-form`}
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !busy) submit();
          }}
        >
          <fieldset className="px-form-section">
            <legend>Who it's for</legend>
            <div className="px-form-grid px-form-grid--2">
              <SelectField label="Project mode" value={projectMode} onChange={setProjectMode} options={PROJECT_MODE_OPTIONS} />
              <SelectField label="Source" value={source} onChange={setSource} options={PROJECT_SOURCE_OPTIONS} disabled={isInternal} />
            </div>
            {!isInternal ? (
              <CustomerSelect value={customer} onChange={setCustomer} />
            ) : (
              <p className="px-hint" style={{ margin: 0 }}>This is an internal project, so no client is needed.</p>
            )}
          </fieldset>

          <fieldset className="px-form-section">
            <legend>Project</legend>
            <div className="px-form-grid px-form-grid--2">
              <TextField
                ref={firstRef}
                label="Project name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Launch campaign, Q2 2026"
                hint="At least 3 characters."
              />
              <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional short code" />
            </div>
            <div className="px-form-grid px-form-grid--3">
              <SelectField label="Type" value={type} onChange={setType} options={PROJECT_TYPE_OPTIONS} />
              <SelectField label="Status" value={status} onChange={setStatus} options={statusOptions} />
              <SelectField label="Priority" value={priority} onChange={setPriority} options={PROJECT_PRIORITY_OPTIONS} />
            </div>
            <div className="px-form-grid px-form-grid--2">
              <TextField label="Team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="e.g. Development" />
              <TextField
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="branding, proposal"
                hint="Separate tags with commas."
              />
            </div>
          </fieldset>

          <fieldset className="px-form-section">
            <legend>Dates and budget</legend>
            <div className="px-form-grid px-form-grid--3">
              <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <TextField label="Due date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <TextField
                label="Target launch"
                type="date"
                value={targetLaunchDate}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
              />
            </div>
            <div className="px-form-grid px-form-grid--2">
              <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="AED" />
              <TextField
                label="Budget"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
          </fieldset>

          <fieldset className="px-form-section">
            <legend>Notes</legend>
            <TextField
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
            />
            <TextField
              label="Internal notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contract notes, payment terms, key decisions, links"
            />
          </fieldset>
        </form>

        <div className="px-dialog-foot">
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form={`${titleId}-form`} disabled={!canSubmit} loading={busy}>
            {isEdit ? <Pencil size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
}
