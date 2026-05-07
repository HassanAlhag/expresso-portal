import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../shared/ui/Button";
import Badge from "../../../../shared/ui/Badge";
import ActionMenu from "../../../../shared/ui/ActionMenu";

import {
  Eye,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Users,
} from "lucide-react";
import { setUserStatus } from "../api";

function roleLabel(role) {
  const r = String(role || "").replaceAll("_", " ");
  return r.toUpperCase();
}

function roleTone(role) {
  if (role === "super_admin") return "danger";
  if (role === "admin") return "info";
  if (role === "staff") return "neutral";
  return "neutral";
}

export default function UserTable({ rows = [], busy, setBusy, onChanged }) {
  const nav = useNavigate();

  const toggleActive = async (u) => {
    if (!u?._id) return;
    setBusy(true);
    try {
      await setUserStatus(u._id, !Boolean(u.isActive));
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/10 p-4">
        <div className="text-sm font-black text-slate-900">
          Users ({rows.length})
        </div>
        <div className="text-xs text-slate-600">
          Click a row to open profile
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-slate-50">
            <tr className="border-b border-black/10">
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                USER
              </th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                ROLE
              </th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                TEAM / TITLE
              </th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                STATUS
              </th>
              <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                LAST LOGIN
              </th>
              <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((u) => (
              <tr
                key={u._id}
                className="cursor-pointer border-b border-slate-100 hover:bg-black/[0.02]"
                onClick={() => nav(`/portal/users/${u._id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.fullName || u.email || "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center font-black text-slate-900">
                          {(u.fullName || u.email || "?")
                            .trim()
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">
                        {u.fullName || "—"}
                      </div>
                      <div className="truncate text-xs text-slate-600">
                        {u.email || "—"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Badge tone={roleTone(u.role)}>{roleLabel(u.role)}</Badge>
                </td>

                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                      <Briefcase size={14} className="text-slate-400" />
                      <span>{u.jobTitle || "—"}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <Users size={13} className="text-slate-400" />
                      <span>{u.team || "No team"}</span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Badge tone={u.isActive ? "success" : "danger"}>
                    {u.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString()
                    : "—"}
                </td>

                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => nav(`/portal/users/${u._id}`)}
                    >
                      <Eye size={16} />
                      View
                    </Button>

                    <ActionMenu
                      items={[
                        {
                          label: "Open profile",
                          onClick: () => nav(`/portal/users/${u._id}`),
                        },
                        {
                          label: u.isActive ? "Deactivate" : "Activate",
                          onClick: () => toggleActive(u),
                        },
                      ]}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => nav(`/portal/users/${u._id}`)}
                      title="Reset password from details page"
                    >
                      <KeyRound size={16} />
                      Reset
                    </Button>

                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white hover:bg-black/[0.03]"
                      title={u.isActive ? "Deactivate" : "Activate"}
                      disabled={busy}
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? (
                        <ToggleRight size={18} />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-600"
                >
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
