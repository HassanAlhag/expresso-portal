import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Power, RefreshCw, SearchX, Store, Trash2, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import RowActions from "../../../shared/ui/RowActions";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { createVendor, deleteVendor, listVendors, updateVendor } from "../api";
import { safeUrl } from "../format";
import VendorFormDialog from "../components/VendorFormDialog";

const LIMIT = 15;
const total = (r) => Number(r?.total ?? 0);

export function buildVendorParams({ q, active, page }) {
  const p = { page, limit: LIMIT };
  if (q) p.q = q;
  if (active) p.isActive = active;
  return p;
}

// Vendors (PUI-4, internal, procurement.read; changes need procurement.write,
// deleting needs procurement.delete).
export default function ProcurementVendorsPage() {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("procurement.write");
  const canDelete = access.can("procurement.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);

  const [editing, setEditing] = useState(null); // vendor, or {} for new
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(null); // { kind: "toggle" | "delete", item }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendors(buildVendorParams({ q: dq.trim(), active, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, active, page]);

  // Whole-directory counts, from the list endpoint's totals.
  const loadCounts = useCallback(async () => {
    try {
      const [all, on] = await Promise.all([listVendors({ limit: 1 }), listVendors({ limit: 1, isActive: "true" })]);
      setCounts({ all: total(all), active: total(on) });
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

  const refresh = () => Promise.all([load(), loadCounts()]);
  const metrics = counts
    ? [
        { key: "all", label: "Vendors", value: counts.all, note: "In the directory" },
        { key: "on", label: "Active", value: counts.active, note: "Matched to published RFQs", onClick: () => { setActive(active === "true" ? "" : "true"); setPage(1); }, pressed: active === "true" },
        { key: "off", label: "Inactive", value: Math.max(0, counts.all - counts.active), note: "Not matched to RFQs", onClick: () => { setActive(active === "false" ? "" : "false"); setPage(1); }, pressed: active === "false" },
      ]
    : [];

  const save = async (payload) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      if (editing?._id) await updateVendor(editing._id, payload);
      else await createVendor(payload);
      toast.success(editing?._id ? "Vendor updated." : "Vendor created.");
      setEditing(null);
      await refresh();
    } catch (e) {
      setFormError(e?.response?.data?.message || "The vendor wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const runPending = async () => {
    const { kind, item } = pending;
    try {
      if (kind === "toggle") await updateVendor(item._id, { isActive: item.isActive === false });
      else await deleteVendor(item._id);
      toast.success(kind === "delete" ? "Vendor deleted." : item.isActive === false ? "Vendor activated." : "Vendor deactivated.");
      setPending(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Try again.");
    }
  };

  const filtered = Boolean(dq.trim() || active);
  let content;
  if (error) content = <ErrorState title="Vendors didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No vendors match these filters" action={<Button variant="outline" onClick={() => { setQ(""); setActive(""); setPage(1); }}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Store} title="No vendors yet" message="Vendors come from approved applications or are added here." action={canWrite ? <Button onClick={() => { setFormError(""); setEditing({}); }}><Plus size={14} aria-hidden="true" />New vendor</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Vendors" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <th scope="col">Vendor</th>
              <th scope="col" className="px-hide-tab">Country</th>
              <th scope="col">Categories</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={5} label="Loading vendors" />
            ) : (
              items.map((v) => {
                const cats = (v.categories || []).filter((c) => typeof c === "object");
                const site = safeUrl(v.website);
                const actions = [
                  canWrite ? { key: "edit", label: "Edit vendor", icon: Pencil, onSelect: () => { setFormError(""); setEditing(v); } } : null,
                  canWrite ? { key: "toggle", label: v.isActive === false ? "Activate" : "Deactivate", icon: Power, onSelect: () => setPending({ kind: "toggle", item: v }) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete vendor", icon: Trash2, tone: "muted", onSelect: () => setPending({ kind: "delete", item: v }) } : null,
                ];
                return (
                  <tr key={v._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <b>{v.name}</b>
                        <span>
                          {[v.contactPerson, v.email, v.phone].filter(Boolean).join(", ") || "No contact details"}
                          {site ? (
                            <>
                              {", "}
                              <a href={site} target="_blank" rel="noopener noreferrer">website</a>
                            </>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td data-label="Country" className="px-hide-tab">{v.country || "—"}</td>
                    <td data-label="Categories">
                      {cats.length ? `${cats.slice(0, 2).map((c) => c.name).join(", ")}${cats.length > 2 ? ` and ${cats.length - 2} more` : ""}` : "None"}
                    </td>
                    <td data-label="Status">
                      <Badge tone={v.isActive === false ? "idle" : "ok"} dot>{v.isActive === false ? "Inactive" : "Active"}</Badge>
                      {v.userId ? <small className="px-muted" style={{ display: "block", marginTop: 4 }}>Has a portal login</small> : null}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={v.name} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="vendors" label="Vendor pages" /> : null}
      </>
    );

  const p = pending?.item;
  return (
    <>
      <PageFrame
        title="Vendors"
        description="Suppliers Expresso sources from, and the categories each one covers."
        breadcrumb={[{ label: "Procurement", to: access.canOpen("/portal/procurement") ? "/portal/procurement" : undefined }, { label: "Vendors" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => { setFormError(""); setEditing({}); }}><Plus size={14} aria-hidden="true" />New vendor</Button> : null}
      >
        <MetricsStrip label="Vendor summary" items={metrics} />
        <Panel flush bare label="Vendors" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter vendors">
            <SearchField label="Search vendors" value={q} onChange={setQ} placeholder="Name, contact, email or country" />
            <SelectField label="Status" value={active} onChange={(v) => { setActive(v); setPage(1); }} options={[{ value: "", label: "Any status" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading vendors…" : error ? "Vendors unavailable" : `${meta.total} vendor${meta.total === 1 ? "" : "s"}`}</span>
            {filtered ? (
              <div className="px-active-filters">
                <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={() => { setQ(""); setActive(""); setPage(1); }}>
                  Clear filters
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? <VendorFormDialog open={Boolean(editing)} initial={editing?._id ? editing : null} busy={busy} error={formError} onClose={() => setEditing(null)} onSubmit={save} /> : null}
      <ConfirmDialog
        open={Boolean(pending)}
        icon={pending?.kind === "delete" ? Trash2 : Power}
        tone={pending?.kind === "delete" ? "bad" : "warn"}
        danger={pending?.kind === "delete"}
        title={pending?.kind === "delete" ? "Delete this vendor?" : p?.isActive === false ? "Activate this vendor?" : "Deactivate this vendor?"}
        confirmLabel={pending?.kind === "delete" ? "Delete vendor" : p?.isActive === false ? "Activate" : "Deactivate"}
        details={
          pending?.kind === "delete"
            ? ["The vendor is deleted permanently. A vendor named on a procurement request can't be deleted.", "Quotations it sent and any portal login it has are not removed. To stop working with a vendor, deactivate it instead."]
            : p?.isActive === false
              ? ["It is matched to published RFQs in its categories again and can sign in as before."]
              : ["Inactive vendors aren't notified of new RFQs and can't use the vendor portal. Nothing is deleted."]
        }
        onClose={() => setPending(null)}
        onConfirm={runPending}
      >
        {p ? `${p.name}.` : ""}
      </ConfirmDialog>
    </>
  );
}
