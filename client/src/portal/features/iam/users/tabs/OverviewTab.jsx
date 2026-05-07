import React from "react";
import Badge from "../../../../shared/ui/Badge";
import {
  Mail,
  Phone,
  Briefcase,
  Users,
  CalendarClock,
  Shield,
} from "lucide-react";

function InfoCard({ label, value, icon: Icon, right = null }) {
  return (
    <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
            {label.toUpperCase()}
          </div>
          <div className="mt-2 text-sm font-black text-slate-900 break-words">
            {value || "—"}
          </div>
        </div>

        {Icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white">
            <Icon size={16} className="text-slate-500" />
          </div>
        ) : null}
      </div>

      {right ? <div className="mt-3">{right}</div> : null}
    </div>
  );
}

function roleTone(role) {
  if (role === "super_admin") return "danger";
  if (role === "admin") return "info";
  return "neutral";
}

export default function OverviewTab({ user }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard label="Full name" value={user?.fullName || "—"} />
      <InfoCard label="Email" value={user?.email || "—"} icon={Mail} />
      <InfoCard label="Phone" value={user?.phone || "—"} icon={Phone} />
      <InfoCard
        label="Job title"
        value={user?.jobTitle || "—"}
        icon={Briefcase}
      />
      <InfoCard label="Team" value={user?.team || "—"} icon={Users} />

      <InfoCard
        label="Role"
        value={
          user?.role
            ? String(user.role).replaceAll("_", " ").toUpperCase()
            : "—"
        }
        icon={Shield}
        right={
          <Badge tone={roleTone(user?.role)}>
            {user?.role
              ? String(user.role).replaceAll("_", " ").toUpperCase()
              : "—"}
          </Badge>
        }
      />

      <InfoCard
        label="Status"
        value={user?.isActive ? "Active" : "Inactive"}
        right={
          <Badge tone={user?.isActive ? "success" : "danger"}>
            {user?.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        }
      />

      <InfoCard
        label="Created at"
        value={
          user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"
        }
        icon={CalendarClock}
      />

      <InfoCard
        label="Last login"
        value={
          user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"
        }
        icon={CalendarClock}
      />

      <div className="rounded-[28px] border border-black/[0.07] bg-white p-5 shadow-sm lg:col-span-2">
        <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          INTERNAL NOTES
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
          {user?.notes || "No internal notes yet."}
        </div>
      </div>
    </div>
  );
}
