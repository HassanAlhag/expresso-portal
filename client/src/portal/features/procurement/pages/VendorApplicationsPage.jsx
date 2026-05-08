import React, { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import {
  listVendorApplications,
  getVendorApplication,
  approveVendorApplication,
  rejectVendorApplication,
} from "../api";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" };
const STATUS_ICON = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

// ── Credentials modal shown after approval ────────────────────────────────────
function CredentialsModal({ credentials, onClose }) {
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2 text-emerald-600">
          <CheckCircle size={20} />
          <span className="font-black text-slate-900">Application Approved</span>
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Share these credentials with the vendor. The password will only be shown once.
        </p>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Email</div>
              <div className="mt-0.5 text-sm font-bold text-slate-900">{credentials.email}</div>
            </div>
            <button
              type="button"
              onClick={() => copy(credentials.email, "email")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <Copy size={12} />
              {copied === "email" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Temp Password</div>
              <div className="mt-0.5 font-mono text-sm font-bold tracking-wider text-slate-900">
                {showPw ? credentials.tempPassword : "••••••••••••"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button
                type="button"
                onClick={() => copy(credentials.tempPassword, "pw")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <Copy size={12} />
                {copied === "pw" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {credentials.note}
        </p>

        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

// ── Application detail drawer ─────────────────────────────────────────────────
function ApplicationDrawer({ applicationId, onClose, onApproved, onRejected }) {
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    setLoading(true);
    getVendorApplication(applicationId)
      .then((d) => setItem(d?.item || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleApprove = () => {
    if (!item?._id) return;
    setConfirmState({
      title: "Approve Application",
      message: `Approve "${item.companyName}" and generate portal credentials?`,
      danger: false,
      confirmLabel: "Approve & Create Login",
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await approveVendorApplication(item._id);
          setConfirmState(null);
          onApproved(res);
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Approval failed");
          setConfirmState(null);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleReject = async () => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await rejectVendorApplication(item._id, { reason: rejectReason });
      onRejected();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Rejection failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
          <span className="font-black text-slate-900">Vendor Application</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !item ? (
            <p className="text-sm text-slate-500">Application not found.</p>
          ) : (
            <div className="grid gap-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[item.status] || "neutral"}>
                  {item.status?.toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Company info */}
              <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Company Details
                </div>
                <div className="grid gap-2.5">
                  <InfoRow icon={Building2} label="Company" value={item.companyName} />
                  <InfoRow icon={Building2} label="Contact" value={item.contactName} />
                  <InfoRow icon={Mail} label="Email" value={item.email} />
                  <InfoRow icon={Phone} label="Phone" value={item.phone || "—"} />
                  <InfoRow icon={MapPin} label="Country" value={item.country || "—"} />
                  <InfoRow icon={Globe} label="Website" value={item.website || "—"} />
                </div>
              </div>

              {/* Categories */}
              <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Selected Categories
                </div>
                <div className="grid gap-2">
                  {(item.categorySelections || []).map((sel, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <span className="text-indigo-600">{sel.mainCategoryId?.name || "—"}</span>
                      {" › "}
                      <span>{sel.categoryId?.name || "—"}</span>
                      {" › "}
                      <span className="text-slate-500">{sel.subcategoryId?.name || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved by */}
              {item.status === "approved" && item.approvedBy && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Approved by {item.approvedBy?.fullName} on{" "}
                  {new Date(item.approvedAt).toLocaleDateString()}
                </div>
              )}

              {item.status === "rejected" && item.rejectionReason && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Rejection reason: {item.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {item?.status === "pending" && (
          <div className="sticky bottom-0 border-t border-black/5 bg-white p-5">
            {showRejectBox ? (
              <div className="grid gap-3">
                <textarea
                  rows={3}
                  placeholder="Reason for rejection (optional)…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRejectBox(false)} disabled={busy} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={busy}
                    className="flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    variant="outline"
                  >
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectBox(true)}
                  disabled={busy}
                  className="flex-1"
                >
                  <XCircle size={15} />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={busy} className="flex-1">
                  <CheckCircle size={15} />
                  {busy ? "Approving…" : "Approve & Create Login"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VendorApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listVendorApplications({ status: statusFilter, limit: 50 });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApproved = (res) => {
    setSelectedId(null);
    setCredentials(res?.credentials || null);
    load();
  };

  const handleRejected = () => {
    setSelectedId(null);
    load();
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Procurement"
        title="Vendor Applications"
        subtitle="Review and approve vendor self-registration requests."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Procurement", to: "/portal/procurement" },
          { label: "Vendor Applications" },
        ]}
        right={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatusFilter(t.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide transition ${
              statusFilter === t.value
                ? "bg-slate-900 text-white"
                : "border border-black/10 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{total} total</span>
      </div>

      {/* List */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="grid gap-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No applications found.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {items.map((item) => {
              const StatusIcon = STATUS_ICON[item.status] || Clock;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${
                    item.status === "approved"
                      ? "bg-emerald-50 text-emerald-500"
                      : item.status === "rejected"
                      ? "bg-red-50 text-red-400"
                      : "bg-amber-50 text-amber-500"
                  }`}>
                    <StatusIcon size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-black text-slate-900">{item.companyName}</div>
                    <div className="truncate text-xs text-slate-500">
                      {item.contactName} · {item.email}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Badge tone={STATUS_TONE[item.status] || "neutral"}>
                      {item.status?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Drawer */}
      {selectedId && (
        <ApplicationDrawer
          applicationId={selectedId}
          onClose={() => setSelectedId(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}

      {/* Credentials modal */}
      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}
