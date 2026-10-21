import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { listInvoices } from "../../billing/api";
import { formatDate, formatMoney } from "../format";

const INVOICE_TONE = { paid: "ok", sent: "info", overdue: "bad", draft: "outline", void: "idle" };

const idOf = (v) => (v && typeof v === "object" ? v._id : v);

// Billing for this project (PUI-2). Only rendered for users with
// billing.read; the API enforces the same and scopes clients to their own
// company. Invoices are also filtered to this project here, because the API
// ignores projectId for client users.
export default function ProjectBillingTab({ projectId, canOpenBilling }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await listInvoices({ projectId, limit: 50, page: 1 });
      const all = Array.isArray(res?.items) ? res.items : [];
      setItems(all.filter((i) => String(idOf(i.projectId) || "") === String(projectId)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const live = items.filter((i) => i.status !== "void");
  const currency = live[0]?.currency || "AED";
  const sum = (list, f) => list.reduce((s, i) => s + Number(f(i) || 0), 0);
  const invoiced = sum(live, (i) => i.total);
  const collected = sum(live, (i) => i.amountPaid);
  const outstanding = sum(live.filter((i) => ["sent", "overdue"].includes(i.status)), (i) => i.balance);
  const overdue = sum(live.filter((i) => i.status === "overdue"), (i) => i.balance);

  const action = canOpenBilling ? (
    <Link className="px-link" to="/portal/billing">
      All billing
    </Link>
  ) : null;

  if (error) return <ErrorState title="Invoices didn't load" onRetry={load} />;

  return (
    <div className="px-stack">
      {!loading && live.length ? (
        <Panel title="Billing summary" sub="Invoices linked to this project, excluding void">
          <div className="px-figs" style={{ "--px-fig-n": 3 }}>
            <div className="px-fig">
              <span>Invoiced</span>
              <b>{formatMoney(invoiced, currency)}</b>
            </div>
            <div className="px-fig">
              <span>Collected</span>
              <b data-tone="ok">{formatMoney(collected, currency)}</b>
            </div>
            <div className="px-fig">
              <span>Outstanding</span>
              <b data-tone={overdue ? "bad" : undefined}>{formatMoney(outstanding, currency)}</b>
              {overdue ? <span className="px-m-note" data-tone="bad">{formatMoney(overdue, currency)} overdue</span> : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {!loading && !items.length ? (
        <EmptyState icon={Wallet} title="No invoices for this project" message="Invoices linked to this project will appear here." />
      ) : (
        <Panel title="Invoices" flush action={action}>
          <table className="px-table px-table--stack" aria-label="Project invoices" aria-busy={loading || undefined}>
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Status</th>
                <th scope="col">Due</th>
                <th scope="col" className="px-num">Total</th>
                <th scope="col" className="px-num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={3} cols={5} label="Loading invoices" />
              ) : (
                items.map((inv) => (
                  <tr key={inv._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        {canOpenBilling ? (
                          <Link to={`/portal/billing/${inv._id}`}>{inv.number || "Draft invoice"}</Link>
                        ) : (
                          <b>{inv.number || "Draft invoice"}</b>
                        )}
                        <span>{inv.issuedAt ? `Issued ${formatDate(inv.issuedAt)}` : "Not issued"}</span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={INVOICE_TONE[inv.status] || "neutral"} dot={inv.status !== "draft"}>
                          {inv.status || "draft"}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Due" className="px-num">
                      {formatDate(inv.dueDate) || <span className="px-muted">—</span>}
                    </td>
                    <td data-label="Total" className="px-num">
                      {formatMoney(inv.total, inv.currency)}
                    </td>
                    <td data-label="Balance" className="px-num">
                      {formatMoney(inv.balance, inv.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
