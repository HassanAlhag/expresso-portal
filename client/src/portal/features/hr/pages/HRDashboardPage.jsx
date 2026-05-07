import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Users,
  ReceiptText,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Clock,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/ui/Toast";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import StatCard from "../../../shared/ui/StatCard";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";

import {
  getStaffStats,
  getExpenseStats,
  getMonthlyExpenses,
  listExpenses,
  listLeaves,
} from "../api";

import ExpenseStatusPill from "../components/ExpenseStatusPill";
import LeaveStatusPill from "../components/LeaveStatusPill";

function money(value) {
  return `AED ${Number(value || 0).toLocaleString("en-AE", {
    maximumFractionDigits: 2,
  })}`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HRDashboardPage() {
  const toast = useToast();
  const [staffStats, setStaffStats] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [staffRes, expenseRes, monthlyRes, expensesRes, leavesRes] =
        await Promise.all([
          getStaffStats(),
          getExpenseStats({ month: currentMonth() }),
          getMonthlyExpenses(),
          listExpenses({ limit: 5, page: 1, sort: "-createdAt" }),
          listLeaves({ limit: 5, page: 1, sort: "-createdAt" }),
        ]);

      setStaffStats(staffRes);
      setExpenseStats(expenseRes);
      setMonthly(Array.isArray(monthlyRes?.items) ? monthlyRes.items : []);
      setRecentExpenses(
        Array.isArray(expensesRes?.items) ? expensesRes.items : []
      );
      setRecentLeaves(Array.isArray(leavesRes?.items) ? leavesRes.items : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load HR dashboard");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = useMemo(
    () => [
      {
        label: "Active Staff",
        value: staffStats?.totals?.active || 0,
        icon: Users,
        color: "indigo",
      },
      {
        label: "Pending Expenses",
        value: expenseStats?.totals?.pending || 0,
        icon: ReceiptText,
        color: "amber",
      },
      {
        label: "Registered This Month",
        value: money(expenseStats?.currentMonth?.registeredTotal || 0),
        icon: Wallet,
        color: "emerald",
      },
      {
        label: "Approved Waiting Register",
        value: expenseStats?.totals?.approved || 0,
        icon: CheckCircle2,
        color: "slate",
      },
    ],
    [staffStats, expenseStats]
  );

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="HR"
        title="HR Dashboard"
        subtitle="Staff, expenses, approvals, and monthly HR operations overview."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "HR" },
          { label: "Dashboard" },
        ]}
        right={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>

          <Card className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {statCards.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="text-sm font-black text-slate-900">
                  Recent Expense Claims
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Latest submitted or updated staff expenses.
                </div>
              </div>

              {recentExpenses.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No expenses yet"
                  message="Expense claims will appear here."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentExpenses.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.staffName || "—"} · {item.claimMonth || "—"}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="neutral">{money(item.amount)}</Badge>
                        <ExpenseStatusPill status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="text-sm font-black text-slate-900">
                  Recent Leave Requests
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Latest staff leave submissions.
                </div>
              </div>

              {recentLeaves.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No leave requests yet"
                  message="Leave requests will appear here."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeaves.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {item.staffName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {formatDate(item.startDate)} →{" "}
                          {formatDate(item.endDate)}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="neutral">
                          <Clock size={12} />
                          {item.days || 1}d
                        </Badge>
                        <LeaveStatusPill status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">
                Monthly Expense Register
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Registered company expenses by month.
              </div>
            </div>

            {monthly.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No monthly expenses registered"
                message="Approved claims will appear here after monthly registration."
              />
            ) : (
              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {monthly.slice(0, 6).map((item) => (
                  <div
                    key={item.month}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      {item.month}
                    </div>

                    <div className="mt-2 text-2xl font-black text-slate-900">
                      {money(item.total)}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {item.count} registered claim{item.count === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
