import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { listContacts, createContact, deleteContact } from "../api";
import { UserRound, Plus, Mail, Phone, Trash2, ExternalLink, Star } from "lucide-react";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

function ContactFormModal({ open, accountId, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({ fullName: "", jobTitle: "", email: "", phone: "", whatsapp: "", isPrimary: false });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">Add contact</div>

        <div className="grid gap-4">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Primary contact
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onSubmit({ ...form, accountId })} loading={busy} disabled={!form.fullName.trim()}>
            Add contact
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountContactsTab({ account }) {
  const nav = useNavigate();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!account?._id) return;
    setLoading(true);
    try {
      const res = await listContacts({ accountId: account._id, limit: 50 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [account?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (payload) => {
    setBusy(true);
    try {
      const res = await createContact(payload);
      setItems((prev) => [res.item, ...prev]);
      setAddOpen(false);
      toast.success("Contact added.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add contact.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      title: "Remove contact",
      message: "Remove this contact?",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteContact(id);
          setItems((prev) => prev.filter((x) => x._id !== id));
          toast.success("Contact removed.");
        } catch {
          toast.error("Failed to remove contact.");
        }
        setConfirmState(null);
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Contacts"
          subtitle={`${items.length} contacts linked to this account`}
          right={
            <Button onClick={() => setAddOpen(true)} disabled={busy}>
              <Plus size={14} />
              Add contact
            </Button>
          }
        />
        <CardBody>
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="No contacts yet"
              message="Add people associated with this account."
              actionLabel="Add contact"
              onAction={() => setAddOpen(true)}
            />
          ) : (
            <div className="grid gap-3">
              {items.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <UserRound size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">{c.fullName}</span>
                        {c.isPrimary && (
                          <Star size={11} className="text-amber-500 fill-amber-400" />
                        )}
                      </div>
                      {c.jobTitle && (
                        <div className="text-xs text-slate-500">{c.jobTitle}</div>
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
                      onClick={() => handleDelete(c._id)}
                      className="text-slate-300 hover:text-rose-500 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <ContactFormModal
        open={addOpen}
        accountId={account?._id}
        busy={busy}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </>
  );
}
