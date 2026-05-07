import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import SmartSelect from "../../../../shared/ui/SmartSelect";
import Pill from "../../../../shared/ui/Pill";
import MediaPickerModal from "../../../media-library/components/MediaPickerModal";
import { listRoles } from "../../roles/api";
import { listTeams } from "../../teams/api";
import { createUser, updateUser } from "../api";
import { Image as ImageIcon, Trash2, UserRound, Users } from "lucide-react";

export default function UserModal({
  open,
  mode = "create",
  initial,
  onClose,
  onSubmit,
  busy,
}) {
  const isEdit = mode === "edit";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);

  const [team, setTeam] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);

  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMediaId, setAvatarMediaId] = useState("");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadRoles = async () => {
      try {
        const res = await listRoles();
        const items = (res?.items || []).map((r) => ({
          key: r.key,
          label: r.label || r.key,
        }));
        setRoleOptions(items);
      } catch (err) {
        console.error("Failed to load roles:", err);
        setRoleOptions([]);
      }
    };

    loadRoles();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadTeams = async () => {
      try {
        const res = await listTeams({ isActive: "true" });
        const items = (res?.items || []).map((t) => ({
          key: t.label,
          label: t.label,
        }));
        setTeamOptions(items);
      } catch (err) {
        console.error("Failed to load teams:", err);
        setTeamOptions([]);
      }
    };

    loadTeams();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");

    setFullName(initial?.fullName || "");
    setEmail(initial?.email || "");
    setJobTitle(initial?.jobTitle || "");
    setPhone(initial?.phone || "");
    setNotes(initial?.notes || "");
    setIsActive(initial?.isActive !== false);
    setAvatarUrl(initial?.avatarUrl || "");
    setAvatarMediaId(initial?.avatarMediaId || "");

    const foundRole = roleOptions.find((r) => r.key === initial?.role);
    setRole(foundRole || roleOptions.find((r) => r.key === "client") || null);

    const foundTeam = teamOptions.find((t) => t.key === initial?.team);
    setTeam(foundTeam || null);

    setPassword("");
  }, [open, initial, roleOptions, teamOptions]);

  const canSave = useMemo(() => {
    if (!fullName.trim() || !email.trim()) return false;
    if (!role?.key) return false;
    if (!isEdit && password.length < 8) return false;
    return true;
  }, [fullName, email, password, isEdit, role]);

  const submit = async () => {
    setError("");
    setSaving(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        role: role?.key || "client",
        team: team?.key || "",
        jobTitle: jobTitle.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        isActive,
        avatarUrl: avatarUrl || "",
        avatarMediaId: avatarMediaId || null,
      };

      if (!isEdit) payload.password = password;

      if (isEdit) {
        await updateUser(initial?._id, payload);
      } else {
        await createUser(payload);
      }

      onSubmit?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <RightDrawer
        open={open}
        title={isEdit ? "Edit user" : "Add user"}
        subtitle={
          isEdit
            ? initial?.email || "Update user details"
            : "Create a new user account"
        }
        onClose={onClose}
      >
        <div className="grid gap-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
              PROFILE PHOTO
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-[96px,1fr]">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-black/10 bg-slate-50">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "User avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={28} className="text-slate-400" />
                )}
              </div>

              <div className="grid content-start gap-2">
                <div className="text-sm text-slate-600">
                  Select a profile image from the media library or upload a new
                  one.
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setAvatarPickerOpen(true)}
                  >
                    <ImageIcon size={16} />
                    Select / Upload photo
                  </Button>

                  {avatarUrl ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setAvatarUrl("");
                        setAvatarMediaId("");
                      }}
                    >
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Hassan Omer"
            />

            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@expresso.com"
            />

            <SmartSelect
              label="Role"
              value={role}
              onChange={(it) => setRole(it)}
              loadOptions={async ({ q }) => {
                const qq = (q || "").toLowerCase();
                const items = roleOptions.filter((x) =>
                  x.label.toLowerCase().includes(qq)
                );
                return { items };
              }}
              getKey={(x) => x.key}
              renderValue={(x) => (
                <div className="flex items-center gap-2">
                  <Pill tone="indigo">{x.label}</Pill>
                </div>
              )}
              renderOption={(x) => (
                <div className="text-sm font-extrabold text-slate-900">
                  {x.label}
                </div>
              )}
              placeholder="Select role…"
            />

            <SmartSelect
              label="Team"
              value={team}
              onChange={(it) => setTeam(it)}
              loadOptions={async ({ q }) => {
                const qq = (q || "").toLowerCase();
                const items = teamOptions.filter((x) =>
                  x.label.toLowerCase().includes(qq)
                );
                return { items };
              }}
              getKey={(x) => x.key}
              renderValue={(x) => (
                <div className="flex items-center gap-2">
                  <Pill tone="neutral">{x.label}</Pill>
                </div>
              )}
              renderOption={(x) => (
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Users size={14} />
                  {x.label}
                </div>
              )}
              placeholder="Select team…"
            />

            <Input
              label="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Account Manager"
            />

            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 ..."
            />

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
                STATUS
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-slate-900">
                  {isActive ? "Active" : "Inactive"}
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-extrabold hover:bg-black/[0.03]"
                >
                  Toggle
                </button>
              </div>
            </div>

            {!isEdit ? (
              <Input
                label="Temporary password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                hint="User can change it later."
                error={
                  password && password.length < 8
                    ? "Password must be at least 8 characters"
                    : ""
                }
              />
            ) : null}

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="mb-2 text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
                INTERNAL NOTES
              </div>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal admin notes about this user..."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || busy}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSave || saving || busy}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </div>
        </div>
      </RightDrawer>

      <MediaPickerModal
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        title="Select Profile Photo"
        subtitle="Choose a profile image from media library or upload a new one."
        onlyType="image"
        multiple={false}
        allowUpload={true}
        onSelect={(item) => {
          if (!item) return;
          setAvatarUrl(item.url || item.thumbnailUrl || "");
          setAvatarMediaId(item._id || "");
        }}
      />
    </>
  );
}
