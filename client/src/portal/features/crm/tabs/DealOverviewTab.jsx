import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import {
  Building2, CalendarDays, CircleDollarSign, UserRound,
  BriefcaseBusiness, ExternalLink, ChevronRight,
} from "lucide-react";
import { formatMoney, stageLabel, DEAL_STAGE_OPTIONS } from "../constants";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="mt-0.5 text-slate-400"><Icon size={16} /></div>
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "—"}</div>
      </div>
    </div>
  );
}

const STAGE_TONES = {
  discovery: "neutral", qualified: "info", proposal: "info",
  negotiation: "warning", verbal_commitment: "warning", won: "success", lost: "danger",
};

export default function DealOverviewTab({ deal, onStageChange, busy }) {
  const nav = useNavigate();
  const customerLabel = deal?.customerId?.companyName || deal?.customerId?.contactName || "—";

  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STAGE_TONES[deal?.stage] || "neutral"}>{stageLabel(deal?.stage)}</Badge>
          <Badge tone="neutral">{deal?.currency || "AED"}</Badge>
          {deal?.ownerUserId?.fullName && (
            <Badge tone="info">{deal.ownerUserId.fullName}</Badge>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {deal?.customerId ? (
            <button
              type="button"
              onClick={() => nav(`/portal/customers/${deal.customerId._id || deal.customerId}`)}
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100"
            >
              <div className="mt-0.5 text-emerald-500"><Building2 size={16} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black tracking-[0.18em] text-emerald-700">CLIENT</div>
                <div className="mt-1 truncate text-sm font-semibold text-emerald-900">{customerLabel}</div>
              </div>
              <ExternalLink size={13} className="mt-1 shrink-0 text-emerald-500" />
            </button>
          ) : (
            <InfoRow icon={Building2} label="CLIENT" value={customerLabel} />
          )}
          <InfoRow icon={CircleDollarSign}  label="VALUE"          value={formatMoney(deal?.value, deal?.currency)} />
          <InfoRow icon={UserRound}         label="OWNER"          value={deal?.ownerUserId?.fullName || "Unassigned"} />
          <InfoRow
            icon={CalendarDays}
            label="EXPECTED CLOSE"
            value={deal?.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "—"}
          />
          <InfoRow icon={BriefcaseBusiness} label="LINKED LEAD"   value={deal?.leadId?.fullName || "—"} />
          <InfoRow icon={Building2}         label="ACCOUNT"        value={deal?.accountId?.name || "—"} />
        </div>
      </Card>

      {deal?.notes && (
        <Card className="p-5">
          <div className="text-sm font-black text-slate-900">Notes</div>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm text-slate-700">
            {deal.notes}
          </div>
        </Card>
      )}

      {onStageChange && (
        <Card className="p-5">
          <div className="text-sm font-black text-slate-900">Move stage</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEAL_STAGE_OPTIONS.filter((opt) => opt.value).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={busy || opt.value === deal?.stage}
                onClick={() => onStageChange(opt.value)}
                className={[
                  "flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-bold transition",
                  opt.value === deal?.stage
                    ? "border-slate-900 bg-slate-900 text-white cursor-default"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 disabled:opacity-60",
                ].join(" ")}
              >
                {opt.label}
                {opt.value !== deal?.stage && <ChevronRight size={14} className="text-slate-400" />}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
