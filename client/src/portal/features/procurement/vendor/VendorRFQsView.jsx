import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, RefreshCw, SearchX, Send } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import SearchField from "../../../shared/ui/SearchField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listRfqs } from "../api";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, date } from "../format";

const LIMIT = 15;
const TABS = [
  { id: "open", label: "Open RFQs", icon: FileText },
  { id: "quoted", label: "Your quotations", icon: Send },
];

export function buildVendorRfqParams({ view, q, page }) {
  const p = { page, limit: LIMIT };
  if (view === "quoted") p.quoted = "true";
  if (q) p.q = q;
  return p;
}

export function deadlineNote(deadline, now = new Date()) {
  if (!deadline) return "No deadline";
  const days = Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000);
  if (days < 0) return `Closed for quotes on ${date(deadline)}`;
  if (days === 0) return "Due today";
  return `${date(deadline)}, ${days} day${days === 1 ? "" : "s"} left`;
}

// RFQs, vendor view (PUI-5). "Open RFQs" are published RFQs in the vendor's
// approved categories; "Your quotations" are the RFQs the vendor has quoted
// on, also after they close. The API applies both rules (R2) and returns
// only vendor-safe fields and the vendor's own quotation status.
export default function VendorRFQsView() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "quoted" ? "quoted" : "open";
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRfqs(buildVendorRfqParams({ view, q: dq.trim(), page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [view, dq, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [dq, view]);

  const switchTo = (id) => setParams(id === "quoted" ? { view: "quoted" } : {}, { replace: true });

  let content;
  if (error) content = <ErrorState title="RFQs didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = dq.trim() ? (
      <EmptyState icon={SearchX} title="No RFQs match that search" action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>} />
    ) : view === "quoted" ? (
      <EmptyState icon={Send} title="You haven't sent any quotations yet" message="Quote on an open RFQ and it appears here, with its status." />
    ) : (
      <EmptyState icon={FileText} title="No open RFQs in your categories" message="When Expresso publishes an RFQ in one of your approved categories, it appears here." />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label={view === "quoted" ? "Your quotations" : "Open RFQs"} aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">RFQ</th>
              <th scope="col" className="px-hide-tab">Categories</th>
              <th scope="col">Deadline</th>
              {view === "quoted" ? <th scope="col" className="px-hide-tab">RFQ status</th> : null}
              <th scope="col">Your quotation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={view === "quoted" ? 5 : 4} label="Loading RFQs" />
            ) : (
              items.map((r) => {
                const cats = (r.subcategoryIds || []).filter((c) => typeof c === "object");
                return (
                  <tr key={r._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/procurement/rfqs/${r._id}`}>{r.title || "Untitled RFQ"}</Link>
                        <span>{r.rfqNumber}</span>
                      </div>
                    </td>
                    <td data-label="Categories" className="px-hide-tab">{cats.map((c) => c.name).join(", ") || "—"}</td>
                    <td data-label="Deadline">{deadlineNote(r.deadline)}</td>
                    {view === "quoted" ? (
                      <td data-label="RFQ status" className="px-hide-tab">
                        <Badge tone={RFQ_STATUS_TONE[r.status] || "neutral"}>{RFQ_STATUS_LABEL[r.status] || r.status}</Badge>
                      </td>
                    ) : null}
                    <td data-label="Your quotation">
                      {r.myQuotationStatus ? <Badge tone={QUOTE_STATUS_TONE[r.myQuotationStatus] || "neutral"} dot>{QUOTE_STATUS_LABEL[r.myQuotationStatus] || r.myQuotationStatus}</Badge> : <Badge tone="warn">Not quoted</Badge>}
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
      description="Requests for quotation in your approved categories, and the quotations you've sent."
      breadcrumb={[{ label: "RFQs" }]}
      secondaryActions={
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      <TabBar idPrefix="vrfq" label="RFQ lists" value={view} onChange={switchTo} tabs={TABS} />
      <TabPanel idPrefix="vrfq" id={view} className="px-tabpanel--spaced">
        <Panel flush bare label={view === "quoted" ? "Your quotations" : "Open RFQs"} className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Search RFQs">
            <SearchField label="Search RFQs" value={q} onChange={setQ} placeholder="Title, number or description" />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading RFQs…" : error ? "RFQs unavailable" : `${meta.total} RFQ${meta.total === 1 ? "" : "s"}`}</span>
          </div>
          {content}
        </Panel>
      </TabPanel>
    </PageFrame>
  );
}
