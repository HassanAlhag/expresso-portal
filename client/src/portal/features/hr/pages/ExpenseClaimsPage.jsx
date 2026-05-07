import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  ReceiptText,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Wallet,
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

import ExpenseClaimFormModal from "../components/ExpenseClaimFormModal";
import ExpenseStatusPill from "../components/ExpenseStatusPill";

import {
  listExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  registerExpense,
  markExpensePaid,
} from "../api";

import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  EXPENSE_DEPARTMENT_OPTIONS,
  EXPENSE_SORT_OPTIONS,
} from "../constants/hr.constants";

function money(value, currency = "AED") {
  return `${currency} ${Number(value || 0).toLocaleString("en-AE", {
    maximumFractionDigits: 2,
  })}`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function ExpenseClaimsPage() {
  const toast = useToast();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [month, setMonth] = useState("");
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
        listExpenses({
          q,
          status,
          category,
          department,
          month,
          sort,
          page,
          limit: 20,
        }),
        getExpenseStats({ month: month || currentMonth() }),
      ]);

      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({
        page: res?.page || 1,
        pages: res?.pages || 1,
        total: res?.total || 0,
      });
      setStats(statsRes);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [q, status, category, department, month, sort, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = () => {
    setQ("");
    setStatus("");
    setCategory("");
    setDepartment("");
    setMonth("");
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

  const handleSave = async (payload) => {
    setBusy(true);

    try {
      if (selected?._id) {
        await updateExpense(selected._id, payload);
      } else {
        await createExpense(payload);
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

  const handleDelete = (item) => {
    setConfirm({
      title: "Delete expense",
      message: `Delete expense "${item.title}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteExpense(item._id);
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

  const doAction = async (fn, item, fallbackMessage) => {
    setBusy(true);
    try {
      await fn(item._id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || fallbackMessage);
    } finally {
      setBusy(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Submitted",
        value: stats?.totals?.pending || 0,
        icon: ReceiptText,
        color: "indigo",
      },
      {
        label: "Approved",
        value: stats?.totals?.approved || 0,
        icon: CheckCircle2,
        color: "emerald",
      },
      {
        label: "Registered",
        value: stats?.totals?.registered || 0,
        icon: ClipboardCheck,
        color: "amber",
      },
      {
        label: "This Month",
        value: money(stats?.currentMonth?.registeredTotal || 0),
        icon: Wallet,
        color: "slate",
      },
    ],
    [stats]
  );

  return (
    <>
      <div className="grid gap-4">
        <PageHeader
          eyebrow="HR"
          title="Expense Claims"
          subtitle="Staff expenses, approvals, and monthly registration."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "HR" },
            { label: "Expenses" },
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
                New claim
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
          searchPlaceholder="Search expenses..."
          filters={[
            {
              label: "Status",
              value: status,
              onChange: (v) => {
                setStatus(v);
                setPage(1);
              },
              options: EXPENSE_STATUS_OPTIONS,
            },
            {
              label: "Category",
              value: category,
              onChange: (v) => {
                setCategory(v);
                setPage(1);
              },
              options: EXPENSE_CATEGORY_OPTIONS,
            },
            {
              label: "Department",
              value: department,
              onChange: (v) => {
                setDepartment(v);
                setPage(1);
              },
              options: EXPENSE_DEPARTMENT_OPTIONS,
            },
            {
              label: "Sort",
              value: sort,
              onChange: setSort,
              options: EXPENSE_SORT_OPTIONS,
            },
          ]}
          onClear={handleClear}
          right={
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          }
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
            icon={ReceiptText}
            title="No expense claims found"
            message="Create a new staff expense claim or adjust your filters."
            actionLabel="New claim"
            onAction={openCreate}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3 font-black">Expense</th>
                    <th className="px-4 py-3 font-black">Staff</th>
                    <th className="px-4 py-3 font-black">Category</th>
                    <th className="px-4 py-3 font-black">Amount</th>
                    <th className="px-4 py-3 font-black">Month</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => nav(`/portal/hr/expenses/${item._id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900 hover:text-indigo-600">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.description || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-semibold">
                          {item.staffName || "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.department || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone="neutral">
                          {String(item.category || "other").replaceAll(
                            "_",
                            " "
                          )}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-sm font-black text-slate-900">
                        {money(item.amount, item.currency)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.claimMonth || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <ExpenseStatusPill status={item.status} />
                      </td>

                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-2">
                          {item.status === "submitted" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  doAction(
                                    approveExpense,
                                    item,
                                    "Approve failed"
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setPrompt({
                                  title: "Reject expense",
                                  inputLabel: "REJECTION REASON",
                                  inputPlaceholder: "Why is this being rejected?",
                                  inputType: "textarea",
                                  required: false,
                                  confirmLabel: "Reject",
                                  onConfirm: async (reason) => {
                                    setBusy(true);
                                    try {
                                      await rejectExpense(item._id, reason);
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

                          {item.status === "approved" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => setPrompt({
                                title: "Register expense",
                                message: `Register "${item.title}" to a month for accounting.`,
                                inputLabel: "MONTH",
                                inputType: "month",
                                inputDefault: item.claimMonth || currentMonth(),
                                required: true,
                                confirmLabel: "Register",
                                onConfirm: async (m) => {
                                  setBusy(true);
                                  try {
                                    await registerExpense(item._id, m);
                                    await load();
                                  } catch (e) {
                                    toast.error(
                                      e?.response?.data?.message ||
                                        e?.message ||
                                        "Register failed"
                                    );
                                  } finally {
                                    setBusy(false);
                                    setPrompt(null);
                                  }
                                },
                              })}
                            >
                              Register
                            </Button>
                          ) : null}

                          {item.status === "registered" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                doAction(
                                  markExpensePaid,
                                  item,
                                  "Payment update failed"
                                )
                              }
                            >
                              Mark paid
                            </Button>
                          ) : null}

                          {["submitted", "approved", "rejected"].includes(
                            item.status
                          ) ? (
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
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
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

      <ExpenseClaimFormModal
        open={modalOpen}
        initial={selected}
        busy={busy}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSubmit={handleSave}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />

      <PromptModal
        open={!!prompt}
        {...prompt}
        onClose={() => setPrompt(null)}
      />
    </>
  );
}
