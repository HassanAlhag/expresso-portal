import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CalendarDays, Wallet } from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";

import { getMonthlyExpenses } from "../api";
import { useToast } from "../../../shared/ui/Toast";

function money(value) {
  return `AED ${Number(value || 0).toLocaleString("en-AE", {
    maximumFractionDigits: 2,
  })}`;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2].map(
  (y) => y.toString()
);

export default function MonthlyExpensesPage() {
  const toast = useToast();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear.toString());

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getMonthlyExpenses();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load monthly expenses");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(
    () => items.filter((item) => String(item.month || "").startsWith(year)),
    [items, year]
  );

  const grandTotal = filteredItems.reduce((sum, i) => sum + (i.total || 0), 0);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="HR"
        title="Monthly Expenses"
        subtitle="Registered company expenses grouped by month."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "HR" },
          { label: "Monthly Expenses" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
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
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No registered monthly expenses"
          message="Approved expense claims will appear here after they are registered."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Wallet size={15} className="text-indigo-500" />
            <span>
              Total registered:{" "}
              <span className="font-black text-slate-900">{money(grandTotal)}</span>{" "}
              across{" "}
              <span className="font-black text-slate-900">{filteredItems.length}</span>{" "}
              month{filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.month} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Month
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {item.month}
                    </div>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Wallet size={20} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-500">
                      Total Registered
                    </div>
                    <div className="mt-1 text-xl font-black text-slate-900">
                      {money(item.total)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Claims</div>
                      <div className="text-lg font-black text-slate-900">
                        {item.count}
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs text-emerald-700">Paid</div>
                      <div className="text-sm font-black text-emerald-800">
                        {money(item.paid)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs text-amber-700">Unpaid</div>
                      <div className="text-sm font-black text-amber-800">
                        {money(item.unpaid)}
                      </div>
                    </div>
                  </div>

                  {item.categories && Object.keys(item.categories).length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-xs font-bold text-slate-500">
                        By Category
                      </div>
                      <div className="grid gap-1">
                        {Object.entries(item.categories).map(([cat, val]) => (
                          <div key={cat} className="flex items-center justify-between text-xs">
                            <span className="capitalize text-slate-600">
                              {String(cat).replaceAll("_", " ")}
                            </span>
                            <span className="font-black text-slate-900">
                              {money(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => nav(`/portal/hr/expenses?month=${item.month}`)}
                  className="mt-3 text-xs font-extrabold text-indigo-600 hover:text-indigo-700"
                >
                  View expenses →
                </button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
