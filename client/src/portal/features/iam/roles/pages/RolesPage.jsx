// src/portal/features/iam/roles/pages/RolesPage.jsx
import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../../../shared/ui/PageHeader";
import Card from "../../../../shared/ui/Card";
import Button from "../../../../shared/ui/Button";
import Badge from "../../../../shared/ui/Badge";
import Skeleton from "../../../../shared/ui/Skeleton";
import EmptyState from "../../../../shared/ui/EmptyState";
import StatCard from "../../../../shared/ui/StatCard";

import {
  Shield,
  Plus,
  RefreshCw,
  Pencil,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { listRoles } from "../api";
import RoleEditor from "../components/RoleEditor";

function toneForRole(key) {
  if (key === "super_admin") return "danger";
  if (key === "admin") return "info";
  if (key === "staff") return "success";
  return "neutral";
}

function prettyPermission(p) {
  return String(p || "").replaceAll(".", " • ");
}

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);

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

  const totalPermissions = useMemo(() => {
    return rows.reduce(
      (sum, r) =>
        sum + (Array.isArray(r.permissions) ? r.permissions.length : 0),
      0
    );
  }, [rows]);

  const systemRoles = useMemo(
    () => rows.filter((r) => r.isSystem).length,
    [rows]
  );

  const customRoles = useMemo(
    () => rows.filter((r) => !r.isSystem).length,
    [rows]
  );

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="IAM"
          title="Roles"
          subtitle="Control access to modules and operations."
          breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Roles" }]}
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
                New role
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Shield} label="Total Roles" value={rows.length} color="indigo" />
          <StatCard icon={Shield} label="Total Permissions" value={totalPermissions} color="emerald" />
          <StatCard icon={LockKeyhole} label="System Roles" value={systemRoles} color="amber" />
          <StatCard icon={Sparkles} label="Custom Roles" value={customRoles} color="violet" />
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
            icon={Shield}
            title="No roles found"
            message="Create your first role to manage access."
            actionLabel="Create role"
            onAction={() => {
              setSelected(null);
              setEditorOpen(true);
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">
                Roles ({rows.length})
              </div>
              <div className="text-xs text-slate-600">
                System and custom access roles
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      ROLE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      KEY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      TYPE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">
                      PERMISSIONS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((role) => (
                    <tr
                      key={role._id || role.key}
                      className="border-b border-slate-100 hover:bg-black/[0.02]"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-black text-slate-900">
                              {role.label || role.name || role.key}
                            </div>

                            <Badge tone={toneForRole(role.key)}>
                              {String(role.key || "")
                                .replaceAll("_", " ")
                                .toUpperCase()}
                            </Badge>
                          </div>

                          <div className="mt-1 text-sm text-slate-600">
                            {role.description || "No description"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-bold text-slate-800">
                          {role.key || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge tone={role.isSystem ? "neutral" : "info"}>
                          {role.isSystem ? "SYSTEM" : "CUSTOM"}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {(role.permissions || []).slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                              {prettyPermission(p)}
                            </span>
                          ))}

                          {(role.permissions || []).length > 4 ? (
                            <span className="inline-flex items-center rounded-full border border-black/10 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                              +{role.permissions.length - 4} more
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelected(role);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-600"
                      >
                        No roles found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
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
