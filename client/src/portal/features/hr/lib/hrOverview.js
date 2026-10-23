// HR overview data (PUI-4). Each source loads only when the user's effective
// permissions allow it, and each settles on its own: a source that fails is
// reported as unavailable, never as zero.
import { getStaffStats, getExpenseStats, getLeaveStats, listExpenses, listLeaves } from "../api";
import { canDecide, date, leaveTypeLabel, money } from "../format";

const ATTENTION_LIMIT = 5;
const items = (r) => (Array.isArray(r?.items) ? r.items : []);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function loadHrOverview(access) {
  const want = {
    staff: access.can("hr.staff.read"),
    expenses: access.can("hr.expenses.read"),
    leaves: access.can("hr.leaves.read"),
    expenseQueue: access.can("hr.expenses.approve"),
    leaveQueue: access.can("hr.leaves.approve"),
  };
  const calls = {
    staff: () => getStaffStats(),
    expenses: () => getExpenseStats(),
    leaves: () => getLeaveStats(),
    expenseQueue: () => listExpenses({ status: "submitted", sort: "createdAt", limit: 20, page: 1 }),
    leaveQueue: () => listLeaves({ status: "submitted", sort: "startDate", limit: 20, page: 1 }),
  };
  const keys = Object.keys(calls).filter((k) => want[k]);
  const settled = await Promise.allSettled(keys.map((k) => calls[k]()));
  const out = {};
  keys.forEach((k, i) => {
    out[k] = settled[i].status === "fulfilled" ? { ok: true, data: settled[i].value } : { ok: false };
  });
  return out; // a key is missing when the user can't see that source
}

export function deriveHrOverview(data, access) {
  const failed = Object.entries(data).filter(([, v]) => !v.ok).map(([k]) => k);
  const staff = data.staff?.ok ? data.staff.data?.totals || {} : null;
  const exp = data.expenses?.ok ? data.expenses.data?.totals || {} : null;
  const lv = data.leaves?.ok ? data.leaves.data?.totals || {} : null;

  const unavailable = { value: "—", note: "Didn't load", noteTone: "bad" };
  const metrics = [];
  if (data.staff)
    metrics.push(staff
      ? { key: "staff", label: "Active staff", value: staff.active || 0, note: `${staff.onLeave || 0} on leave, ${staff.total || 0} records in all`, to: "/portal/hr/staff" }
      : { key: "staff", label: "Active staff", ...unavailable });
  if (data.expenses)
    metrics.push(exp
      ? { key: "exp", label: "Expense claims waiting", value: exp.pending || 0, note: exp.approved ? `${exp.approved} approved, not registered` : "Submitted, not decided", noteTone: exp.pending ? "warn" : undefined, to: "/portal/hr/expenses" }
      : { key: "exp", label: "Expense claims waiting", ...unavailable });
  if (data.leaves)
    metrics.push(lv
      ? { key: "leave", label: "Leave requests waiting", value: lv.submitted || 0, note: "Submitted, not decided", noteTone: lv.submitted ? "warn" : undefined, to: "/portal/hr/leaves" }
      : { key: "leave", label: "Leave requests waiting", ...unavailable });
  if (data.leaves)
    metrics.push(lv
      ? { key: "upcoming", label: "Upcoming approved leave", value: lv.upcoming || 0, note: "Starting today or later" }
      : { key: "upcoming", label: "Upcoming approved leave", ...unavailable });

  // Needs attention: decisions this user can actually make (not their own).
  const attention = [];
  const expQueue = data.expenseQueue?.ok ? items(data.expenseQueue.data).filter((e) => canDecide(access, "hr.expenses.approve", e)) : [];
  const leaveQueue = data.leaveQueue?.ok ? items(data.leaveQueue.data).filter((l) => canDecide(access, "hr.leaves.approve", l)) : [];
  leaveQueue.slice(0, ATTENTION_LIMIT).forEach((l) =>
    attention.push({
      key: `l-${l._id}`,
      kind: "leave",
      tone: "warn",
      title: `${l.staffName || "Someone"}: ${leaveTypeLabel(l.leaveType)}`,
      sub: `${date(l.startDate, { year: false })} to ${date(l.endDate)}, ${plural(l.days || 1, "day")}`,
      to: "/portal/hr/leaves",
      actionLabel: "Review",
    })
  );
  expQueue.slice(0, ATTENTION_LIMIT).forEach((e) =>
    attention.push({
      key: `e-${e._id}`,
      kind: "expense",
      tone: "warn",
      title: `${e.staffName || "Someone"}: ${e.title}`,
      sub: `${money(e.amount, e.currency)}, submitted ${date(e.createdAt)}`,
      to: `/portal/hr/expenses/${e._id}`,
      actionLabel: "Review",
    })
  );
  const moreLeaves = Math.max(0, Number(data.leaveQueue?.data?.total || 0) - Math.min(leaveQueue.length, ATTENTION_LIMIT));
  const moreExp = Math.max(0, Number(data.expenseQueue?.data?.total || 0) - Math.min(expQueue.length, ATTENTION_LIMIT));
  if (data.leaveQueue?.ok && moreLeaves > 0 && leaveQueue.length >= ATTENTION_LIMIT)
    attention.push({ key: "more-l", kind: "leave", tone: "info", title: `More leave requests are waiting`, sub: "Filter the leave list by Submitted", to: "/portal/hr/leaves", actionLabel: "Open" });
  if (data.expenseQueue?.ok && moreExp > 0 && expQueue.length >= ATTENTION_LIMIT)
    attention.push({ key: "more-e", kind: "expense", tone: "info", title: `More expense claims are waiting`, sub: "Filter the claim list by Submitted", to: "/portal/hr/expenses", actionLabel: "Open" });
  if (exp?.approved && access.can("hr.expenses.approve"))
    attention.push({ key: "register", kind: "register", tone: "info", title: `${plural(exp.approved, "approved claim")} not registered to a month`, sub: "Register them so they join the monthly summary", to: "/portal/hr/expenses", actionLabel: "Open" });

  const byDepartment = data.staff?.ok && Array.isArray(data.staff.data?.byDepartment) ? data.staff.data.byDepartment : [];
  return {
    metrics,
    attention,
    canDecideAny: Boolean(data.expenseQueue || data.leaveQueue),
    queueFailed: Boolean((data.expenseQueue && !data.expenseQueue.ok) || (data.leaveQueue && !data.leaveQueue.ok)),
    byDepartment,
    staffTotal: staff?.total || 0,
    failed,
  };
}
