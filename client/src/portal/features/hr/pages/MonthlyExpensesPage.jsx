import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, RefreshCw } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useAccess } from "../../../shared/hooks/useAccess";

import { getMonthlyExpenses, getMonthlyExpenseDetails } from "../api";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, date, expenseCategoryLabel, monthLabel } from "../format";
import ExpenseActionDialogs from "../components/ExpenseActionDialogs";
import { expenseActionsFor } from "../components/expenseActions";

// Claims carry their own currency and the API adds amounts as recorded, so
// these totals are shown as plain figures rather than in one currency.
const amount = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Monthly expense summary (PUI-4, hr.expenses.approve). Registered claims
// grouped by the month they were registered to, with each month's claims.
export default function MonthlyExpensesPage() {
  const access = useAccess();
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [action, setAction] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMonthlyExpenses();
      setMonths(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setMonths([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (month) => {
    if (!month) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      setDetail(await getMonthlyExpenseDetails(month));
    } catch (e) {
      setDetail(null);
      setDetailError(e?.response?.data?.message || "This month's claims didn't load.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadDetail(selected);
  }, [selected, loadDetail]);

  // Every year that has registered claims, plus the current one.
  const years = useMemo(() => {
    const set = new Set([String(new Date().getFullYear()), ...months.map((m) => String(m.month || "").slice(0, 4)).filter(Boolean)]);
    return [...set].sort().reverse();
  }, [months]);
  const rows = useMemo(() => months.filter((m) => String(m.month || "").startsWith(year)), [months, year]);
  const sum = (k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

  const metrics = error || loading
    ? []
    : [
        { key: "total", label: `Registered in ${year}`, value: amount(sum("total")), note: `${rows.length} month${rows.length === 1 ? "" : "s"}` },
        { key: "paid", label: "Paid", value: amount(sum("paid")) },
        { key: "unpaid", label: "Not paid yet", value: amount(sum("unpaid")), noteTone: sum("unpaid") ? "warn" : undefined, note: sum("unpaid") ? "Registered, waiting for payment" : "Nothing outstanding" },
        { key: "count", label: "Claims", value: sum("count"), note: "Registered or paid" },
      ];

  const refresh = async () => {
    await load();
    if (selected) await loadDetail(selected);
  };

  let content;
  if (error) content = <ErrorState title="Monthly expenses didn't load" message={error} onRetry={load} />;
  else if (!loading && !rows.length)
    content = <EmptyState icon={CalendarDays} title={`No registered claims in ${year}`} message="Approved claims appear here once they're registered to a month." />;
  else
    content = (
      <table className="px-table px-table--stack" aria-label={`Registered expenses by month, ${year}`} aria-busy={loading || undefined}>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col" className="px-num">Claims</th>
            <th scope="col" className="px-num">Registered</th>
            <th scope="col" className="px-num">Paid</th>
            <th scope="col" className="px-num">Not paid</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows rows={4} cols={5} label="Loading monthly expenses" />
          ) : (
            rows.map((m) => (
              <tr key={m.month}>
                <td className="px-primary">
                  <div className="px-cell-main">
                    <button type="button" aria-pressed={selected === m.month} onClick={() => setSelected(selected === m.month ? "" : m.month)}>
                      {monthLabel(m.month)}
                    </button>
                    <span>{selected === m.month ? "Showing its claims below" : "Show its claims"}</span>
                  </div>
                </td>
                <td data-label="Claims" className="px-num">{m.count || 0}</td>
                <td data-label="Registered" className="px-num">{amount(m.total)}</td>
                <td data-label="Paid" className="px-num">{amount(m.paid)}</td>
                <td data-label="Not paid" className="px-num">{amount(m.unpaid)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

  const claims = Array.isArray(detail?.items) ? detail.items : [];

  return (
    <>
      <PageFrame
        title="Monthly expenses"
        description="Registered expense claims, by the month they were registered to. Amounts are added as recorded, without currency conversion."
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "Expense claims", to: "/portal/hr/expenses" }, { label: "Monthly" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
      >
        <MetricsStrip label={`Expense summary for ${year}`} items={metrics} />
        <Panel flush bare label="Months" className="px-list-panel">
          <div className="px-toolbar" aria-label="Choose a year">
            <SelectField label="Year" value={year} onChange={(v) => { setYear(v); setSelected(""); }} options={years.map((y) => ({ value: y, label: y }))} />
          </div>
          {content}
        </Panel>

        {selected ? (
          <Panel title={`Claims registered to ${monthLabel(selected)}`} sub={detail?.summary ? `${detail.summary.count || 0} claims, ${amount(detail.summary.unpaid)} not paid yet` : undefined} flush>
            {detailError ? (
              <ErrorState title="This month's claims didn't load" message={detailError} onRetry={() => loadDetail(selected)} />
            ) : (
              <table className="px-table px-table--stack" aria-label={`Claims registered to ${monthLabel(selected)}`} aria-busy={detailLoading || undefined}>
                <thead>
                  <tr>
                    <th scope="col">Claim</th>
                    <th scope="col" className="px-hide-tab">Category</th>
                    <th scope="col" className="px-num">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <SkeletonRows rows={3} cols={5} label="Loading claims" />
                  ) : (
                    claims.map((c) => (
                      <tr key={c._id}>
                        <td className="px-primary">
                          <div className="px-cell-main">
                            <Link to={`/portal/hr/expenses/${c._id}`}>{c.title || "Untitled claim"}</Link>
                            <span>{[c.staffName, date(c.expenseDate)].filter(Boolean).join(", ")}</span>
                          </div>
                        </td>
                        <td data-label="Category" className="px-hide-tab">{expenseCategoryLabel(c.category)}</td>
                        <td data-label="Amount" className="px-num">{`${c.currency || "AED"} ${amount(c.amount)}`}</td>
                        <td data-label="Status">
                          <Badge tone={EXPENSE_STATUS_TONE[c.status] || "neutral"} dot>{EXPENSE_STATUS_LABEL[c.status] || c.status}</Badge>
                        </td>
                        <td className="px-actions-cell">
                          <RowActions label={c.title || "claim"} actions={expenseActionsFor(access, c, { confirm: (kind, item) => setAction({ kind, item }), reject: () => {}, register: () => {}, edit: () => {} }).filter((a) => a.key === "paid")} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </Panel>
        ) : null}
      </PageFrame>
      <ExpenseActionDialogs action={action} onClose={() => setAction(null)} onDone={refresh} />
    </>
  );
}
