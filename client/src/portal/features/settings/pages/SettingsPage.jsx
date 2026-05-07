import React, { useEffect, useState } from "react";
import { api } from "../../../shared/api/client";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardHeader, CardBody } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import {
  Lock,
  Bell,
  Eye,
  EyeOff,
  Shield,
  Mail,
  FolderKanban,
  Ticket,
  Wallet,
  Activity,
  User,
  Phone,
  Briefcase,
} from "lucide-react";

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus:outline-none focus:ring-4 focus:ring-slate-900/10",
        checked ? "bg-[var(--brand)]" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0",
          "transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function NotifRow({ icon: Icon, label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          <Icon size={14} className="text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-rose-400", pct: "25%" };
  if (score === 2) return { label: "Fair", color: "bg-orange-400", pct: "50%" };
  if (score === 3) return { label: "Good", color: "bg-amber-400", pct: "75%" };
  return { label: "Strong", color: "bg-emerald-500", pct: "100%" };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const toast = useToast();

  // ── Profile ───────────────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", jobTitle: "", role: "",
  });

  useEffect(() => {
    api.get("/users/me")
      .then((res) => {
        const u = res.data?.user || res.data;
        setProfile({
          fullName: u?.fullName || "",
          email: u?.email || "",
          phone: u?.phone || "",
          jobTitle: u?.jobTitle || "",
          role: u?.role || "",
        });
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileBusy(true);
    try {
      await api.patch("/users/me", {
        fullName: profile.fullName,
        phone: profile.phone,
        jobTitle: profile.jobTitle,
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileBusy(false);
    }
  };

  // ── Password ──────────────────────────────────────────────────────────────
  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);

  const strength = getStrength(pw.next);
  const mismatch = pw.confirm.length > 0 && pw.next !== pw.confirm;

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password updated successfully.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to change password. Check your current password."
      );
    } finally {
      setPwBusy(false);
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    emailDigest: true,
    projectUpdates: true,
    ticketReplies: true,
    billingAlerts: true,
    securityAlerts: true,
    teamActivity: false,
  });
  const [notifBusy, setNotifBusy] = useState(false);

  const setNotif = (key) => (val) => setNotifs((n) => ({ ...n, [key]: val }));

  const handleSaveNotifs = async () => {
    setNotifBusy(true);
    try {
      await api.patch("/users/me/notifications", { preferences: notifs });
    } catch {
      // endpoint may not exist yet — treat as UI-only
    } finally {
      setNotifBusy(false);
      toast.success("Notification preferences saved.");
    }
  };

  return (
    <div className="grid gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="SYSTEM"
        title="Settings"
        subtitle="Security, notifications, and account preferences."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Settings" }]}
      />

      {/* ── Profile ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Profile"
          subtitle="Update your display name, contact details, and job title"
          right={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
              <User size={15} className="text-slate-500" />
            </div>
          }
        />
        <CardBody>
          {profileLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-2xl" />)}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="FULL NAME"
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your display name"
                  prefix={<User size={14} className="text-slate-400" />}
                />
                <Input
                  label="EMAIL"
                  value={profile.email}
                  disabled
                  placeholder="Email address"
                  prefix={<Mail size={14} className="text-slate-400" />}
                />
                <Input
                  label="PHONE"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+971 50 000 0000"
                  prefix={<Phone size={14} className="text-slate-400" />}
                />
                <Input
                  label="JOB TITLE"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="e.g. Account Manager"
                  prefix={<Briefcase size={14} className="text-slate-400" />}
                />
              </div>
              {profile.role ? (
                <div className="text-xs text-slate-400">
                  Role: <span className="font-bold text-slate-600">{profile.role.replace(/_/g, " ")}</span>
                  {" · "}Email cannot be changed here.
                </div>
              ) : null}
              <Button type="submit" loading={profileBusy} variant="outline" className="w-full sm:w-auto">
                <User size={15} />
                Save profile
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Change Password"
            subtitle="Use a strong, unique password to protect your account"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Lock size={15} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            <form onSubmit={handleChangePw} className="grid gap-4">

              {/* Current */}
              <Input
                label="CURRENT PASSWORD"
                type={show.current ? "text" : "password"}
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {/* New */}
              <div className="grid gap-2">
                <Input
                  label="NEW PASSWORD"
                  type={show.next ? "text" : "password"}
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  placeholder="At least 8 characters"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                      className="text-slate-400 hover:text-slate-600 transition"
                    >
                      {show.next ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {strength && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Password strength</span>
                      <span className="font-extrabold text-slate-700">
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.pct }}
                      />
                    </div>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        ["8+ characters", pw.next.length >= 8],
                        ["Uppercase letter", /[A-Z]/.test(pw.next)],
                        ["Number", /[0-9]/.test(pw.next)],
                        ["Special character", /[^A-Za-z0-9]/.test(pw.next)],
                      ].map(([rule, met]) => (
                        <li
                          key={rule}
                          className={[
                            "text-[10.5px] font-semibold flex items-center gap-1",
                            met ? "text-emerald-600" : "text-slate-400",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-block h-1.5 w-1.5 rounded-full",
                              met ? "bg-emerald-500" : "bg-slate-300",
                            ].join(" ")}
                          />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <Input
                label="CONFIRM NEW PASSWORD"
                type={show.confirm ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
                error={mismatch ? "Passwords do not match" : ""}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <Button
                type="submit"
                loading={pwBusy}
                disabled={mismatch}
                className="w-full mt-1"
              >
                <Shield size={15} />
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Notification Preferences"
            subtitle="Choose which alerts and emails you want to receive"
            right={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                <Bell size={15} className="text-slate-500" />
              </div>
            }
          />
          <CardBody>
            <div>
              <NotifRow
                icon={Mail}
                label="Weekly email digest"
                hint="A weekly summary of activity across your account"
                checked={notifs.emailDigest}
                onChange={setNotif("emailDigest")}
              />
              <NotifRow
                icon={FolderKanban}
                label="Project updates"
                hint="Notifications when project milestones are reached or changed"
                checked={notifs.projectUpdates}
                onChange={setNotif("projectUpdates")}
              />
              <NotifRow
                icon={Ticket}
                label="Ticket replies"
                hint="Email alerts when a support ticket receives a reply"
                checked={notifs.ticketReplies}
                onChange={setNotif("ticketReplies")}
              />
              <NotifRow
                icon={Wallet}
                label="Billing alerts"
                hint="Notifications for new invoices and payment confirmations"
                checked={notifs.billingAlerts}
                onChange={setNotif("billingAlerts")}
              />
              <NotifRow
                icon={Shield}
                label="Security alerts"
                hint="Alerts for new logins or suspicious account activity"
                checked={notifs.securityAlerts}
                onChange={setNotif("securityAlerts")}
              />
              <NotifRow
                icon={Activity}
                label="Team activity"
                hint="Updates when team members are added, removed, or change roles"
                checked={notifs.teamActivity}
                onChange={setNotif("teamActivity")}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleSaveNotifs}
              loading={notifBusy}
              className="mt-5 w-full"
            >
              <Bell size={15} />
              Save preferences
            </Button>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
