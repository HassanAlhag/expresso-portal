import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Handshake,
  LayoutGrid,
  ReceiptText,
  ShoppingCart,
  Ticket,
  Users,
} from "lucide-react";

import Briefing from "../../../shared/ui/Briefing";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import Panel from "../../../shared/ui/Panel";
import AttentionList from "../../../shared/ui/AttentionList";
import Timeline from "../../../shared/ui/Timeline";
import Badge from "../../../shared/ui/Badge";
import Alert from "../../../shared/ui/Alert";
import Button from "../../../shared/ui/Button";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { useAccess } from "../../../shared/hooks/useAccess";
import ProjectStatusPill from "../../projects/components/ProjectStatusPill";
import { dueInfo, formatDate, humanize, projectSubline } from "../../projects/format";
import { SHORTCUTS, compactMoney, deriveStaff, loadStaffDashboard, plannedSources } from "./staffData";

const KIND_ICON = {
  invoice: ReceiptText,
  ticket: Ticket,
  job: ClipboardList,
  project: FolderKanban,
  procurement: ShoppingCart,
  people: Users,
  client: Building2,
  deal: Handshake,
};

const TICKET_TONE = { open: "info", in_progress: "info", waiting: "warn", pending: "warn", resolved: "ok", closed: "idle", done: "ok" };

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(user) {
  const n = String(user?.fullName || "").trim();
  return n ? n.split(/\s+/)[0] : "";
}

function NumberWord(n) {
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  return n <= 10 ? words[n] : String(n);
}

function MoreLink({ to, children }) {
  return to ? (
    <Link className="px-link" to={to}>
      {children}
    </Link>
  ) : null;
}

// Staff dashboard (PUI-2). Answers, in order: what needs me, how the
// business is doing, what is in delivery, and what changed. Sections exist
// only for areas the user's permissions cover.
export default function StaffDashboard() {
  const access = useAccess();
  const planned = useMemo(() => plannedSources(access), [access]);
  const [state, setState] = useState({ loading: true, data: {}, failed: [], requested: [] });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const res = await loadStaffDashboard(access);
    setState({ loading: false, ...res });
  }, [access]);

  useEffect(() => {
    load();
  }, [load]);

  const view = useMemo(() => deriveStaff(state.data, access), [state.data, access]);
  const name = firstName(access.user);
  const hello = `${greeting()}${name ? `, ${name}` : ""}.`;
  const when = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (!planned.length) {
    return (
      <div className="px-stack">
        <Briefing when={when}>{hello} Your dashboard has nothing to show yet.</Briefing>
        <EmptyState
          icon={LayoutGrid}
          title="No dashboard sections for your role"
          message="The dashboard summarises projects, jobs, support, clients, sales, billing, procurement and people. Your role doesn't include any of these yet. Ask an administrator if you need access."
        />
      </div>
    );
  }

  const allFailed = !state.loading && state.requested.length > 0 && state.failed.length === state.requested.length;
  if (allFailed) {
    return (
      <div className="px-stack">
        <Briefing when={when}>{hello}</Briefing>
        <ErrorState title="Your dashboard didn't load" onRetry={load} />
      </div>
    );
  }

  const n = view.attention.length;
  const failedLabels = [...new Set(state.failed.map((f) => f.label))];
  const loaded = (key) => view.has(key);
  const isPlanned = (key) => planned.some((p) => p.key === key);
  const showSide = isPlanned("billing") || isPlanned("deals") || isPlanned("procurement") || isPlanned("expenses") || isPlanned("leaves") || isPlanned("customers");
  const shortcuts = SHORTCUTS.filter((s) => access.canOpen(s.to));
  const goTo = shortcuts.length ? (
    <Panel title="Go to" flush>
      <ul className="px-list px-shortcuts px-shortcuts--grid">
        {shortcuts.map((s) => (
          <li key={s.key}>
            <Link to={s.to}>
              <span>
                <b>{s.label}</b>
                <small>{s.sub}</small>
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  ) : null;

  return (
    <div className="px-stack">
      <Briefing
        when={when}
        links={state.loading ? [] : view.attention.slice(0, 4).filter((a) => a.to).map((a) => ({ label: a.short, to: a.to }))}
      >
        {hello}{" "}
        {state.loading ? (
          "Loading your workspace…"
        ) : n ? (
          <>
            <strong>
              {NumberWord(n)} thing{n === 1 ? "" : "s"}
            </strong>{" "}
            need{n === 1 ? "s" : ""} your attention.
          </>
        ) : (
          "Nothing needs your attention right now."
        )}
      </Briefing>

      {failedLabels.length ? (
        <Alert
          tone="warn"
          icon={AlertTriangle}
          title="Some sections didn't load"
          role="status"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              Try again
            </Button>
          }
        >
          {`${failedLabels.join(", ")} ${failedLabels.length === 1 ? "is" : "are"} missing from this view.`}
        </Alert>
      ) : null}

      {state.loading ? null : <MetricsStrip label="Business summary" items={view.metrics} />}

      <div className={showSide ? "px-grid px-cols-main" : "px-stack"}>
        <div className="px-stack">
          <Panel title="Needs your attention" sub="Most urgent first" flush>
            {state.loading ? (
              <LoadingState rows={3} label="Loading what needs attention" className="px-embedded" />
            ) : (
              <AttentionList
                items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                empty={
                  <div className="px-inline-empty">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>Nothing needs your attention in the areas you can see.</span>
                  </div>
                }
              />
            )}
          </Panel>

          {isPlanned("projects") || isPlanned("jobs") ? (
            <Panel title="Delivery" sub="Active projects, most recently updated" flush action={<MoreLink to={access.canOpen("/portal/projects") ? "/portal/projects" : undefined}>All projects</MoreLink>}>
              {state.loading ? (
                <LoadingState rows={3} label="Loading delivery" className="px-embedded" />
              ) : (
                <>
                  {loaded("projects") ? (
                    view.activeProjects.length ? (
                      <ul className="px-list">
                        {view.activeProjects.map((p) => {
                          const due = dueInfo(p);
                          return (
                            <li key={p._id}>
                              <div style={{ minWidth: 0 }}>
                                <div className="px-t">
                                  <Link to={`/portal/projects/${p._id}`}>{p.name || "Untitled project"}</Link>
                                </div>
                                <div className="px-s">{projectSubline(p)}</div>
                              </div>
                              <div className="px-r">
                                <ProjectStatusPill status={p.status} />
                                <span data-tone={due?.tone || undefined}>{due ? due.text : p.endDate ? formatDate(p.endDate) : "No due date"}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="px-inline-empty">
                        <FolderKanban size={18} aria-hidden="true" />
                        <span>No active projects.</span>
                      </div>
                    )
                  ) : null}
                  {loaded("jobs") ? (
                    <div className="px-subsection">
                      <div className="px-subhead">
                        <h3>Job pipeline</h3>
                        <span className="px-muted">{view.jobsTotal} most recent jobs</span>
                      </div>
                      {view.jobsTotal ? (
                        <>
                          <div className="px-stackbar" role="img" aria-label={view.stageCounts.map((s) => `${s.label} ${s.count}`).join(", ")}>
                            {view.stageCounts.filter((s) => s.count).map((s) => (
                              <i key={s.key} style={{ width: `${(s.count / view.jobsTotal) * 100}%`, background: s.color }} />
                            ))}
                          </div>
                          <ul className="px-legend">
                            {view.stageCounts.map((s) => (
                              <li key={s.key}>
                                <i style={{ background: s.color }} aria-hidden="true" />
                                {s.label}
                                <b>{s.count}</b>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="px-muted" style={{ margin: 0 }}>No jobs yet.</p>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </Panel>
          ) : null}

          {isPlanned("tickets") ? (
            <Panel title="Recent tickets" sub={state.loading ? undefined : `${view.openTicketCount} open`} flush action={<MoreLink to={access.canOpen("/portal/tickets") ? "/portal/tickets" : undefined}>All tickets</MoreLink>}>
              {state.loading ? (
                <LoadingState rows={3} label="Loading tickets" className="px-embedded" />
              ) : view.tickets.length ? (
                <ul className="px-list px-cap-m3">
                  {view.tickets.map((t) => (
                    <li key={t._id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="px-t">
                          <Link to={`/portal/tickets/${t._id}`}>{t.title || t.subject || "Ticket"}</Link>
                        </div>
                        <div className="px-s">{[t.customerId?.companyName, formatDate(t.createdAt)].filter(Boolean).join(", ") || "—"}</div>
                      </div>
                      <div className="px-r">
                        <Badge tone={TICKET_TONE[String(t.status || "open").toLowerCase()] || "neutral"} dot>
                          {humanize(t.status || "open")}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-inline-empty">
                  <Ticket size={18} aria-hidden="true" />
                  <span>No tickets yet.</span>
                </div>
              )}
            </Panel>
          ) : null}

          {!state.loading && view.recent.length ? (
            <Panel title="Recently added" sub="New records in the areas you can see">
              <Timeline
                label="Recently added"
                className="px-cap-m3"
                items={view.recent.map((r) => {
                  const Icon = KIND_ICON[r.kind];
                  return {
                    key: r.key,
                    icon: Icon,
                    tone: "info",
                    dateTime: r.at,
                    when: formatDate(r.at, { year: false }),
                    content: (
                      <>
                        <span className="px-muted">{r.verb}: </span>
                        {r.to ? <Link to={r.to}><b>{r.title}</b></Link> : <b>{r.title}</b>}
                      </>
                    ),
                  };
                })}
              />
            </Panel>
          ) : null}
        </div>

        {showSide ? (
          <div className="px-stack">
            {isPlanned("billing") ? (
              <Panel title="Cash" sub="All invoices, excluding void" action={<MoreLink to={access.canOpen("/portal/billing") ? "/portal/billing" : undefined}>Billing</MoreLink>}>
                {state.loading ? (
                  <LoadingState rows={2} label="Loading billing" className="px-embedded" />
                ) : view.billing ? (
                  <>
                    <div className="px-figs px-figs--tight" style={{ "--px-fig-n": 3 }}>
                      <div className="px-fig">
                        <span>Invoiced</span>
                        <b>AED {compactMoney(view.billing.totalRevenue)}</b>
                      </div>
                      <div className="px-fig">
                        <span>Collected</span>
                        <b>AED {compactMoney(view.billing.totalPaid)}</b>
                      </div>
                      <div className="px-fig">
                        <span>Overdue</span>
                        <b data-tone={Number(view.billing.totalOverdue) > 0 ? "bad" : undefined}>AED {compactMoney(view.billing.totalOverdue)}</b>
                      </div>
                    </div>
                    {Number(view.billing.totalRevenue) > 0 ? (
                      <>
                        <div
                          className="px-bar"
                          data-tone="ok"
                          style={{ marginTop: 16 }}
                          role="img"
                          aria-label={`${Math.round((Number(view.billing.totalPaid) / Number(view.billing.totalRevenue)) * 100)}% collected`}
                        >
                          <i style={{ width: `${Math.min(100, (Number(view.billing.totalPaid) / Number(view.billing.totalRevenue)) * 100)}%` }} />
                        </div>
                        <p className="px-muted px-hide-sm" style={{ margin: "8px 0 0", fontSize: 13 }}>
                          {Math.round((Number(view.billing.totalPaid) / Number(view.billing.totalRevenue)) * 100)}% of the invoiced value has been collected.
                        </p>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="px-muted" style={{ margin: 0 }}>Billing didn't load.</p>
                )}
              </Panel>
            ) : null}

            {isPlanned("deals") ? (
              <Panel
                title="Pipeline"
                sub={state.loading ? undefined : `AED ${compactMoney(view.pipelineValue)} across ${view.openDealCount} open deal${view.openDealCount === 1 ? "" : "s"}`}
                flush
                action={<MoreLink to={access.canOpen("/portal/crm/deals") ? "/portal/crm/deals" : undefined}>CRM</MoreLink>}
              >
                {state.loading ? (
                  <LoadingState rows={2} label="Loading pipeline" className="px-embedded" />
                ) : view.openDeals.length ? (
                  <ul className="px-list px-cap-m2">
                    {view.openDeals.map((d) => (
                      <li key={d._id}>
                        <div style={{ minWidth: 0 }}>
                          <div className="px-t">
                            {access.canOpen("/portal/crm/deals") ? <Link to={`/portal/crm/deals/${d._id}`}>{d.title || "Untitled deal"}</Link> : d.title || "Untitled deal"}
                          </div>
                          <div className="px-s">{[d.customerId?.companyName, humanize(d.stage || "discovery")].filter(Boolean).join(", ")}</div>
                        </div>
                        <div className="px-r">
                          <b>{d.value ? `AED ${compactMoney(d.value)}` : "—"}</b>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-inline-empty">
                    <Handshake size={18} aria-hidden="true" />
                    <span>No open deals.</span>
                  </div>
                )}
              </Panel>
            ) : null}

            {isPlanned("procurement") || isPlanned("expenses") || isPlanned("leaves") ? (
              <Panel title="Operations" sub="Requests waiting on the team">
                {state.loading ? (
                  <LoadingState rows={2} label="Loading operations" className="px-embedded" />
                ) : (
                  <dl className="px-kv px-kv--side px-kv--tight">
                    {loaded("procurement") ? (
                      <>
                        <dt>Procurement</dt>
                        <dd>
                          {view.procurement?.pending || 0} pending, {view.procurement?.inProgress || 0} in progress
                        </dd>
                      </>
                    ) : null}
                    {loaded("expenses") ? (
                      <>
                        <dt>Expenses</dt>
                        <dd>{view.pendingExpenses} pending approval</dd>
                      </>
                    ) : null}
                    {loaded("leaves") ? (
                      <>
                        <dt>Leave</dt>
                        <dd>{view.submittedLeaves} awaiting a decision</dd>
                      </>
                    ) : null}
                  </dl>
                )}
              </Panel>
            ) : null}

            {isPlanned("customers") ? (
              <Panel title="Newest clients" flush action={<MoreLink to={access.canOpen("/portal/customers") ? "/portal/customers" : undefined}>All clients</MoreLink>}>
                {state.loading ? (
                  <LoadingState rows={2} label="Loading clients" className="px-embedded" />
                ) : view.customers.length ? (
                  <ul className="px-list px-cap-m2">
                    {view.customers.map((c) => (
                      <li key={c._id}>
                        <div style={{ minWidth: 0 }}>
                          <div className="px-t">
                            <Link to={`/portal/customers/${c._id}`}>{c.companyName || "Client"}</Link>
                          </div>
                          <div className="px-s">{c.contactName || c.primaryEmail || "—"}</div>
                        </div>
                        <div className="px-r">
                          <Badge tone={c.isActive ? "ok" : "neutral"} dot={Boolean(c.isActive)}>
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-inline-empty">
                    <Building2 size={18} aria-hidden="true" />
                    <span>No clients yet.</span>
                  </div>
                )}
              </Panel>
            ) : null}

            {goTo}
          </div>
        ) : null}
      </div>
      {showSide ? null : goTo}
    </div>
  );
}
