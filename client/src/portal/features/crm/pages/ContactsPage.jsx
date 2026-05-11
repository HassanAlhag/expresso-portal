import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import { listContacts, createContact, deleteContact } from "../api";
import { leadSourceLabel } from "../constants";
import {
  UserRound, Plus, Mail, Phone,
  Building2, RefreshCw, Trash2, ExternalLink, Star,
} from "lucide-react";

function ContactFormModal({ open, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({
    fullName: "", jobTitle: "", email: "", phone: "",
    whatsapp: "", notes: "", isPrimary: false,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">New contact</div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">FULL NAME *</label>
              <input
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="Jane Smith"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">JOB TITLE</label>
              <input
                value={form.jobTitle}
                onChange={set("jobTitle")}
                placeholder="Marketing Manager"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="jane@company.com"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">PHONE</label>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+971..."
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">NOTES</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="Any relevant context..."
              className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Mark as primary contact
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} loading={busy} disabled={!form.fullName.trim()}>
            <Plus size={14} />
            Create contact
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [confirmState, setConfirmState] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listContacts({ limit: 100 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      toast.error("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setBusy(true);
    try {
      const res = await createContact(form);
      setItems((prev) => [res.item, ...prev]);
      setAddOpen(false);
      toast.success("Contact created.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create contact.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmState({
      title: "Delete contact",
      message: `Delete "${name}"?`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteContact(id);
          setItems((prev) => prev.filter((x) => x._id !== id));
          toast.success("Contact deleted.");
        } catch {
          toast.error("Failed to delete contact.");
        }
        setConfirmState(null);
      },
    });
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return items.filter((c) =>
      rx.test(c.fullName) || rx.test(c.email) || rx.test(c.jobTitle) ||
      rx.test(c.accountId?.name) || rx.test(c.phone)
    );
  }, [items, q]);

  const stats = useMemo(() => ({
    total: items.length,
    withEmail: items.filter((c) => c.email).length,
    primary: items.filter((c) => c.isPrimary).length,
    linked: items.filter((c) => c.accountId || c.customerId || c.leadId).length,
  }), [items]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Contacts"
        subtitle="People associated with accounts, deals, and leads."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Contacts" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={15} />
              New contact
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={UserRound} label="Total"      value={stats.total}     color="indigo"  />
        <StatCard icon={UserRound} label="With Email" value={stats.withEmail} color="blue"    />
        <StatCard icon={UserRound} label="Primary"    value={stats.primary}   color="amber"   />
        <StatCard icon={UserRound} label="Linked"     value={stats.linked}    color="emerald" />
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(v) => setQ(v)}
        searchPlaceholder="Name, email, title, account…"
        onClear={() => setQ("")}
      />

      {/* List */}
      {loading ? (
        <Card className="p-6">
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={UserRound}
            title="No contacts found"
            message="Contacts link people to your CRM accounts and deals."
            actionLabel="New contact"
            onAction={() => setAddOpen(true)}
          />
        </Card>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 p-4">
            <div className="text-sm font-black text-slate-900">Contacts ({filtered.length})</div>
            <div className="text-xs text-slate-500">People in your CRM network</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-black/[0.02] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                    {(c.fullName?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{c.fullName}</span>
                      {c.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          <Star size={9} className="fill-amber-400" /> Primary
                        </span>
                      )}
                      {c.customerId?.companyName && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                          <Building2 size={9} />
                          {c.customerId.companyName}
                        </span>
                      )}
                      {c.leadId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700">
                          Lead - {leadSourceLabel(c.leadId.source || c.source)}
                        </span>
                      )}
                    </div>
                    {c.jobTitle && (
                      <div className="text-xs text-slate-500">{c.jobTitle}{c.accountId?.name ? ` · ${c.accountId.name}` : ""}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition">
                          <Mail size={11} />{c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition">
                          <Phone size={11} />{c.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => nav(`/portal/crm/contacts/${c._id}`)}
                    className="text-slate-400 hover:text-slate-700 transition"
                  >
                    <ExternalLink size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c._id, c.fullName)}
                    className="text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ContactFormModal
        open={addOpen}
        busy={busy}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
