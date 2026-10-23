import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LifeBuoy, Plus, RefreshCw, SearchX, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { createTicket, getTicketStats, listTickets } from "../api";
import { EXTERNAL_TICKET_TYPES, TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_TYPE_LABEL, TERMINAL_TICKET_STATUSES, countStatuses, date, ticketStatusLabel } from "../format";
import ClientTicketFormDialog from "./ClientTicketFormDialog";

const LIMIT = 12;
const STATUS_FILTERS = [
  { value: "", label: "Any status" },
  ...Object.entries(TICKET_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

export function buildClientTicketParams({ q, status, type, page }) {
  const p = { page, limit: LIMIT, sort: "-lastActivityAt" };
  if (q) p.q = q;
  if (status) p.status = status;
  if (type) p.type = type;
  return p;
}

// Support requests, client and vendor view (PUI-5). The API returns only the
// user's company's requests (or their own, without a company), never
// internal tickets, and never internal comments.
export default function ClientTicketsList() {
  const toast = useToast();
  const nav = useNavigate();
  const access = useAccess();
  const canWrite = access.can("tickets.write");
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [formOpen, setFormOpen] = useState(() => canWrite && params.get("new") === "1");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTickets(buildClientTicketParams({ q: dq.trim(), status, type, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, type, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getTicketStats());
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

  const by = stats?.byStatus;
  const metrics = useMemo(() => {
    if (!by) return [];
    const toggle = (v) => () => {
      setStatus(status === v ? "" : v);
      setPage(1);
    };
    return [
      { key: "open", label: "Open", value: countStatuses(by), note: "Not resolved yet" },
      { key: "waiting", label: "Waiting for you", value: by.waiting_client || 0, note: "Expresso needs your reply", noteTone: by.waiting_client ? "warn" : undefined, onClick: toggle("waiting_client"), pressed: status === "waiting_client" },
      { key: "done", label: "Resolved or closed", value: countStatuses(by, TERMINAL_TICKET_STATUSES), note: "Finished requests" },
    ];
  }, [by, status]);

  const closeForm = () => {
    setFormOpen(false);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const create = async (payload) => {
    setBusy(true);
    setFormError("");
    try {
      const res = await createTicket(payload);
      toast.success("Request sent. Expresso will reply here.");
      closeForm();
      if (res?.item?._id) nav(`/portal/tickets/${res.item._id}`);
      else await Promise.all([load(), loadStats()]);
    } catch (e) {
      setFormError(e?.response?.data?.message || "The request wasn't sent. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = Boolean(dq.trim() || status || type);
  const clear = () => {
    setQ("");
    setStatus("");
    setType("");
    setPage(1);
  };

  let content;
  if (error) content = <ErrorState title="Your requests didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No requests match these filters" action={<Button variant="outline" onClick={clear}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={LifeBuoy} title="No support requests yet" message="Ask for help, report a problem or request a change. Expresso replies here." action={canWrite ? <Button onClick={() => setFormOpen(true)}><Plus size={14} aria-hidden="true" />New request</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Support requests" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Status</th>
              <th scope="col" className="px-num px-hide-tab">Last update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={3} label="Loading your requests" />
            ) : (
              items.map((t) => (
                <tr key={t._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/tickets/${t._id}`}>{t.title || "Support request"}</Link>
                      <span>{[t.ref, TICKET_TYPE_LABEL[t.type], `opened ${date(t.createdAt)}`].filter(Boolean).join(", ")}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <Badge tone={TICKET_STATUS_TONE[t.status] || "neutral"} dot>{ticketStatusLabel(t.status)}</Badge>
                  </td>
                  <td data-label="Last update" className="px-num px-hide-tab">{date(t.lastActivityAt || t.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="requests" label="Request pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Support requests"
        description="Questions, problems and change requests you've sent to Expresso, newest activity first."
        breadcrumb={[{ label: "Support requests" }]}
        secondaryActions={
          <Button variant="outline" onClick={() => Promise.all([load(), loadStats()])} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={14} aria-hidden="true" />New request</Button> : null}
      >
        <MetricsStrip label="Your requests" items={metrics} />
        <Panel flush bare label="Support requests" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter requests">
            <SearchField label="Search requests" value={q} onChange={setQ} placeholder="Subject, details or reference" />
            <SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_FILTERS} />
            <SelectField label="Kind" value={type} onChange={(v) => { setType(v); setPage(1); }} options={[{ value: "", label: "Any kind" }, ...EXTERNAL_TICKET_TYPES.map(({ value, label }) => ({ value, label }))]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading your requests…" : error ? "Requests unavailable" : `${meta.total} request${meta.total === 1 ? "" : "s"}`}</span>
            {filtered ? (
              <div className="px-active-filters">
                <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={clear}>
                  Clear filters
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
          {content}
        </Panel>
      </PageFrame>
      {canWrite ? <ClientTicketFormDialog open={formOpen} busy={busy} error={formError} onClose={closeForm} onSubmit={create} /> : null}
    </>
  );
}
