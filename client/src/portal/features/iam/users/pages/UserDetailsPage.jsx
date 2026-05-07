// src/portal/features/iam/users/pages/UserDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import DetailsShell from "../../../../shared/ui/DetailsShell";
import { useToast } from "../../../../shared/ui/Toast";
import Button from "../../../../shared/ui/Button";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import Tabs from "../../../../shared/ui/Tabs";

import {
  KeyRound,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Users,
  Phone,
  Mail,
} from "lucide-react";

import { getUser, setUserStatus, resetUserPassword } from "../api";
import UserModal from "../components/UserModal";
import ResetPasswordModal from "../components/ResetPasswordModal";

import OverviewTab from "../tabs/OverviewTab";
import AccessTab from "../tabs/AccessTab";
import SecurityTab from "../tabs/SecurityTab";
import ActivityTab from "../tabs/ActivityTab";
import NotesTab from "../tabs/NotesTab";

const TAB = {
  OVERVIEW: "overview",
  ACCESS: "access",
  SECURITY: "security",
  ACTIVITY: "activity",
  NOTES: "notes",
};

const TAB_ITEMS = [
  { value: TAB.OVERVIEW, label: "Overview" },
  { value: TAB.ACCESS, label: "Access" },
  { value: TAB.SECURITY, label: "Security" },
  { value: TAB.ACTIVITY, label: "Activity" },
  { value: TAB.NOTES, label: "Notes" },
];

function roleLabel(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .toUpperCase();
}

function roleTone(role) {
  if (role === "super_admin") return "danger";
  if (role === "admin") return "info";
  return "neutral";
}

export default function UserDetailsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tab, setTab] = useState(TAB.OVERVIEW);

  const initials = useMemo(() => {
    const s = (user?.fullName || user?.email || "?").trim();
    return s.slice(0, 1).toUpperCase();
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUser(id);
      setUser(res?.user || res || null);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const toggleStatus = async () => {
    if (!user?._id) return;
    setBusy(true);
    try {
      const next = !Boolean(user.isActive);
      await setUserStatus(user._id, next);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (newPassword) => {
    if (!user?._id) return;
    setBusy(true);
    try {
      await resetUserPassword(user._id, { newPassword });
      setResetOpen(false);
      toast.success("Password reset successfully.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-sm">
        <Skeleton className="h-12 w-2/3" />
        <div className="mt-4 grid gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-800">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 text-sm font-black text-slate-700 shadow-sm">
        User not found.
      </div>
    );
  }

  const RightActions = (
    <>
      <Button variant="outline" onClick={toggleStatus} disabled={busy}>
        {user.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        {user.isActive ? "Deactivate" : "Activate"}
      </Button>

      <Button
        variant="outline"
        onClick={() => setEditOpen(true)}
        disabled={busy}
      >
        <Pencil size={16} />
        Edit
      </Button>

      <Button onClick={() => setResetOpen(true)} disabled={busy}>
        <KeyRound size={16} />
        Reset password
      </Button>
    </>
  );

  const TabsBar = (
    <Tabs
      value={tab}
      onChange={setTab}
      items={TAB_ITEMS}
      right={
        <div className="flex items-center gap-2">
          <Badge tone={user.isActive ? "success" : "danger"}>
            {user.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
          <Badge tone={roleTone(user.role)}>{roleLabel(user.role)}</Badge>
        </div>
      }
    />
  );

  return (
    <DetailsShell
      backTo="/portal/users"
      eyebrow="IAM"
      title={
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl border border-black/10 bg-white">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || user.email || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center font-black text-slate-900">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-2xl font-black text-slate-900">
              {user.fullName || "—"}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 truncate">
                <Mail size={14} className="text-slate-400" />
                {user.email || "—"}
              </span>

              <span className="inline-flex items-center gap-1.5 truncate">
                <Briefcase size={14} className="text-slate-400" />
                {user.jobTitle || "No title"}
              </span>

              <span className="inline-flex items-center gap-1.5 truncate">
                <Users size={14} className="text-slate-400" />
                {user.team || "No team"}
              </span>

              <span className="inline-flex items-center gap-1.5 truncate">
                <Phone size={14} className="text-slate-400" />
                {user.phone || "No phone"}
              </span>
            </div>
          </div>
        </div>
      }
      subtitle={null}
      right={RightActions}
      tabs={TabsBar}
    >
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === TAB.OVERVIEW ? <OverviewTab user={user} /> : null}
        {tab === TAB.ACCESS ? <AccessTab user={user} /> : null}
        {tab === TAB.SECURITY ? <SecurityTab user={user} /> : null}
        {tab === TAB.ACTIVITY ? <ActivityTab user={user} /> : null}
        {tab === TAB.NOTES ? <NotesTab user={user} /> : null}
      </div>

      <UserModal
        open={editOpen}
        mode="edit"
        initial={user}
        onClose={() => setEditOpen(false)}
        onSubmit={async () => {
          setEditOpen(false);
          await load();
        }}
        busy={busy}
      />

      <ResetPasswordModal
        open={resetOpen}
        user={user}
        onClose={() => setResetOpen(false)}
        onSubmit={doReset}
        busy={busy}
      />
    </DetailsShell>
  );
}
