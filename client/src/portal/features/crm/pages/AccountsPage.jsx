import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import {
  Plus,
  RefreshCw,
  Building2,
  Globe,
  Trash2,
  Pencil,
  Link2,
  ChevronRight,
} from "lucide-react";

import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../api";

function AccountFormModal({
  open,
  mode = "create",
  initial = null,
  busy = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    name: "",
    legalName: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    address: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initial?.name || "",
      legalName: initial?.legalName || "",
      industry: initial?.industry || "",
      website: initial?.website || "",
      phone: initial?.phone || "",
      email: initial?.email || "",
      country: initial?.country || "",
      city: initial?.city || "",
      address: initial?.address || "",
      status: initial?.status || "active",
      notes: initial?.notes || "",
    });
  }, [open, initial]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-black/10 px-6 py-5">
          <div className="text-xl font-black text-slate-900">
            {mode === "edit" ? "Edit account" : "New account"}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Company profile for CRM and deals.
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Account name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              label="Legal name"
              value={form.legalName}
              onChange={(e) =>
                setForm((s) => ({ ...s, legalName: e.target.value }))
              }
            />
            <Input
              label="Industry"
              value={form.industry}
              onChange={(e) =>
                setForm((s) => ({ ...s, industry: e.target.value }))
              }
            />
            <Input
              label="Website"
              value={form.website}
              onChange={(e) =>
                setForm((s) => ({ ...s, website: e.target.value }))
              }
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((s) => ({ ...s, phone: e.target.value }))
              }
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) =>
                setForm((s) => ({ ...s, country: e.target.value }))
              }
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
            />
          </div>

          <Input
            label="Address"
            value={form.address}
            onChange={(e) =>
              setForm((s) => ({ ...s, address: e.target.value }))
            }
          />

          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              STATUS
            </span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value }))
              }
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
              NOTES
            </span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) =>
                setForm((s) => ({ ...s, notes: e.target.value }))
              }
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-5">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={busy || !form.name.trim()}
          >
            {busy
              ? "Saving..."
              : mode === "edit"
              ? "Save changes"
              : "Create account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || "active").toLowerCase();
  const map = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-slate-200 bg-slate-50 text-slate-700",
    prospect: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
        map[s] || "border-slate-200 bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      {s}
    </span>
  );
}

export default function AccountsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listAccounts({
        q,
        limit: 50,
        page: 1,
        sort: "-createdAt",
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load accounts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((x) => x.status === "active").length,
      prospects: items.filter((x) => x.status === "prospect").length,
    };
  }, [items]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      await createAccount(payload);
      setCreateOpen(false);
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
      await updateAccount(selected._id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (item) => {
    if (!item?._id) return;
    setConfirm({
      title: "Delete account",
      message: `Delete "${item.name}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteAccount(item._id);
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
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Accounts"
        subtitle="Companies and organizations linked to your pipeline."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Accounts" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading || busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={16} />
              New account
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Building2} label="Total"     value={stats.total}     color="indigo"  />
        <StatCard icon={Building2} label="Active"    value={stats.active}    color="emerald" />
        <StatCard icon={Building2} label="Prospects" value={stats.prospects} color="blue"    />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Search company, industry, email…"
        onClear={() => setQ("")}
      />

      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No accounts yet"
          message="Create your first CRM account."
          actionLabel="New account"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 p-4">
            <div className="text-sm font-black text-slate-900">Accounts ({items.length})</div>
            <div className="text-xs text-slate-500">CRM company records</div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="border-b border-black/10">
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">COMPANY</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">INDUSTRY</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">LINKED CLIENT</th>
                  <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">COUNTRY</th>
                  <th className="px-4 py-3 text-right text-xs font-black tracking-[0.18em] text-slate-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 hover:bg-black/[0.02]"
                  >
                    <td className="px-4 py-4 align-top">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => nav(`/portal/crm/accounts/${item._id}`)}
                      >
                        <div className="text-sm font-black text-slate-900 hover:underline">{item.name}</div>
                        {item.email && (
                          <div className="mt-0.5 text-xs text-slate-500">{item.email}</div>
                        )}
                        {item.website && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Globe size={10} />{item.website}
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">
                      {item.industry || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {item.customerId ? (
                        <button
                          type="button"
                          onClick={() => nav(`/portal/customers/${item.customerId._id || item.customerId}`)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Link2 size={10} />
                          {item.customerId.companyName || "Client"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Not linked</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {item.country || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => nav(`/portal/crm/accounts/${item._id}`)}
                          disabled={busy}
                        >
                          <ChevronRight size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelected(item); setEditOpen(true); }}
                          disabled={busy}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item)}
                          disabled={busy}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AccountFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
        busy={busy}
      />

      <AccountFormModal
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

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
