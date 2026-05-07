import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import {
  listRequests,
  createRequest,
  listCategories,
  listCustomers,
} from "../api";
import {
  Package,
  Plus,
  RefreshCw,
  ChevronRight,
  X,
  User,
  DollarSign,
} from "lucide-react";

const BRAND = "#6F7FD9";

const STATUS_TONES = {
  new: "border-slate-200 bg-slate-50 text-slate-700",
  assessing: "border-amber-200 bg-amber-50 text-amber-700",
  quoted: "border-blue-200 bg-blue-50 text-blue-700",
  approved: "border-violet-200 bg-violet-50 text-violet-700",
  ordered: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const PRIORITY_TONES = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-slate-200 bg-slate-50 text-slate-600",
  low: "border-slate-100 bg-slate-50 text-slate-400",
};

function StatusPill({ value }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
        STATUS_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value || "—"}
    </span>
  );
}

function PriorityPill({ value }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em]",
        PRIORITY_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value || "—"}
    </span>
  );
}

function formatBudget(amount, currency = "AED") {
  if (!amount && amount !== 0) return "—";
  return `${currency} ${Number(amount).toLocaleString("en-AE", {
    maximumFractionDigits: 0,
  })}`;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Create Request Modal ──────────────────────────────────────────────────────

function CreateRequestModal({ open, onClose, onSubmit, busy }) {
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    categoryId: "",
    title: "",
    description: "",
    requirements: "",
    budget: "",
    currency: "AED",
    priority: "normal",
  });

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    setLoadingCats(true);
    listCategories({ limit: 100 })
      .then((res) => {
        if (!ignore) setCategories(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoadingCats(false);
      });

    setLoadingCustomers(true);
    listCustomers({ limit: 200, sort: "-createdAt" })
      .then((res) => {
        if (!ignore) setCustomers(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoadingCustomers(false);
      });

    return () => {
      ignore = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setForm({
      customerId: "",
      categoryId: "",
      title: "",
      description: "",
      requirements: "",
      budget: "",
      currency: "AED",
      priority: "normal",
    });
  }, [open]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.customerId) return;
    if (!form.categoryId) return;
    if (!form.title.trim()) return;

    onSubmit({
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
      customerId: form.customerId,
      categoryId: form.categoryId,
    });
  };

  if (!open) return null;

  const canSubmit =
    Boolean(form.customerId) &&
    Boolean(form.categoryId) &&
    Boolean(form.title.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              New Procurement Request
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Select the customer, category, and request details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="create-request-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  CUSTOMER *
                </span>

                <select
                  value={form.customerId}
                  onChange={set("customerId")}
                  disabled={loadingCustomers}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {loadingCustomers ? "Loading clients..." : "Select client"}
                  </option>

                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName ||
                        c.contactName ||
                        c.primaryEmail ||
                        "Unnamed Client"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  CATEGORY *
                </span>

                <select
                  value={form.categoryId}
                  onChange={set("categoryId")}
                  disabled={loadingCats}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {loadingCats ? "Loading categories..." : "Select category"}
                  </option>

                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Input
              label="TITLE *"
              value={form.title}
              onChange={set("title")}
              placeholder="Brief title for this request"
              required
            />

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                DESCRIPTION
              </span>
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="What do you need and why?"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                REQUIREMENTS
              </span>
              <textarea
                rows={3}
                value={form.requirements}
                onChange={set("requirements")}
                placeholder="Detailed specifications, features, constraints..."
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="BUDGET"
                type="number"
                min="0"
                value={form.budget}
                onChange={set("budget")}
                placeholder="0"
              />

              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  CURRENCY
                </span>
                <select
                  value={form.currency}
                  onChange={set("currency")}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  {["AED", "USD", "EUR", "GBP"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  PRIORITY
                </span>
                <select
                  value={form.priority}
                  onChange={set("priority")}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  {["low", "normal", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!customers.length && !loadingCustomers && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                No customers found. Please create a customer first before
                creating a procurement request.
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>

          <Button
            type="submit"
            form="create-request-form"
            disabled={busy || !canSubmit}
            loading={busy}
            style={{ backgroundColor: BRAND }}
          >
            Create Request
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProcurementRequestsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listRequests({ limit: 200 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load requests.";

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      await createRequest(payload);
      setCreateOpen(false);
      await load();
      toast.success("Procurement request created.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const text = [
        item.title,
        item.ref,
        item.customerId?.companyName,
        item.customerId?.contactName,
        item.categoryId?.name,
        item.assignedTo?.fullName,
        item.assignedTo?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !q || text.includes(q.toLowerCase());
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchPriority = !priorityFilter || item.priority === priorityFilter;
      return matchQ && matchStatus && matchPriority;
    });
  }, [items, q, statusFilter, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter(
        (x) => !["delivered", "cancelled"].includes(x.status)
      ).length,
      delivered: items.filter((x) => x.status === "delivered").length,
    }),
    [items]
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="OPERATIONS"
        title="Procurement Requests"
        subtitle="Manage all procurement and sourcing requests."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "Requests" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              style={{ backgroundColor: BRAND }}
              disabled={busy}
            >
              <Plus size={15} />
              New Request
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Package}
          label="Total"
          value={loading ? "—" : stats.total}
          color="indigo"
        />
        <StatCard
          icon={Package}
          label="Active"
          value={loading ? "—" : stats.active}
          color="emerald"
        />
        <StatCard
          icon={Package}
          label="Delivered"
          value={loading ? "—" : stats.delivered}
          color="blue"
        />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Title, ref, client, category…"
        filters={[
          {
            label: "status",
            value: statusFilter,
            onChange: (v) => setStatusFilter(v),
            options: [
              { value: "", label: "All statuses" },
              ...[
                "new",
                "assessing",
                "quoted",
                "approved",
                "ordered",
                "delivered",
                "cancelled",
              ].map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              })),
            ],
          },
          {
            label: "priority",
            value: priorityFilter,
            onChange: (v) => setPriorityFilter(v),
            options: [
              { value: "", label: "All priorities" },
              ...["urgent", "high", "normal", "low"].map((p) => ({
                value: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
              })),
            ],
          },
        ]}
        onClear={() => {
          setQ("");
          setStatusFilter("");
          setPriorityFilter("");
        }}
      />

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="grid gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No procurement requests"
          message="Create your first procurement request to get started."
          actionLabel="New Request"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => {
            const ref =
              item.ref ||
              (item._id ? `PR-${item._id.slice(-4).toUpperCase()}` : "—");
            const categoryName = item.categoryId?.name || "—";
            const customerName =
              item.customerId?.companyName ||
              item.customerId?.contactName ||
              "—";
            const assignedName =
              item.assignedTo?.fullName || item.assignedTo?.email || null;

            return (
              <div
                key={item._id}
                className="group overflow-hidden rounded-[28px] border border-black/[0.07] bg-white p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-500 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                      {ref}
                    </span>
                    <StatusPill value={item.status} />
                    <PriorityPill value={item.priority} />
                  </div>

                  {/* Title */}
                  <div className="mt-3 text-lg font-black text-slate-900 leading-snug">
                    {item.title || "Untitled request"}
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      {categoryName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {customerName}
                    </span>
                  </div>

                  {/* Assigned + Budget */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {assignedName ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
                            {getInitials(assignedName)}
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {assignedName}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <User size={13} />
                          Unassigned
                        </span>
                      )}
                    </div>
                    {(item.budget || item.budget === 0) && (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                        <DollarSign size={12} className="text-slate-400" />
                        {formatBudget(item.budget, item.currency)}
                      </span>
                    )}
                  </div>

                  {/* Footer link */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        nav(`/portal/procurement/requests/${item._id}`)
                      }
                      className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-900"
                    >
                      View details
                      <ChevronRight
                        size={13}
                        className="transition group-hover:translate-x-0.5"
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        busy={busy}
      />
    </div>
  );
}
