import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import SegmentTabs from "../../../shared/ui/SegmentTabs";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import { ArrowLeft, RefreshCw, Pencil, Trash2, UserCheck, ExternalLink } from "lucide-react";

import { getAccount, updateAccount, deleteAccount } from "../api";
import AccountOverviewTab from "../tabs/AccountOverviewTab";
import AccountContactsTab from "../tabs/AccountContactsTab";
import AccountDealsTab from "../tabs/AccountDealsTab";

const TABS = [
  { value: "overview",  label: "Overview"  },
  { value: "contacts",  label: "Contacts"  },
  { value: "deals",     label: "Deals"     },
];

function AccountFormModal({ open, initial, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "", legalName: "", industry: "", website: "",
    phone: "", email: "", country: "", city: "", address: "", status: "active", notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name:         initial?.name || "",
      legalName:    initial?.legalName || "",
      industry:     initial?.industry || "",
      website:      initial?.website || "",
      phone:        initial?.phone || "",
      email:        initial?.email || "",
      country:      initial?.country || "",
      city:         initial?.city || "",
      address:      initial?.address || "",
      status:       initial?.status || "active",
      notes:        initial?.notes || "",
    });
  }, [open, initial]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5";
  const labelCls = "text-[11px] font-black tracking-[0.18em] text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">Edit account</div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className={labelCls}>NAME *</label>
              <input value={form.name} onChange={set("name")} placeholder="Acme Corp" className={inputCls} />
            </div>
            <div className="grid gap-2">
              <label className={labelCls}>LEGAL NAME</label>
              <input value={form.legalName} onChange={set("legalName")} placeholder="Acme Corporation LLC" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className={labelCls}>INDUSTRY</label>
              <input value={form.industry} onChange={set("industry")} placeholder="Technology" className={inputCls} />
            </div>
            <div className="grid gap-2">
              <label className={labelCls}>WEBSITE</label>
              <input value={form.website} onChange={set("website")} placeholder="https://acme.com" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className={labelCls}>EMAIL</label>
              <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
            </div>
            <div className="grid gap-2">
              <label className={labelCls}>PHONE</label>
              <input value={form.phone} onChange={set("phone")} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className={labelCls}>CITY</label>
              <input value={form.city} onChange={set("city")} className={inputCls} />
            </div>
            <div className="grid gap-2">
              <label className={labelCls}>COUNTRY</label>
              <input value={form.country} onChange={set("country")} className={inputCls} />
            </div>
          </div>
          <div className="grid gap-2">
            <label className={labelCls}>ADDRESS</label>
            <input value={form.address} onChange={set("address")} className={inputCls} />
          </div>
          <div className="grid gap-2">
            <label className={labelCls}>NOTES</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState({ deals: [], procurementRequests: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAccount(id);
      setItem(res?.item || null);
      setRelated(res?.related || { deals: [], procurementRequests: [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEdit = async (payload) => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await updateAccount(item._id, payload);
      setEditOpen(false);
      await load();
      toast.success("Account updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirm({
      title: "Delete account",
      message: `Delete "${item?.name}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteAccount(item._id);
          toast.success("Account deleted.");
          nav("/portal/crm/accounts");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
        setConfirm(null);
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <Card className="p-6">
        <div className="text-sm font-black text-slate-700">Account not found.</div>
      </Card>
    );
  }

  const linkedCustomer = item.customerId;

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="CRM"
        title={item.name || "Account"}
        subtitle="Company profile, contacts, and related deals."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Accounts", to: "/portal/crm/accounts" },
          { label: item.name || "Account" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/crm/accounts")} disabled={busy}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
              <Pencil size={16} />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={16} />
            </Button>
          </div>
        }
      />

      {linkedCustomer && (
        <button
          type="button"
          onClick={() => nav(`/portal/customers/${linkedCustomer._id}`)}
          className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-left transition hover:bg-emerald-100"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-white">
              <UserCheck size={16} />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Converted to client
              </div>
              <div className="text-sm font-bold text-emerald-900">
                {linkedCustomer.companyName}
                {linkedCustomer.contactName ? ` · ${linkedCustomer.contactName}` : ""}
              </div>
            </div>
          </div>
          <ExternalLink size={15} className="shrink-0 text-emerald-600" />
        </button>
      )}

      <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview"  && <AccountOverviewTab account={item} />}
      {tab === "contacts"  && <AccountContactsTab account={item} />}
      {tab === "deals"     && <AccountDealsTab deals={related.deals || []} />}

      <AccountFormModal
        open={editOpen}
        initial={item}
        busy={busy}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
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
