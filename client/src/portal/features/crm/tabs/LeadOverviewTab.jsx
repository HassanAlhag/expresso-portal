import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import { Building2, Mail, Phone, Globe, UserRound, BriefcaseBusiness, ExternalLink, Wrench } from "lucide-react";
import { leadSourceLabel } from "../constants";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="mt-0.5 text-slate-400">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "—"}</div>
      </div>
    </div>
  );
}

const STATUS_TONES = {
  new:         "border-sky-200 bg-sky-50 text-sky-700",
  contacted:   "border-amber-200 bg-amber-50 text-amber-700",
  qualified:   "border-emerald-200 bg-emerald-50 text-emerald-700",
  unqualified: "border-rose-200 bg-rose-50 text-rose-700",
  converted:   "border-violet-200 bg-violet-50 text-violet-700",
};

export default function LeadOverviewTab({ lead }) {
  const nav = useNavigate();
  const v = String(lead?.status || "new").toLowerCase();
  const convertedAccount = lead?.convertedToAccountId || lead?.accountId || null;

  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
              STATUS_TONES[v] || "border-slate-200 bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {v.replaceAll("_", " ")}
          </span>
          <Badge tone="neutral">{leadSourceLabel(lead?.source)}</Badge>
          {lead?.ownerUserId?.fullName ? (
            <Badge tone="info">{lead.ownerUserId.fullName}</Badge>
          ) : (
            <Badge tone="neutral">Unassigned</Badge>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <InfoRow icon={UserRound}        label="FULL NAME"   value={lead?.fullName} />
          <InfoRow icon={Building2}        label="COMPANY"     value={lead?.companyName} />
          <InfoRow icon={Mail}             label="EMAIL"       value={lead?.email} />
          <InfoRow icon={Phone}            label="PHONE"       value={lead?.phone} />
          <InfoRow icon={Wrench}           label="SERVICE"     value={lead?.service} />
          <InfoRow icon={Globe}            label="SOURCE"      value={leadSourceLabel(lead?.source)} />
          <InfoRow icon={BriefcaseBusiness} label="ASSIGNED STAFF" value={lead?.ownerUserId?.fullName || "Unassigned"} />
        </div>

        {convertedAccount && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() =>
                nav(`/portal/crm/accounts/${convertedAccount._id || convertedAccount}`)
              }
              className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100"
            >
              <Building2 size={14} />
              {convertedAccount?.name || "View account"}
              <ExternalLink size={12} className="ml-auto text-indigo-500" />
            </button>
          </div>
        )}
      </Card>

      {lead?.notes && (
        <Card className="p-5">
          <div className="text-sm font-black text-slate-900">Notes</div>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm text-slate-700">
            {lead.notes}
          </div>
        </Card>
      )}
    </div>
  );
}
