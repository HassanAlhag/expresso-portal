import React from "react";
import { Link } from "react-router-dom";
import SelectField from "../../../shared/ui/SelectField";
import LoadingState from "../../../shared/ui/LoadingState";
import { DEAL_STAGES, DEAL_STAGE_LABEL, compactMoney, ownerName } from "../format";

// Deals by stage (PUI-3). One column per stage with its first 100 deals by
// value; a stage with more says how many are not shown. Moving a deal uses a
// labelled select (no drag and drop), only for users who can edit deals.
export default function DealsPipelineBoard({ columns = {}, loading, canMove = false, onMove, busyId }) {
  if (loading) return <LoadingState rows={4} label="Loading the board" />;
  return (
    <div className="px-board" role="list" aria-label="Deals by stage">
      {DEAL_STAGES.map((stage) => {
        const col = columns[stage] || { items: [], total: 0 };
        const value = col.items.reduce((s, d) => s + Number(d.value || 0), 0);
        return (
          <section key={stage} className="px-board-col" role="listitem" aria-label={`${DEAL_STAGE_LABEL[stage]}, ${col.total} deals`}>
            <h3>
              {DEAL_STAGE_LABEL[stage]}
              <small>
                {col.total}
                {col.total && col.total <= col.items.length ? ` · ${compactMoney(value)}` : ""}
              </small>
            </h3>
            {col.items.length ? (
              col.items.map((d) => (
                <article key={d._id} className="px-board-card">
                  <Link to={`/portal/crm/deals/${d._id}`}>{d.title || "Untitled deal"}</Link>
                  <span className="px-s">
                    {[d.customerId?.companyName || d.accountId?.name, d.value ? compactMoney(d.value, d.currency) : null, ownerName(d)].filter(Boolean).join(" · ") || "No details"}
                  </span>
                  {canMove ? (
                    <SelectField
                      label={`Stage for ${d.title || "deal"}`}
                      hideLabel
                      value={d.stage === "new" ? "discovery" : d.stage}
                      disabled={busyId === d._id}
                      onChange={(next) => next !== d.stage && onMove?.(d, next)}
                      options={DEAL_STAGES.map((s) => ({ value: s, label: `Stage: ${DEAL_STAGE_LABEL[s]}` }))}
                    />
                  ) : null}
                </article>
              ))
            ) : (
              <p className="px-board-more">No deals</p>
            )}
            {col.total > col.items.length ? <p className="px-board-more">{col.total - col.items.length} more not shown. Use the table to see them.</p> : null}
          </section>
        );
      })}
    </div>
  );
}
