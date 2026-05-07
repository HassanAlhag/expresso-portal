import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import SegmentTabs from "../../../shared/ui/SegmentTabs";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

import { ArrowLeft, RefreshCw, Pencil, Trash2, ArrowRightCircle } from "lucide-react";

import { getLead, updateLead, deleteLead, convertLeadToDeal } from "../api";
import LeadFormModal from "../components/LeadFormModal";
import LeadOverviewTab from "../tabs/LeadOverviewTab";
import LeadActivitiesTab from "../tabs/LeadActivitiesTab";

const TABS = [
  { value: "overview",   label: "Overview"   },
  { value: "activities", label: "Activities" },
];

export default function LeadDetailsPage() {
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
  const [convertTitle, setConvertTitle] = useState("");
  const [convertValue, setConvertValue] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLead(id);
      const lead = res?.item || res?.lead || null;
      setItem(lead);
      setConvertTitle(
        lead?.companyName
          ? `${lead.companyName} Opportunity`
          : `${lead?.fullName || "Lead"} Opportunity`
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canConvert = useMemo(
    () => String(item?.status || "").toLowerCase() === "qualified",
    [item]
  );

  const handleEdit = async (payload) => {
    if (!item?._id) return;
    setBusy(true);
    try {
      await updateLead(item._id, payload);
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    setConfirm({
      title: "Delete lead",
      message: `Delete "${item?.fullName}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteLead(item._id);
          toast.success("Lead deleted.");
          nav("/portal/crm/leads");
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
          setBusy(false);
        }
        setConfirm(null);
      },
    });
  };

  const handleConvert = async () => {
    if (!item?._id) return;
    setBusy(true);
    try {
      const res = await convertLeadToDeal(item._id, {
        title: convertTitle,
        value: convertValue ? Number(convertValue) : 0,
      });
      const dealId = res?.deal?._id || res?.item?._id;
      if (dealId) {
        nav(`/portal/crm/deals/${dealId}`);
      } else {
        await load();
        toast.success("Lead converted successfully.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Convert failed");
    } finally {
      setBusy(false);
    }
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
        <div className="text-sm font-black text-slate-700">Lead not found.</div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="CRM"
        title={item.fullName || "Lead"}
        subtitle="Lead details, qualification, and conversion."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "CRM", to: "/portal/crm" },
          { label: "Leads", to: "/portal/crm/leads" },
          { label: item.fullName || "Lead" },
        ]}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => nav("/portal/crm/leads")} disabled={busy}>
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

      <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
          <LeadOverviewTab lead={item} />

          <Card className="p-5">
            <div className="text-sm font-black text-slate-900">Convert to deal</div>
            <div className="mt-1 text-sm text-slate-600">
              Best practice: only convert qualified leads.
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Input
                label="Deal title"
                value={convertTitle}
                onChange={(e) => setConvertTitle(e.target.value)}
                placeholder="Opportunity title"
              />
              <Input
                label="Estimated value"
                type="number"
                value={convertValue}
                onChange={(e) => setConvertValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={handleConvert}
                disabled={busy || !canConvert}
              >
                <ArrowRightCircle size={15} />
                Convert to deal
              </Button>
              {!canConvert && (
                <span className="text-xs font-semibold text-amber-700">
                  Lead must be in Qualified status before conversion.
                </span>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === "activities" && <LeadActivitiesTab lead={item} />}

      <LeadFormModal
        open={editOpen}
        mode="edit"
        initial={item}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
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
