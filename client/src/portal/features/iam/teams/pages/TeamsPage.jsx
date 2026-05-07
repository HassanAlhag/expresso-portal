import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Card from "../../../../shared/ui/Card";
import Button from "../../../../shared/ui/Button";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";
import StatCard from "../../../../shared/ui/StatCard";

import {
  Users,
  Plus,
  RefreshCw,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { listTeams, setTeamStatus } from "../api";
import TeamEditor from "../components/TeamEditor";

export default function TeamsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTeams();
      setRows(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeTeams = useMemo(
    () => rows.filter((r) => r.isActive).length,
    [rows]
  );

  const totalUsers = useMemo(
    () => rows.reduce((sum, r) => sum + (r.userCount || 0), 0),
    [rows]
  );

  const toggleStatus = async (team) => {
    setBusy(true);
    try {
      await setTeamStatus(team._id, !team.isActive);
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
          title="Teams"
          subtitle="Organize users by function and department."
          breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Teams" }]}
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

              <Button
                onClick={() => {
                  setSelected(null);
                  setEditorOpen(true);
                }}
                disabled={busy}
              >
                <Plus size={16} />
                New team
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Total Teams" value={rows.length} color="indigo" />
          <StatCard icon={Users} label="Active Teams" value={activeTeams} color="emerald" />
          <StatCard icon={Users} label="Users Linked" value={totalUsers} color="amber" />
        </div>

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
            icon={Users}
            title="No teams found"
            message="Create your first team."
            actionLabel="Create team"
            onAction={() => {
              setSelected(null);
              setEditorOpen(true);
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">
                Teams ({rows.length})
              </div>
              <div className="text-xs text-slate-600">
                Department and functional groups
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      TEAM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      KEY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      LEAD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      STATUS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      USERS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((team) => (
                    <tr
                      key={team._id || team.key}
                      className="border-b border-slate-100 hover:bg-black/[0.02]"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-black text-slate-900">
                          {team.label}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {team.description || "No description"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-bold text-slate-800">
                        {team.key}
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-bold text-slate-800">
                        {team.leadUserId?.fullName || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge tone={team.isActive ? "success" : "danger"}>
                          {team.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-bold text-slate-800">
                        {team.userCount || 0}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelected(team);
                              setEditorOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                            Edit
                          </Button>

                          <button
                            type="button"
                            className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white hover:bg-black/[0.03]"
                            title={team.isActive ? "Deactivate" : "Activate"}
                            disabled={busy}
                            onClick={() => toggleStatus(team)}
                          >
                            {team.isActive ? (
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
                        No teams found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <TeamEditor
        open={editorOpen}
        initial={selected}
        busy={busy}
        onClose={() => {
          setEditorOpen(false);
          setSelected(null);
        }}
        onSaved={async () => {
          setEditorOpen(false);
          setSelected(null);
          await load();
        }}
        setBusy={setBusy}
      />
    </>
  );
}
