import React from "react";
import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import EmptyState from "../../../shared/ui/EmptyState";
import { DEAL_STAGE_LABEL, DEAL_STAGE_TONE, money, normalizeStage, ownerName } from "../format";
import { formatDate } from "../../projects/format";

// Deals linked to the account (from GET /crm/accounts/:id `related.deals`).
export default function AccountDealsTab({ deals = [] }) {
  if (!deals.length) return <EmptyState icon={Handshake} title="No deals yet" message="Deals linked to this account appear here." />;
  return (
    <Panel title="Deals" sub={`${deals.length} linked deal${deals.length === 1 ? "" : "s"}`} flush>
      <table className="px-table px-table--stack" aria-label="Account deals">
        <thead>
          <tr>
            <th scope="col">Deal</th>
            <th scope="col">Stage</th>
            <th scope="col" className="px-num">Value</th>
            <th scope="col" className="px-hide-tab">Expected close</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => {
            const st = normalizeStage(d.stage);
            return (
              <tr key={d._id}>
                <td className="px-primary">
                  <div className="px-cell-main">
                    <Link to={`/portal/crm/deals/${d._id}`}>{d.title || "Untitled deal"}</Link>
                    <span>{ownerName(d) || "Unassigned"}</span>
                  </div>
                </td>
                <td data-label="Stage">
                  <span>
                    <Badge tone={DEAL_STAGE_TONE[st] || "neutral"} dot>
                      {DEAL_STAGE_LABEL[st] || st}
                    </Badge>
                  </span>
                </td>
                <td data-label="Value" className="px-num">{money(d.value, d.currency) || <span className="px-muted">—</span>}</td>
                <td data-label="Expected close" className="px-hide-tab px-num">{formatDate(d.expectedCloseDate) || <span className="px-muted">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
