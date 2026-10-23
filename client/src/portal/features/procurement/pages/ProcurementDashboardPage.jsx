import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileText, Inbox, RefreshCw, Store } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import AttentionList from "../../../shared/ui/AttentionList";
import Alert from "../../../shared/ui/Alert";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useAccess } from "../../../shared/hooks/useAccess";

import { loadProcurementOverview, deriveProcurementOverview } from "../lib/overview";
import { PRIORITY_LABEL, PRIORITY_TONE, REQUEST_STATUSES, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, clientName, date, requestRef } from "../format";

const KIND_ICON = { request: Inbox, vendor: Store, rfq: FileText };

// Procurement overview (PUI-4, procurement.read).
export default function ProcurementDashboardPage() {
  const access = useAccess();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadProcurementOverview(access));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.user?._id, access.role]);

  useEffect(() => {
    load();
  }, [load]);

  const view = data ? deriveProcurementOverview(data) : null;
  const s = view?.stats;
  const recent = s?.recentRequests || s?.recent || [];
  const links = [
    access.canOpen("/portal/procurement/requests") && { to: "/portal/procurement/requests", label: "Requests" },
    access.isInternal && access.canOpen("/portal/procurement/rfqs") && { to: "/portal/procurement/rfqs", label: view?.published !== null && view?.published !== undefined ? `RFQs (${view.published} published)` : "RFQs" },
    access.isInternal && access.canOpen("/portal/procurement/vendors") && { to: "/portal/procurement/vendors", label: "Vendors" },
    access.isInternal && access.canOpen("/portal/procurement/categories") && { to: "/portal/procurement/categories", label: "Categories" },
    access.isInternal && access.canOpen("/portal/procurement/vendor-applications") && { to: "/portal/procurement/vendor-applications", label: "Vendor applications" },
  ].filter(Boolean);

  return (
    <PageFrame
      title="Procurement"
      description={access.isInternal ? "Sourcing requests from clients, the RFQs sent to vendors and the vendors who answer them." : "Your company's procurement requests and where each one stands."}
      breadcrumb={[{ label: "Procurement" }]}
      secondaryActions={
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {!view ? (
        <LoadingState rows={6} label="Loading the procurement overview" />
      ) : !s ? (
        <ErrorState title="Procurement figures didn't load" onRetry={load} />
      ) : (
        <>
          {view.failed.length ? (
            <Alert tone="warn" icon={AlertTriangle} title="Some figures didn't load">
              Items that depend on them are left out. Refresh to try again.
            </Alert>
          ) : null}
          <MetricsStrip label="Procurement summary" items={view.metrics} />
          <div className="px-grid px-cols-main">
            <div className="px-stack">
              {access.isInternal ? (
                <Panel title="Needs attention" flush>
                  <AttentionList
                    items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                    empty={
                      <div className="px-inline-empty">
                        <CheckCircle2 size={18} aria-hidden="true" />
                        <span>No new requests, pending applications or unpublished RFQs.</span>
                      </div>
                    }
                  />
                </Panel>
              ) : null}
              <Panel title="Latest requests" flush action={access.canOpen("/portal/procurement/requests") ? <Link className="px-link" to="/portal/procurement/requests">All requests</Link> : null}>
                {recent.length ? (
                  <ul className="px-list">
                    {recent.map((r) => (
                      <li key={r._id}>
                        <div style={{ minWidth: 0 }}>
                          <div className="px-t">
                            <Link to={`/portal/procurement/requests/${r._id}`}>{r.title || "Untitled request"}</Link>
                          </div>
                          <div className="px-s">{[requestRef(r), access.isInternal ? clientName(r) : null, date(r.createdAt)].filter(Boolean).join(", ")}</div>
                        </div>
                        <div className="px-r" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {r.priority && r.priority !== "normal" ? <Badge tone={PRIORITY_TONE[r.priority]}>{PRIORITY_LABEL[r.priority] || r.priority}</Badge> : null}
                          <Badge tone={REQUEST_STATUS_TONE[r.status] || "neutral"} dot>{REQUEST_STATUS_LABEL[r.status] || r.status}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-inline-empty">
                    <Inbox size={18} aria-hidden="true" />
                    <span>No procurement requests yet.</span>
                  </div>
                )}
              </Panel>
            </div>
            <div className="px-stack">
              <Panel title="Requests by status" sub="Every request" flush>
                <ul className="px-list">
                  {REQUEST_STATUSES.map((st) => (
                    <li key={st}>
                      <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                        <div className="px-t">{REQUEST_STATUS_LABEL[st]}</div>
                        <div className="px-bar" data-tone={st === "delivered" ? "ok" : undefined} aria-hidden="true">
                          <i style={{ width: `${s.total ? Math.round(((s.byStatus?.[st] || 0) / s.total) * 100) : 0}%` }} />
                        </div>
                      </div>
                      <div className="px-r">
                        <b>{s.byStatus?.[st] || 0}</b>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
              {links.length > 1 ? (
                <Panel title="Go to" flush>
                  <ul className="px-list">
                    {links.map((l) => (
                      <li key={l.to}>
                        <Link className="px-link" to={l.to}>{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </div>
          </div>
        </>
      )}
    </PageFrame>
  );
}
