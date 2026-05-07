import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import Badge from "../../../shared/ui/Badge";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import {
  Plus,
  RefreshCw,
  Building2,
  UserPlus,
  Trash2,
  ChevronRight,
  Briefcase,
  ShoppingCart,
  Layers,
} from "lucide-react";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomerLogin,
} from "../api";

import CustomerFormModal from "../components/CustomerFormModal";
import CreateLoginModal from "../components/CreateLoginModal";

const DEPT_OPTIONS = [
  { value: "", label: "All departments" },
  { value: "digital_agency", label: "Digital Agency" },
  { value: "procurement", label: "Procurement" },
  { value: "both", label: "Both" },
];

const DEPT_META = {
  digital_agency: {
    label: "Digital Agency",
    icon: Briefcase,
    classes: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  procurement: {
    label: "Procurement",
    icon: ShoppingCart,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  both: {
    label: "Digital & Procurement",
    icon: Layers,
    classes: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "companyName", label: "Company A → Z" },
  { value: "-companyName", label: "Company Z → A" },
  { value: "contactName", label: "Contact A → Z" },
  { value: "-contactName", label: "Contact Z → A" },
];

export default function CustomersPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState("");
  const [dept, setDept] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCustomers({
        q,
        isActive,
        department: dept || undefined,
        sort,
        page,
        limit,
      });
      setItems(res?.items || []);
      setMeta({
        page: res?.page || page,
        pages: res?.pages || 1,
        total: res?.total ?? 0,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load clients"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q, isActive, dept, sort, page]);

  const resetFilters = () => {
    setQ("");
    setIsActive("");
    setDept("");
    setSort("-createdAt");
    setPage(1);
  };

  const stats = useMemo(
    () => ({
      total: meta.total || 0,
      activeOnPage: items.filter((x) => x.isActive).length,
      inactiveOnPage: items.filter((x) => !x.isActive).length,
      withLoginOnPage: items.filter((x) => Boolean(x.ownerUserId)).length,
    }),
    [items, meta.total]
  );

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      await createCustomer(payload);
      setCreateOpen(false);
      setPage(1);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (payload) => {
    if (!selected?._id) return;
    setBusy(true);
    try {
      await updateCustomer(selected._id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDeactivate = (c) => {
    if (!c?._id) return;
    setConfirm({
      title: "Deactivate client",
      message: `Deactivate "${c.companyName}"?`,
      danger: true,
      confirmLabel: "Deactivate",
      onConfirm: async () => {
        setBusy(true);
        setConfirm(null);
        try {
          await deleteCustomer(c._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Deactivate failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const onCreateLogin = async (payload) => {
    if (!selected?._id) return;
    setBusy(true);
    try {
      await createCustomerLogin(selected._id, payload);
      setLoginOpen(false);
      setSelected(null);
      await load();
      toast.success("Login created and linked to client.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="ACCOUNTS"
        title="Clients"
        subtitle="Client accounts & ownership."
        breadcrumb={[{ label: "Portal", to: "/portal" }, { label: "Clients" }]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={15} />
              New client
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total"
          value={stats.total}
          color="indigo"
        />
        <StatCard
          icon={Building2}
          label="Active"
          value={stats.activeOnPage}
          color="emerald"
        />
        <StatCard
          icon={Building2}
          label="Inactive"
          value={stats.inactiveOnPage}
          color="rose"
        />
        <StatCard
          icon={UserPlus}
          label="Has Login"
          value={stats.withLoginOnPage}
          color="violet"
        />
      </div>

      {/* Filter bar */}
      <FilterBar
        searchValue={q}
        onSearchChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        searchPlaceholder="Search company, contact, email…"
        filters={[
          {
            label: "status",
            value: isActive,
            onChange: (v) => {
              setIsActive(v);
              setPage(1);
            },
            options: STATUS_OPTIONS,
          },
          {
            label: "department",
            value: dept,
            onChange: (v) => {
              setDept(v);
              setPage(1);
            },
            options: DEPT_OPTIONS,
          },
          {
            label: "sort",
            value: sort,
            onChange: (v) => {
              setSort(v);
              setPage(1);
            },
            options: SORT_OPTIONS,
          },
        ]}
        onClear={resetFilters}
      />

      {/* Content */}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-[28px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          message="Create a client to start jobs and production workflow."
          actionLabel="New client"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((c) => {
            const hasLogin = Boolean(c.ownerUserId);
            return (
              <div
                key={c._id}
                className="group overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
              >
                <button
                  type="button"
                  onClick={() => nav(`/portal/customers/${c._id}`)}
                  className="block w-full text-left"
                >
                  <div className="p-5">
                    <div className="rounded-[24px] border border-black/5 bg-slate-50 p-4">
                      <div className="flex h-40 items-center justify-center rounded-[20px] border border-black/5 bg-slate-100 overflow-hidden">
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={c.companyName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                            <Building2 size={34} />
                            <div className="text-sm font-bold text-slate-500">
                              {c.companyName?.slice(0, 2)?.toUpperCase() ||
                                "CU"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge tone={c.isActive ? "success" : "danger"}>
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                      <Badge tone={hasLogin ? "info" : "neutral"}>
                        {hasLogin ? "LOGIN LINKED" : "NO LOGIN"}
                      </Badge>
                      {(() => {
                        const d = c.department || "digital_agency";
                        const m = DEPT_META[d];
                        if (!m) return null;
                        const Icon = m.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${m.classes}`}
                          >
                            <Icon size={10} />
                            {m.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="mt-3">
                      <div className="line-clamp-1 text-lg font-black text-slate-900">
                        {c.companyName}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm text-slate-600">
                        {c.contactName || "No contact assigned"}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {c.primaryEmail || "No email"}
                        {c.slug ? ` • /${c.slug}` : ""}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Open profile
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </button>

                <div className="border-t border-black/5 bg-white/70 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(c);
                        setLoginOpen(true);
                      }}
                      disabled={busy}
                    >
                      <UserPlus size={16} />
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(c);
                        setEditOpen(true);
                      }}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(c)}
                      disabled={busy}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && items.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page <b>{meta.page}</b> of <b>{meta.pages}</b> · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || loading}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={meta.page >= meta.pages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CustomerFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />
      <CustomerFormModal
        open={editOpen}
        mode="edit"
        initial={selected}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSubmit={onEdit}
        busy={busy}
      />
      <CreateLoginModal
        open={loginOpen}
        customer={selected}
        onClose={() => {
          setLoginOpen(false);
          setSelected(null);
        }}
        onSubmit={onCreateLogin}
        busy={busy}
      />
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
