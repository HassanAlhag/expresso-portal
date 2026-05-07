import React from "react";
import { useNavigate } from "react-router-dom";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";
import { BriefcaseBusiness } from "lucide-react";
import { formatMoney, stageLabel } from "../constants";

const STAGE_TONES = {
  discovery: "neutral", qualified: "info", proposal: "info",
  negotiation: "warning", verbal_commitment: "warning", won: "success", lost: "danger",
};

export default function AccountDealsTab({ deals = [] }) {
  const nav = useNavigate();

  return (
    <Card>
      <CardHeader
        title="Deals"
        subtitle={`${deals.length} deal${deals.length !== 1 ? "s" : ""} linked to this account`}
      />
      <CardBody>
        {deals.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="No deals yet"
            message="Deals linked to this account will appear here."
          />
        ) : (
          <div className="grid gap-3">
            {deals.map((deal) => (
              <button
                key={deal._id}
                type="button"
                onClick={() => nav(`/portal/crm/deals/${deal._id}`)}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:bg-black/[0.02]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">{deal.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <Badge tone={STAGE_TONES[deal.stage] || "neutral"} className="text-[10px]">
                      {stageLabel(deal.stage)}
                    </Badge>
                    <span>{formatMoney(deal.value, deal.currency)}</span>
                  </div>
                  {deal.ownerUserId?.fullName && (
                    <div className="mt-1 text-xs text-slate-400">{deal.ownerUserId.fullName}</div>
                  )}
                </div>
                {deal.expectedCloseDate && (
                  <div className="shrink-0 text-right text-xs text-slate-500">
                    <div className="font-semibold">Close by</div>
                    <div>{new Date(deal.expectedCloseDate).toLocaleDateString()}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
