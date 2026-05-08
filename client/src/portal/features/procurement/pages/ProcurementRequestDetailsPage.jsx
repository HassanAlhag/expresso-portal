import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/ui/PageHeader";
import Card, { CardBody, CardHeader } from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import {
  getRequest,
  updateRequest,
  deleteRequest,
  listVendors,
  createRfqFromRequest,
} from "../api";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  ChevronRight,
  Building2,
  Tag,
  User,
  DollarSign,
  Calendar,
  Hash,
  X,
  Search,
  Globe,
  Phone,
  Mail,
  FileText,
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

const STATUS_ORDER = [
  "new",
  "assessing",
  "quoted",
  "approved",
  "ordered",
  "delivered",
];

function StatusPill({ value }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
        STATUS_TONES[value] || "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {value || "—"}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="mt-0.5 shrink-0 text-slate-400">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBudget(amount, currency = "AED") {
  if (!amount && amount !== 0) return "—";
  return `${currency} ${Number(amount).toLocaleString("en-AE", {
    maximumFractionDigits: 0,
  })}`;
}

// ── Vendor Select Modal ───────────────────────────────────────────────────────

function VendorSelectModal({ open, onClose, onSelect, currentVendorId }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    setLoading(true);
    listVendors({ limit: 200 })
      .then((res) => {
        if (!ignore) setVendors(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [open]);

  const filtered = vendors.filter(
    (v) =>
      !q ||
      [v.name, v.contactPerson, v.email, v.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-black text-slate-900">Select Vendor</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>
        <div className="border-b border-slate-100 px-5 py-3">
          <Input
            placeholder="Search vendors..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            prefix={<Search size={14} className="text-slate-400" />}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid gap-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center text-sm text-slate-400">
              No vendors found.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => onSelect(v)}
                  className={[
                    "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50",
                    v._id === currentVendorId ? "bg-indigo-50" : "",
                  ].join(" ")}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {v.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {[v.contactPerson, v.country]
                        .filter(Boolean)
                        .join(" · ") || "No details"}
                    </div>
                  </div>
                  {v._id === currentVendorId && (
                    <span className="text-xs font-black text-indigo-600">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProcurementRequestDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [error, setError] = useState("");

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  // Quick edit form state
  const [editForm, setEditForm] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRequest(id);
      const req = res?.item || res?.request || res;
      setItem(req);
      setEditForm({
        title: req.title || "",
        description: req.description || "",
        requirements: req.requirements || "",
        budget: req.budget ?? "",
        quotedAmount: req.quotedAmount ?? "",
        assignedTo: req.assignedTo?.fullName || req.assignedTo || "",
        proposedDelivery: req.proposedDelivery
          ? req.proposedDelivery.slice(0, 10)
          : "",
      });
      setIsDirty(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (newStatus) => {
    setStatusBusy(true);
    try {
      const res = await updateRequest(id, { status: newStatus });
      const updated = res?.item || res?.request || res;
      setItem(updated);
      toast.success(`Status updated to ${newStatus}.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed.");
    } finally {
      setStatusBusy(false);
    }
  };

  const handleCancelRequest = () => {
    setConfirmState({
      title: "Cancel Request",
      message: "Cancel this procurement request?",
      danger: true,
      onConfirm: async () => {
        setStatusBusy(true);
        try {
          const res = await updateRequest(id, { status: "cancelled" });
          const updated = res?.item || res?.request || res;
          setItem(updated);
          toast.success("Request cancelled.");
        } catch (e) {
          toast.error(e?.response?.data?.message || "Cancel failed.");
        } finally {
          setStatusBusy(false);
          setConfirmState(null);
        }
      },
    });
  };

  const handleDelete = () => {
    setConfirmState({
      title: "Delete Request",
      message: "Permanently delete this request?",
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteRequest(id);
          toast.success("Request deleted.");
          setConfirmState(null);
          nav("/portal/procurement/requests");
        } catch (e) {
          toast.error(e?.response?.data?.message || "Delete failed.");
          setBusy(false);
          setConfirmState(null);
        }
      },
    });
  };

  const handleVendorSelect = async (vendor) => {
    setVendorModalOpen(false);
    setBusy(true);
    try {
      const res = await updateRequest(id, { vendorId: vendor._id });
      const updated = res?.item || res?.request || res;
      setItem(updated);
      toast.success(`Vendor assigned: ${vendor.name}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Vendor assignment failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRfq = () => {
    setConfirmState({
      title: "Create RFQ",
      message: "Create a draft RFQ from this procurement request?",
      danger: false,
      confirmLabel: "Create RFQ",
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await createRfqFromRequest(id);
          const rfq = res?.item;
          toast.success("Draft RFQ created from request.");
          setConfirmState(null);
          if (rfq?._id) {
            nav(`/portal/procurement/rfqs/${rfq._id}`);
          } else {
            nav("/portal/procurement/rfqs");
          }
        } catch (e) {
          const existingRfq = e?.response?.data?.item;
          if (existingRfq?._id) {
            toast.error("An RFQ already exists for this request.");
            setConfirmState(null);
            nav(`/portal/procurement/rfqs/${existingRfq._id}`);
            return;
          }
          toast.error(e?.response?.data?.message || "Failed to create RFQ.");
          setConfirmState(null);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const setEdit = (field) => (e) => {
    setEditForm((f) => ({ ...f, [field]: e.target.value }));
    setIsDirty(true);
  };

  const handleSaveEdit = async () => {
    setBusy(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        requirements: editForm.requirements,
        budget: editForm.budget !== "" ? Number(editForm.budget) : undefined,
        quotedAmount:
          editForm.quotedAmount !== ""
            ? Number(editForm.quotedAmount)
            : undefined,
        assignedTo: editForm.assignedTo.trim() || undefined,
        proposedDelivery: editForm.proposedDelivery || undefined,
      };
      const res = await updateRequest(id, payload);
      const updated = res?.item || res?.request || res;
      setItem(updated);
      setIsDirty(false);
      toast.success("Request updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid gap-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {error || "Request not found."}
      </div>
    );
  }

  const ref = item.ref || `PR-${item._id?.slice(-4).toUpperCase() || "???"}`;
  const categoryName = item.categoryId?.name || "—";
  const customerName =
    item.customerId?.companyName || item.customerId?.contactName || "—";
  const vendor = item.vendorId;
  const canDelete = ["new", "cancelled"].includes(item.status);

  const timelineFields = [
    { label: "Created", date: item.createdAt },
    { label: "Assessed", date: item.assessedAt },
    { label: "Quoted", date: item.quotedAt },
    { label: "Approved", date: item.approvedAt },
    { label: "Ordered", date: item.orderedAt },
    { label: "Delivered", date: item.deliveredAt },
    { label: "Cancelled", date: item.cancelledAt },
  ].filter((t) => t.date);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="PROCUREMENT"
        title={item.title || "Untitled Request"}
        subtitle={`${ref} · ${customerName}`}
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "Requests", to: "/portal/procurement/requests" },
          { label: ref },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => nav("/portal/procurement/requests")}
              disabled={busy}
            >
              <ArrowLeft size={15} />
            </Button>

            <Button variant="outline" onClick={load} disabled={busy || loading}>
              <RefreshCw size={15} />
            </Button>

            <Button
              onClick={handleCreateRfq}
              disabled={busy}
              style={{ backgroundColor: BRAND }}
            >
              <FileText size={15} />
              Create RFQ
            </Button>

            {canDelete && (
              <Button variant="danger" onClick={handleDelete} disabled={busy}>
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="lg:col-span-2 grid gap-6 self-start">
          <Card>
            <CardHeader
              title="Request Details"
              right={<StatusPill value={item.status} />}
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Hash} label="REF" value={ref} />
                <InfoRow icon={Tag} label="CATEGORY" value={categoryName} />
                <InfoRow
                  icon={Building2}
                  label="CUSTOMER"
                  value={customerName}
                />
                <InfoRow
                  icon={User}
                  label="PRIORITY"
                  value={
                    item.priority
                      ? item.priority.charAt(0).toUpperCase() +
                        item.priority.slice(1)
                      : "—"
                  }
                />
                {(item.budget || item.budget === 0) && (
                  <InfoRow
                    icon={DollarSign}
                    label="BUDGET"
                    value={formatBudget(item.budget, item.currency)}
                  />
                )}
                {item.quotedAmount && (
                  <InfoRow
                    icon={DollarSign}
                    label="QUOTED AMOUNT"
                    value={formatBudget(item.quotedAmount, item.currency)}
                  />
                )}
                {item.proposedDelivery && (
                  <InfoRow
                    icon={Calendar}
                    label="PROPOSED DELIVERY"
                    value={formatDate(item.proposedDelivery)}
                  />
                )}
                {item.createdBy && (
                  <InfoRow
                    icon={User}
                    label="CREATED BY"
                    value={
                      item.createdBy?.fullName ||
                      item.createdBy?.email ||
                      String(item.createdBy)
                    }
                  />
                )}
              </div>

              {item.description && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
                    DESCRIPTION
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {item.description}
                  </p>
                </div>
              )}

              {item.requirements && (
                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 text-[11px] font-black tracking-[0.18em] text-slate-500">
                    REQUIREMENTS
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {item.requirements}
                  </p>
                </div>
              )}

              {item.notes && (
                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="mb-2 text-[11px] font-black tracking-[0.18em] text-amber-600">
                    NOTES
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-amber-800">
                    {item.notes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Vendor Assignment */}
          <Card>
            <CardHeader
              title="Vendor Assignment"
              right={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVendorModalOpen(true)}
                  disabled={busy}
                >
                  {vendor ? "Change Vendor" : "Assign Vendor"}
                </Button>
              }
            />
            <CardBody>
              {vendor ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    icon={Building2}
                    label="VENDOR NAME"
                    value={vendor.name}
                  />
                  {vendor.contactPerson && (
                    <InfoRow
                      icon={User}
                      label="CONTACT PERSON"
                      value={vendor.contactPerson}
                    />
                  )}
                  {vendor.phone && (
                    <InfoRow icon={Phone} label="PHONE" value={vendor.phone} />
                  )}
                  {vendor.email && (
                    <InfoRow icon={Mail} label="EMAIL" value={vendor.email} />
                  )}
                  {vendor.website && (
                    <InfoRow
                      icon={Globe}
                      label="WEBSITE"
                      value={vendor.website}
                    />
                  )}
                </div>
              ) : (
                <div className="flex min-h-[80px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No vendor assigned yet.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: workflow, quick edit, timeline */}
        <div className="grid gap-6 self-start">
          {/* Status Workflow */}
          <Card>
            <CardHeader title="Status Workflow" />
            <CardBody>
              <div className="grid gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusBusy || item.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={[
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
                      item.status === s
                        ? "border-slate-900 bg-slate-900 text-white cursor-default"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                    ].join(" ")}
                  >
                    <span className="capitalize">{s}</span>
                    {item.status === s ? (
                      <span className="text-xs font-black opacity-70">
                        current
                      </span>
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </button>
                ))}

                {item.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={statusBusy}
                    className="mt-1 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    Cancel Request
                    <ChevronRight size={14} className="text-rose-400" />
                  </button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Edit */}
          <Card>
            <CardHeader title="Quick Edit" />
            <CardBody>
              <div className="grid gap-4">
                <Input
                  label="TITLE"
                  value={editForm.title || ""}
                  onChange={setEdit("title")}
                />
                <label className="grid gap-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                    DESCRIPTION
                  </span>
                  <textarea
                    rows={3}
                    value={editForm.description || ""}
                    onChange={setEdit("description")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                    REQUIREMENTS
                  </span>
                  <textarea
                    rows={3}
                    value={editForm.requirements || ""}
                    onChange={setEdit("requirements")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <div className="grid gap-4 grid-cols-2">
                  <Input
                    label="BUDGET"
                    type="number"
                    min="0"
                    value={editForm.budget ?? ""}
                    onChange={setEdit("budget")}
                  />
                  <Input
                    label="QUOTED AMOUNT"
                    type="number"
                    min="0"
                    value={editForm.quotedAmount ?? ""}
                    onChange={setEdit("quotedAmount")}
                  />
                </div>
                <Input
                  label="ASSIGNED TO"
                  value={editForm.assignedTo || ""}
                  onChange={setEdit("assignedTo")}
                  placeholder="Name or user ID"
                />
                <Input
                  label="PROPOSED DELIVERY"
                  type="date"
                  value={editForm.proposedDelivery || ""}
                  onChange={setEdit("proposedDelivery")}
                />

                {isDirty && (
                  <Button
                    onClick={handleSaveEdit}
                    disabled={busy}
                    loading={busy}
                    style={{ backgroundColor: BRAND }}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Timeline */}
          {timelineFields.length > 0 && (
            <Card>
              <CardHeader title="Timeline" />
              <CardBody>
                <div className="grid gap-3">
                  {timelineFields.map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        {t.label}
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatDate(t.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <VendorSelectModal
        open={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSelect={handleVendorSelect}
        currentVendorId={vendor?._id}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}
