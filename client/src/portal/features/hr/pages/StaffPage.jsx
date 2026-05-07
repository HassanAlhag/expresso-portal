import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Users,
  UserCheck,
  Clock,
  UserX,
  Pencil,
  Trash2,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import Badge from "../../../shared/ui/Badge";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import StaffFormModal from "../components/StaffFormModal";
import StaffStatusPill from "../components/StaffStatusPill";

import {
  listStaff,
  getStaffStats,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../api";

import {
  HR_DEPARTMENT_OPTIONS,
  STAFF_EMPLOYMENT_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  STAFF_SORT_OPTIONS,
} from "../constants/hr.constants";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatType(value) {
  return String(value || "full_time").replaceAll("_", " ");
}

export default function StaffPage() {
  const toast = useToast();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [res, statsRes] = await Promise.all([
        listStaff({
          q,
          status,
          department,
          employmentType,
          sort,
          page,
          limit: 20,
        }),
        getStaffStats(),
      ]);

      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({
        page: res?.page || 1,
        pages: res?.pages || 1,
        total: res?.total || 0,
      });
      setStats(statsRes);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [q, status, department, employmentType, sort, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = useMemo(
    () => [
      {
        label: "Total Staff",
        value: stats?.totals?.total || 0,
        icon: Users,
        color: "indigo",
      },
      {
        label: "Active",
        value: stats?.totals?.active || 0,
        icon: UserCheck,
        color: "emerald",
      },
      {
        label: "On Leave",
        value: stats?.totals?.onLeave || 0,
        icon: Clock,
        color: "amber",
      },
      {
        label: "Inactive",
        value: stats?.totals?.inactive || 0,
        icon: UserX,
        color: "slate",
      },
    ],
    [stats]
  );

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setDepartment("");
    setEmploymentType("");
    setSort("-createdAt");
    setPage(1);
  };

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setModalOpen(true);
  };

  const save = async (payload) => {
    setBusy(true);

    try {
      if (selected?._id) {
        await updateStaff(selected._id, payload);
      } else {
        await createStaff(payload);
      }

      setModalOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = (item) => {
    setConfirm({
      title: "Delete staff member",
      message: `Delete "${item.fullName}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteStaff(item._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
        setConfirm(null);
      },
    });
  };

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="HR"
          title="Staff Directory"
          subtitle="Manage employees, departments, employment status, and HR records."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "HR" },
            { label: "Staff" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={load}
                disabled={loading || busy}
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </Button>

              <Button onClick={openCreate} disabled={busy}>
                <Plus size={15} />
                New staff
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {statCards.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>

        <FilterBar
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchPlaceholder="Search staff..."
          filters={[
            {
              label: "Status",
              value: status,
              onChange: (v) => {
                setStatus(v);
                setPage(1);
              },
              options: STAFF_STATUS_OPTIONS,
            },
            {
              label: "Department",
              value: department,
              onChange: (v) => {
                setDepartment(v);
                setPage(1);
              },
              options: HR_DEPARTMENT_OPTIONS,
            },
            {
              label: "Employment",
              value: employmentType,
              onChange: (v) => {
                setEmploymentType(v);
                setPage(1);
              },
              options: STAFF_EMPLOYMENT_TYPE_OPTIONS,
            },
            {
              label: "Sort",
              value: sort,
              onChange: setSort,
              options: STAFF_SORT_OPTIONS,
            },
          ]}
          onClear={clearFilters}
        />

        {loading ? (
          <Card className="p-6">
            <div className="grid gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff found"
            message="Create your first staff record or adjust your filters."
            actionLabel="New staff"
            onAction={openCreate}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3 font-black">Staff</th>
                    <th className="px-4 py-3 font-black">Department</th>
                    <th className="px-4 py-3 font-black">Team</th>
                    <th className="px-4 py-3 font-black">Employment</th>
                    <th className="px-4 py-3 font-black">Joining</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => nav(`/portal/hr/staff/${item._id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900 hover:text-indigo-600 transition-colors">
                          {item.fullName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.jobTitle || "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {item.email || item.phone || "—"}
                        </div>
                        {item.managerStaffId?.fullName && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            Manager: {item.managerStaffId.fullName}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.department || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.teamId?.label || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone="neutral">
                          {formatType(item.employmentType)}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(item.joiningDate)}
                      </td>

                      <td className="px-4 py-4">
                        <StaffStatusPill status={item.status} />
                      </td>

                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => openEdit(item)}
                          >
                            <Pencil size={14} />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => remove(item)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Page <b>{meta.page}</b> of <b>{meta.pages}</b> · {meta.total}{" "}
                  total
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.pages}
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <StaffFormModal
        open={modalOpen}
        initial={selected}
        busy={busy}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSubmit={save}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
