import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, Handshake, Plus, RefreshCw, UserRound } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import AttentionList from "../../../shared/ui/AttentionList";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import { useAccess } from "../../../shared/hooks/useAccess";

import { DEAL_STAGE_LABEL, LEAD_STATUS_LABEL, LEAD_STATUS_TONE, ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_TONE, compactMoney, entityPath, leadSourceLabel } from "../format";
import { loadCrmOverview, deriveCrmOverview } from "../lib/dashboardData";
import { formatDate } from "../../projects/format";
import LeadFormModal from "../components/LeadFormModal";
import { createLead } from "../api";
import { useToast } from "../../../shared/ui/Toast";

const KIND_ICON = { overdue: AlertTriangle, won: Handshake, lead: UserRound };

// CRM overview (PUI-3): what needs action in sales, where the pipeline
// stands, and what came in recently. Staff only.
export default function CRMDashboardPage() {
  const access = useAccess();
  const toast = useToast();
  const canWrite = access.can("crm.write");
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      setData(await loadCrmOverview());
      setState("ready");
    } catch {
      setState("failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const view = useMemo(() => (data ? deriveCrmOverview(data) : null), [data]);

  const metrics = view
    ? [
        { key: "leads", label: "Open leads", value: view.openLeads, note: `${data.leads.qualified || 0} qualified`, to: "/portal/crm/leads" },
        {
          key: "deals",
          label: "Open deals",
          value: view.summary.open,
          note: view.summary.openValue === null ? "Value not totalled: too many to add up here" : `${compactMoney(view.summary.openValue)} in the pipeline`,
          to: "/portal/crm/deals",
        },
        { key: "won", label: "Won deals", value: view.summary.won, note: view.summary.wonValue === null ? "Value not totalled" : compactMoney(view.summary.wonValue), noteTone: "ok", to: "/portal/crm/deals" },
        { key: "accounts", label: "Accounts", value: data.accountTotal, note: "Companies in the CRM", to: "/portal/crm/accounts" },
      ]
    : [];

  return (
    <>
      <PageFrame
        title="Sales overview"
        description="Follow-ups that need action, the pipeline by stage, and the newest leads and accounts."
        breadcrumb={[{ label: "CRM" }]}
        secondaryActions={<Button variant="outline" onClick={load} disabled={state === "loading"}><RefreshCw size={14} className={state === "loading" ? "animate-spin" : ""} aria-hidden="true" />Refresh</Button>}
        primaryAction={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New lead</Button> : null}
      >
        {state === "failed" ? (
          <ErrorState title="The sales overview didn't load" onRetry={load} />
        ) : state === "loading" && !view ? (
          <LoadingState rows={6} label="Loading the sales overview" />
        ) : (
          <>
            <MetricsStrip label="Sales summary" items={metrics} />
            <div className="px-grid px-cols-main">
              <div className="px-stack">
                <Panel title="Needs your attention" sub="Overdue follow-ups first" flush>
                  <AttentionList
                    items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                    empty={
                      <div className="px-inline-empty">
                        <CheckCircle2 size={18} aria-hidden="true" />
                        <span>No overdue follow-ups, won deals waiting or qualified leads.</span>
                      </div>
                    }
                  />
                </Panel>

                <Panel title="Pipeline by stage" sub="Every deal, counted from the CRM" flush action={<Link className="px-link" to="/portal/crm/deals">All deals</Link>}>
                  <ul className="px-list">
                    {view.pipeline.map((p) => (
                      <li key={p.stage}>
                        <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                          <div className="px-t">{DEAL_STAGE_LABEL[p.stage]}</div>
                          <div className="px-bar" data-tone={p.stage === "won" ? "ok" : p.stage === "lost" ? "bad" : undefined} aria-hidden="true">
                            <i style={{ width: `${Math.round(p.share * 100)}%` }} />
                          </div>
                        </div>
                        <div className="px-r">
                          <b>{p.count}</b>
                          <span>{p.value === null ? "Value not totalled" : compactMoney(p.value)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel title="Newest leads" flush action={<Link className="px-link" to="/portal/crm/leads">All leads</Link>}>
                  {data.recentLeads.length ? (
                    <ul className="px-list px-cap-m3">
                      {data.recentLeads.map((l) => (
                        <li key={l._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              <Link to={`/portal/crm/leads/${l._id}`}>{l.fullName || "Unnamed lead"}</Link>
                            </div>
                            <div className="px-s">{[l.companyName, leadSourceLabel(l.source), formatDate(l.createdAt, { year: false })].filter(Boolean).join(", ")}</div>
                          </div>
                          <div className="px-r">
                            <Badge tone={LEAD_STATUS_TONE[l.status] || "neutral"} dot>
                              {LEAD_STATUS_LABEL[l.status] || l.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <UserRound size={18} aria-hidden="true" />
                      <span>No leads yet.</span>
                    </div>
                  )}
                </Panel>
              </div>

              <div className="px-stack">
                <Panel title="Follow-ups this week" sub={view.overdueCount ? `${view.overdueCount} overdue` : "Due in the next 7 days"} flush>
                  {view.dueSoon.length ? (
                    <ul className="px-list px-cap-m3">
                      {view.dueSoon.map((a) => (
                        <li key={a._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              {entityPath(a.entityType, a.entityId) ? <Link to={entityPath(a.entityType, a.entityId)}>{a.subject || "Follow-up"}</Link> : a.subject || "Follow-up"}
                            </div>
                            <div className="px-s">{[a.entityType ? `On a ${a.entityType}` : null, a.assignedTo?.fullName].filter(Boolean).join(", ")}</div>
                          </div>
                          <div className="px-r">
                            <span>
                              <CalendarClock size={13} aria-hidden="true" /> {formatDate(a.dueAt, { year: false })}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <CalendarClock size={18} aria-hidden="true" />
                      <span>Nothing due in the next 7 days.</span>
                    </div>
                  )}
                  {!view.pendingComplete ? <p className="px-muted" style={{ margin: "0 20px 14px", fontSize: 13 }}>Showing the first 200 open follow-ups by due date.</p> : null}
                </Panel>

                <Panel title="Newest accounts" flush action={<Link className="px-link" to="/portal/crm/accounts">All accounts</Link>}>
                  {data.accounts.length ? (
                    <ul className="px-list px-cap-m3">
                      {data.accounts.map((a) => (
                        <li key={a._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              <Link to={`/portal/crm/accounts/${a._id}`}>{a.name || "Unnamed account"}</Link>
                            </div>
                            <div className="px-s">{a.customerId?.companyName ? `Client: ${a.customerId.companyName}` : a.industry || "No industry"}</div>
                          </div>
                          <div className="px-r">
                            <Badge tone={ACCOUNT_STATUS_TONE[a.status] || "neutral"} dot>
                              {ACCOUNT_STATUS_LABEL[a.status] || a.status || "Active"}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <Building2 size={18} aria-hidden="true" />
                      <span>No accounts yet.</span>
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </>
        )}
      </PageFrame>

      {canWrite ? (
        <LeadFormModal
          open={createOpen}
          mode="create"
          busy={busy}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              await createLead(payload);
              toast.success("Lead created.");
              setCreateOpen(false);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The lead wasn't created. Check the details and try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
