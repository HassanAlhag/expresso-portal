// src/portal/features/iam/users/components/UserDrawer.jsx
import React from "react";
import { X, ExternalLink, Pencil, KeyRound } from "lucide-react";
import { BRAND } from "../constants";

export default function UserDrawer({
  open,
  user,
  onClose,
  onOpenFull,
  onEdit,
  onReset,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onMouseDown={onClose}
      />

      {/* panel */}
      <div
        className="absolute right-0 top-0 h-full w-[min(520px,92vw)] bg-white shadow-2xl border-l border-black/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* header */}
          <div className="flex items-start justify-between gap-3 border-b border-black/10 p-5">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
                USER PREVIEW
              </div>
              <div className="mt-1 text-xl font-black text-slate-900 truncate">
                {user?.fullName || user?.email || "User"}
              </div>
              <div className="mt-1 text-sm text-slate-600 truncate">
                {user?.email || "—"}
              </div>
            </div>

            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white hover:bg-black/[0.03] active:scale-[0.98] transition"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-3">
              <Info label="Role" value={user?.role || "—"} />
              <Info
                label="Status"
                value={user?.isActive ? "Active" : "Inactive"}
              />
              <Info
                label="Last Login"
                value={
                  user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : "—"
                }
              />
              <Info
                label="Created"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "—"
                }
              />
            </div>
          </div>

          {/* footer */}
          <div className="border-t border-black/10 p-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenFull?.(user)}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 h-11 text-sm font-extrabold text-slate-900 hover:bg-black/[0.03] active:scale-[0.98] transition"
            >
              <ExternalLink size={16} />
              Open full profile
            </button>

            <button
              type="button"
              onClick={() => onEdit?.(user)}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 h-11 text-sm font-extrabold text-slate-900 hover:bg-black/[0.03] active:scale-[0.98] transition"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onReset?.(user)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 h-11 text-sm font-extrabold text-white active:scale-[0.98] transition"
              style={{ backgroundColor: BRAND }}
            >
              <KeyRound size={16} />
              Reset password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-extrabold text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
}
