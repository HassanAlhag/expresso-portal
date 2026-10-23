import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ExternalLink, Handshake, LayoutGrid, List, Pencil, Plus, RefreshCw, SearchX, Trash2, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listDeals, createDeal, updateDeal, deleteDeal, convertDealToCustomer, listLeadAssignees } from "../api";
import { DEAL_STAGES, DEAL_STAGE_LABEL, DEAL_STAGE_TONE, compactMoney, money, normalizeStage, ownerName } from "../format";
import { DEAL_CONVERSION_DETAILS, conversionError } from "../lib/convert";
import { formatDate } from "../../projects/format";
import DealFormModal from "../components/DealFormModal";
import DealsPipelineBoard from "../components/DealsPipelineBoard";
import { loadStageColumns, summarizeStages } from "../lib/dealStages";

const LIMIT = 12;
const VIEW_KEY = "portal_deals_view";
const STAGE_FILTERS = [{ value: "", label: "Any stage" }, ...DEAL_STAGES.map((s) => ({ value: s, label: DEAL_STAGE_LABEL[s] }))];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-value", label: "Highest value" },
  { value: "value", label: "Lowest value" },
  { value: "expectedCloseDate", label: "Closing soonest" },
  { value: "title", label: "Title, A to Z" },
  { value: "-updatedAt", label: "Recently updated" },
];

export function buildDealParams({ q, stage, ownerUserId, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (stage) p.stage = stage;
  if (ownerUserId) p.ownerUserId = ownerUserId;
  return p;
}

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === "board" ? "board" : "table";
  } catch {
    return "table";
  }
}

// Deals (PUI-3). Staff only.
export default function DealsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [view, setView] = useState(readView);
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [stage, setStage] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [owners, setOwners] = useState([]);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [board, setBoard] = useState({});
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState(false);
  const [movingId, setMovingId] = useState("");

  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [converting, setConverting] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDeals(buildDealParams({ q: dq.trim(), stage, ownerUserId, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, stage, ownerUserId, sort, page]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(summarizeStages(await loadStageColumns()));
    } catch {
      setSummary(null);
    }
  }, []);

  const loadBoard = useCallback(async () => {
    setBoardLoading(true);
    setBoardError(false);
    try {
      const extra = {};
      if (dq.trim()) extra.q = dq.trim();
      if (ownerUserId) extra.ownerUserId = ownerUserId;
      setBoard(await loadStageColumns(extra));
    } catch {
      setBoardError(true);
    } finally {
      setBoardLoading(false);
    }
  }, [dq, ownerUserId]);

  useEffect(() => {
    if (view === "table") load();
  }, [load, view]);
  useEffect(() => {
    if (view === "board") loadBoard();
  }, [loadBoard, view]);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    setPage(1);
  }, [dq]);
  useEffect(() => {
    let cancelled = false;
    listLeadAssignees()
      .then((r) => !cancelled && setOwners(Array.isArray(r?.items) ? r.items : r?.users || []))
      .catch(() => !cancelled && setOwners([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([view === "table" ? load() : loadBoard(), loadSummary()]);
  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-viewer convenience only */
    }
  };
  const filtered = Boolean(dq.trim() || stage || ownerUserId);
  const clearFilters = () => {
    setQ("");
    setStage("");
    setOwnerUserId("");
    setPage(1);
  };

  const metrics = useMemo(() => {
    if (!summary) return [];
    return [
      {
        key: "open",
        label: "Open deals",
        value: summary.open,
        note: summary.openValue === null ? "Value not totalled: too many to add up here" : `${compactMoney(summary.openValue)} in the pipeline`,
      },
      { key: "late", label: "Negotiation and commitment", value: summary.late, note: "Closest to closing" },
      { key: "won", label: "Won", value: summary.won, note: summary.wonValue === null ? "Value not totalled" : compactMoney(summary.wonValue), noteTone: "ok" },
      { key: "lost", label: "Lost", value: summary.lost, note: "Closed without a sale" },
    ];
  }, [summary]);

  const save = async (fn, ok, after) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(ok);
      after?.(res);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const move = async (deal, next) => {
    setMovingId(deal._id);
    try {
      await updateDeal(deal._id, { stage: next });
      toast.success(`${deal.title || "Deal"} moved to ${DEAL_STAGE_LABEL[next]}.`);
      await Promise.all([loadBoard(), loadSummary()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "The stage didn't change. Try again.");
    } finally {
      setMovingId("");
    }
  };

  const ownerOptions = [{ value: "", label: "Any owner" }, ...owners.map((o) => ({ value: o._id, label: o.fullName || o.email || "Staff member" }))];
  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    stage && view === "table" && { key: "s", label: DEAL_STAGE_LABEL[stage], clear: () => set(setStage)("") },
    ownerUserId && { key: "o", label: `Owner: ${ownerOptions.find((o) => o.value === ownerUserId)?.label || "selected"}`, clear: () => set(setOwnerUserId)("") },
  ].filter(Boolean);

  let content;
  if (view === "board") {
    content = boardError ? <ErrorState title="The board didn't load" onRetry={loadBoard} /> : <DealsPipelineBoard columns={board} loading={boardLoading} canMove={canWrite} onMove={move} busyId={movingId} />;
  } else if (error) {
    content = <ErrorState title="Deals didn't load" message={error} onRetry={load} />;
  } else if (!loading && !items.length) {
    content = filtered ? (
      <EmptyState icon={SearchX} title="No deals match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Handshake} title="No deals yet" message="Deals are created from converted leads, or directly." action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New deal</Button> : null} />
    );
  } else {
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Deals" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Deal" field="title" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Stage" field="stage" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Value" field="value" sort={sort} onSort={set(setSort)} align="right" firstDir="desc" />
              <SortHeader label="Expected close" field="expectedCloseDate" sort={sort} onSort={set(setSort)} className="px-hide-tab" />
              <th scope="col">Owner</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading deals" />
            ) : (
              items.map((d) => {
                const st = normalizeStage(d.stage);
                const clientId = d.customerId?._id;
                const actions = [
                  { key: "open", label: "Open deal", icon: ExternalLink, onSelect: () => nav(`/portal/crm/deals/${d._id}`) },
                  canWrite ? { key: "edit", label: "Edit deal", icon: Pencil, onSelect: () => setEditing(d) } : null,
                  canWrite && st === "won" && !clientId ? { key: "convert", label: "Convert to client", icon: Building2, onSelect: () => setConverting(d) } : null,
                  clientId && access.canOpen("/portal/customers") ? { key: "client", label: "Open client", icon: Building2, onSelect: () => nav(`/portal/customers/${clientId}`) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete deal", icon: Trash2, tone: "muted", onSelect: () => setRemoving(d) } : null,
                ];
                return (
                  <tr key={d._id} data-clickable="true" onClick={(e) => !e.target.closest("a, button, [role='menu']") && nav(`/portal/crm/deals/${d._id}`)}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/crm/deals/${d._id}`}>{d.title || "Untitled deal"}</Link>
                        <span>{d.customerId?.companyName ? `Client: ${d.customerId.companyName}` : d.accountId?.name || d.leadId?.companyName || "No account"}</span>
                      </div>
                    </td>
                    <td data-label="Stage">
                      <span>
                        <Badge tone={DEAL_STAGE_TONE[st] || "neutral"} dot>
                          {DEAL_STAGE_LABEL[st] || st}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Value" className="px-num">{money(d.value, d.currency) || <span className="px-muted">—</span>}</td>
                    <td data-label="Expected close" className="px-hide-tab px-num">{formatDate(d.expectedCloseDate) || <span className="px-muted">—</span>}</td>
                    <td data-label="Owner">{ownerName(d) || <span className="px-muted">Unassigned</span>}</td>
                    <td className="px-actions-cell">
                      <RowActions label={d.title || "deal"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "deal" : "deals"} label="Deals pages" /> : null}
      </>
    );
  }

  return (
    <>
      <PageFrame
        title="Deals"
        description="Sales opportunities and the stage each one has reached."
        breadcrumb={[{ label: "CRM", to: "/portal/crm" }, { label: "Deals" }]}
        secondaryActions={
          <>
            <div className="px-choice-row" role="radiogroup" aria-label="View">
              <button type="button" role="radio" aria-checked={view === "table"} className="px-choice" onClick={() => changeView("table")}>
                <List size={14} aria-hidden="true" />
                Table
              </button>
              <button type="button" role="radio" aria-checked={view === "board"} className="px-choice" onClick={() => changeView("board")}>
                <LayoutGrid size={14} aria-hidden="true" />
                By stage
              </button>
            </div>
            <Button variant="outline" onClick={refresh} disabled={loading && view === "table"}>
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={canWrite ? <Button onClick={() => setCreateOpen(true)} disabled={busy}><Plus size={14} aria-hidden="true" />New deal</Button> : null}
      >
        <MetricsStrip label="Deals summary" items={metrics} />
        <Panel flush bare label="Deal list" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter deals">
            <SearchField label="Search deals" value={q} onChange={setQ} placeholder="Title, notes, source or tag" />
            {view === "table" ? <SelectField label="Stage" value={stage} onChange={set(setStage)} options={STAGE_FILTERS} /> : null}
            <SelectField label="Owner" value={ownerUserId} onChange={set(setOwnerUserId)} options={ownerOptions} />
            {view === "table" ? <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} /> : null}
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">
              {view === "board" ? "Deals by stage, highest value first" : loading ? "Loading deals…" : error ? "Deals unavailable" : `${meta.total} deal${meta.total === 1 ? "" : "s"}`}
            </span>
            {chips.length ? (
              <div className="px-active-filters">
                {chips.map((c) => (
                  <button key={c.key} type="button" className="px-filter-chip" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
                    {c.label}
                    <X size={12} aria-hidden="true" />
                  </button>
                ))}
                <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={clearFilters}>Clear all</button>
              </div>
            ) : null}
          </div>
          <div style={view === "board" ? { padding: 12 } : undefined}>{content}</div>
        </Panel>
      </PageFrame>

      {canWrite ? (
        <>
          <DealFormModal
            open={createOpen}
            mode="create"
            busy={busy}
            onClose={() => setCreateOpen(false)}
            onSubmit={(p) => save(() => createDeal(p), "Deal created.", (res) => {
              setCreateOpen(false);
              const id = res?.item?._id;
              if (id) nav(`/portal/crm/deals/${id}`);
            })}
          />
          <DealFormModal open={Boolean(editing)} mode="edit" initial={editing} busy={busy} onClose={() => setEditing(null)} onSubmit={(p) => save(() => updateDeal(editing._id, p), "Deal updated.", () => setEditing(null))} />
          <ConfirmDialog
            open={Boolean(converting)}
            icon={Building2}
            tone="info"
            title="Convert this won deal to a client?"
            confirmLabel="Convert to client"
            onClose={() => setConverting(null)}
            onConfirm={async () => {
              try {
                const res = await convertDealToCustomer(converting._id);
                toast.success(`${res?.customer?.companyName || "The client"} is linked to this deal.`);
                setConverting(null);
                await refresh();
              } catch (e) {
                toast.error(conversionError(e, "deal"));
                setConverting(null);
                await refresh();
              }
            }}
            details={DEAL_CONVERSION_DETAILS}
          >
            {converting?.title}
          </ConfirmDialog>
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={Boolean(removing)}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this deal permanently?"
          confirmLabel="Delete deal"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await deleteDeal(removing._id);
              toast.success("Deal deleted.");
              setRemoving(null);
              await refresh();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The deal wasn't deleted. Try again.");
            }
          }}
          details={[
            "The deal is erased and can't be restored.",
            "Its lead, account, contacts and activities are not deleted. A client converted from it keeps a link to a deal that no longer exists.",
          ]}
        >
          {removing?.title}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
