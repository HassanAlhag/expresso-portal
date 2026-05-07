import React from "react";
import Badge from "../../../../shared/ui/Badge";

function roleTone(role) {
  if (role === "super_admin") return "danger";
  if (role === "admin") return "info";
  return "neutral";
}

function accessSummary(role) {
  if (role === "super_admin") {
    return [
      "Full system access",
      "Can manage admins, staff, clients, and roles",
      "Can manage security-sensitive actions",
    ];
  }

  if (role === "admin") {
    return [
      "Administrative access",
      "Can manage staff and client users",
      "Cannot manage super admins",
    ];
  }

  if (role === "staff") {
    return [
      "Operational access",
      "Can work inside assigned modules",
      "Cannot manage IAM or high-security settings",
    ];
  }

  return [
    "Client-level access",
    "Can access client portal features only",
    "Cannot access internal admin operations",
  ];
}

export default function AccessTab({ user }) {
  const role = user?.role || "";
  const perms = user?.permissions || [];
  const summary = accessSummary(role);

  return (
    <div className="grid gap-4">
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          CURRENT ROLE
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Badge tone={roleTone(role)}>
            {String(role || "—")
              .replaceAll("_", " ")
              .toUpperCase()}
          </Badge>
        </div>

        <div className="mt-4 grid gap-2">
          {summary.map((line) => (
            <div key={line} className="text-sm text-slate-700">
              • {line}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          PERMISSIONS
        </div>

        {perms.length === 0 ? (
          <div className="mt-2 text-sm text-slate-600">
            No explicit permission matrix assigned yet. Access is currently
            driven mainly by role.
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {perms.map((p) => (
              <Badge key={p} tone="neutral">
                {p}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
