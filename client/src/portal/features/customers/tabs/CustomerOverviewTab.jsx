import React from "react";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import { formatDate } from "../../projects/format";
import { DEAL_STAGE_LABEL, DEAL_STAGE_TONE, money, normalizeStage } from "../../crm/format";
import { DEPARTMENT_LABEL, departmentOf } from "../format";

// Client overview (PUI-3): who the client is, how to reach them, and the
// commercial context staff already hold. Internal notes and CRM links are
// staff information: the API does not send them to client users, and
// `isInternal` keeps them out of the client layout as well.
export default function CustomerOverviewTab({ customer, isInternal = true, canReadCrm = false, onCreateLogin }) {
  const deal = customer?.crmDealId && typeof customer.crmDealId === "object" ? customer.crmDealId : null;
  const account = customer?.crmAccountId && typeof customer.crmAccountId === "object" ? customer.crmAccountId : null;
  const showCrm = isInternal && canReadCrm && (deal || account);

  return (
    <div className="px-grid px-cols-detail">
      <div className="px-stack">
        <Panel title="Main contact">
          <KeyValue
            items={[
              { label: "Name", value: customer?.contactName },
              {
                label: "Email",
                value: customer?.primaryEmail ? <a href={`mailto:${customer.primaryEmail}`}>{customer.primaryEmail}</a> : null,
              },
              { label: "Phone", value: customer?.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : null },
            ]}
          />
        </Panel>

        {showCrm ? (
          <Panel title="Sales history" sub="The CRM records this client came from">
            <KeyValue
              items={[
                {
                  label: "CRM account",
                  value: account ? <Link to={`/portal/crm/accounts/${account._id}`}>{account.name || "Account"}</Link> : null,
                  hidden: !account,
                },
                {
                  label: "Deal",
                  value: deal ? (
                    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <Link to={`/portal/crm/deals/${deal._id}`}>{deal.title || "Deal"}</Link>
                      <Badge tone={DEAL_STAGE_TONE[normalizeStage(deal.stage)] || "neutral"} dot>
                        {DEAL_STAGE_LABEL[normalizeStage(deal.stage)] || deal.stage}
                      </Badge>
                      {deal.value ? <span className="px-muted">{money(deal.value, deal.currency)}</span> : null}
                    </span>
                  ) : null,
                  hidden: !deal,
                },
              ]}
            />
          </Panel>
        ) : null}

        {isInternal && customer?.notes ? (
          <Panel title="Internal notes" sub="Staff only">
            <p className="px-prose">{customer.notes}</p>
          </Panel>
        ) : null}
      </div>

      <div className="px-stack">
        <Panel title="Account">
          <KeyValue
            className="px-kv--side"
            items={[
              {
                label: "Status",
                value: (
                  <Badge tone={customer?.isActive ? "ok" : "neutral"} dot={Boolean(customer?.isActive)}>
                    {customer?.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              { label: "Department", value: DEPARTMENT_LABEL[departmentOf(customer)] },
              { label: "Code", value: customer?.code },
              { label: "Industry", value: customer?.industry },
              { label: "Country", value: customer?.country },
              { label: "Client since", value: formatDate(customer?.createdAt) },
            ]}
          />
        </Panel>
        {isInternal ? (
          <Panel title="Portal access">
            {customer?.ownerUserId ? (
              <p style={{ margin: 0 }}>A main portal login is linked. Everyone with access is listed under Users.</p>
            ) : (
              <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
                <p className="px-muted" style={{ margin: 0 }}>No main portal login yet.</p>
                {onCreateLogin ? (
                  <Button size="sm" variant="outline" onClick={onCreateLogin}>
                    <KeyRound size={14} aria-hidden="true" />
                    Create main login
                  </Button>
                ) : null}
              </div>
            )}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
