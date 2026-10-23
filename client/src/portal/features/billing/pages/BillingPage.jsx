import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ban, CheckCircle2, Clock, ExternalLink, FileText, Plus, Receipt, RefreshCw, SearchX, Send, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listInvoices, getBillingStats, createInvoice, markInvoicePaid, voidInvoice, markOverdueInvoices, updateInvoice } from "../api";
import { INVOICE_STATUSES, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, compactMoney, date, money, overdueDays } from "../format";
import InvoiceFormDialog from "../components/InvoiceFormDialog";
import { invoiceActionCopy } from "../components/invoiceActions";

const LIMIT = 12;
const STATUS_OPTIONS = [{ value: "", label: "Any status" }, ...INVOICE_STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS_LABEL[s] }))];
// Every sort the API supports.
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "dueDate", label: "Due soonest" },
  { value: "-dueDate", label: "Due latest" },
  { value: "-total", label: "Highest total" },
  { value: "total", label: "Lowest total" },
  { value: "-balance", label: "Largest balance" },
  { value: "-updatedAt", label: "Recently updated" },
];

export function buildInvoiceParams({ q, status, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (status) p.status = status;
  return p;
}

// Billing (PUI-4). Staff manage invoices; client users see their own
// company's invoices read-only (the API scopes them and refuses writes).
export default function BillingPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("billing.write");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(null); // { kind, invoice }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listInvoices(buildInvoiceParams({ q: dq.trim(), status, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, sort, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getBillingStats());
    } catch {
      setStats(null); // the summary is optional; never shown as zero
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
  const filtered = Boolean(dq.trim() || status);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setPage(1);
  };

  const by = stats?.byStatus || {};
  const metrics = useMemo(() => {
    if (!stats) return [];
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      {
        key: "outstanding",
        label: "Outstanding",
        value: compactMoney(stats.totalOutstanding),
        note: `${(by.sent?.count || 0) + (by.overdue?.count || 0)} unpaid invoices`,
      },
      {
        key: "overdue",
        label: "Overdue",
        value: compactMoney(stats.totalOverdue),
        note: `${by.overdue?.count || 0} invoices`,
        noteTone: by.overdue?.count ? "bad" : "ok",
        onClick: toggle("overdue"),
        pressed: status === "overdue",
      },
      {
        key: "collected",
        label: "Collected",
        value: compactMoney(stats.totalPaid),
        note: "All payments, excluding void",
        onClick: toggle("paid"),
        pressed: status === "paid",
      },
      {
        key: "drafts",
        label: "Drafts",
        value: by.draft?.count || 0,
        note: "Not yet sent",
        onClick: toggle("draft"),
        pressed: status === "draft",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, status]);

  const runAction = async () => {
    const { kind, invoice } = pending;
    try {
      if (kind === "sent") await updateInvoice(invoice._id, { status: "sent" });
      if (kind === "paid") await markInvoicePaid(invoice._id);
      if (kind === "void") await voidInvoice(invoice._id);
      if (kind === "overdue") {
        const res = await markOverdueInvoices();
        toast.success(`${res?.updated ?? 0} invoice${res?.updated === 1 ? "" : "s"} marked overdue.`);
      } else toast.success(invoiceActionCopy(kind, invoice).done);
      setPending(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Refresh and try again.");
    }
  };

  const toolbar = (
    <div className="px-toolbar" role="search" aria-label="Filter invoices">
      <SearchField label="Search invoices" value={q} onChange={setQ} placeholder="Number, notes or currency" />
      <SelectField label="Status" value={status} onChange={set(setStatus)} options={STATUS_OPTIONS} />
      <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
    </div>
  );

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: INVOICE_STATUS_LABEL[status], clear: () => set(setStatus)("") },
  ].filter(Boolean);

  const resultBar = (
    <div className="px-result-bar">
      <span aria-live="polite">{loading ? "Loading invoices…" : error ? "Invoices unavailable" : `${meta.total} invoice${meta.total === 1 ? "" : "s"}`}</span>
      {chips.length ? (
        <div className="px-active-filters">
          {chips.map((c) => (
            <button key={c.key} type="button" className="px-filter-chip" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
              {c.label}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );

  let content;
  if (error) content = <ErrorState title="Invoices didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No invoices match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState
        icon={Receipt}
        title="No invoices yet"
        message={canWrite ? "Create a draft invoice, then mark it as sent when it goes to the client." : "Invoices will appear here when they are issued."}
        action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New invoice</Button> : null}
      />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Invoices" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Invoice</th>
              <SortHeader label="Status" field="status" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Due" field="dueDate" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Total" field="total" sort={sort} onSort={set(setSort)} firstDir="desc" align="right" />
              <SortHeader label="Balance" field="balance" sort={sort} onSort={set(setSort)} firstDir="desc" align="right" />
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading invoices" />
            ) : (
              items.map((inv) => {
                const late = overdueDays(inv);
                const name = inv.number || "Draft invoice";
                const actions = [
                  { key: "open", label: "Open invoice", icon: ExternalLink, onSelect: () => nav(`/portal/billing/${inv._id}`) },
                  canWrite && inv.status === "draft" ? { key: "sent", label: "Mark as sent", icon: Send, onSelect: () => setPending({ kind: "sent", invoice: inv }) } : null,
                  canWrite && !["paid", "void"].includes(inv.status) ? { key: "paid", label: "Mark as paid", icon: CheckCircle2, onSelect: () => setPending({ kind: "paid", invoice: inv }) } : null,
                  canWrite && inv.status !== "void" ? { key: "sep", separator: true } : null,
                  canWrite && inv.status !== "void" ? { key: "void", label: "Void invoice", icon: Ban, tone: "muted", onSelect: () => setPending({ kind: "void", invoice: inv }) } : null,
                ];
                return (
                  <tr
                    key={inv._id}
                    data-clickable="true"
                    onClick={(e) => {
                      if (e.target.closest("a, button, [role='menu']")) return;
                      nav(`/portal/billing/${inv._id}`);
                    }}
                  >
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/billing/${inv._id}`}>{name}</Link>
                        <span>{[inv.customerId?.companyName, inv.projectId?.name || inv.projectId?.title].filter(Boolean).join(", ") || "No client"}</span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={INVOICE_STATUS_TONE[inv.status] || "neutral"} dot={inv.status !== "draft"}>
                          {INVOICE_STATUS_LABEL[inv.status] || inv.status}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Due">
                      {inv.dueDate ? (
                        <span className="px-due">
                          <span className="px-num">{date(inv.dueDate)}</span>
                          {late ? <small data-tone="bad">{late} day{late === 1 ? "" : "s"} past due</small> : null}
                        </span>
                      ) : (
                        <span className="px-muted">No due date</span>
                      )}
                    </td>
                    <td data-label="Total" className="px-num">{money(inv.total, inv.currency)}</td>
                    <td data-label="Balance" className="px-num">
                      {inv.status === "void" ? <span className="px-muted">Void</span> : money(inv.balance, inv.currency)}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={name} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "invoice" : "invoices"} label="Invoice pages" /> : null}
      </>
    );

  const copy = pending ? invoiceActionCopy(pending.kind, pending.invoice) : null;

  return (
    <>
      <PageFrame
        title="Billing"
        description={access.isInternal ? "Invoices, payments and what is still owed." : "Your invoices and payments."}
        breadcrumb={[{ label: "Billing" }]}
        secondaryActions={
          <>
            {canWrite ? (
              <Button variant="outline" onClick={() => setPending({ kind: "overdue", invoice: null })}>
                <Clock size={14} aria-hidden="true" />
                Mark overdue
              </Button>
            ) : null}
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={
          canWrite ? (
            <Button onClick={() => { setFormError(""); setCreateOpen(true); }}>
              <Plus size={14} aria-hidden="true" />
              New invoice
            </Button>
          ) : null
        }
      >
        <MetricsStrip label="Billing summary" items={metrics} />
        <Panel flush bare label="Invoice list" className="px-list-panel">
          {toolbar}
          {resultBar}
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? (
        <>
          <InvoiceFormDialog
            open={createOpen}
            mode="create"
            busy={formBusy}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={async (payload) => {
              setFormBusy(true);
              setFormError("");
              try {
                const res = await createInvoice(payload);
                toast.success(`Draft invoice ${res?.item?.number || ""} created.`.replace("  ", " "));
                setCreateOpen(false);
                const id = res?.item?._id;
                if (id) nav(`/portal/billing/${id}`);
                else await refresh();
              } catch (e) {
                setFormError(e?.response?.data?.message || "The invoice wasn't created. Check the details and try again.");
              } finally {
                setFormBusy(false);
              }
            }}
          />
          <ConfirmDialog
            open={Boolean(pending)}
            icon={copy?.icon || FileText}
            tone={copy?.tone}
            danger={copy?.danger}
            title={copy?.title}
            confirmLabel={copy?.confirm}
            details={copy?.details}
            onClose={() => setPending(null)}
            onConfirm={runAction}
          >
            {copy?.lead}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
