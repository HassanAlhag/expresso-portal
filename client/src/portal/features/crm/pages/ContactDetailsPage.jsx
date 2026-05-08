import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import CRMActivityComposer from "../components/CRMActivityComposer";
import CRMActivityTimeline from "../components/CRMActivityTimeline";
import { getContact, updateContact, deleteContact } from "../api";
import {
  ArrowLeft, RefreshCw, Pencil, Trash2,
  UserRound, Mail, Phone, Building2, BriefcaseBusiness,
  MessageCircle, Star, Activity,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="mt-0.5 text-slate-400"><Icon size={15} /></div>
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">{label}</div>
        {href ? (
          <a href={href} className="mt-1 text-sm font-semibold text-slate-900 hover:text-slate-600 transition break-words">
            {value || "—"}
          </a>
        ) : (
          <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{value || "—"}</div>
        )}
      </div>
    </div>
  );
}

function EditModal({ open, contact, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (contact) {
      setForm({
        fullName: contact.fullName || "",
        jobTitle: contact.jobTitle || "",
        email: contact.email || "",
        phone: contact.phone || "",
        whatsapp: contact.whatsapp || "",
        notes: contact.notes || "",
        isPrimary: contact.isPrimary || false,
      });
    }
  }, [contact]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-5 text-base font-black text-slate-900">Edit contact</div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">FULL NAME *</label>
              <input value={form.fullName} onChange={set("fullName")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">JOB TITLE</label>
              <input value={form.jobTitle} onChange={set("jobTitle")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">EMAIL</label>
              <input type="email" value={form.email} onChange={set("email")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">PHONE</label>
              <input value={form.phone} onChange={set("phone")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">WHATSAPP</label>
            <input value={form.whatsapp} onChange={set("whatsapp")} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5" />
          </div>
          <div className="grid gap-2">
            <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">NOTES</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={!!form.isPrimary} onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 rounded" />
            Primary contact
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} loading={busy} disabled={!form.fullName?.trim()}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

export default function ContactDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [confirmState, setConfirmState] = useState(null);
  const [item, setItem] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getContact(id);
      setItem(res?.item || null);
      setActivities(Array.isArray(res?.related?.activities) ? res.related.activities : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load contact.");
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleEdit = async (payload) => {
    setBusy(true);
    try {
      const res = await updateContact(id, payload);
      setItem(res?.item);
      setEditOpen(false);
      toast.success("Contact updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete contact",
      message: `Delete "${item?.fullName}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteContact(id);
          nav("/portal/crm/contacts");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed.");
          setBusy(false);
        }
        setConfirmState(null);
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error || "Contact not found."}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CRM"
        title={item.fullName}
        subtitle={item.jobTitle || "Contact"}
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Contacts", to: "/portal/crm/contacts" },
          { label: item.fullName },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/crm/contacts")} disabled={busy}>
              <ArrowLeft size={15} /> Back
            </Button>
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw size={15} />
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
              <Pencil size={15} /> Edit
            </Button>
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={15} />
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: contact info */}
        <div className="lg:col-span-2 grid gap-6 self-start">
          <Card>
            <CardHeader
              title="Contact details"
              right={
                item.isPrimary ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-black text-amber-700">
                    <Star size={11} className="fill-amber-400" /> Primary
                  </span>
                ) : null
              }
            />
            <CardBody>
              <div className="grid gap-3">
                <InfoRow icon={UserRound} label="FULL NAME" value={item.fullName} />
                <InfoRow icon={BriefcaseBusiness} label="JOB TITLE" value={item.jobTitle} />
                <InfoRow icon={Mail} label="EMAIL" value={item.email} href={item.email ? `mailto:${item.email}` : undefined} />
                <InfoRow icon={Phone} label="PHONE" value={item.phone} href={item.phone ? `tel:${item.phone}` : undefined} />
                {item.whatsapp && (
                  <InfoRow icon={MessageCircle} label="WHATSAPP" value={item.whatsapp} href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`} />
                )}
                {item.accountId && (
                  <InfoRow icon={Building2} label="ACCOUNT" value={item.accountId.name} />
                )}
              </div>
            </CardBody>
          </Card>

          {item.notes && (
            <Card>
              <CardHeader title="Notes" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{item.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: activities */}
        <div className="lg:col-span-3 grid gap-6">
          <Card>
            <CardHeader
              title="Log activity"
              right={
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-slate-50">
                  <Activity size={15} className="text-slate-500" />
                </div>
              }
            />
            <CardBody>
              <CRMActivityComposer
                entityType="contact"
                entityId={id}
                onCreated={(newItem) => setActivities((prev) => [newItem, ...prev])}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity timeline" subtitle={`${activities.length} activities`} />
            <CardBody>
              {activitiesLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <CRMActivityTimeline
                  items={activities}
                  canDelete
                  onDeleted={(delId) => setActivities((prev) => prev.filter((x) => x._id !== delId))}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <EditModal
        open={editOpen}
        contact={item}
        busy={busy}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
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
