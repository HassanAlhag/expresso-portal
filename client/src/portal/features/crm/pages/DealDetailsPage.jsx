import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import SegmentTabs from "../../../shared/ui/SegmentTabs";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import { ArrowLeft, RefreshCw, Pencil, Trash2, ExternalLink } from "lucide-react";

import { getDeal, updateDeal, deleteDeal, convertDealToCustomer } from "../api";
import { stageLabel } from "../constants";
import DealFormModal from "../components/DealFormModal";
import DealOverviewTab from "../tabs/DealOverviewTab";
import DealActivitiesTab from "../tabs/DealActivitiesTab";

const TABS = [
  { value: "overview",   label: "Overview"   },
  { value: "activities", label: "Activities" },
];

export default function DealDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDeal(id);
      setItem(res?.item || res?.deal || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load deal");
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
      await updateDeal(item._id, payload);
      setEditOpen(false);
      await load();
      toast.success("Deal updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirm({
      title: "Delete deal",
      message: `Delete "${item?.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteDeal(item._id);
          toast.success("Deal deleted.");
          nav("/portal/crm/deals");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
        setConfirm(null);
      },
    });
  };

  const handleStageChange = async (nextStage) => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await updateDeal(item._id, { stage: nextStage });
      await load();
      toast.success(`Stage moved to ${stageLabel(nextStage)}.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Stage update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleConvertToCustomer = () => {
    setConfirm({
      title: "Convert to client",
      message: "Convert this won deal into a client account? A new client record will be created.",
      danger: false,
      confirmLabel: "Convert to client",
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await convertDealToCustomer(item._id);
          const customerId = res?.customer?._id;
          toast.success("Deal converted to client successfully.");
          if (customerId) {
            nav(`/portal/customers/${customerId}`);
            return;
          }
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Conversion failed");
        } finally {
          setBusy(false);
          setConfirm(null);
        }
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
        <div className="text-sm font-black text-slate-700">Deal not found.</div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="CRM"
        title={item.title || "Deal"}
        subtitle="Deal details, value, ownership, and stage."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Deals", to: "/portal/crm/deals" },
          { label: item.title || "Deal" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/crm/deals")} disabled={busy}>
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
            {item.customerId ? (
              <Button
                onClick={() => nav(`/portal/customers/${item.customerId._id || item.customerId}`)}
                disabled={busy}
              >
                <ExternalLink size={15} />
                View client
              </Button>
            ) : (
              <Button
                onClick={handleConvertToCustomer}
                disabled={busy || item.stage !== "won"}
              >
                Convert to client
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete} disabled={busy}>
              <Trash2 size={16} />
            </Button>
          </div>
        }
      />

      <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <DealOverviewTab
          deal={item}
          onStageChange={handleStageChange}
          busy={busy}
        />
      )}

      {tab === "activities" && <DealActivitiesTab deal={item} />}

      <DealFormModal
        open={editOpen}
        mode="edit"
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
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
