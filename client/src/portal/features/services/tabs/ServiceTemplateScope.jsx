import React, { useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import {
  Plus,
  Trash2,
  Copy,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  PenSquare,
  Pencil,
  Check,
  X,
  Layers3,
  MonitorSmartphone,
} from "lucide-react";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const JOB_TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "post", label: "Post" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "video", label: "Video" },
  { value: "design", label: "Design" },
  { value: "page", label: "Page" },
  { value: "other", label: "Other" },
];

const PHASE_TYPE_OPTIONS = [
  { value: "phase", label: "Phase" },
  { value: "milestone", label: "Milestone" },
  { value: "deliverable_group", label: "Deliverable Group" },
];

const RECURRING_PRESETS = [
  {
    label: "Post",
    icon: PenSquare,
    create: () => createRecurringItem("Feed Posts", "post", 8, "posts", 30),
  },
  {
    label: "Reel",
    icon: Clapperboard,
    create: () => createRecurringItem("Reels", "reel", 4, "reels", 30),
  },
  {
    label: "Story",
    icon: FileText,
    create: () => createRecurringItem("Stories", "story", 12, "stories", 30),
  },
  {
    label: "Video",
    icon: Clapperboard,
    create: () => createRecurringItem("Videos", "video", 2, "videos", 30),
  },
  {
    label: "Design",
    icon: ImageIcon,
    create: () => createRecurringItem("Designs", "design", 4, "designs", 30),
  },
];

const PHASE_PRESETS = [
  {
    label: "Discovery",
    icon: Layers3,
    create: () =>
      createPhase(
        "Discovery",
        "Research, planning, structure, and requirements alignment.",
        1,
        7,
        [
          createPhaseJob("Brief review", "task", 1, "task", 2),
          createPhaseJob("Sitemap / structure", "task", 1, "task", 3),
        ]
      ),
  },
  {
    label: "Design",
    icon: PenSquare,
    create: () =>
      createPhase(
        "Design",
        "Create visual direction and approved designs.",
        2,
        10,
        [
          createPhaseJob("Moodboard / direction", "design", 1, "design", 2),
          createPhaseJob("UI design", "design", 1, "design", 7),
        ]
      ),
  },
  {
    label: "Development",
    icon: MonitorSmartphone,
    create: () =>
      createPhase(
        "Development",
        "Build and implement approved screens or pages.",
        3,
        14,
        [
          createPhaseJob("Frontend build", "page", 1, "page", 7),
          createPhaseJob("Backend integration", "task", 1, "task", 7),
        ]
      ),
  },
];

function createRecurringItem(
  title = "",
  type = "post",
  quantity = 1,
  unit = "items",
  dueDays = 0
) {
  return {
    id: uid(),
    title,
    description: "",
    type,
    quantity,
    unit,
    dueDays,
    required: true,
    checklist: [],
    _saved: false,
  };
}

function createPhaseJob(
  title = "",
  type = "task",
  quantity = 1,
  unit = "items",
  dueDays = 0
) {
  return {
    id: uid(),
    title,
    description: "",
    type,
    quantity,
    unit,
    dueDays,
    required: true,
    checklist: [],
  };
}

function createPhase(
  title = "",
  description = "",
  order = 1,
  dueDays = 0,
  jobs = []
) {
  return {
    id: uid(),
    title,
    description,
    type: "phase",
    order,
    dueDays,
    jobs,
  };
}

function labelize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
      {children}
    </div>
  );
}

function SmallSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
    >
      {options.map((opt) => (
        <option key={`${opt.value}-${opt.label}`} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function PresetButton({ label, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-6">
          <div>
            <div className="text-xl font-black text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function OutputSummaryCard({ item, onEdit, onDuplicate, onDelete }) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-black text-slate-900">
              {item.title || "Untitled output"}
            </div>

            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-slate-600">
              {labelize(item.type).toUpperCase()}
            </span>
          </div>

          <div className="mt-3 text-sm leading-6 text-slate-600">
            {item.description || "No description added."}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            QUANTITY
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {item.quantity ?? 1}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            UNIT
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {item.unit || "items"}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            DUE
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {Number(item.dueDays || 0)} day(s)
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={16} />
          Edit
        </Button>

        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy size={16} />
          Duplicate
        </Button>

        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 size={16} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function OutputEditorRow({ item, onChange, onSave, onDuplicate, onDelete }) {
  const canSave = useMemo(
    () => (item.title || "").trim().length >= 2,
    [item.title]
  );

  return (
    <Card className="p-5">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Input
            label="OUTPUT NAME"
            value={item.title || ""}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="e.g. Instagram Posts"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="grid gap-2">
            <SectionLabel>TYPE</SectionLabel>
            <SmallSelect
              value={item.type || "post"}
              onChange={(e) => onChange({ ...item, type: e.target.value })}
              options={JOB_TYPE_OPTIONS}
            />
          </label>
        </div>

        <div className="lg:col-span-2">
          <Input
            label="QUANTITY"
            type="number"
            value={String(item.quantity ?? 1)}
            onChange={(e) =>
              onChange({
                ...item,
                quantity: Math.max(1, Number(e.target.value || 1)),
              })
            }
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label="UNIT"
            value={item.unit || ""}
            onChange={(e) => onChange({ ...item, unit: e.target.value })}
            placeholder="posts / reels / videos"
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label="DUE DAYS"
            type="number"
            value={String(item.dueDays ?? 0)}
            onChange={(e) =>
              onChange({
                ...item,
                dueDays: Math.max(0, Number(e.target.value || 0)),
              })
            }
          />
        </div>

        <div className="lg:col-span-9">
          <label className="grid gap-2">
            <SectionLabel>DESCRIPTION</SectionLabel>
            <textarea
              rows={2}
              value={item.description || ""}
              onChange={(e) =>
                onChange({ ...item, description: e.target.value })
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              placeholder="Optional note about this output..."
            />
          </label>
        </div>

        <div className="lg:col-span-3 flex items-end justify-end gap-2">
          <Button variant="outline" onClick={onDuplicate}>
            <Copy size={16} />
            Duplicate
          </Button>

          <Button variant="outline" onClick={onDelete}>
            <Trash2 size={16} />
            Delete
          </Button>

          <Button onClick={onSave} disabled={!canSave}>
            <Check size={16} />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PhaseCard({ phase, onEdit, onDuplicate, onDelete }) {
  const jobs = Array.isArray(phase?.jobs) ? phase.jobs : [];

  return (
    <Card className="p-5 transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-black text-slate-900">
              {phase.title || "Untitled phase"}
            </div>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
              {labelize(phase.type || "phase")}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
              Due in {phase.dueDays || 0} days
            </span>
          </div>

          {phase.description ? (
            <div className="mt-3 text-sm text-slate-600">
              {phase.description}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil size={16} />
            Edit
          </Button>
          <Button variant="outline" onClick={onDuplicate}>
            <Copy size={16} />
            Duplicate
          </Button>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      {jobs.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-black text-slate-900">
                  {job.title || "Untitled job"}
                </div>

                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                  {labelize(job.type)}
                </span>

                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                  {job.quantity || 1} {job.unit || "items"}
                </span>
              </div>

              {job.description ? (
                <div className="mt-2 text-sm text-slate-600">
                  {job.description}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function PhaseEditorModal({ initial, onClose, onSubmit }) {
  const [phase, setPhase] = useState(
    initial || {
      id: uid(),
      title: "",
      description: "",
      type: "phase",
      order: 1,
      dueDays: 0,
      jobs: [],
    }
  );

  const jobs = Array.isArray(phase.jobs) ? phase.jobs : [];
  const canSave = (phase.title || "").trim().length >= 2;

  const addJob = () => {
    setPhase((prev) => ({
      ...prev,
      jobs: [
        ...(Array.isArray(prev.jobs) ? prev.jobs : []),
        createPhaseJob("", "task", 1, "items", 0),
      ],
    }));
  };

  const updateJob = (jobId, patch) => {
    setPhase((prev) => ({
      ...prev,
      jobs: (prev.jobs || []).map((job) =>
        job.id === jobId ? { ...job, ...patch } : job
      ),
    }));
  };

  const deleteJob = (jobId) => {
    setPhase((prev) => ({
      ...prev,
      jobs: (prev.jobs || []).filter((job) => job.id !== jobId),
    }));
  };

  return (
    <ModalShell
      title={initial ? "Edit phase" : "Add phase"}
      subtitle="Create a clean phase, then add the jobs inside it."
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Input
              label="PHASE NAME"
              value={phase.title || ""}
              onChange={(e) =>
                setPhase((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Design"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="grid gap-2">
              <SectionLabel>TYPE</SectionLabel>
              <SmallSelect
                value={phase.type || "phase"}
                onChange={(e) =>
                  setPhase((prev) => ({ ...prev, type: e.target.value }))
                }
                options={PHASE_TYPE_OPTIONS}
              />
            </label>
          </div>

          <div className="lg:col-span-2">
            <Input
              label="ORDER"
              type="number"
              value={String(phase.order ?? 1)}
              onChange={(e) =>
                setPhase((prev) => ({
                  ...prev,
                  order: Math.max(1, Number(e.target.value || 1)),
                }))
              }
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              label="DUE DAYS"
              type="number"
              value={String(phase.dueDays ?? 0)}
              onChange={(e) =>
                setPhase((prev) => ({
                  ...prev,
                  dueDays: Math.max(0, Number(e.target.value || 0)),
                }))
              }
            />
          </div>
        </div>

        <label className="grid gap-2">
          <SectionLabel>DESCRIPTION</SectionLabel>
          <textarea
            rows={3}
            value={phase.description || ""}
            onChange={(e) =>
              setPhase((prev) => ({ ...prev, description: e.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            placeholder="Optional phase description..."
          />
        </label>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-black text-slate-900">Jobs</div>
            <div className="mt-1 text-sm text-slate-600">
              Add the work items that belong to this phase.
            </div>
          </div>

          <Button onClick={addJob}>
            <Plus size={16} />
            Add job
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-5">
            <div className="text-sm text-slate-600">No jobs added yet.</div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="p-5">
                <div className="grid gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <Input
                      label="JOB NAME"
                      value={job.title || ""}
                      onChange={(e) =>
                        updateJob(job.id, { title: e.target.value })
                      }
                      placeholder="e.g. Home page design"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="grid gap-2">
                      <SectionLabel>TYPE</SectionLabel>
                      <SmallSelect
                        value={job.type || "task"}
                        onChange={(e) =>
                          updateJob(job.id, { type: e.target.value })
                        }
                        options={JOB_TYPE_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="QUANTITY"
                      type="number"
                      value={String(job.quantity ?? 1)}
                      onChange={(e) =>
                        updateJob(job.id, {
                          quantity: Math.max(1, Number(e.target.value || 1)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="UNIT"
                      value={job.unit || ""}
                      onChange={(e) =>
                        updateJob(job.id, { unit: e.target.value })
                      }
                      placeholder="pages / items / designs"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="DUE DAYS"
                      type="number"
                      value={String(job.dueDays ?? 0)}
                      onChange={(e) =>
                        updateJob(job.id, {
                          dueDays: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-10">
                    <label className="grid gap-2">
                      <SectionLabel>DESCRIPTION</SectionLabel>
                      <textarea
                        rows={2}
                        value={job.description || ""}
                        onChange={(e) =>
                          updateJob(job.id, { description: e.target.value })
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                        placeholder="Optional note about this job..."
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2 flex items-end justify-end">
                    <Button variant="outline" onClick={() => deleteJob(job.id)}>
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() =>
              onSubmit({
                ...phase,
                title: phase.title.trim(),
                jobs: (phase.jobs || []).filter((job) =>
                  String(job.title || "").trim()
                ),
              })
            }
            disabled={!canSave}
          >
            <Check size={16} />
            Save phase
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function ServiceTemplateScope({
  value = [],
  onChange,
  executionMode = "recurring",
}) {
  const groups = Array.isArray(value) ? value : [];
  const isRecurring = executionMode === "recurring";

  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  const setGroups = (next) => onChange?.(next);

  if (isRecurring) {
    const recurringGroup = groups[0] || {
      id: uid(),
      title: "Monthly Outputs",
      description: "",
      type: "deliverable_group",
      order: 1,
      dueDays: 0,
      jobs: [],
    };

    const jobs = Array.isArray(recurringGroup.jobs)
      ? recurringGroup.jobs.map((job) => ({
          ...job,
          _saved: job?._saved !== false,
        }))
      : [];

    const updateJobs = (nextJobs) => {
      setGroups([
        {
          ...recurringGroup,
          jobs: nextJobs,
        },
      ]);
    };

    const addItem = (item = null) => {
      updateJobs([...jobs, item || createRecurringItem()]);
    };

    const updateItem = (jobId, nextJob) => {
      updateJobs(jobs.map((job) => (job.id === jobId ? nextJob : job)));
    };

    const saveItem = (jobId) => {
      updateJobs(
        jobs.map((job) => (job.id === jobId ? { ...job, _saved: true } : job))
      );
    };

    const editItem = (jobId) => {
      updateJobs(
        jobs.map((job) => (job.id === jobId ? { ...job, _saved: false } : job))
      );
    };

    const duplicateItem = (job) => {
      updateJobs([
        ...jobs,
        {
          ...job,
          id: uid(),
          _saved: false,
        },
      ]);
    };

    const deleteItem = (jobId) => {
      updateJobs(jobs.filter((job) => job.id !== jobId));
    };

    return (
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-black text-slate-900">
                Monthly Outputs
              </div>
              <div className="mt-1 text-sm text-slate-600">
                For social media and recurring retainers, just add what you
                sell: posts, reels, stories, videos, designs, reports.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {RECURRING_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  label={preset.label}
                  Icon={preset.icon}
                  onClick={() => addItem(preset.create())}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => addItem()}>
              <Plus size={16} />
              Add custom output
            </Button>
          </div>
        </Card>

        {jobs.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-slate-600">
              No outputs yet. Add posts, reels, stories, videos, or any custom
              recurring output.
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) =>
              job._saved ? (
                <OutputSummaryCard
                  key={job.id}
                  item={job}
                  onEdit={() => editItem(job.id)}
                  onDuplicate={() => duplicateItem(job)}
                  onDelete={() => deleteItem(job.id)}
                />
              ) : (
                <OutputEditorRow
                  key={job.id}
                  item={job}
                  onChange={(next) => updateItem(job.id, next)}
                  onSave={() => saveItem(job.id)}
                  onDuplicate={() => duplicateItem(job)}
                  onDelete={() => deleteItem(job.id)}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  const phases = groups;

  const addPhase = (phase) => {
    setGroups([...phases, phase]);
  };

  const updatePhase = (phaseId, nextPhase) => {
    setGroups(
      phases.map((phase) => (phase.id === phaseId ? nextPhase : phase))
    );
  };

  const deletePhase = (phaseId) => {
    setGroups(phases.filter((phase) => phase.id !== phaseId));
  };

  const duplicatePhase = (phase) => {
    setGroups([
      ...phases,
      {
        ...phase,
        id: uid(),
        title: `${phase.title || "Phase"} Copy`,
        jobs: Array.isArray(phase.jobs)
          ? phase.jobs.map((job) => ({ ...job, id: uid() }))
          : [],
      },
    ]);
  };

  return (
    <>
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-black text-slate-900">
                Phases & Jobs
              </div>
              <div className="mt-1 text-sm text-slate-600">
                For websites, branding, apps, and one-time projects, create the
                phases first, then the jobs inside each phase.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PHASE_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  label={preset.label}
                  Icon={preset.icon}
                  onClick={() => addPhase(preset.create())}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                setEditingPhase(null);
                setPhaseModalOpen(true);
              }}
            >
              <Plus size={16} />
              Add phase
            </Button>
          </div>
        </Card>

        {phases.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-slate-600">
              No phases yet. Add phases like Discovery, Design, Development, QA,
              or Launch.
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onEdit={() => {
                  setEditingPhase(phase);
                  setPhaseModalOpen(true);
                }}
                onDuplicate={() => duplicatePhase(phase)}
                onDelete={() => deletePhase(phase.id)}
              />
            ))}
          </div>
        )}
      </div>

      {phaseModalOpen ? (
        <PhaseEditorModal
          initial={editingPhase}
          onClose={() => {
            setPhaseModalOpen(false);
            setEditingPhase(null);
          }}
          onSubmit={(phase) => {
            if (editingPhase?.id) {
              updatePhase(editingPhase.id, phase);
            } else {
              addPhase(phase);
            }
            setPhaseModalOpen(false);
            setEditingPhase(null);
          }}
        />
      ) : null}
    </>
  );
}
