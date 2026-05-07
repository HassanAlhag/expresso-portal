import React from "react";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import { Building2, Mail, Phone, Globe, MapPin } from "lucide-react";

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

export default function AccountOverviewTab({ account }) {
  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={account?.status === "active" ? "success" : "neutral"}>
            {String(account?.status || "active").toUpperCase()}
          </Badge>
          {account?.industry ? <Badge tone="info">{account.industry}</Badge> : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <InfoRow icon={Building2} label="ACCOUNT NAME" value={account?.name} />
          <InfoRow icon={Building2} label="LEGAL NAME"   value={account?.legalName} />
          <InfoRow icon={Mail}      label="EMAIL"        value={account?.email} />
          <InfoRow icon={Phone}     label="PHONE"        value={account?.phone} />
          <InfoRow icon={Globe}     label="WEBSITE"      value={account?.website} />
          <InfoRow
            icon={MapPin}
            label="LOCATION"
            value={[account?.city, account?.country].filter(Boolean).join(", ")}
          />
        </div>

        {account?.address && (
          <div className="mt-4">
            <InfoRow icon={MapPin} label="ADDRESS" value={account.address} />
          </div>
        )}
      </Card>

      {account?.notes && (
        <Card className="p-5">
          <div className="text-sm font-black text-slate-900">Notes</div>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm text-slate-700">
            {account.notes}
          </div>
        </Card>
      )}
    </div>
  );
}
