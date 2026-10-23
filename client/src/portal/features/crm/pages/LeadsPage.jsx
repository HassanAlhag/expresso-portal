import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightCircle, ExternalLink, Pencil, Plus, RefreshCw, SearchX, Trash2, UserRound, X } from "lucide-react";

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

import { listLeads, createLead, updateLead, deleteLead, convertLeadToDeal } from "../api";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_STATUS_TONE, SOURCE_OPTIONS, leadSourceLabel, ownerName } from "../format";
import { LEAD_CONVERSION_DETAILS, conversionError } from "../lib/convert";
import LeadFormModal from "../components/LeadFormModal";

const LIMIT = 12;
export const INCLUDE_CONVERTED = "__all";
export const LEAD_STATUS_FILTERS = [
  { value: "", label: "Open leads (not converted)" },
  { value: INCLUDE_CONVERTED, label: "All, including converted" },
  ...LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABEL[s] })),
];
const SOURCE_FILTERS = [{ value: "", label: "Any source" }, ...SOURCE_OPTIONS];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-updatedAt", label: "Recently updated" },
  { value: "fullName", label: "Name, A to Z" },
  { value: "companyName", label: "Company, A to Z" },
  { value: "status", label: "Status, A to Z" },
];

export function buildLeadParams({ q, status, source, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (status === INCLUDE_CONVERTED) p.includeConverted = "true";
  else if (status) p.status = status;
  if (source) p.source = source;
  return p;
}

// Global counts from the list endpoint's totals (one-row requests).
async function loadLeadCounts() {
  const total = (params) => listLeads({ ...params, limit: 1, page: 1 }).then((r) => Number(r?.total || 0));
  const entries = await Promise.all(LEAD_STATUSES.map(async (s) => [s, await total({ status: s })]));
  return Object.fromEntries(entries);
}

// Leads (PUI-3). Staff only: CRM routes and APIs are closed to client users.
export default function LeadsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("crm.write");
  const canDelete = access.can("crm.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);

  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [converting, setConverting] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listLeads(buildLeadParams({ q: dq.trim(), status, source, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, source, sort, page]);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await loadLeadCounts());
    } catch {
      setCounts(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([load(), loadCounts()]);
  const filtered = Boolean(dq.trim() || status || source);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setSource("");
    setPage(1);
  };

  const metrics = useMemo(() => {
    if (!counts) return [];
    const toggle = (v) => () => set(setStatus)(status === v ? "" : v);
    return [
      { key: "new", label: "New", value: counts.new, note: `${counts.contacted} contacted`, onClick: toggle("new"), pressed: status === "new" },
      { key: "qualified", label: "Qualified", value: counts.qualified, note: counts.qualified ? "Ready to convert" : "None waiting", noteTone: counts.qualified ? "warn" : undefined, onClick: toggle("qualified"), pressed: status === "qualified" },
      { key: "unqualified", label: "Unqualified", value: counts.unqualified, note: "Not a fit for now", onClick: toggle("unqualified"), pressed: status === "unqualified" },
      { key: "converted", label: "Converted", value: counts.converted, note: "Now deals", onClick: toggle("converted"), pressed: status === "converted" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, status]);

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

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: LEAD_STATUS_FILTERS.find((o) => o.value === status)?.label, clear: () => set(setStatus)("") },
    source && { key: "src", label: leadSourceLabel(source), clear: () => set(setSource)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Leads didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No leads match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState
        icon={UserRound}
        title="No open leads"
        message="Leads come from the website, Build Your Plan, referrals and manual entry. Converted leads are hidden unless you filter for them."
        action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New lead</Button> : null}
      />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Leads" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Lead" field="fullName" sort={sort} onSort={set(setSort)} />
              <th scope="col" className="px-hide-tab">Contact</th>
              <th scope="col" className="px-hide-lg px-hide-sm">Service</th>
              <th scope="col" className="px-hide-tab">Source</th>
              <SortHeader label="Status" field="status" sort={sort} onSort={set(setSort)} />
              <th scope="col">Owner</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={7} label="Loading leads" />
            ) : (
              items.map((l) => {
                const converted = l.status === "converted";
                const actions = [
                  { key: "open", label: "Open lead", icon: ExternalLink, onSelect: () => nav(`/portal/crm/leads/${l._id}`) },
                  canWrite ? { key: "edit", label: "Edit lead", icon: Pencil, onSelect: () => setEditing(l) } : null,
                  canWrite && !converted ? { key: "convert", label: "Convert to deal", icon: ArrowRightCircle, onSelect: () => setConverting(l) } : null,
                  converted && l.convertedDealId?._id ? { key: "deal", label: "Open deal", icon: ExternalLink, onSelect: () => nav(`/portal/crm/deals/${l.convertedDealId._id}`) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete lead", icon: Trash2, tone: "muted", onSelect: () => setRemoving(l) } : null,
                ];
                return (
                  <tr key={l._id} data-clickable="true" onClick={(e) => !e.target.closest("a, button, [role='menu']") && nav(`/portal/crm/leads/${l._id}`)}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/crm/leads/${l._id}`}>{l.fullName || "Unnamed lead"}</Link>
                        <span>{l.companyName || "No company"}</span>
                      </div>
                    </td>
                    <td data-label="Contact" className="px-hide-tab">
                      <div className="px-cell-main">
                        <span>{l.email || "No email"}</span>
                        <span>{l.phone || ""}</span>
                      </div>
                    </td>
                    <td data-label="Service" className="px-hide-lg px-hide-sm">{l.service || <span className="px-muted">—</span>}</td>
                    <td data-label="Source" className="px-hide-tab">{leadSourceLabel(l.source)}</td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={LEAD_STATUS_TONE[l.status] || "neutral"} dot={l.status !== "unqualified"}>
                          {LEAD_STATUS_LABEL[l.status] || l.status || "New"}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Owner">{ownerName(l) || <span className="px-muted">Unassigned</span>}</td>
                    <td className="px-actions-cell">
                      <RowActions label={l.fullName || "lead"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "lead" : "leads"} label="Leads pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Leads"
        description="People and companies interested in working with Expresso, before they become deals."
        breadcrumb={[{ label: "CRM", to: "/portal/crm" }, { label: "Leads" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => setCreateOpen(true)} disabled={busy}><Plus size={14} aria-hidden="true" />New lead</Button> : null}
      >
        <MetricsStrip label="Leads by status" items={metrics} />
        <Panel flush bare label="Lead list" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter leads">
            <SearchField label="Search leads" value={q} onChange={setQ} placeholder="Name, company, email or phone" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={LEAD_STATUS_FILTERS} />
            <SelectField label="Source" value={source} onChange={set(setSource)} options={SOURCE_FILTERS} />
            <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading leads…" : error ? "Leads unavailable" : `${meta.total} lead${meta.total === 1 ? "" : "s"}${!status ? " (converted hidden)" : ""}`}</span>
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
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? (
        <>
          <LeadFormModal open={createOpen} mode="create" busy={busy} onClose={() => setCreateOpen(false)} onSubmit={(p) => save(() => createLead(p), "Lead created.", () => setCreateOpen(false))} />
          <LeadFormModal open={Boolean(editing)} mode="edit" initial={editing} busy={busy} onClose={() => setEditing(null)} onSubmit={(p) => save(() => updateLead(editing._id, p), "Lead updated.", () => setEditing(null))} />
          <ConfirmDialog
            open={Boolean(converting)}
            icon={ArrowRightCircle}
            tone="info"
            title="Convert this lead to a deal?"
            confirmLabel="Convert to deal"
            onClose={() => setConverting(null)}
            onConfirm={async () => {
              try {
                const res = await convertLeadToDeal(converting._id);
                toast.success("Lead converted. The new deal is open.");
                setConverting(null);
                const dealId = res?.item?._id;
                if (dealId) nav(`/portal/crm/deals/${dealId}`);
                else await refresh();
              } catch (e) {
                toast.error(conversionError(e, "lead"));
                setConverting(null);
                await refresh();
              }
            }}
            details={LEAD_CONVERSION_DETAILS}
          >
            {`${converting?.fullName || "This lead"}${converting?.companyName ? `, ${converting.companyName}` : ""}`}
          </ConfirmDialog>
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={Boolean(removing)}
          icon={Trash2}
          tone="bad"
          danger
          title="Delete this lead permanently?"
          confirmLabel="Delete lead"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await deleteLead(removing._id);
              toast.success("Lead deleted.");
              setRemoving(null);
              await refresh();
            } catch (e) {
              toast.error(e?.response?.data?.message || "The lead wasn't deleted. Try again.");
            }
          }}
          details={[
            "The lead is erased and can't be restored.",
            "Deals, accounts, contacts and activities created from it are not deleted.",
          ]}
        >
          {removing?.fullName}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
