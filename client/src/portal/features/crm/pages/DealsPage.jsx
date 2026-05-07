import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import Badge from "../../../shared/ui/Badge";
import StatCard from "../../../shared/ui/StatCard";
import FilterBar from "../../../shared/ui/FilterBar";
import ViewToggle from "../../../shared/ui/ViewToggle";
import { useToast } from "../../../shared/ui/Toast";

import {
  Plus,
  RefreshCw,
  BriefcaseBusiness,
  CircleDollarSign,
  Handshake,
  PanelsTopLeft,
  LayoutList,
  Trophy,
  XCircle,
  ChevronRight,
} from "lucide-react";

import { createDeal, listDeals, updateDeal, convertDealToCustomer } from "../api";
import {
  DEAL_SORT_OPTIONS,
  DEAL_STAGE_OPTIONS,
  formatMoney,
  stageLabel,
} from "../constants";
import DealFormModal from "../components/DealFormModal";
import DealsPipelineBoard from "../components/DealsPipelineBoard";

function StageBadge({ stage }) {
  const toneMap = {
    discovery: "neutral",
    qualified: "info",
    proposal: "info",
    negotiation: "warning",
    verbal_commitment: "warning",
    won: "success",
    lost: "danger",
  };

  return <Badge tone={toneMap[stage] || "neutral"}>{stageLabel(stage)}</Badge>;
}

export default function DealsPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [view, setView] = useState("pipeline");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listDeals({
        q,
        stage,
        sort,
        limit: 100,
        page: 1,
      });

      const rows = Array.isArray(res?.items) ? res.items : [];
      setItems(rows);
      setMeta({
        total: res?.total ?? rows.length,
        page: res?.page || 1,
        pages: res?.pages || 1,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load deals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, stage, sort]);

  const stats = useMemo(() => {
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item?.value || 0),
      0
    );
    const wonCount = items.filter((x) => x.stage === "won").length;
    const openCount = items.filter(
      (x) => !["won", "lost"].includes(x.stage)
    ).length;

    return {
      total: meta.total || 0,
      totalValue,
      wonCount,
      openCount,
    };
  }, [items, meta.total]);

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createDeal(payload);
      setCreateOpen(false);
      await load();

      const id = res?.item?._id;
      if (id) nav(`/portal/crm/deals/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const moveDeal = async (deal, nextStage) => {
    if (!deal?._id || !nextStage) return;

    setBusy(true);
    try {
      await updateDeal(deal._id, { stage: nextStage });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Move failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="CRM"
          title="Deals"
          subtitle="Manage opportunities from discovery to close."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "CRM" },
            { label: "Deals" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={load}
                disabled={loading || busy}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>

              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus size={16} />
                New deal
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BriefcaseBusiness} label="Total Deals"     value={stats.total}                       color="indigo"  />
          <StatCard icon={Handshake}         label="Open Deals"      value={stats.openCount}                   color="blue"    />
          <StatCard icon={Handshake}         label="Won Deals"       value={stats.wonCount}                    color="emerald" />
          <StatCard icon={CircleDollarSign}  label="Pipeline Value"  value={formatMoney(stats.totalValue, "AED")} color="violet"  />
        </div>

        <FilterBar
          searchValue={q}
          onSearchChange={(v) => setQ(v)}
          searchPlaceholder="Search title, notes, source…"
          filters={[
            { label: "stage", value: stage, onChange: (v) => setStage(v), options: DEAL_STAGE_OPTIONS },
            { label: "sort",  value: sort,  onChange: (v) => setSort(v),  options: DEAL_SORT_OPTIONS  },
          ]}
          onClear={() => { setQ(""); setStage(""); setSort("-createdAt"); }}
          right={
            <ViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: "pipeline", icon: PanelsTopLeft, label: "Pipeline view" },
                { value: "list",     icon: LayoutList,    label: "List view"     },
              ]}
            />
          }
        />

        {loading ? (
          <Card className="p-6">
            <div className="grid gap-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-20 w-full" />
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
            icon={BriefcaseBusiness}
            title="No deals yet"
            message="Create a deal to start tracking your sales pipeline."
            actionLabel="New deal"
            onAction={() => setCreateOpen(true)}
          />
        ) : view === "pipeline" ? (
          <DealsPipelineBoard
            items={items}
            busy={busy}
            onOpen={(item) => nav(`/portal/crm/deals/${item._id}`)}
            onMove={moveDeal}
          />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div className="text-sm font-black text-slate-900">Deals ({items.length})</div>
              <div className="text-xs text-slate-500">{meta.total} total</div>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">DEAL</th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">CLIENT</th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">STAGE</th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">VALUE</th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">CLOSE DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-black tracking-[0.18em] text-slate-500">OWNER</th>
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
                          onClick={() => nav(`/portal/crm/deals/${item._id}`)}
                        >
                          <div className="text-sm font-black text-slate-900 hover:underline">{item.title}</div>
                          {item.source && (
                            <div className="mt-0.5 text-xs capitalize text-slate-500">{item.source}</div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {item.customerId?.companyName || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <StageBadge stage={item.stage} />
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-bold text-slate-800">
                        {formatMoney(item.value, item.currency)}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        {item.expectedCloseDate
                          ? new Date(item.expectedCloseDate).toLocaleDateString()
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        {item.ownerUserId?.fullName || <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          {!["won", "lost"].includes(item.stage) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveDeal(item, "won")}
                                disabled={busy}
                              >
                                <Trophy size={13} />
                                Won
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveDeal(item, "lost")}
                                disabled={busy}
                              >
                                <XCircle size={13} />
                                Lost
                              </Button>
                            </>
                          )}
                          {item.stage === "won" && !item.customerId?._id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  setBusy(true);
                                  const res = await convertDealToCustomer(item._id);
                                  const cid = res?.customer?._id || res?.item?._id;
                                  await load();
                                  if (cid) nav(`/portal/customers/${cid}`);
                                } catch (e) {
                                  toast.error(e?.response?.data?.message || e?.message || "Convert failed");
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              disabled={busy}
                            >
                              <ChevronRight size={13} />
                              To Client
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DealFormModal
        open={createOpen}
        mode="create"
        busy={busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
