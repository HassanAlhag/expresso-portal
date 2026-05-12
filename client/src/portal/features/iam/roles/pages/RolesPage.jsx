// src/portal/features/iam/roles/pages/RolesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Button from "../../../../shared/ui/Button";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";
import StatCard from "../../../../shared/ui/StatCard";

import { listRoles } from "../api";
import RoleEditor from "../components/RoleEditor";

const ROLE_GROUPS = {
  internal: new Set([
    "super_admin",
    "admin",
    "operations_manager",
    "finance",
    "procurement_manager",
    "procurement_officer",
    "project_manager",
    "staff",
    "hr_management",
  ]),
  external: new Set(["staff_client", "procurement_client", "client_admin", "client", "vendor"]),
};

function toneForRole(key) {
  if (key === "super_admin") return "danger";
  if (key === "admin" || key === "operations_manager") return "info";
  if (String(key || "").includes("client")) return "success";
  if (String(key || "").includes("procurement")) return "warning";
  if (key === "finance") return "blue";
  if (key === "hr_management") return "violet";
  return "neutral";
}

function roleGroup(role) {
  if (ROLE_GROUPS.external.has(role.key)) return "external";
  if (ROLE_GROUPS.internal.has(role.key)) return "internal";
  return "custom";
}

function prettyKey(key) {
  return String(key || "").replaceAll("_", " ");
}

function getPermissionStats(role) {
  const permissions = Array.isArray(role.permissions) ? role.permissions : [];
  const domains = new Set(permissions.map((permission) => String(permission).split(".")[0]));
  return { permissions, domains };
}

function RoleCard({ role, selected, onEdit }) {
  const { permissions, domains } = getPermissionStats(role);
  const group = roleGroup(role);
  const topPermissions = permissions.slice(0, 5);

  return (
    <button
      type="button"
      onClick={onEdit}
      className={[
        "group flex h-full flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        selected
          ? "border-indigo-300 ring-4 ring-indigo-50"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
              group === "external"
                ? "bg-emerald-50 text-emerald-700"
                : group === "internal"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {group === "external" ? <Users size={19} /> : <Shield size={19} />}
          </span>

          <span className="min-w-0">
            <span className="block truncate text-base font-black text-slate-950">
              {role.label || role.name || role.key}
            </span>
            <span className="mt-1 block truncate font-mono text-xs font-bold text-slate-400">
              {role.key}
            </span>
          </span>
        </div>

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition group-hover:border-indigo-200 group-hover:text-indigo-600">
          <Edit3 size={15} />
        </span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
        {role.description || "No description yet."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={toneForRole(role.key)} size="xs">
          {prettyKey(role.key)}
        </Badge>
        <Badge tone={role.isSystem ? "warning" : "info"} size="xs">
          {role.isSystem ? "System" : "Custom"}
        </Badge>
        {role.synthetic ? (
          <Badge tone="neutral" size="xs">
            Default
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Permissions
          </div>
          <div className="mt-1 text-xl font-black text-slate-950">
            {permissions.length}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Modules
          </div>
          <div className="mt-1 text-xl font-black text-slate-950">
            {domains.size}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {topPermissions.map((permission) => (
          <span
            key={permission}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] font-bold text-slate-500"
          >
            {permission}
          </span>
        ))}
        {permissions.length > topPermissions.length ? (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
            +{permissions.length - topPermissions.length}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listRoles();
      setRows(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalPermissions = rows.reduce(
      (sum, role) => sum + (Array.isArray(role.permissions) ? role.permissions.length : 0),
      0
    );
    return {
      totalPermissions,
      systemRoles: rows.filter((role) => role.isSystem).length,
      customRoles: rows.filter((role) => !role.isSystem).length,
      externalRoles: rows.filter((role) => roleGroup(role) === "external").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((role) => {
      const group = roleGroup(role);
      if (groupFilter !== "all" && group !== groupFilter) return false;
      if (!q) return true;
      return [
        role.key,
        role.label,
        role.description,
        ...(Array.isArray(role.permissions) ? role.permissions : []),
      ].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [groupFilter, query, rows]);

  const openEditor = (role = null) => {
    setSelected(role);
    setEditorOpen(true);
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="IAM"
          title="Roles"
          subtitle="Design internal and client access with clear permission boundaries."
          breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Roles" }]}
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading || busy}>
                <RefreshCw size={16} />
                Refresh
              </Button>

              <Button onClick={() => openEditor(null)} disabled={busy}>
                <Plus size={16} />
                New role
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Shield} label="Total Roles" value={rows.length} color="indigo" />
          <StatCard icon={LockKeyhole} label="Permissions Set" value={stats.totalPermissions} color="emerald" />
          <StatCard icon={Sparkles} label="Custom Roles" value={stats.customRoles} color="violet" />
          <StatCard icon={Users} label="External Roles" value={stats.externalRoles} color="amber" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, keys, descriptions, or permissions..."
                className="h-9 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["internal", "Internal"],
                ["external", "External"],
                ["custom", "Custom"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGroupFilter(value)}
                  className={[
                    "h-10 rounded-xl border px-3 text-xs font-black transition",
                    groupFilter === value
                      ? "border-indigo-200 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="mt-5 h-20 w-full" />
                <Skeleton className="mt-5 h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No matching roles"
            message="Adjust the search or filter to find the access role you need."
            actionLabel="Create role"
            onAction={() => openEditor(null)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRows.map((role) => (
              <RoleCard
                key={role._id || role.key}
                role={role}
                selected={(selected?._id || selected?.key) === (role._id || role.key)}
                onEdit={() => openEditor(role)}
              />
            ))}
          </div>
        )}
      </div>

      <RoleEditor
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
