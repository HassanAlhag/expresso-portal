// client/src/portal/features/services/tabs/ServiceTemplateApprovals.jsx
import React, { useEffect, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import {
  Plus,
  Trash2,
  ListChecks,
  GripVertical,
  Info,
  Zap,
} from "lucide-react";
import { listRoles } from "../../iam/roles/api";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// ── System role keys that always make sense as approvers ──────────────────────
const FALLBACK_ROLES = [
  { key: "client",             label: "Client" },
  { key: "client_admin",       label: "Client admin" },
  { key: "admin",              label: "Admin" },
  { key: "super_admin",        label: "Super admin" },
  { key: "operations_manager", label: "Operations manager" },
  { key: "project_manager",    label: "Project manager" },
  { key: "finance",            label: "Finance" },
  { key: "hr_management",      label: "HR management" },
  { key: "staff",              label: "Staff" },
];

// ── Quick-start templates ─────────────────────────────────────────────────────
const QUICK_TEMPLATES = [
  {
    label: "Standard (Internal → Client)",
    steps: [
      { title: "Internal review",  role: "staff",  required: true, instructions: "Check quality, brand guidelines, and captions before sending to client." },
      { title: "Client approval",  role: "client", required: true, instructions: "Review deliverable and approve or request changes." },
    ],
    checklist: [
      "Brand guidelines followed",
      "Captions reviewed and corrected",
      "Legal text included",
      "All assets are high resolution",
    ],
  },
  {
    label: "Production (Internal → Manager → Client)",
    steps: [
      { title: "Internal QA",       role: "staff",              required: true,  instructions: "Verify edit quality, audio, and visuals." },
      { title: "Manager sign-off",  role: "operations_manager", required: true,  instructions: "Approve before sending to client." },
      { title: "Client approval",   role: "client",             required: true,  instructions: "Final approval from client." },
    ],
    checklist: [
      "Video exported in correct format",
      "Audio levels checked",
      "Subtitles/captions added",
      "Brand colors and logo placement verified",
      "Client approved script used",
    ],
  },
  {
    label: "Design only (Internal)",
    steps: [
      { title: "Design review", role: "project_manager", required: true, instructions: "Verify design matches brief and brand kit." },
    ],
    checklist: [
      "Fonts are brand-approved",
      "Colors match brand palette",
      "Correct dimensions for all platforms",
    ],
  },
];

// ── RoleSelect component ──────────────────────────────────────────────────────
function RoleSelect({ value, onChange, roles }) {
  const known = roles.find((r) => r.key === value);
  return (
    <label className="grid gap-1.5">
      <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
        Approver role
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-black/5"
      >
        <option value="">Select role…</option>
        {roles.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
        {/* If saved value not in fetched list, keep it visible */}
        {value && !known && (
          <option value={value}>{value}</option>
        )}
      </select>
    </label>
  );
}

// ── Suggestion chips for checklist ───────────────────────────────────────────
const CHECKLIST_SUGGESTIONS = [
  "Brand guidelines followed",
  "Legal text included",
  "Client approved captions",
  "All assets are high resolution",
  "Correct file format",
  "Spelling and grammar checked",
  "Platform dimensions correct",
  "Audio levels checked",
  "Subtitles added",
  "Logo placement verified",
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ServiceTemplateApprovals({ value, onChange }) {
  const v = value || { required: true, steps: [], checklist: [] };
  const [roles, setRoles] = useState(FALLBACK_ROLES);

  useEffect(() => {
    listRoles()
      .then((res) => {
        const fetched = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        if (fetched.length > 0) {
          setRoles(
            fetched.map((r) => ({ key: r.key || r._id, label: r.label || r.name || r.key }))
          );
        }
      })
      .catch(() => {}); // keep fallback on error
  }, []);

  const set = (patch) => onChange({ ...v, ...patch });

  const addStep = () =>
    set({
      steps: [
        ...(v.steps || []),
        { id: uid(), title: "", role: "client", required: true, instructions: "" },
      ],
    });

  const updateStep = (id, patch) =>
    set({ steps: (v.steps || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const removeStep = (id) =>
    set({ steps: (v.steps || []).filter((s) => s.id !== id) });

  const addCheck = (text = "") =>
    set({ checklist: [...(v.checklist || []), { id: uid(), text, required: true }] });

  const updateCheck = (id, patch) =>
    set({ checklist: (v.checklist || []).map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const removeCheck = (id) =>
    set({ checklist: (v.checklist || []).filter((c) => c.id !== id) });

  const applyTemplate = (tpl) => {
    set({
      required: true,
      steps: tpl.steps.map((s) => ({ id: uid(), ...s })),
      checklist: tpl.checklist.map((text) => ({ id: uid(), text, required: true })),
    });
  };

  const existingCheckTexts = new Set((v.checklist || []).map((c) => c.text));

  return (
    <div className="grid gap-4">
      {/* ── What is this section ─────────────────────────────────────────── */}
      <div className="flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
        <div className="text-sm text-indigo-800">
          <span className="font-extrabold">How approvals work: </span>
          Approval steps define <em>who</em> reviews each job/deliverable and in what order. When a job is in progress, staff use the job's communication thread to log "Approve", "Request changes", or notes. The checklist is a quality gate — a list of things the approver should verify before signing off. Steps and checklist appear on the job detail page as guidance.
        </div>
      </div>

      {/* ── Toggle + Quick-start ─────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Approvals</div>
            <div className="mt-1 text-sm text-slate-500">
              Defines who reviews deliverables before delivery.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.02]">
              <input
                type="checkbox"
                checked={v.required !== false}
                onChange={(e) => set({ required: e.target.checked })}
              />
              Approval required
            </label>
            <Button variant="outline" onClick={addStep}>
              <Plus size={14} />
              Add step
            </Button>
          </div>
        </div>

        {/* Quick-start templates */}
        <div className="mt-4 border-t border-black/[0.06] pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
            <Zap size={11} />
            Quick start
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {tpl.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Selecting a quick start replaces the current steps and checklist.
          </div>
        </div>
      </Card>

      {/* ── Approval Steps ───────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Approval steps</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Steps run in order — each represents one sign-off gate.
            </div>
          </div>
          <Button variant="outline" onClick={addStep}>
            <Plus size={14} />
            Add step
          </Button>
        </div>

        {(v.steps || []).length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-400">No steps yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Add steps above or pick a quick-start template.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {(v.steps || []).map((s, idx) => (
              <div
                key={s.id}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                {/* Step header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-slate-300" />
                    <div className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-indigo-700">
                      STEP {idx + 1}
                    </div>
                    {s.required && (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                    onClick={() => removeStep(s.id)}
                    title="Remove step"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Step name + role */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Step name
                    </span>
                    <input
                      value={s.title || s.name || ""}
                      onChange={(e) => updateStep(s.id, { title: e.target.value, name: e.target.value })}
                      placeholder="e.g. Client approval"
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    />
                  </label>
                  <RoleSelect
                    value={s.role || ""}
                    onChange={(val) => updateStep(s.id, { role: val })}
                    roles={roles}
                  />
                </div>

                {/* Required toggle */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    id={`sr-${s.id}`}
                    type="checkbox"
                    checked={s.required !== false}
                    onChange={(e) => updateStep(s.id, { required: e.target.checked })}
                  />
                  <label htmlFor={`sr-${s.id}`} className="text-sm font-semibold text-slate-700">
                    Required — blocks delivery until this step is completed
                  </label>
                </div>

                {/* Instructions */}
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Instructions for approver
                  </span>
                  <textarea
                    rows={2}
                    value={s.instructions || ""}
                    onChange={(e) => updateStep(s.id, { instructions: e.target.value })}
                    className="resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-black/5"
                    placeholder="What the approver should check before signing off…"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Approval Checklist ───────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <ListChecks size={15} />
              Approval checklist
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Quality items the approver must verify before signing off. Shown on every job in this service.
            </div>
          </div>
          <Button variant="outline" onClick={() => addCheck()}>
            <Plus size={14} />
            Add item
          </Button>
        </div>

        {/* Suggestion chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {CHECKLIST_SUGGESTIONS.filter((s) => !existingCheckTexts.has(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addCheck(s)}
              className="rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              + {s}
            </button>
          ))}
        </div>

        {(v.checklist || []).length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
            No checklist items yet. Add items above or click the suggestions.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {(v.checklist || []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-2xl border border-black/[0.07] bg-white px-4 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={c.required !== false}
                  onChange={(e) => updateCheck(c.id, { required: e.target.checked })}
                  title="Mark as required"
                  className="shrink-0"
                />
                <input
                  value={c.text || ""}
                  onChange={(e) => updateCheck(c.id, { text: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                  placeholder="Checklist item…"
                />
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                  onClick={() => removeCheck(c.id)}
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
