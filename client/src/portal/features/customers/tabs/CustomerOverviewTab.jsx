import React from "react";

export default function CustomerOverviewTab({ customer }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm md:col-span-2">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          CONTACT
        </div>
        <div className="mt-2 grid gap-2">
          <div className="text-sm font-black text-slate-900">
            {customer.contactName || "—"}
          </div>
          <div className="text-sm text-slate-700">
            {customer.primaryEmail || "—"}
          </div>
          <div className="text-sm text-slate-700">{customer.phone || "—"}</div>
        </div>

        {customer.notes ? (
          <>
            <div className="mt-6 text-[11px] font-black tracking-[0.22em] text-slate-500">
              NOTES
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {customer.notes}
            </div>
          </>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          META
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Industry</span>
            <span className="font-black text-slate-900">
              {customer.industry || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Country</span>
            <span className="font-black text-slate-900">
              {customer.country || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Code</span>
            <span className="font-black text-slate-900">
              {customer.code || "—"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-black/[0.07] bg-slate-50 p-3 text-xs text-slate-600">
          This client can have fixed service enrollments and separate projects.
        </div>
      </div>
    </div>
  );
}
