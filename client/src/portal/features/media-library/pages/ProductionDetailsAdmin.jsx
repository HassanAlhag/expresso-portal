import React from "react";
import Card from "../../../shared/ui/Card";

export default function ProductionDetailsAdmin() {
  return (
    <div className="grid gap-5">
      <div>
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
          CONTENT / PRODUCTION
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Production Details
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Review production information and attached media.
        </div>
      </div>

      <Card className="p-5">
        <div className="text-lg font-black text-slate-900">
          Production details page
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Connect this to your backend production API and show: title, customer,
          status, notes, assets, activity log.
        </div>
      </Card>
    </div>
  );
}
