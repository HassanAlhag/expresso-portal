import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Plus, ReceiptText, RefreshCw, SearchX, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import TextField from "../../../shared/ui/TextField";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listExpenses, getExpenseStats, createExpense, updateExpense } from "../api";
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_STATUS_OPTIONS, HR_DEPARTMENT_OPTIONS } from "../constants/hr.constants";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, date, expenseCategoryLabel, humanize, isOwnRecord, money, monthLabel } from "../format";
import ExpenseClaimFormModal from "../components/ExpenseClaimFormModal";
import ExpenseActionDialogs from "../components/ExpenseActionDialogs";
import { expenseActionsFor } from "../components/expenseActions";

const LIMIT = 12;
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-expenseDate", label: "Expense date, newest" },
  { value: "expenseDate", label: "Expense date, oldest" },
  { value: "-amount", label: "Amount, high to low" },
  { value: "amount", label: "Amount, low to high" },
  { value: "title", label: "Title, A to Z" },
];

export function buildExpenseParams({ q, status, category, department, month, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (status) p.status = status;
  if (category) p.category = category;
  if (department) p.department = department;
  if (month) p.month = month;
  return p;
}

// Expense claims (PUI-4). Approvers see every claim and take it through
// approve, register to a month and mark paid; everyone else sees and manages
// their own (the API scopes the list, the stats and every action).
export default function ExpenseClaimsPage() {
  const toast = useToast();
  const nav = useNavigate();
  const access = useAccess();
  const canWrite = access.can("hr.expenses.write");
  const approver = access.can("hr.expenses.approve");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [action, setAction] = useState(null); // { kind, item }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listExpenses(buildExpenseParams({ q: dq.trim(), status, category, department, month, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, category, department, month, sort, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getExpenseStats());
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([load(), loadStats()]);
  const filtered = Boolean(dq.trim() || status || category || department || month);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setCategory("");
    setDepartment("");
    setMonth("");
    setPage(1);
  };

  // Counts only: claims carry their own currency, so summing amounts across
  // claims could mix currencies.
  const t = stats?.totals;
  const metrics = useMemo(() => {
    if (!t) return [];
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      { key: "pending", label: approver ? "Waiting for a decision" : "Waiting for approval", value: t.pending || 0, note: approver ? "Submitted claims" : "Your submitted claims", noteTone: t.pending ? "warn" : undefined, onClick: toggle("submitted"), pressed: status === "submitted" },
      { key: "approved", label: "Approved, not registered", value: t.approved || 0, note: "Next: register to a month", onClick: toggle("approved"), pressed: status === "approved" },
      { key: "registered", label: "Registered, not paid", value: t.registered || 0, note: "Waiting for payment", onClick: toggle("registered"), pressed: status === "registered" },
      { key: "paid", label: "Paid", value: t.paid || 0, note: `${t.total || 0} claim${t.total === 1 ? "" : "s"} in all, ${t.rejected || 0} rejected`, onClick: toggle("paid"), pressed: status === "paid" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, status, approver]);

  const openForm = (item = null) => {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  };

  const submitForm = async (payload) => {
    setFormBusy(true);
    setFormError("");
    try {
      if (editing) await updateExpense(editing._id, payload);
      else await createExpense(payload);
      toast.success(editing ? "Claim updated." : "Claim submitted.");
      setFormOpen(false);
      await refresh();
    } catch (e) {
      setFormError(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setFormBusy(false);
    }
  };

  const handlers = {
    confirm: (kind, item) => setAction({ kind, item }),
    reject: (item) => setAction({ kind: "reject", item }),
    register: (item) => setAction({ kind: "register", item }),
    edit: (item) => openForm(item),
  };

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: EXPENSE_STATUS_LABEL[status], clear: () => set(setStatus)("") },
    category && { key: "c", label: expenseCategoryLabel(category), clear: () => set(setCategory)("") },
    department && { key: "d", label: humanize(department), clear: () => set(setDepartment)("") },
    month && { key: "m", label: `Claimed for ${monthLabel(month)}`, clear: () => set(setMonth)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Expense claims didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No claims match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState
        icon={ReceiptText}
        title="No expense claims yet"
        message={approver ? "Claims submitted by the team appear here for a decision." : "Your expense claims appear here."}
        action={canWrite ? <Button onClick={() => openForm()}><Plus size={14} aria-hidden="true" />New claim</Button> : null}
      />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Expense claims" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Claim" field="title" sort={sort} onSort={set(setSort)} />
              <th scope="col" className="px-hide-tab">Category</th>
              <SortHeader label="Expense date" field="expenseDate" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Amount" field="amount" sort={sort} onSort={set(setSort)} align="right" />
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={6} label="Loading expense claims" />
            ) : (
              items.map((item) => {
                const mine = isOwnRecord(access, item);
                const actions = [
                  { key: "open", label: "Open claim", icon: ExternalLink, onSelect: () => nav(`/portal/hr/expenses/${item._id}`) },
                  ...expenseActionsFor(access, item, handlers),
                ];
                const statusNote =
                  item.status === "rejected"
                    ? item.rejectionReason
                    : ["registered", "paid"].includes(item.status) && item.registeredMonth
                      ? `Registered to ${monthLabel(item.registeredMonth)}`
                      : "";
                return (
                  <tr key={item._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/hr/expenses/${item._id}`}>{item.title || "Untitled claim"}</Link>
                        <span>
                          {item.staffName || "Unnamed"}
                          {mine ? " (you)" : ""}
                          {item.department ? `, ${humanize(item.department)}` : ""}
                        </span>
                      </div>
                    </td>
                    <td data-label="Category" className="px-hide-tab">{expenseCategoryLabel(item.category)}</td>
                    <td data-label="Expense date" className="px-num">{date(item.expenseDate)}</td>
                    <td data-label="Amount" className="px-num">{money(item.amount, item.currency)}</td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={EXPENSE_STATUS_TONE[item.status] || "neutral"} dot>{EXPENSE_STATUS_LABEL[item.status] || humanize(item.status)}</Badge>
                      </span>
                      {statusNote ? <small className="px-muted" style={{ display: "block", marginTop: 4 }}>{statusNote}</small> : null}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={`${item.title || "claim"}`} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="claims" label="Expense claim pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Expense claims"
        description={approver ? "Claims from the team: decisions, monthly registration and payment." : "Your expense claims and where each one stands."}
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "Expense claims" }]}
        secondaryActions={
          <>
            {approver && access.canOpen("/portal/hr/monthly-expenses") ? (
              <Button variant="outline" onClick={() => nav("/portal/hr/monthly-expenses")}>Monthly summary</Button>
            ) : null}
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={canWrite ? <Button onClick={() => openForm()}><Plus size={14} aria-hidden="true" />New claim</Button> : null}
      >
        <MetricsStrip label="Expense claim summary" items={metrics} />
        <Panel flush bare label="Expense claims" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter expense claims">
            <SearchField label="Search claims" value={q} onChange={setQ} placeholder="Title, name or description" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={[{ value: "", label: "Any status" }, ...EXPENSE_STATUS_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Category" value={category} onChange={set(setCategory)} options={[{ value: "", label: "Any category" }, ...EXPENSE_CATEGORY_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Department" value={department} onChange={set(setDepartment)} options={[{ value: "", label: "Any department" }, ...HR_DEPARTMENT_OPTIONS.filter((o) => o.value)]} />
            <TextField label="Claim month" type="month" value={month} onChange={(e) => set(setMonth)(e.target.value)} />
            <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading expense claims…" : error ? "Expense claims unavailable" : `${meta.total} claim${meta.total === 1 ? "" : "s"}`}</span>
            {chips.length ? (
              <div className="px-active-filters">
                {chips.map((c) => (
                  <button key={c.key} type="button" className="px-filter-chip" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
                    {c.label}
                    <X size={12} aria-hidden="true" />
                  </button>
                ))}
                <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={clearFilters}>Clear all</button>
              </div>
            ) : null}
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? <ExpenseClaimFormModal open={formOpen} initial={editing} busy={formBusy} error={formError} onClose={() => setFormOpen(false)} onSubmit={submitForm} /> : null}
      <ExpenseActionDialogs action={action} onClose={() => setAction(null)} onDone={refresh} />
    </>
  );
}
