import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardCheck, ReceiptText, RefreshCw } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import AttentionList from "../../../shared/ui/AttentionList";
import Alert from "../../../shared/ui/Alert";
import LoadingState from "../../../shared/ui/LoadingState";
import { useAccess } from "../../../shared/hooks/useAccess";

import { loadHrOverview, deriveHrOverview } from "../lib/hrOverview";
import { humanize } from "../format";

const KIND_ICON = { leave: CalendarDays, expense: ReceiptText, register: ClipboardCheck };

// HR overview (PUI-4): the team at a glance and the decisions waiting.
export default function HRDashboardPage() {
  const access = useAccess();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadHrOverview(access));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.user?._id, access.role]);

  useEffect(() => {
    load();
  }, [load]);

  const view = data ? deriveHrOverview(data, access) : null;
  const links = [
    access.canOpen("/portal/hr/staff") && { to: "/portal/hr/staff", label: "Staff" },
    access.canOpen("/portal/hr/leaves") && { to: "/portal/hr/leaves", label: "Leave" },
    access.canOpen("/portal/hr/expenses") && { to: "/portal/hr/expenses", label: "Expense claims" },
    access.canOpen("/portal/hr/monthly-expenses") && { to: "/portal/hr/monthly-expenses", label: "Monthly expenses" },
  ].filter(Boolean);
  const maxDept = Math.max(1, ...(view?.byDepartment || []).map((d) => d.count || 0));

  return (
    <PageFrame
      title="HR"
      description="The team, and the leave and expense decisions waiting on you."
      breadcrumb={[{ label: "HR" }]}
      secondaryActions={
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {!view ? (
        <LoadingState rows={6} label="Loading the HR overview" />
      ) : (
        <>
          {view.failed.length ? (
            <Alert tone="warn" icon={AlertTriangle} title="Some HR figures didn't load" action={<Button size="sm" variant="outline" onClick={load}>Try again</Button>}>
              Figures that didn't load show a dash instead of a number.
            </Alert>
          ) : null}
          <MetricsStrip label="HR summary" items={view.metrics} />
          <div className="px-grid px-cols-main">
            <div className="px-stack">
              {view.canDecideAny ? (
                <Panel title="Needs your decision" sub="Leave first, then expense claims, oldest first" flush>
                  {view.queueFailed ? (
                    <div className="px-inline-empty">
                      <AlertTriangle size={18} aria-hidden="true" />
                      <span>The approval queue didn't load. Try again.</span>
                    </div>
                  ) : (
                    <AttentionList
                      items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                      empty={
                        <div className="px-inline-empty">
                          <CheckCircle2 size={18} aria-hidden="true" />
                          <span>No leave requests or expense claims are waiting for you.</span>
                        </div>
                      }
                    />
                  )}
                </Panel>
              ) : null}
            </div>
            <div className="px-stack">
              {view.byDepartment.length ? (
                <Panel title="Staff by department" sub={`${view.staffTotal} staff records, every status`} flush>
                  <ul className="px-list">
                    {view.byDepartment.map((d) => (
                      <li key={d.department}>
                        <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                          <div className="px-t">{humanize(d.department)}</div>
                          <div className="px-bar" aria-hidden="true">
                            <i style={{ width: `${Math.round(((d.count || 0) / maxDept) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="px-r">
                          <b>{d.count || 0}</b>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
              {links.length ? (
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
