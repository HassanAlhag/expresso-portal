import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Button from "../../../../shared/ui/Button";
import StatCard from "../../../../shared/ui/StatCard";
import FilterBar from "../../../../shared/ui/FilterBar";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";

import {
  Plus,
  RefreshCw,
  Users as UsersIcon,
  Shield,
  Briefcase,
  UserX,
} from "lucide-react";

import UserTable from "../components/UserTable";
import UserModal from "../components/UserModal";
import { listUsers } from "../api";
import { listRoles } from "../../roles/api";
import { listTeams } from "../../teams/api";

const STATUS = [
  { value: "", label: "All status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const SORT = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "fullName", label: "Name (A–Z)" },
  { value: "-fullName", label: "Name (Z–A)" },
  { value: "email", label: "Email (A–Z)" },
  { value: "-lastLoginAt", label: "Last login" },
];

export default function UsersListPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [isActive, setIsActive] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [roleOptions, setRoleOptions] = useState([{ value: "", label: "All roles" }]);
  const [teamOptions, setTeamOptions] = useState([{ value: "", label: "All teams" }]);
  const [createOpen, setCreateOpen] = useState(false);

  const loadRolesForFilter = async () => {
    try {
      const res = await listRoles();
      const items = (res?.items || []).map((r) => ({ value: r.key, label: r.label || r.key }));
      setRoleOptions([{ value: "", label: "All roles" }, ...items]);
    } catch {
      setRoleOptions([{ value: "", label: "All roles" }]);
    }
  };

  const loadTeamsForFilter = async () => {
    try {
      const res = await listTeams({ isActive: "true" });
      const items = (res?.items || []).map((t) => ({ value: t.label, label: t.label }));
      setTeamOptions([{ value: "", label: "All teams" }, ...items]);
    } catch {
      setTeamOptions([{ value: "", label: "All teams" }]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await listUsers({ q, role, team, isActive, sort, page, limit });
      setRows(res?.users || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRolesForFilter();
    loadTeamsForFilter();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, role, team, isActive, sort, page]);

  const resetFilters = () => {
    setQ(""); setRole(""); setTeam(""); setIsActive(""); setSort("-createdAt"); setPage(1);
  };

  const activeCount = useMemo(() => rows.filter((x) => x.isActive).length, [rows]);
  const inactiveCount = useMemo(() => rows.filter((x) => !x.isActive).length, [rows]);
  const teamCount = useMemo(() => {
    const teams = new Set(rows.map((x) => x.team).filter((x) => String(x || "").trim()));
    return teams.size;
  }, [rows]);

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="IAM"
          title="Users"
          subtitle="Roles, team structure, access, and security."
          breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Users" }]}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus size={15} />
                Add user
              </Button>
            </div>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={UsersIcon} label="Total"    value={total}         color="indigo"  />
          <StatCard icon={Shield}    label="Active"   value={activeCount}   color="emerald" />
          <StatCard icon={UserX}     label="Inactive" value={inactiveCount} color="rose"    />
          <StatCard icon={Briefcase} label="Teams"    value={teamCount}     color="amber"   />
        </div>

        {/* Filter bar */}
        <FilterBar
          searchValue={q}
          onSearchChange={(v) => { setQ(v); setPage(1); }}
          searchPlaceholder="Name, email, team, title…"
          filters={[
            { label: "role",   value: role,     onChange: (v) => { setRole(v);     setPage(1); }, options: roleOptions },
            { label: "team",   value: team,     onChange: (v) => { setTeam(v);     setPage(1); }, options: teamOptions },
            { label: "status", value: isActive, onChange: (v) => { setIsActive(v); setPage(1); }, options: STATUS      },
            { label: "sort",   value: sort,     onChange: (v) => { setSort(v);                 }, options: SORT        },
          ]}
          onClear={resetFilters}
        />

        {/* Content */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 grid gap-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            message="Create a new user or adjust your filters."
            actionLabel="Add user"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <UserTable rows={rows} busy={busy} setBusy={setBusy} onChanged={load} />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page <b>{page}</b> of <b>{pages}</b> · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages || loading}>Next</Button>
          </div>
        </div>
      </div>

      <UserModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        busy={busy}
        onSubmit={async () => { setCreateOpen(false); await load(); }}
      />
    </>
  );
}
