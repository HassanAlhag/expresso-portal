import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ExternalLink, Pencil, Plus, RefreshCw, SearchX, Trash2, X } from "lucide-react";

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

import { listAccounts, createAccount, updateAccount, deleteAccount } from "../api";
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_TONE } from "../format";
import AccountFormModal from "../components/AccountFormModal";

const LIMIT = 12;
const STATUS_FILTERS = [{ value: "", label: "Any status" }, ...ACCOUNT_STATUSES.map((s) => ({ value: s, label: ACCOUNT_STATUS_LABEL[s] }))];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "-name", label: "Name, Z to A" },
  { value: "industry", label: "Industry, A to Z" },
  { value: "-updatedAt", label: "Recently updated" },
];

// CRM accounts (PUI-3): paged on the server (the old page showed only the
// first 50), with real counts per status.
export default function AccountsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { q: dq.trim(), sort, page, limit: LIMIT };
      if (status) params.status = status;
      const res = await listAccounts(params);
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, sort, page]);

  const loadCounts = useCallback(async () => {
    try {
      const entries = await Promise.all(
        ACCOUNT_STATUSES.map(async (s) => [s, Number((await listAccounts({ status: s, limit: 1, page: 1 }))?.total || 0)])
      );
      setCounts(Object.fromEntries(entries));
    } catch {
      setCounts(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([load(), loadCounts()]);
  const filtered = Boolean(dq.trim() || status);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setPage(1);
  };

  const metrics = useMemo(() => {
    if (!counts) return [];
    const toggle = (v) => () => set(setStatus)(status === v ? "" : v);
    return ACCOUNT_STATUSES.map((s) => ({
      key: s,
      label: ACCOUNT_STATUS_LABEL[s],
      value: counts[s],
      note: s === "prospect" ? "Not clients yet" : s === "active" ? "Current relationships" : "Dormant",
      onClick: toggle(s),
      pressed: status === s,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, status]);

  const save = async (fn, ok, after) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(ok);
      after?.(res);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: ACCOUNT_STATUS_LABEL[status] || status, clear: () => set(setStatus)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Accounts didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No accounts match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Building2} title="No accounts yet" message="Accounts are companies in the CRM. They are also created when leads and deals are converted." action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New account</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Accounts" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Account" field="name" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Industry" field="industry" sort={sort} onSort={set(setSort)} className="px-hide-tab" />
              <th scope="col">Status</th>
              <th scope="col">Client</th>
              <th scope="col" className="px-hide-lg px-hide-sm">Country</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading accounts" />
            ) : (
              items.map((a) => {
                const actions = [
                  { key: "open", label: "Open account", icon: ExternalLink, onSelect: () => nav(`/portal/crm/accounts/${a._id}`) },
                  canWrite ? { key: "edit", label: "Edit account", icon: Pencil, onSelect: () => setEditing(a) } : null,
                  a.customerId?._id && access.canOpen("/portal/customers") ? { key: "client", label: "Open client", icon: Building2, onSelect: () => nav(`/portal/customers/${a.customerId._id}`) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete account", icon: Trash2, tone: "muted", onSelect: () => setRemoving(a) } : null,
                ];
                return (
                  <tr key={a._id} data-clickable="true" onClick={(e) => !e.target.closest("a, button, [role='menu']") && nav(`/portal/crm/accounts/${a._id}`)}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/crm/accounts/${a._id}`}>{a.name || "Unnamed account"}</Link>
                        <span>{a.email || a.website || "No contact details"}</span>
                      </div>
                    </td>
                    <td data-label="Industry" className="px-hide-tab">{a.industry || <span className="px-muted">—</span>}</td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={ACCOUNT_STATUS_TONE[a.status] || "neutral"} dot>
                          {ACCOUNT_STATUS_LABEL[a.status] || a.status || "Active"}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Client">{a.customerId?.companyName || <span className="px-muted">Not a client</span>}</td>
                    <td data-label="Country" className="px-hide-lg px-hide-sm">{a.country || <span className="px-muted">—</span>}</td>
                    <td className="px-actions-cell">
                      <RowActions label={a.name || "account"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "account" : "accounts"} label="Accounts pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Accounts"
        description="Companies in the CRM, with their contacts and deals."
        breadcrumb={[{ label: "CRM", to: "/portal/crm" }, { label: "Accounts" }]}
        secondaryActions={<Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh</Button>}
        primaryAction={canWrite ? <Button onClick={() => setCreateOpen(true)} disabled={busy}><Plus size={14} aria-hidden="true" />New account</Button> : null}
      >
        <MetricsStrip label="Accounts by status" items={metrics} />
        <Panel flush bare label="Account list" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter accounts">
            <SearchField label="Search accounts" value={q} onChange={setQ} placeholder="Name, email, industry or website" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={STATUS_FILTERS} />
            <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading accounts…" : error ? "Accounts unavailable" : `${meta.total} account${meta.total === 1 ? "" : "s"}`}</span>
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

      {canWrite ? (
        <>
          <AccountFormModal open={createOpen} mode="create" busy={busy} onClose={() => setCreateOpen(false)} onSubmit={(p) => save(() => createAccount(p), "Account created.", () => setCreateOpen(false))} />
          <AccountFormModal open={Boolean(editing)} mode="edit" initial={editing} busy={busy} onClose={() => setEditing(null)} onSubmit={(p) => save(() => updateAccount(editing._id, p), "Account updated.", () => setEditing(null))} />
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={Boolean(removing)}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this account permanently?"
          confirmLabel="Delete account"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await deleteAccount(removing._id);
              toast.success("Account deleted.");
              setRemoving(null);
              await refresh();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The account wasn't deleted. Try again.");
            }
          }}
          details={[
            "The account is erased and can't be restored.",
            "Its contacts, deals and activities are not deleted; they lose their link to this account.",
            ...(removing?.customerId ? ["The linked client stays, with a link to an account that no longer exists."] : []),
          ]}
        >
          {removing?.name}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
