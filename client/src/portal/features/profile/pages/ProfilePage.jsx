import React, { useEffect, useState } from "react";
import { me } from "../../../shared/api/auth.api";
import { api } from "../../../shared/api/client";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardHeader, CardBody } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import {
  User,
  Mail,
  Shield,
  Users,
  CalendarDays,
  Edit2,
  Save,
  X,
  Building2,
  Clock,
} from "lucide-react";

const ROLE_TONE = {
  super_admin: "violet",
  admin: "indigo",
  staff: "slate",
  client: "green",
};

function formatRole(role) {
  return (role || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

function formatDateTime(iso) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl text-2xl font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
      style={{ background: "var(--brand)" }}
    >
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase">
          {label}
        </div>
        <div
          className={[
            "mt-0.5 text-sm font-semibold text-slate-800 truncate",
            mono ? "font-mono" : "",
          ].join(" ")}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ fullName: "", phone: "", title: "" });

  const loadUser = async () => {
    try {
      const res = await me();
      const u = res?.user ?? null;
      setUser(u);
      if (u) {
        setForm({
          fullName: u.fullName || "",
          phone: u.phone || "",
          title: u.title || "",
        });
      }
    } catch {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch("/users/me", {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        title: form.title.trim(),
      });
      setUser((prev) => ({ ...prev, ...(data?.user ?? {}) }));
      setEditing(false);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      title: user?.title || "",
    });
    setEditing(false);
  };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-9 w-48 rounded-2xl" />
          <Skeleton className="h-4 w-72 rounded-full" />
        </div>
        <Skeleton className="h-36 w-full rounded-[22px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-[22px]" />
          <Skeleton className="h-64 w-full rounded-[22px]" />
        </div>
      </div>
    );
  }

  const roleTone = ROLE_TONE[user?.role] ?? "slate";
  const clientName =
    typeof user?.client === "object"
      ? user?.client?.name
      : user?.client || null;

  return (
    <div className="grid gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="SYSTEM"
        title="Profile"
        subtitle="Your account details and personal information."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Profile" }]}
        right={
          editing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving} size="sm">
                <X size={14} /> Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} size="sm">
                <Save size={14} /> Save changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)} size="sm">
              <Edit2 size={14} /> Edit profile
            </Button>
          )
        }
      />

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={user?.fullName} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {user?.fullName || "Unknown"}
                </h2>
                <Badge tone={roleTone}>{formatRole(user?.role)}</Badge>
                {user?.team && <Badge tone="slate">{user.team}</Badge>}
                {user?.isActive ? (
                  <Badge tone="green">Active</Badge>
                ) : (
                  <Badge tone="red">Inactive</Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">{user?.email || "—"}</p>
              {user?.title && (
                <p className="mt-0.5 text-sm font-medium text-slate-600">
                  {user.title}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  Member since {formatDate(user?.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Last login: {formatDateTime(user?.lastLoginAt)}
                </span>
                {clientName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    {clientName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Two-column detail ─────────────────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">

        {/* Editable personal info */}
        <Card>
          <CardHeader
            title="Account Information"
            subtitle={
              editing
                ? "Make your changes below and save"
                : "Click Edit profile above to make changes"
            }
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <User size={15} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            <div className="grid gap-4">
              <Input
                label="FULL NAME"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                placeholder="e.g. Sarah Al-Rashidi"
                disabled={!editing}
              />
              <Input
                label="PHONE"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+966 5X XXX XXXX"
                disabled={!editing}
              />
              <Input
                label="JOB TITLE / POSITION"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Account Manager"
                disabled={!editing}
              />
            </div>

            {editing && (
              <div className="mt-5 flex items-center gap-2">
                <Button onClick={handleSave} loading={saving} size="sm">
                  <Save size={14} /> Save changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  size="sm"
                >
                  <X size={14} /> Cancel
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Read-only identity */}
        <Card>
          <CardHeader
            title="Identity & Access"
            subtitle="Managed by your administrator"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Shield size={15} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            <div>
              <InfoRow icon={Mail} label="Email address" value={user?.email} mono />
              <InfoRow icon={Shield} label="Role" value={formatRole(user?.role)} />
              <InfoRow icon={Users} label="Team" value={user?.team} />
              <InfoRow icon={Building2} label="Client account" value={clientName} />
              <InfoRow
                icon={CalendarDays}
                label="Member since"
                value={formatDate(user?.createdAt)}
              />
              <InfoRow
                icon={Clock}
                label="Last login"
                value={formatDateTime(user?.lastLoginAt)}
              />
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              To change your email or role, contact your system administrator.
            </p>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
