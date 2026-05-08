import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
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
import PromptModal from "../../../shared/ui/PromptModal";
import { useToast } from "../../../shared/ui/Toast";

import LeaveRequestFormModal from "../components/LeaveRequestFormModal";
import LeaveStatusPill from "../components/LeaveStatusPill";

import {
  listLeaves,
  getLeaveStats,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from "../api";

import {
  HR_DEPARTMENT_OPTIONS,
  LEAVE_SORT_OPTIONS,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
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
  return String(value || "annual").replaceAll("_", " ");
}

export default function LeaveRequestsPage() {
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [department, setDepartment] = useState("");
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
        listLeaves({
          q,
          status,
          leaveType,
          department,
          sort,
          page,
          limit: 20,
        }),
        getLeaveStats(),
      ]);

      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({
        page: res?.page || 1,
        pages: res?.pages || 1,
        total: res?.total || 0,
      });
      setStats(statsRes);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [q, status, leaveType, department, sort, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = useMemo(
    () => [
      {
        label: "Submitted",
        value: stats?.totals?.submitted || 0,
        icon: Clock,
        color: "indigo",
      },
      {
        label: "Approved",
        value: stats?.totals?.approved || 0,
        icon: CheckCircle2,
        color: "emerald",
      },
      {
        label: "Rejected",
        value: stats?.totals?.rejected || 0,
        icon: XCircle,
        color: "rose",
      },
      {
        label: "Upcoming",
        value: stats?.totals?.upcoming || 0,
        icon: CalendarDays,
        color: "amber",
      },
    ],
    [stats]
  );

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setLeaveType("");
    setDepartment("");
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
        await updateLeave(selected._id, payload);
      } else {
        await createLeave(payload);
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
    setConfirmState({
      title: "Delete leave request",
      message: `Delete leave request for "${item.staffName}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteLeave(item._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
        setConfirmState(null);
      },
    });
  };

  const action = async (fn, item, message) => {
    setBusy(true);

    try {
      await fn(item._id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="HR"
          title="Leave Requests"
          subtitle="Submit, review, and approve staff leave requests."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "HR" },
            { label: "Leaves" },
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
                New leave
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
          searchPlaceholder="Search leave requests..."
          filters={[
            {
              label: "Status",
              value: status,
              onChange: (v) => {
                setStatus(v);
                setPage(1);
              },
              options: LEAVE_STATUS_OPTIONS,
            },
            {
              label: "Type",
              value: leaveType,
              onChange: (v) => {
                setLeaveType(v);
                setPage(1);
              },
              options: LEAVE_TYPE_OPTIONS,
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
              label: "Sort",
              value: sort,
              onChange: setSort,
              options: LEAVE_SORT_OPTIONS,
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
            icon={CalendarDays}
            title="No leave requests found"
            message="Create a leave request or adjust your filters."
            actionLabel="New leave"
            onAction={openCreate}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3 font-black">Staff</th>
                    <th className="px-4 py-3 font-black">Type</th>
                    <th className="px-4 py-3 font-black">Period</th>
                    <th className="px-4 py-3 font-black">Days</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900">
                          {item.staffName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.department || "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {item.reason || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone="neutral">
                          {formatType(item.leaveType)}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(item.startDate)} →{" "}
                        {formatDate(item.endDate)}
                      </td>

                      <td className="px-4 py-4 text-sm font-black text-slate-900">
                        {item.days || 1}
                      </td>

                      <td className="px-4 py-4">
                        <LeaveStatusPill status={item.status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.status === "submitted" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  action(approveLeave, item, "Approve failed")
                                }
                              >
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setPrompt({
                                  title: "Reject leave request",
                                  inputLabel: "REJECTION REASON",
                                  inputPlaceholder: "Why is this being rejected?",
                                  inputType: "textarea",
                                  required: false,
                                  confirmLabel: "Reject",
                                  onConfirm: async (reason) => {
                                    setBusy(true);
                                    try {
                                      await rejectLeave(item._id, reason);
                                      await load();
                                    } catch (e) {
                                      toast.error(
                                        e?.response?.data?.message ||
                                          e?.message ||
                                          "Reject failed"
                                      );
                                    } finally {
                                      setBusy(false);
                                      setPrompt(null);
                                    }
                                  },
                                })}
                              >
                                <XCircle size={14} />
                              </Button>
                            </>
                          ) : null}

                          {["submitted"].includes(item.status) ? (
                            <>
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
                            </>
                          ) : null}

                          {["submitted", "approved"].includes(item.status) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                action(cancelLeave, item, "Cancel failed")
                              }
                            >
                              Cancel
                            </Button>
                          ) : null}
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

      <LeaveRequestFormModal
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
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />

      <PromptModal
        open={!!prompt}
        {...prompt}
        onClose={() => setPrompt(null)}
      />
    </>
  );
}
