import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Pencil,
  Users,
  Briefcase,
  Activity,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Star,
  Target,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

import DetailsShell from "../../../shared/ui/DetailsShell";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import SegmentTabs from "../../../shared/ui/SegmentTabs";
import Modal from "../../../shared/ui/Modal";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import StatCard from "../../../shared/ui/StatCard";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import StaffFormModal from "../components/StaffFormModal";
import StaffStatusPill from "../components/StaffStatusPill";
import ExpenseStatusPill from "../components/ExpenseStatusPill";
import ExpenseCategoryBadge from "../components/ExpenseCategoryBadge";
import LeaveStatusPill from "../components/LeaveStatusPill";

import { listJobs } from "../../jobs/api";
import { api } from "../../../shared/api/client";

import {
  getStaff,
  updateStaff,
  listExpenses,
  listLeaves,
  updateStaffSkills,
  addStaffScorecard,
  removeStaffScorecard,
  addStaffLearningGoal,
  updateStaffLearningGoal,
  removeStaffLearningGoal,
  listScorecardTemplates,
  createScorecardTemplate,
  deleteScorecardTemplate,
  getStaffBenchmark,
} from "../api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val) {
  return val || "—";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtSalary(amount, currency) {
  if (!amount) return null;
  return `${currency || "AED"} ${Number(amount).toLocaleString("en-AE")}`;
}

function cap(s) {
  return s
    ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
}

// ── InfoRow: a label/value row inside a card ──────────────────────────────────

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{children}</span>
    </div>
  );
}

// ── CardSection: titled card wrapper ─────────────────────────────────────────

function CardSection({ title, children }) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-3">
        <span className="text-[13px] font-extrabold tracking-tight text-slate-700">
          {title}
        </span>
      </div>
      <div className="grid gap-4 p-5">{children}</div>
    </Card>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const SEGMENT_TABS = [
  { value: "overview",  label: "Overview" },
  { value: "expenses",  label: "Expenses" },
  { value: "leaves",    label: "Leaves" },
  { value: "work",      label: "Assigned Work" },
  { value: "activity",  label: "Activity" },
  { value: "skills",    label: "Skills" },
  { value: "goals",     label: "Goals" },
  { value: "scorecard", label: "Scorecard" },
  { value: "analytics", label: "Analytics" },
];

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ staff }) {
  const salary = fmtSalary(staff.baseSalary, staff.currency);
  const manager = staff.managerStaffId;
  const team = staff.teamId;
  const linkedUser = staff.linkedUserId;

  return (
    <div className="grid gap-4">
      {/* 2-col grid on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="grid gap-4">
          <CardSection title="Personal Info">
            <InfoRow label="Full Name">{fmt(staff.fullName)}</InfoRow>
            <InfoRow label="Email">{fmt(staff.email)}</InfoRow>
            <InfoRow label="Phone">{fmt(staff.phone)}</InfoRow>
          </CardSection>

          <CardSection title="Employment">
            <InfoRow label="Job Title">{fmt(staff.jobTitle)}</InfoRow>
            <InfoRow label="Department">{cap(staff.department)}</InfoRow>
            <InfoRow label="Employment Type">
              {cap(staff.employmentType)}
            </InfoRow>
            <InfoRow label="Joining Date">{fmtDate(staff.joiningDate)}</InfoRow>
            <InfoRow label="Status">
              <StaffStatusPill status={staff.status} />
            </InfoRow>
          </CardSection>
        </div>

        {/* Right column */}
        <div className="grid gap-4">
          <CardSection title="Team & Manager">
            <InfoRow label="Team">
              {team?.label || "Not assigned"}
            </InfoRow>
            <InfoRow label="Manager">
              {manager ? (
                <span>
                  {manager.fullName}
                  {manager.jobTitle ? (
                    <span className="ml-1 text-slate-500">
                      · {manager.jobTitle}
                    </span>
                  ) : null}
                </span>
              ) : (
                "No manager"
              )}
            </InfoRow>
            <InfoRow label="Linked Portal User">
              {linkedUser?.email || "No linked user"}
            </InfoRow>
          </CardSection>

          <CardSection title="Compensation">
            <InfoRow label="Monthly Salary">
              {salary ?? (
                <span className="italic text-slate-400">Confidential</span>
              )}
            </InfoRow>
            <InfoRow label="Currency">{fmt(staff.currency)}</InfoRow>
          </CardSection>
        </div>
      </div>

      {/* Full-width cards */}
      <CardSection title="Emergency Contact">
        {staff.emergencyContactName || staff.emergencyContactPhone ? (
          <>
            <InfoRow label="Name">{fmt(staff.emergencyContactName)}</InfoRow>
            <InfoRow label="Phone">{fmt(staff.emergencyContactPhone)}</InfoRow>
          </>
        ) : (
          <p className="text-sm text-slate-400 italic">Not provided</p>
        )}
      </CardSection>

      <CardSection title="Notes">
        {staff.notes ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {staff.notes}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">No notes</p>
        )}
      </CardSection>
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ staffName }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!staffName) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await listExpenses({
          staffName,
          page: 1,
          limit: 20,
          sort: "-createdAt",
        });
        if (!cancelled) setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        if (!cancelled)
          toast.error(
            e?.response?.data?.message || e?.message || "Failed to load expenses"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffName, toast]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No expenses"
        message="No expense claims found for this staff member."
      />
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Card key={item._id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-black text-slate-900">
                {item.title || "Expense"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {fmtDate(item.expenseDate)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExpenseCategoryBadge category={item.category} />
              <ExpenseStatusPill status={item.status} />
              <span className="text-sm font-black text-slate-900">
                {item.currency || "AED"}{" "}
                {Number(item.amount || 0).toLocaleString("en-AE", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Leaves Tab ────────────────────────────────────────────────────────────────

function LeavesTab({ staffName }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!staffName) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await listLeaves({
          staffName,
          page: 1,
          limit: 20,
          sort: "-createdAt",
        });
        if (!cancelled) setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        if (!cancelled)
          toast.error(
            e?.response?.data?.message || e?.message || "Failed to load leaves"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffName, toast]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No leaves"
        message="No leave requests found for this staff member."
      />
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Card key={item._id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{cap(item.leaveType || item.type)}</Badge>
              </div>
              <div className="mt-1.5 text-sm font-semibold text-slate-700">
                {fmtDate(item.startDate)}
                {item.endDate && item.endDate !== item.startDate ? (
                  <span className="text-slate-400"> → {fmtDate(item.endDate)}</span>
                ) : null}
              </div>
              {item.daysCount != null ? (
                <div className="mt-0.5 text-xs text-slate-500">
                  {item.daysCount} day{item.daysCount !== 1 ? "s" : ""}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <LeaveStatusPill status={item.status} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Assigned Work Tab ─────────────────────────────────────────────────────────

function AssignedWorkTab({ linkedUserId }) {
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const userId = linkedUserId?._id || linkedUserId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listJobs({ assigneeId: userId, limit: 30, sort: "-createdAt" });
        if (!cancelled) setItems(res?.items || []);
      } catch (e) {
        if (!cancelled)
          toast.error(e?.response?.data?.message || e?.message || "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, toast]);

  if (!userId) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No portal user linked"
        message="Link a portal user to this staff record to see assigned jobs."
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No assigned jobs"
        message="Jobs assigned to this staff member will appear here."
      />
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((job) => (
        <Card key={job._id} className="p-4">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => nav(`/portal/jobs/${job._id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-black text-slate-900 hover:underline">
                  {job.title || "Untitled"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  {job.customerId?.companyName && (
                    <span className="font-semibold text-slate-600">
                      {job.customerId.companyName}
                    </span>
                  )}
                  {job.type && (
                    <span>· {String(job.type).replaceAll("_", " ")}</span>
                  )}
                  {job.projectId?.name && (
                    <span className="text-slate-400">· {job.projectId.name}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {fmtDate(job.createdAt)}
                </span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

function StaffActivityTab({ linkedUserId }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const userId = linkedUserId?._id || linkedUserId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${userId}/activity?limit=30`);
        if (!cancelled) setItems(data?.items || []);
      } catch (e) {
        if (!cancelled)
          toast.error(e?.response?.data?.message || e?.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, toast]);

  if (!userId) {
    return (
      <EmptyState
        icon={Activity}
        title="No portal user linked"
        message="Link a portal user to this staff record to see activity history."
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        message="Portal actions by this staff member will appear here."
      />
    );
  }

  return (
    <Card className="p-5">
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100" />
        <div className="grid gap-4 pl-8">
          {items.map((entry, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-5 top-1.5 h-2 w-2 rounded-full border-2 border-indigo-300 bg-white" />
              <div className="text-sm font-semibold text-slate-800 capitalize">
                {String(entry.action || "").replaceAll(".", " · ").replaceAll("_", " ")}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={10} />
                {fmtDate(entry.createdAt)}
                {entry.ip && <span>· {entry.ip}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Skills Tab ────────────────────────────────────────────────────────────────

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const SKILL_LEVEL_TONE = {
  beginner: "neutral",
  intermediate: "info",
  advanced: "success",
  expert: "violet",
};

function SkillsTab({ staff, staffId, onUpdated }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [skills, setSkills] = useState(Array.isArray(staff.skills) ? staff.skills : []);
  const [addName, setAddName] = useState("");
  const [addLevel, setAddLevel] = useState("beginner");

  useEffect(() => {
    setSkills(Array.isArray(staff.skills) ? staff.skills : []);
  }, [staff.skills]);

  const save = async (next) => {
    setBusy(true);
    try {
      const res = await updateStaffSkills(staffId, next);
      setSkills(res.item.skills || []);
      onUpdated(res.item);
      toast.success("Skills updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to save skills.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    const name = addName.trim();
    if (!name) return;
    setAddName("");
    setAddLevel("beginner");
    save([...skills, { name, level: addLevel }]);
  };

  const handleRemove = (idx) => save(skills.filter((_, i) => i !== idx));

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="text-[13px] font-extrabold tracking-tight text-slate-700">
          Skill Matrix
        </span>
        <span className="text-xs text-slate-400">
          {skills.length} skill{skills.length !== 1 ? "s" : ""}
        </span>
      </div>

      {skills.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm italic text-slate-400">
          No skills added yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {skills.map((sk, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-sm font-semibold text-slate-800">{sk.name}</span>
              <div className="flex items-center gap-2">
                <Badge tone={SKILL_LEVEL_TONE[sk.level] || "neutral"}>{sk.level}</Badge>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 px-5 py-3">
        <div className="flex-1 min-w-[140px]">
          <Input
            placeholder="Skill name…"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="w-40">
          <Select
            value={addLevel}
            onChange={setAddLevel}
            options={SKILL_LEVELS.map((l) => ({ value: l, label: cap(l) }))}
          />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={busy || !addName.trim()}>
          <Plus size={13} /> Add
        </Button>
      </div>
    </Card>
  );
}

// ── Goals Tab ─────────────────────────────────────────────────────────────────

const GOAL_STATUS_TONE = { active: "info", completed: "success", on_hold: "warning" };
const GOAL_EMPTY = { title: "", description: "", targetDate: "", status: "active", progress: 0 };

function GoalProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function GoalsTab({ staff, staffId, onUpdated }) {
  const toast = useToast();
  const goals = Array.isArray(staff.learningGoals) ? staff.learningGoals : [];
  const [addOpen, setAddOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(GOAL_EMPTY);
  const [busy, setBusy] = useState(false);

  const setF = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const openAdd  = () => { setForm(GOAL_EMPTY); setAddOpen(true); };
  const openEdit = (g) => {
    setEditTarget(g);
    setForm({
      title: g.title || "",
      description: g.description || "",
      targetDate: g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : "",
      status: g.status || "active",
      progress: g.progress ?? 0,
    });
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const res = await addStaffLearningGoal(staffId, { ...form, progress: Number(form.progress), targetDate: form.targetDate || null });
      onUpdated(res.item);
      setAddOpen(false);
      toast.success("Goal added.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to add goal.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!form.title.trim() || !editTarget) return;
    setBusy(true);
    try {
      const res = await updateStaffLearningGoal(staffId, editTarget._id, { ...form, progress: Number(form.progress), targetDate: form.targetDate || null });
      onUpdated(res.item);
      setEditTarget(null);
      toast.success("Goal updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update goal.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await removeStaffLearningGoal(staffId, deleteTarget._id);
      onUpdated(res.item);
      setDeleteTarget(null);
      toast.success("Goal removed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to remove goal.");
    } finally {
      setBusy(false);
    }
  };

  const GoalForm = (
    <div className="grid gap-3">
      <Input label="TITLE" value={form.title} onChange={setF("title")} placeholder="Goal title…" />
      <div className="grid gap-1.5">
        <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">DESCRIPTION</label>
        <textarea
          value={form.description}
          onChange={setF("description")}
          rows={2}
          placeholder="Optional description…"
          className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Input label="TARGET DATE" type="date" value={form.targetDate} onChange={setF("targetDate")} />
        <div className="grid gap-1.5">
          <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">STATUS</label>
          <Select value={form.status} onChange={setF("status")} options={[
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "on_hold", label: "On Hold" },
          ]} />
        </div>
        <Input label="PROGRESS %" type="number" min={0} max={100} value={form.progress} onChange={setF("progress")} />
      </div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-slate-700">
          Learning Goals <span className="ml-1.5 font-normal text-slate-400">{goals.length}</span>
        </span>
        <Button size="sm" onClick={openAdd} disabled={busy}><Plus size={13} /> Add Goal</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No learning goals" message="Add development goals to track growth." />
      ) : (
        <div className="grid gap-3">
          {goals.map((g) => (
            <Card key={g._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900">{g.title}</span>
                    <Badge tone={GOAL_STATUS_TONE[g.status] || "neutral"}>{cap(g.status)}</Badge>
                  </div>
                  {g.description && <p className="mt-1 text-xs leading-5 text-slate-500">{g.description}</p>}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1"><GoalProgressBar value={g.progress} /></div>
                    <span className="w-9 text-right text-xs font-black text-slate-600">{g.progress ?? 0}%</span>
                  </div>
                  {g.targetDate && <div className="mt-1 text-[11px] text-slate-400">Target: {fmtDate(g.targetDate)}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => openEdit(g)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><Pencil size={13} /></button>
                  <button type="button" onClick={() => setDeleteTarget(g)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Learning Goal" width="560px"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button><Button onClick={handleAdd} disabled={busy || !form.title.trim()}>{busy ? "Saving…" : "Add Goal"}</Button></div>}
      >{GoalForm}</Modal>

      <Modal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Edit Learning Goal" width="560px"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditTarget(null)} disabled={busy}>Cancel</Button><Button onClick={handleEdit} disabled={busy || !form.title.trim()}>{busy ? "Saving…" : "Save Changes"}</Button></div>}
      >{GoalForm}</Modal>

      <ConfirmModal open={Boolean(deleteTarget)} danger title="Remove goal?" message={`"${deleteTarget?.title}" will be permanently deleted.`} confirmLabel="Remove" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

// ── Scorecard Tab ─────────────────────────────────────────────────────────────

const SC_EMPTY = { period: "", rating: "3", notes: "", reviewerName: "" };

function StarRating({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={14} className={i < value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
      ))}
    </div>
  );
}

const TPL_EMPTY = { name: "", period: "", notes: "", defaultRating: "3" };

function ScorecardTab({ staff, staffId, onUpdated }) {
  const toast = useToast();
  const scorecards = Array.isArray(staff.scorecards) ? [...staff.scorecards].reverse() : [];

  const [addOpen, setAddOpen]             = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [form, setForm]                   = useState(SC_EMPTY);
  const [busy, setBusy]                   = useState(false);

  // Templates
  const [templates, setTemplates]         = useState([]);
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const [tplAddOpen, setTplAddOpen]       = useState(false);
  const [tplDeleteTarget, setTplDeleteTarget] = useState(null);
  const [tplForm, setTplForm]             = useState(TPL_EMPTY);
  const [tplBusy, setTplBusy]             = useState(false);

  useEffect(() => {
    listScorecardTemplates()
      .then((r) => setTemplates(r?.items || []))
      .catch(() => {});
  }, []);

  const setF = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const setTF = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setTplForm((f) => ({ ...f, [key]: val }));
  };

  const openAddBlank = () => { setForm(SC_EMPTY); setAddOpen(true); };

  const applyTemplate = (tpl) => {
    setForm({
      period: tpl.period || "",
      rating: String(tpl.defaultRating || 3),
      notes: tpl.notes || "",
      reviewerName: "",
    });
    setTplPickerOpen(false);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const rating = Number(form.rating);
    if (!rating || rating < 1 || rating > 5) return;
    setBusy(true);
    try {
      const res = await addStaffScorecard(staffId, { ...form, rating });
      onUpdated(res.item);
      setAddOpen(false);
      setForm(SC_EMPTY);
      toast.success("Scorecard entry added.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to add scorecard.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await removeStaffScorecard(staffId, deleteTarget._id);
      onUpdated(res.item);
      setDeleteTarget(null);
      toast.success("Entry removed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to remove entry.");
    } finally {
      setBusy(false);
    }
  };

  const handleTplAdd = async () => {
    if (!tplForm.name.trim()) return;
    setTplBusy(true);
    try {
      const res = await createScorecardTemplate({
        name: tplForm.name.trim(),
        period: tplForm.period.trim(),
        notes: tplForm.notes.trim(),
        defaultRating: Number(tplForm.defaultRating) || 3,
      });
      setTemplates((t) => [...t, res.item]);
      setTplAddOpen(false);
      setTplForm(TPL_EMPTY);
      toast.success("Template created.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to create template.");
    } finally {
      setTplBusy(false);
    }
  };

  const handleTplDelete = async () => {
    if (!tplDeleteTarget) return;
    setTplBusy(true);
    try {
      await deleteScorecardTemplate(tplDeleteTarget._id);
      setTemplates((t) => t.filter((x) => x._id !== tplDeleteTarget._id));
      setTplDeleteTarget(null);
      toast.success("Template deleted.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete template.");
    } finally {
      setTplBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-slate-700">
          Performance Scorecards <span className="ml-1.5 font-normal text-slate-400">{scorecards.length}</span>
        </span>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setTplPickerOpen(true)} disabled={busy}>
              Use Template
            </Button>
          )}
          <Button size="sm" onClick={openAddBlank} disabled={busy}><Plus size={13} /> Add Review</Button>
        </div>
      </div>

      {/* Scorecard list */}
      {scorecards.length === 0 ? (
        <EmptyState icon={Star} title="No scorecard entries" message="Performance reviews will appear here." />
      ) : (
        <div className="grid gap-3">
          {scorecards.map((sc) => (
            <Card key={sc._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating value={sc.rating} />
                    <span className="text-sm font-black text-slate-900">{sc.rating}/5</span>
                    {sc.period && <Badge tone="neutral">{sc.period}</Badge>}
                  </div>
                  {sc.reviewerName && <div className="mt-1 text-xs text-slate-500">Reviewed by {sc.reviewerName}</div>}
                  {sc.notes && <p className="mt-2 text-sm leading-5 text-slate-600">{sc.notes}</p>}
                  <div className="mt-1.5 text-[11px] text-slate-400">{fmtDate(sc.createdAt)}</div>
                </div>
                <button type="button" onClick={() => setDeleteTarget(sc)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"><Trash2 size={13} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template management */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-[13px] font-extrabold tracking-tight text-slate-700">
            Review Templates <span className="ml-1.5 font-normal text-slate-400">{templates.length}</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => { setTplForm(TPL_EMPTY); setTplAddOpen(true); }} disabled={tplBusy}>
            <Plus size={13} /> New Template
          </Button>
        </div>
        {templates.length === 0 ? (
          <div className="px-5 py-6 text-center text-xs italic text-slate-400">No templates yet. Create one to speed up reviews.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {templates.map((tpl) => (
              <div key={tpl._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-slate-800">{tpl.name}</span>
                  {tpl.period && <span className="ml-2 text-xs text-slate-400">{tpl.period}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={tpl.defaultRating} />
                  <button type="button" onClick={() => setTplDeleteTarget(tpl)} disabled={tplBusy} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add review modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Scorecard Entry" width="480px"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button><Button onClick={handleAdd} disabled={busy}>{busy ? "Saving…" : "Add Entry"}</Button></div>}
      >
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="PERIOD" value={form.period} onChange={setF("period")} placeholder="Q1 2026, H1 2025…" />
            <div className="grid gap-1.5">
              <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">RATING (1–5)</label>
              <Select value={form.rating} onChange={setF("rating")} options={[1,2,3,4,5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` }))} />
            </div>
          </div>
          <Input label="REVIEWER NAME" value={form.reviewerName} onChange={setF("reviewerName")} placeholder="Optional" />
          <div className="grid gap-1.5">
            <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">NOTES</label>
            <textarea value={form.notes} onChange={setF("notes")} rows={3} placeholder="Performance notes…" className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
      </Modal>

      {/* Template picker modal */}
      <Modal open={tplPickerOpen} onClose={() => setTplPickerOpen(false)} title="Choose a Template" width="420px"
        footer={<Button variant="outline" onClick={() => setTplPickerOpen(false)}>Cancel</Button>}
      >
        <div className="grid gap-2">
          {templates.map((tpl) => (
            <button key={tpl._id} type="button" onClick={() => applyTemplate(tpl)}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-800">{tpl.name}</div>
                {tpl.period && <div className="text-xs text-slate-400">{tpl.period}</div>}
              </div>
              <StarRating value={tpl.defaultRating} />
            </button>
          ))}
        </div>
      </Modal>

      {/* New template modal */}
      <Modal open={tplAddOpen} onClose={() => setTplAddOpen(false)} title="New Review Template" width="460px"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTplAddOpen(false)} disabled={tplBusy}>Cancel</Button><Button onClick={handleTplAdd} disabled={tplBusy || !tplForm.name.trim()}>{tplBusy ? "Saving…" : "Create Template"}</Button></div>}
      >
        <div className="grid gap-3">
          <Input label="TEMPLATE NAME" value={tplForm.name} onChange={setTF("name")} placeholder="Annual Review, Q2 Assessment…" />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="DEFAULT PERIOD" value={tplForm.period} onChange={setTF("period")} placeholder="Q1 2026…" />
            <div className="grid gap-1.5">
              <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">DEFAULT RATING</label>
              <Select value={tplForm.defaultRating} onChange={setTF("defaultRating")} options={[1,2,3,4,5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` }))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">DEFAULT NOTES</label>
            <textarea value={tplForm.notes} onChange={setTF("notes")} rows={2} placeholder="Pre-filled review notes…" className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={Boolean(deleteTarget)} danger title="Remove scorecard entry?" message="This review will be permanently deleted." confirmLabel="Remove" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      <ConfirmModal open={Boolean(tplDeleteTarget)} danger title="Delete template?" message={`"${tplDeleteTarget?.name}" will be permanently deleted.`} confirmLabel="Delete" onConfirm={handleTplDelete} onClose={() => setTplDeleteTarget(null)} />
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function BenchmarkBar({ label, myValue, avgValue, unit = "" }) {
  const max = Math.max(myValue, avgValue, 1);
  const myPct  = Math.round((myValue  / max) * 100);
  const avgPct = Math.round((avgValue / max) * 100);
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-400 text-[11px]">you {unit}{myValue.toLocaleString()} · avg {unit}{avgValue.toLocaleString()}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-400 transition-all" style={{ width: `${myPct}%` }} />
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300 transition-all" style={{ width: `${avgPct}%` }} />
      </div>
      <div className="flex gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-indigo-400" /> You</span>
        <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-full bg-slate-300" /> Dept avg</span>
      </div>
    </div>
  );
}

function AnalyticsTab({ staff, staffId }) {
  const toast = useToast();
  const [loading, setLoading]       = useState(true);
  const [jobs, setJobs]             = useState([]);
  const [leaves, setLeaves]         = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [benchmark, setBenchmark]   = useState(null);

  const userId = staff.linkedUserId?._id || staff.linkedUserId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [jr, lr, er, br] = await Promise.all([
          userId
            ? listJobs({ assigneeId: userId, limit: 100, sort: "-createdAt" })
            : Promise.resolve({ items: [] }),
          listLeaves({ staffName: staff.fullName, limit: 100 }),
          listExpenses({ staffName: staff.fullName, limit: 100 }),
          getStaffBenchmark(staffId).catch(() => null),
        ]);
        if (!cancelled) {
          setJobs(jr?.items || []);
          setLeaves(lr?.items || []);
          setExpenses(er?.items || []);
          setBenchmark(br?.ok ? br : null);
        }
      } catch (e) {
        if (!cancelled) toast.error(e?.response?.data?.message || e?.message || "Failed to load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, staff.fullName, staffId, toast]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  const totalJobs    = jobs.length;
  const deliveredJobs = jobs.filter((j) => ["delivered", "published"].includes(j.status)).length;
  const inProgress   = jobs.filter((j) => !["delivered", "published", "cancelled"].includes(j.status)).length;

  const approvedLeaves   = leaves.filter((l) => l.status === "approved");
  const totalLeaveDays   = approvedLeaves.reduce((s, l) => s + (l.daysCount || 0), 0);

  const approvedExpenses    = expenses.filter((e) => ["approved", "registered", "paid"].includes(e.status));
  const totalExpenseAmount  = approvedExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const currency            = expenses[0]?.currency || staff.currency || "AED";

  const statusCounts = {};
  jobs.forEach((j) => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });
  const pipeline = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="grid gap-4">
      {!userId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          No portal user linked — job data unavailable. Link a user from the Overview tab.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase}    label="Total Jobs"          value={totalJobs}    sub={`${inProgress} in progress`}    color="indigo" />
        <StatCard icon={CheckCircle2} label="Delivered"           value={deliveredJobs} sub="Delivered or published"        color="emerald" />
        <StatCard icon={Clock}        label="Leave Days Taken"    value={totalLeaveDays} sub={`${leaves.length} request${leaves.length !== 1 ? "s" : ""}`} color="amber" />
        <StatCard icon={BarChart2}    label="Approved Expenses"   value={`${currency} ${Number(totalExpenseAmount).toLocaleString("en-AE")}`} sub={`${expenses.length} claim${expenses.length !== 1 ? "s" : ""} total`} color="violet" />
      </div>

      {pipeline.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3">
            <span className="text-[13px] font-extrabold tracking-tight text-slate-700">Job Pipeline</span>
          </div>
          <div className="grid gap-2 p-5">
            {pipeline.map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs font-semibold capitalize text-slate-600">
                  {status.replace(/_/g, " ")}
                </span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.round((count / totalJobs) * 100)}%` }} />
                </div>
                <span className="w-6 text-right text-xs font-black text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {benchmark && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3">
            <span className="text-[13px] font-extrabold tracking-tight text-slate-700">
              Department Benchmark
              <span className="ml-2 text-xs font-normal text-slate-400 capitalize">
                {benchmark.department} · {benchmark.staffCount} staff
              </span>
            </span>
          </div>
          <div className="grid gap-4 p-5">
            <BenchmarkBar
              label="Leave Days Taken"
              myValue={benchmark.mine.leaveDays}
              avgValue={benchmark.avg.leaveDays}
            />
            <BenchmarkBar
              label="Approved Expenses"
              myValue={benchmark.mine.expenseAmount}
              avgValue={benchmark.avg.expenseAmount}
              unit={`${benchmark.currency} `}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StaffDetailsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStaff(id);
      setStaff(res?.item || null);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load staff"
      );
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      await updateStaff(id, payload);
      setEditOpen(false);
      await loadStaff();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Save failed"
      );
    } finally {
      setBusy(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error / not found state ────────────────────────────────────────────────

  if (!staff) {
    return (
      <EmptyState
        icon={Users}
        title="Staff member not found"
        message="This staff record may have been deleted or the link is incorrect."
        actionLabel="Back to staff"
        onAction={() => window.history.back()}
      />
    );
  }

  // ── Tab content ────────────────────────────────────────────────────────────

  let tabContent = null;

  if (tab === "overview") {
    tabContent = <OverviewTab staff={staff} />;
  } else if (tab === "expenses") {
    tabContent = <ExpensesTab staffName={staff.fullName} />;
  } else if (tab === "leaves") {
    tabContent = <LeavesTab staffName={staff.fullName} />;
  } else if (tab === "work") {
    tabContent = <AssignedWorkTab linkedUserId={staff.linkedUserId} />;
  } else if (tab === "activity") {
    tabContent = <StaffActivityTab linkedUserId={staff.linkedUserId} />;
  } else if (tab === "skills") {
    tabContent = <SkillsTab staff={staff} staffId={id} onUpdated={setStaff} />;
  } else if (tab === "goals") {
    tabContent = <GoalsTab staff={staff} staffId={id} onUpdated={setStaff} />;
  } else if (tab === "scorecard") {
    tabContent = <ScorecardTab staff={staff} staffId={id} onUpdated={setStaff} />;
  } else if (tab === "analytics") {
    tabContent = <AnalyticsTab staff={staff} staffId={id} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <DetailsShell
        backTo="/portal/hr/staff"
        eyebrow="HR / STAFF"
        title={staff.fullName}
        subtitle={staff.jobTitle || undefined}
        right={
          <div className="flex items-center gap-2">
            <StaffStatusPill status={staff.status} />
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={busy}
            >
              <Pencil size={14} />
              Edit
            </Button>
          </div>
        }
        tabs={
          <SegmentTabs
            tabs={SEGMENT_TABS}
            value={tab}
            onChange={setTab}
          />
        }
      >
        {tabContent}
      </DetailsShell>

      <StaffFormModal
        open={editOpen}
        initial={staff}
        busy={busy}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
