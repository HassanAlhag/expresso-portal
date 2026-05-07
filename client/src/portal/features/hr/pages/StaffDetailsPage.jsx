import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Pencil, Users, Briefcase, Activity } from "lucide-react";

import DetailsShell from "../../../shared/ui/DetailsShell";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";
import SegmentTabs from "../../../shared/ui/SegmentTabs";

import StaffFormModal from "../components/StaffFormModal";
import StaffStatusPill from "../components/StaffStatusPill";
import ExpenseStatusPill from "../components/ExpenseStatusPill";
import ExpenseCategoryBadge from "../components/ExpenseCategoryBadge";
import LeaveStatusPill from "../components/LeaveStatusPill";

import {
  getStaff,
  updateStaff,
  listExpenses,
  listLeaves,
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
  { value: "overview", label: "Overview" },
  { value: "expenses", label: "Expenses" },
  { value: "leaves", label: "Leaves" },
  { value: "work", label: "Assigned Work" },
  { value: "activity", label: "Activity" },
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
    tabContent = (
      <EmptyState
        icon={Briefcase}
        title="Assigned Work"
        message="Projects, tickets, and jobs assigned to this staff member will appear here in a future phase."
      />
    );
  } else if (tab === "activity") {
    tabContent = (
      <EmptyState
        icon={Activity}
        title="Activity Log"
        message="Audit trail and activity history will be available in a future phase."
      />
    );
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
