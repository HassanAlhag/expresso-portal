// src/portal/features/customers/components/CreateLoginModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import { KeyRound, UserPlus, X } from "lucide-react";

export default function CreateLoginModal({
  open,
  customer,
  onClose,
  onSubmit, // (payload) => Promise
  busy,
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmail(customer?.primaryEmail || "");
    setFullName(customer?.contactName || "");
    setTempPassword("");
  }, [open, customer]);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim()) && String(tempPassword).trim().length >= 8;
  }, [email, tempPassword]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={() => onClose?.()}
    >
      <div
        className="w-[min(720px,96vw)] overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-black/10 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-white">
                <UserPlus size={20} className="text-slate-800" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-slate-900">
                  Create portal login
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Create a client user and link it to this client.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="h-11 w-11 rounded-full border border-black/10 bg-white hover:bg-black/[0.03] transition"
              onClick={() => onClose?.()}
              title="Close"
            >
              <X className="mx-auto" size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-white grid gap-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
                  CLIENT
                </div>
                <div className="mt-2 text-base font-black text-slate-900 truncate">
                  {customer?.companyName || "—"}
                </div>
                <div className="mt-1 text-sm text-slate-600 truncate">
                  {customer?.contactName || "—"} •{" "}
                  {customer?.primaryEmail || "—"}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={customer?.isActive ? "success" : "danger"}>
                  {customer?.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
                {customer?.slug ? (
                  <Badge tone="neutral">/{customer.slug}</Badge>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              LOGIN DETAILS
            </div>

            <div className="mt-4 grid gap-3">
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
              />

              <Input
                label="Full name (optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Client name"
              />

              <Input
                label="Temporary password"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Min 8 characters"
                hint="Share this once with the client. They can reset later."
              />

              <div className="rounded-2xl border border-black/10 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <KeyRound size={16} />
                  Security note
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  This creates access to the portal. Use a strong temporary
                  password.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/10 bg-white flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onClose?.()} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit?.({
                email: email.trim(),
                fullName: fullName.trim() || undefined,
                tempPassword: tempPassword.trim(),
              })
            }
            disabled={busy || !canSubmit}
          >
            Create login
          </Button>
        </div>
      </div>
    </div>
  );
}
