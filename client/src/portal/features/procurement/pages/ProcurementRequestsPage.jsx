import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Inbox, Plus, RefreshCw, SearchX, Trash2, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { createRequest, deleteRequest, getProcurementStats, listRequests } from "../api";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_TONE, REQUEST_STATUSES, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, REQUEST_DELETE_DETAILS, clientName, date, money, options, requestRef } from "../format";
import RequestFormDialog from "../components/RequestFormDialog";

const LIMIT = 15;

export function buildRequestParams({ q, status, priority, page }) {
  const p = { page, limit: LIMIT };
  if (q) p.q = q;
  if (status) p.status = status;
  if (priority) p.priority = priority;
  return p;
}

// Procurement requests (PUI-4, procurement.read). Staff see every client's
// requests; client users see their own company's (the API scopes the list,
// the stats and every action, and strips internal fields for them).
export default function ProcurementRequestsPage() {
  const toast = useToast();
  const nav = useNavigate();
  const access = useAccess();
  const canWrite = access.can("procurement.write");
  const canDelete = access.can("procurement.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRequests(buildRequestParams({ q: dq.trim(), status, priority, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, priority, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getProcurementStats());
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
  const filtered = Boolean(dq.trim() || status || priority);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setPriority("");
    setPage(1);
  };

  const metrics = useMemo(() => {
    if (!stats?.byStatus) return [];
    const by = stats.byStatus;
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      { key: "new", label: "New", value: by.new || 0, note: "Not picked up yet", noteTone: by.new ? "warn" : undefined, onClick: toggle("new"), pressed: status === "new" },
      { key: "assessing", label: "Assessing or quoted", value: (by.assessing || 0) + (by.quoted || 0), note: `${by.assessing || 0} assessing, ${by.quoted || 0} quoted` },
      { key: "ordered", label: "Approved or ordered", value: (by.approved || 0) + (by.ordered || 0), note: `${by.ordered || 0} ordered` },
      { key: "delivered", label: "Delivered", value: by.delivered || 0, note: `${stats.total || 0} requests in all`, onClick: toggle("delivered"), pressed: status === "delivered" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, status]);

  const create = async (payload) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const res = await createRequest(payload);
      toast.success("Request created.");
      setFormOpen(false);
      if (res?.item?._id) nav(`/portal/procurement/requests/${res.item._id}`);
      else await refresh();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The request wasn't created. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await deleteRequest(removing._id);
      toast.success("Request deleted.");
      setRemoving(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The request wasn't deleted. Try again.");
    }
  };

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: REQUEST_STATUS_LABEL[status], clear: () => set(setStatus)("") },
    priority && { key: "p", label: `${PRIORITY_LABEL[priority]} priority`, clear: () => set(setPriority)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Requests didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No requests match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Inbox} title="No procurement requests yet" message={access.isInternal ? "Requests that clients send, or that you log for them, appear here." : "Requests you send to Expresso appear here."} action={canWrite ? <Button onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />New request</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Procurement requests" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col" className="px-hide-tab">Category</th>
              <th scope="col">Priority</th>
              <th scope="col" className="px-num px-hide-tab">Budget</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading requests" />
            ) : (
              items.map((r) => {
                const deletable = canDelete && ["new", "cancelled"].includes(r.status);
                const actions = [
                  { key: "open", label: "Open request", icon: ExternalLink, onSelect: () => nav(`/portal/procurement/requests/${r._id}`) },
                  deletable ? { key: "sep", separator: true } : null,
                  deletable ? { key: "delete", label: "Delete request", icon: Trash2, tone: "muted", onSelect: () => setRemoving(r) } : null,
                ];
                return (
                  <tr key={r._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/procurement/requests/${r._id}`}>{r.title || "Untitled request"}</Link>
                        <span>{[requestRef(r), access.isInternal ? clientName(r) : null, date(r.createdAt)].filter(Boolean).join(", ")}</span>
                      </div>
                    </td>
                    <td data-label="Category" className="px-hide-tab">{r.categoryId?.name || "—"}</td>
                    <td data-label="Priority">
                      <Badge tone={PRIORITY_TONE[r.priority] || "neutral"}>{PRIORITY_LABEL[r.priority] || r.priority || "Normal"}</Badge>
                    </td>
                    <td data-label="Budget" className="px-num px-hide-tab">{r.budget ? money(r.budget, r.currency) : "—"}</td>
                    <td data-label="Status">
                      <Badge tone={REQUEST_STATUS_TONE[r.status] || "neutral"} dot>{REQUEST_STATUS_LABEL[r.status] || r.status}</Badge>
                      {access.isInternal && r.assignedTo ? <small className="px-muted" style={{ display: "block", marginTop: 4 }}>{r.assignedTo.fullName || r.assignedTo.email}</small> : null}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={r.title || "request"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="requests" label="Request pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Procurement requests"
        description={access.isInternal ? "What clients have asked Expresso to source, newest first." : "What your company has asked Expresso to source, newest first."}
        breadcrumb={[{ label: "Procurement", to: access.canOpen("/portal/procurement") ? "/portal/procurement" : undefined }, { label: "Requests" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />New request</Button> : null}
      >
        <MetricsStrip label="Request summary" items={metrics} />
        <Panel flush bare label="Requests" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter requests">
            <SearchField label="Search requests" value={q} onChange={setQ} placeholder="Title or reference" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={[{ value: "", label: "Any status" }, ...options(REQUEST_STATUSES, REQUEST_STATUS_LABEL)]} />
            <SelectField label="Priority" value={priority} onChange={set(setPriority)} options={[{ value: "", label: "Any priority" }, ...options(PRIORITIES, PRIORITY_LABEL)]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading requests…" : error ? "Requests unavailable" : `${meta.total} request${meta.total === 1 ? "" : "s"}, newest first`}</span>
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

      {canWrite ? <RequestFormDialog open={formOpen} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSubmit={create} /> : null}
      <ConfirmDialog open={Boolean(removing)} icon={Trash2} tone="bad" danger title="Delete this request?" confirmLabel="Delete request" details={REQUEST_DELETE_DETAILS} onClose={() => setRemoving(null)} onConfirm={remove}>
        {removing ? `${removing.title} (${requestRef(removing)}).` : ""}
      </ConfirmDialog>
    </>
  );
}
