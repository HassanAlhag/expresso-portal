import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import {
  X,
  CalendarDays,
  ClipboardList,
  Layers3,
  Plus,
  Trash2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function labelize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function cloneGroups(groups = []) {
  return Array.isArray(groups)
    ? groups.map((group, groupIndex) => ({
        id: group?.id || uid(),
        title: group?.title || `Group ${groupIndex + 1}`,
        description: group?.description || "",
        type: group?.type || "deliverable_group",
        order: Number(group?.order ?? groupIndex + 1),
        dueDays: Number(group?.dueDays || 0),
        jobs: Array.isArray(group?.jobs)
          ? group.jobs.map((job, jobIndex) => ({
              id: job?.id || uid(),
              title: job?.title || `Item ${jobIndex + 1}`,
              description: job?.description || "",
              type: job?.type || "task",
              quantity: Number(job?.quantity || 1),
              unit: job?.unit || "items",
              dueDays: Number(job?.dueDays || 0),
              required: job?.required !== false,
              checklist: Array.isArray(job?.checklist) ? job.checklist : [],
            }))
          : [],
      }))
    : [];
}

export default function EditEnrollmentModal({
  open,
  enrollment,
  busy = false,
  onClose,
  onSubmit,
}) {
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open || !enrollment) return;

    setStatus(enrollment?.status || "active");
    setStartDate(safeDate(enrollment?.startDate));
    setEndDate(safeDate(enrollment?.endDate));
    setNotes(enrollment?.notes || "");

    const sourceGroups =
      enrollment?.overrides?.customGroups?.length > 0
        ? enrollment.overrides.customGroups
        : enrollment?.finalScope?.groups || [];

    setGroups(cloneGroups(sourceGroups));
  }, [open, enrollment]);

  const customerName =
    enrollment?.customerId?.companyName ||
    enrollment?.customerId?.contactName ||
    "Client";

  const serviceName = enrollment?.serviceTemplateId?.name || "Enrollment";

  const mode = useMemo(() => {
    return (
      enrollment?.serviceTemplateId?.executionMode ||
      enrollment?.finalScope?.mode ||
      "recurring"
    );
  }, [enrollment]);

  if (!open || !enrollment) return null;

  const updateGroup = (groupId, patch) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group
      )
    );
  };

  const updateJob = (groupId, jobId, patch) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              jobs: (group.jobs || []).map((job) =>
                job.id === jobId ? { ...job, ...patch } : job
              ),
            }
      )
    );
  };

  const addJob = (groupId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              jobs: [
                ...(group.jobs || []),
                {
                  id: uid(),
                  title: "",
                  description: "",
                  type: mode === "recurring" ? "post" : "task",
                  quantity: 1,
                  unit: "items",
                  dueDays: 0,
                  required: true,
                  checklist: [],
                },
              ],
            }
      )
    );
  };

  const removeJob = (groupId, jobId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              jobs: (group.jobs || []).filter((job) => job.id !== jobId),
            }
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedGroups = groups.map((group, groupIndex) => ({
      id: group.id || uid(),
      title: String(group.title || "").trim() || `Group ${groupIndex + 1}`,
      description: String(group.description || "").trim(),
      type: String(group.type || "deliverable_group").trim(),
      order: Number(group.order ?? groupIndex + 1),
      dueDays: Number(group.dueDays || 0),
      jobs: (group.jobs || [])
        .map((job) => ({
          id: job.id || uid(),
          title: String(job.title || "").trim(),
          description: String(job.description || "").trim(),
          type: String(job.type || "task").trim(),
          quantity: Math.max(1, Number(job.quantity || 1)),
          unit: String(job.unit || "items").trim(),
          dueDays: Math.max(0, Number(job.dueDays || 0)),
          required: job.required !== false,
          checklist: Array.isArray(job.checklist) ? job.checklist : [],
        }))
        .filter((job) => job.title),
    }));

    await onSubmit?.({
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes.trim(),
      overrides: {
        notes: notes.trim(),
        customGroups: cleanedGroups,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/30 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <Card className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden p-0">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 shrink-0">
            <div>
              <div className="text-2xl font-black text-slate-900">
                Edit enrolled service
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Update this customer’s service agreement and client-specific
                scope.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                  {customerName}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                  {serviceName}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                  {labelize(mode)}
                </span>
              </div>
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
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.22em] text-slate-500">
                      <ClipboardList size={14} />
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

                  <Input
                    label="START DATE"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />

                  <Input
                    label="END DATE"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-center gap-2">
                    <Layers3 size={18} className="text-slate-500" />
                    <div className="text-base font-black text-slate-900">
                      Client-specific service scope
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Adjust the enrolled service for this client only. These
                    changes should not affect the original service template.
                  </div>

                  <div className="mt-5 grid gap-4">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-[22px] border border-slate-200 bg-white p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <Input
                            label="GROUP TITLE"
                            value={group.title}
                            onChange={(e) =>
                              updateGroup(group.id, { title: e.target.value })
                            }
                          />

                          <Input
                            label="GROUP TYPE"
                            value={group.type}
                            onChange={(e) =>
                              updateGroup(group.id, { type: e.target.value })
                            }
                          />

                          <Input
                            label="GROUP DUE DAYS"
                            type="number"
                            value={String(group.dueDays ?? 0)}
                            onChange={(e) =>
                              updateGroup(group.id, {
                                dueDays: Math.max(
                                  0,
                                  Number(e.target.value || 0)
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="mt-4 grid gap-3">
                          {(group.jobs || []).map((job) => (
                            <div
                              key={job.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="grid gap-3 md:grid-cols-12">
                                <div className="md:col-span-4">
                                  <Input
                                    label="TITLE"
                                    value={job.title}
                                    onChange={(e) =>
                                      updateJob(group.id, job.id, {
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="TYPE"
                                    value={job.type}
                                    onChange={(e) =>
                                      updateJob(group.id, job.id, {
                                        type: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="QUANTITY"
                                    type="number"
                                    value={String(job.quantity ?? 1)}
                                    onChange={(e) =>
                                      updateJob(group.id, job.id, {
                                        quantity: Math.max(
                                          1,
                                          Number(e.target.value || 1)
                                        ),
                                      })
                                    }
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="UNIT"
                                    value={job.unit}
                                    onChange={(e) =>
                                      updateJob(group.id, job.id, {
                                        unit: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Input
                                    label="DUE DAYS"
                                    type="number"
                                    value={String(job.dueDays ?? 0)}
                                    onChange={(e) =>
                                      updateJob(group.id, job.id, {
                                        dueDays: Math.max(
                                          0,
                                          Number(e.target.value || 0)
                                        ),
                                      })
                                    }
                                  />
                                </div>

                                <div className="md:col-span-10">
                                  <label className="grid gap-2">
                                    <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                                      DESCRIPTION
                                    </span>
                                    <textarea
                                      rows={2}
                                      value={job.description || ""}
                                      onChange={(e) =>
                                        updateJob(group.id, job.id, {
                                          description: e.target.value,
                                        })
                                      }
                                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                                      placeholder="Optional job/output description..."
                                    />
                                  </label>
                                </div>

                                <div className="md:col-span-2 flex items-end justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => removeJob(group.id, job.id)}
                                  >
                                    <Trash2 size={16} />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addJob(group.id)}
                          >
                            <Plus size={16} />
                            Add item
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.22em] text-slate-500">
                    <CalendarDays size={14} />
                    NOTES
                  </span>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                    placeholder="Internal notes, billing note, client-specific remark..."
                  />
                </label>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-5">
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>

                <Button type="submit" disabled={busy}>
                  {busy ? "Saving..." : "Save enrolled service"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
