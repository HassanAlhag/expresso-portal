import React from "react";
import Input from "../../../shared/ui/Input";
import Button from "../../../shared/ui/Button";
import { UserPlus } from "lucide-react";

export default function CustomerLoginsTab({
  customer,
  busy,
  loginEmail,
  setLoginEmail,
  loginName,
  setLoginName,
  tempPassword,
  setTempPassword,
  onCreateLogin,
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
      <div className="text-sm font-black text-slate-900">
        Client portal login
      </div>
      <div className="mt-1 text-sm text-slate-600">
        Create a client user and link it to this client.
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.07] bg-slate-50 p-3 text-xs text-slate-600">
        Linked user id:{" "}
        <span className="font-black text-slate-900">
          {customer.ownerUserId ? String(customer.ownerUserId) : "Not linked"}
        </span>
      </div>

      {!customer.ownerUserId ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Input
            label="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="client@company.com"
          />
          <Input
            label="Full name (optional)"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="Client name"
          />
          <Input
            label="Temp password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="Min 8 characters"
          />

          <div className="sm:col-span-3 flex justify-end">
            <Button
              onClick={onCreateLogin}
              disabled={
                busy || !loginEmail.trim() || tempPassword.trim().length < 8
              }
            >
              <UserPlus size={16} />
              Create login
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
          Login is already linked to this client.
        </div>
      )}
    </div>
  );
}
