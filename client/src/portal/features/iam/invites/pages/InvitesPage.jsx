import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Button from "../../../../shared/ui/Button";
import Card from "../../../../shared/ui/Card";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";
import StatCard from "../../../../shared/ui/StatCard";
import FilterBar from "../../../../shared/ui/FilterBar";

import {
  Plus,
  RefreshCw,
  MailPlus,
  RotateCcw,
  Ban,
} from "lucide-react";

import { listInvites, cancelInvite, resendInvite } from "../api";
import { listRoles } from "../../roles/api";
import { listTeams } from "../../teams/api";
import InviteEditor from "../components/InviteEditor";

const STATUS = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const SORT = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "-expiresAt", label: "Expiry (latest)" },
  { value: "expiresAt", label: "Expiry (soonest)" },
  { value: "email", label: "Email (A–Z)" },
];

function toneForStatus(status) {
  if (status === "pending") return "info";
  if (status === "accepted") return "success";
  if (status === "cancelled") return "danger";
  if (status === "expired") return "neutral";
  return "neutral";
}

export default function InvitesPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [sort, setSort] = useState("-createdAt");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [roleOptions, setRoleOptions] = useState([
    { value: "", label: "All roles" },
  ]);
  const [teamOptions, setTeamOptions] = useState([
    { value: "", label: "All teams" },
  ]);

  const [createOpen, setCreateOpen] = useState(false);

  const loadLookups = async () => {
    try {
      const [rolesRes, teamsRes] = await Promise.all([
        listRoles(),
        listTeams({ isActive: "true" }),
      ]);

      setRoleOptions([
        { value: "", label: "All roles" },
        ...(rolesRes?.items || []).map((r) => ({
          value: r.key,
          label: r.label || r.key,
        })),
      ]);

      setTeamOptions([
        { value: "", label: "All teams" },
        ...(teamsRes?.items || []).map((t) => ({
          value: t.label,
          label: t.label,
        })),
      ]);
    } catch (err) {
      console.error("Failed to load invite filters:", err);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await listInvites({
        q,
        status,
        role,
        team,
        sort,
        page,
        limit,
      });
      setRows(res?.items || []);
      setTotal(res?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, role, team, sort, page]);

  const pendingCount = useMemo(
    () => rows.filter((x) => x.status === "pending").length,
    [rows]
  );

  const acceptedCount = useMemo(
    () => rows.filter((x) => x.status === "accepted").length,
    [rows]
  );

  const handleCancel = async (invite) => {
    setBusy(true);
    try {
      await cancelInvite(invite._id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (invite) => {
    setBusy(true);
    try {
      await resendInvite(invite._id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="IAM"
          title="Invites"
          subtitle="Create and manage portal invitations."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "Invites" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={load}
                disabled={loading || busy}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>

              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus size={16} />
                New invite
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={MailPlus} label="Total Invites" value={total} color="indigo" />
          <StatCard icon={MailPlus} label="Pending" value={pendingCount} color="amber" />
          <StatCard icon={MailPlus} label="Accepted" value={acceptedCount} color="emerald" />
        </div>

        <FilterBar
          searchValue={q}
          onSearchChange={(v) => { setQ(v); setPage(1); }}
          searchPlaceholder="Search email, name, team…"
          filters={[
            { label: "status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS },
            { label: "role",   value: role,   onChange: (v) => { setRole(v);   setPage(1); }, options: roleOptions },
            { label: "team",   value: team,   onChange: (v) => { setTeam(v);   setPage(1); }, options: teamOptions },
            { label: "sort",   value: sort,   onChange: (v) => { setSort(v);   setPage(1); }, options: SORT },
          ]}
          onClear={() => { setQ(""); setStatus(""); setRole(""); setTeam(""); setSort("-createdAt"); setPage(1); }}
        />

        {loading ? (
          <Card className="p-6">
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={MailPlus}
            title="No invites found"
            message="Create your first portal invite."
            actionLabel="Create invite"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">
                Invites ({rows.length})
              </div>
              <div className="text-xs text-slate-600">
                Pending and historical invitations
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      EMAIL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      ROLE / TEAM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      STATUS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      EXPIRES
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((invite) => (
                    <tr
                      key={invite._id}
                      className="border-b border-slate-100 hover:bg-black/[0.02]"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-black text-slate-900">
                          {invite.email}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {invite.fullName || "No name"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="neutral">
                            {String(invite.role || "")
                              .replaceAll("_", " ")
                              .toUpperCase()}
                          </Badge>
                          {invite.team ? (
                            <Badge tone="info">{invite.team}</Badge>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge tone={toneForStatus(invite.status)}>
                          {String(invite.status || "").toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {invite.expiresAt
                          ? new Date(invite.expiresAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          {invite.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleResend(invite)}
                                disabled={busy}
                              >
                                <RotateCcw size={16} />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleCancel(invite)}
                                disabled={busy}
                              >
                                <Ban size={16} />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleResend(invite)}
                              disabled={busy}
                            >
                              <RotateCcw size={16} />
                              Resend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-600"
                      >
                        No invites found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <InviteEditor
        open={createOpen}
        busy={busy}
        setBusy={setBusy}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false);
          await load();
        }}
      />
    </>
  );
}
