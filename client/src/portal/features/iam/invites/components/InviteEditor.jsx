import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import SmartSelect from "../../../../shared/ui/SmartSelect";
import Pill from "../../../../shared/ui/Pill";
import { listRoles } from "../../roles/api";
import { listTeams } from "../../teams/api";
import { createInvite } from "../api";
import { Send, Users } from "lucide-react";

export default function InviteEditor({
  open,
  onClose,
  onSaved,
  busy,
  setBusy,
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(null);
  const [team, setTeam] = useState(null);
  const [expiresInDays, setExpiresInDays] = useState("7");

  const [roleOptions, setRoleOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadAll = async () => {
      try {
        const [rolesRes, teamsRes] = await Promise.all([
          listRoles(),
          listTeams({ isActive: "true" }),
        ]);

        const roles = (rolesRes?.items || []).map((r) => ({
          key: r.key,
          label: r.label || r.key,
        }));

        const teams = (teamsRes?.items || []).map((t) => ({
          key: t.label,
          label: t.label,
        }));

        setRoleOptions(roles);
        setTeamOptions(teams);
        setRole(roles.find((r) => r.key === "client") || null);
        setTeam(null);
      } catch (err) {
        console.error("Failed to load invite form data:", err);
        setRoleOptions([]);
        setTeamOptions([]);
      }
    };

    setEmail("");
    setFullName("");
    setExpiresInDays("7");
    setError("");
    loadAll();
  }, [open]);

  const canSave = useMemo(() => {
    return Boolean(email.trim()) && Boolean(role?.key);
  }, [email, role]);

  const save = async () => {
    setError("");
    setBusy(true);

    try {
      await createInvite({
        email: email.trim(),
        fullName: fullName.trim(),
        role: role?.key || "client",
        team: team?.key || "",
        expiresInDays: Number(expiresInDays) || 7,
      });

      onSaved?.();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to create invite"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      title="New invite"
      subtitle="Invite a user into the portal."
      onClose={onClose}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. user@company.com"
        />

        <Input
          label="Full name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Hassan Omer"
        />

        <SmartSelect
          label="Role"
          value={role}
          onChange={(it) => setRole(it)}
          loadOptions={async ({ q }) => {
            const qq = (q || "").toLowerCase();
            return {
              items: roleOptions.filter((x) =>
                x.label.toLowerCase().includes(qq)
              ),
            };
          }}
          getKey={(x) => x.key}
          renderValue={(x) => <Pill tone="indigo">{x.label}</Pill>}
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
            return {
              items: teamOptions.filter((x) =>
                x.label.toLowerCase().includes(qq)
              ),
            };
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
          label="Expires in days"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(e.target.value)}
          placeholder="7"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || busy}>
            <Send size={16} />
            {busy ? "Sending…" : "Create invite"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
