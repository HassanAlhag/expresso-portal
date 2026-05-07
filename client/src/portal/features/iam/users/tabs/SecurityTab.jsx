import React from "react";
import Badge from "../../../../shared/ui/Badge";

export default function SecurityTab({ user }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          ACCOUNT STATUS
        </div>

        <div className="mt-2">
          <Badge tone={user?.isActive ? "success" : "danger"}>
            {user?.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>

        <div className="mt-3 text-sm text-slate-600">
          Inactive users should not be able to sign in or access protected
          areas.
        </div>
      </div>

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          LAST LOGIN
        </div>
        <div className="mt-2 text-sm font-black text-slate-900">
          {user?.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString()
            : "—"}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Later we can add device sessions and sign-out history.
        </div>
      </div>

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          PASSWORD POLICY
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Current rule: minimum 8 characters. Later we can add stronger password
          rules and optional expiry policy.
        </div>
      </div>

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          PASSWORD CHANGED
        </div>
        <div className="mt-2 text-sm font-black text-slate-900">
          {user?.passwordChangedAt
            ? new Date(user.passwordChangedAt).toLocaleString()
            : "—"}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Used to invalidate older sessions when needed.
        </div>
      </div>
    </div>
  );
}
