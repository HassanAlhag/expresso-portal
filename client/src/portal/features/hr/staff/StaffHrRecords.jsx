import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ReceiptText } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import ErrorState from "../../../shared/ui/ErrorState";
import { listExpenses, listLeaves } from "../api";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, LEAVE_STATUS_LABEL, LEAVE_STATUS_TONE, date, expenseCategoryLabel, leaveTypeLabel, money } from "../format";
import { loadStaffRecords } from "./staffRecords";

function useStaffRecords(listFn, staff) {
  const [state, setState] = useState({ status: "loading", items: [], complete: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));
    loadStaffRecords(listFn, staff)
      .then((r) => !cancelled && setState({ status: "ready", ...r }))
      .catch(() => !cancelled && setState({ status: "failed", items: [], complete: true }));
    return () => {
      cancelled = true;
    };
  }, [listFn, staff, n]);
  return [state, () => setN((x) => x + 1)];
}

const sub = (state, noun) =>
  state.status !== "ready" ? undefined : `${state.items.length} ${noun}${state.items.length === 1 ? "" : "s"}${state.complete ? "" : ", from the 100 most recent name matches"}, matched by name or linked portal user`;

function Empty({ icon: Icon, children }) {
  return (
    <div className="px-inline-empty">
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

// Leave tab of a staff record (PUI-4, hr.leaves.read).
export function StaffLeaveTab({ staff }) {
  const [state, retry] = useStaffRecords(listLeaves, staff);
  return (
    <Panel title="Leave requests" sub={sub(state, "request")} flush action={<Link className="px-link" to="/portal/hr/leaves">All leave</Link>}>
      {state.status === "failed" ? (
        <ErrorState title="Leave requests didn't load" onRetry={retry} />
      ) : state.status === "ready" && !state.items.length ? (
        <Empty icon={CalendarDays}>No leave requests for {staff.fullName}.</Empty>
      ) : (
        <table className="px-table px-table--stack" aria-label={`Leave requests for ${staff.fullName}`} aria-busy={state.status === "loading" || undefined}>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Dates</th>
              <th scope="col" className="px-num">Days</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.status === "loading" ? (
              <SkeletonRows rows={3} cols={4} label="Loading leave requests" />
            ) : (
              state.items.map((l) => (
                <tr key={l._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <b>{leaveTypeLabel(l.leaveType)}</b>
                      {l.reason ? <span>{l.reason}</span> : null}
                    </div>
                  </td>
                  <td data-label="Dates" className="px-num">{`${date(l.startDate, { year: false })} to ${date(l.endDate)}`}</td>
                  <td data-label="Days" className="px-num">{l.days || 1}</td>
                  <td data-label="Status">
                    <Badge tone={LEAVE_STATUS_TONE[l.status] || "neutral"} dot>{LEAVE_STATUS_LABEL[l.status] || l.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// Expenses tab of a staff record (PUI-4, hr.expenses.read).
export function StaffExpensesTab({ staff }) {
  const [state, retry] = useStaffRecords(listExpenses, staff);
  return (
    <Panel title="Expense claims" sub={sub(state, "claim")} flush action={<Link className="px-link" to="/portal/hr/expenses">All claims</Link>}>
      {state.status === "failed" ? (
        <ErrorState title="Expense claims didn't load" onRetry={retry} />
      ) : state.status === "ready" && !state.items.length ? (
        <Empty icon={ReceiptText}>No expense claims for {staff.fullName}.</Empty>
      ) : (
        <table className="px-table px-table--stack" aria-label={`Expense claims for ${staff.fullName}`} aria-busy={state.status === "loading" || undefined}>
          <thead>
            <tr>
              <th scope="col">Claim</th>
              <th scope="col" className="px-hide-tab">Expense date</th>
              <th scope="col" className="px-num">Amount</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.status === "loading" ? (
              <SkeletonRows rows={3} cols={4} label="Loading expense claims" />
            ) : (
              state.items.map((e) => (
                <tr key={e._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/hr/expenses/${e._id}`}>{e.title || "Untitled claim"}</Link>
                      <span>{expenseCategoryLabel(e.category)}</span>
                    </div>
                  </td>
                  <td data-label="Expense date" className="px-num px-hide-tab">{date(e.expenseDate)}</td>
                  <td data-label="Amount" className="px-num">{money(e.amount, e.currency)}</td>
                  <td data-label="Status">
                    <Badge tone={EXPENSE_STATUS_TONE[e.status] || "neutral"} dot>{EXPENSE_STATUS_LABEL[e.status] || e.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
