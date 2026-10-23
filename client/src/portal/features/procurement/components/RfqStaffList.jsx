import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, FileText, Pencil, Plus, RefreshCw, SearchX, X } from "lucide-react";

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
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listRfqs } from "../api";
import { RFQ_STATUSES, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, date, options } from "../format";

const LIMIT = 15;
const NOTES = { draft: "Visible to staff only", published: "Open to matched vendors", closed: "No longer taking quotes", awarded: "A quotation was accepted" };

export function buildRfqParams({ q, status, page }) {
  const p = { page, limit: LIMIT };
  if (q) p.q = q;
  if (status) p.status = status;
  return p;
}

// RFQs, staff view (PUI-4, internal, procurement.read).
export default function RfqStaffList() {
  const nav = useNavigate();
  const access = useAccess();
  const canWrite = access.can("procurement.write");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRfqs(buildRfqParams({ q: dq.trim(), status, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, page]);

  const loadCounts = useCallback(async () => {
    try {
      const res = await Promise.all(RFQ_STATUSES.map((s) => listRfqs({ status: s, limit: 1 })));
      setCounts(Object.fromEntries(RFQ_STATUSES.map((s, i) => [s, Number(res[i]?.total ?? 0)])));
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

  const refresh = () => Promise.all([load(), loadCounts()]);
  const metrics = counts
    ? RFQ_STATUSES.map((s) => ({ key: s, label: RFQ_STATUS_LABEL[s], value: counts[s], note: NOTES[s], noteTone: s === "draft" && counts[s] ? "warn" : undefined, onClick: () => { setStatus(status === s ? "" : s); setPage(1); }, pressed: status === s }))
    : [];

  let content;
  if (error) content = <ErrorState title="RFQs didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = dq.trim() || status ? (
      <EmptyState icon={SearchX} title="No RFQs match these filters" action={<Button variant="outline" onClick={() => { setQ(""); setStatus(""); setPage(1); }}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={FileText} title="No RFQs yet" message="Create one here, or from a procurement request." action={canWrite ? <Button onClick={() => nav("/portal/procurement/rfqs/new")}><Plus size={14} aria-hidden="true" />New RFQ</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="RFQs" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">RFQ</th>
              <th scope="col" className="px-hide-tab">Categories</th>
              <th scope="col" className="px-num">Deadline</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={5} label="Loading RFQs" />
            ) : (
              items.map((r) => {
                const cats = (r.subcategoryIds || []).filter((c) => typeof c === "object");
                const actions = [
                  { key: "open", label: "Open RFQ", icon: ExternalLink, onSelect: () => nav(`/portal/procurement/rfqs/${r._id}`) },
                  canWrite && r.status === "draft" ? { key: "edit", label: "Edit draft", icon: Pencil, onSelect: () => nav(`/portal/procurement/rfqs/${r._id}/edit`) } : null,
                ];
                return (
                  <tr key={r._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/procurement/rfqs/${r._id}`}>{r.title || "Untitled RFQ"}</Link>
                        <span>{[r.rfqNumber, r.createdBy?.fullName ? `by ${r.createdBy.fullName}` : null, date(r.createdAt)].filter(Boolean).join(", ")}</span>
                      </div>
                    </td>
                    <td data-label="Categories" className="px-hide-tab">{cats.length ? `${cats.slice(0, 2).map((c) => c.name).join(", ")}${cats.length > 2 ? ` and ${cats.length - 2} more` : ""}` : "—"}</td>
                    <td data-label="Deadline" className="px-num">{date(r.deadline) || "Open"}</td>
                    <td data-label="Status">
                      <Badge tone={RFQ_STATUS_TONE[r.status] || "neutral"} dot>{RFQ_STATUS_LABEL[r.status] || r.status}</Badge>
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={r.rfqNumber || r.title || "RFQ"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="RFQs" label="RFQ pages" /> : null}
      </>
    );

  return (
    <PageFrame
      title="RFQs"
      description="Requests for quotation sent to vendors, and where each one stands."
      breadcrumb={[{ label: "Procurement", to: access.canOpen("/portal/procurement") ? "/portal/procurement" : undefined }, { label: "RFQs" }]}
      secondaryActions={
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      }
      primaryAction={canWrite ? <Button onClick={() => nav("/portal/procurement/rfqs/new")}><Plus size={14} aria-hidden="true" />New RFQ</Button> : null}
    >
      <MetricsStrip label="RFQ summary" items={metrics} />
      <Panel flush bare label="RFQs" className="px-list-panel">
        <div className="px-toolbar" role="search" aria-label="Filter RFQs">
          <SearchField label="Search RFQs" value={q} onChange={setQ} placeholder="Title, number or description" />
          <SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "Any status" }, ...options(RFQ_STATUSES, RFQ_STATUS_LABEL)]} />
        </div>
        <div className="px-result-bar">
          <span aria-live="polite">{loading ? "Loading RFQs…" : error ? "RFQs unavailable" : `${meta.total} RFQ${meta.total === 1 ? "" : "s"}, newest first`}</span>
          {dq.trim() || status ? (
            <div className="px-active-filters">
              <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={() => { setQ(""); setStatus(""); setPage(1); }}>
                Clear filters
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
        {content}
      </Panel>
    </PageFrame>
  );
}
