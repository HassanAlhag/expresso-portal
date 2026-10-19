import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";
import SmartSelect from "../../../../shared/ui/SmartSelect";
import Pill from "../../../../shared/ui/Pill";
import { listRoles } from "../../roles/api";
import { listTeams } from "../../teams/api";
import { listCustomers } from "../../../customers/api";
import { inviteFromAccessRequest } from "../api";
import { Send, Users, Building2 } from "lucide-react";

export default function InviteFromRequestModal({
  open,
  request,
  onClose,
  onSaved,
}) {
  const [role, setRole] = useState(null);
  const [team, setTeam] = useState(null);
  const [client, setClient] = useState(null);
  const [expiresInDays, setExpiresInDays] = useState("7");

  const [roleOptions, setRoleOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);

  const [busy, setBusy] = useState(false);
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

    setClient(null);
    setExpiresInDays("7");
    setError("");
    loadAll();
  }, [open]);

  const canSave = useMemo(() => Boolean(role?.key), [role]);

  const save = async () => {
    setError("");
    setBusy(true);

    try {
      await inviteFromAccessRequest(request._id, {
        role: role?.key || "client",
        team: team?.key || "",
        clientId: client?._id || null,
        expiresInDays: Number(expiresInDays) || 7,
      });

      onSaved?.();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to send invite"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      title="Send invite"
      subtitle={request ? `Activate portal access for ${request.workEmail}` : ""}
      onClose={onClose}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-black/10 bg-slate-50 p-4">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            REQUESTER
          </div>
          <div className="mt-2 text-sm font-black text-slate-900">
            {request?.fullName}
          </div>
          <div className="text-sm text-slate-600">{request?.workEmail}</div>
          <div className="text-sm text-slate-600">{request?.company}</div>
        </div>

        <SmartSelect
          label="Role"
          value={role}
          onChange={(it) => setRole(it)}
          loadOptions={async ({ q }) => {
            const qq = (q || "").toLowerCase();
            return {
              items: roleOptions.filter((x) => x.label.toLowerCase().includes(qq)),
            };
          }}
          getKey={(x) => x.key}
          renderValue={(x) => <Pill tone="indigo">{x.label}</Pill>}
          renderOption={(x) => (
            <div className="text-sm font-extrabold text-slate-900">{x.label}</div>
          )}
          placeholder="Select role…"
        />

        <SmartSelect
          label="Company / client (optional)"
          value={client}
          onChange={(it) => setClient(it)}
          loadOptions={async ({ q }) => {
            const res = await listCustomers({ q, limit: 20 });
            return { items: res?.items || [] };
          }}
          getKey={(x) => x._id}
          renderValue={(x) => (
            <div className="flex items-center gap-2">
              <Pill tone="neutral">{x.companyName}</Pill>
            </div>
          )}
          renderOption={(x) => (
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Building2 size={14} />
              {x.companyName}
            </div>
          )}
          placeholder="Link to a company…"
        />

        <SmartSelect
          label="Team"
          value={team}
          onChange={(it) => setTeam(it)}
          loadOptions={async ({ q }) => {
            const qq = (q || "").toLowerCase();
            return {
              items: teamOptions.filter((x) => x.label.toLowerCase().includes(qq)),
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
            {busy ? "Sending…" : "Approve & send invite"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
