import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ExternalLink, KeyRound, Pencil, Plus, Power, RefreshCw, SearchX, X } from "lucide-react";

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

import { listCustomers, createCustomer, updateCustomer, createCustomerLogin } from "../api";
import { DEPARTMENT_LABEL, clientInitials, departmentOf, logoSrc } from "../format";
import CustomerFormModal from "../components/CustomerFormModal";
import CreateLoginModal from "../components/CreateLoginModal";

const LIMIT = 12;
const STATUS_OPTIONS = [
  { value: "", label: "Active and inactive" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];
const DEPT_OPTIONS = [{ value: "", label: "Any department" }, ...Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({ value, label }))];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "companyName", label: "Company, A to Z" },
  { value: "-companyName", label: "Company, Z to A" },
  { value: "contactName", label: "Contact, A to Z" },
  { value: "-updatedAt", label: "Recently updated" },
];

export function buildClientParams({ q, isActive, department, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (isActive !== "") p.isActive = isActive;
  if (department) p.department = department;
  return p;
}

// Global counts from the list endpoint's totals (one-row requests), so the
// summary never reflects only the current page.
async function loadClientCounts() {
  const total = (params) => listCustomers({ ...params, limit: 1, page: 1 }).then((r) => Number(r?.total || 0));
  const [active, inactive, agency, procurement, both] = await Promise.all([
    total({ isActive: "true" }),
    total({ isActive: "false" }),
    total({ department: "digital_agency" }),
    total({ department: "procurement" }),
    total({ department: "both" }),
  ]);
  return { active, inactive, agency, procurement, both };
}

// Clients (PUI-3): staff list of client accounts. Client portal users who can
// read their own company see just that record, without staff actions.
export default function CustomersPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("customers.write");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [isActive, setIsActive] = useState("");
  const [department, setDepartment] = useState("");
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
  const [loginFor, setLoginFor] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCustomers(buildClientParams({ q: dq.trim(), isActive, department, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, isActive, department, sort, page]);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await loadClientCounts());
    } catch {
      setCounts(null); // the summary is optional; the list still works
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (access.isInternal) loadCounts();
  }, [loadCounts, access.isInternal]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([load(), access.isInternal ? loadCounts() : null]);
  const filtered = Boolean(dq.trim() || isActive || department);
  const clearFilters = () => {
    setQ("");
    setIsActive("");
    setDepartment("");
    setPage(1);
  };

  const metrics = useMemo(() => {
    if (!counts) return [];
    const toggle = (setter, current, value) => () => set(setter)(current === value ? "" : value);
    return [
      { key: "active", label: "Active clients", value: counts.active, note: `${counts.inactive} inactive`, onClick: toggle(setIsActive, isActive, "true"), pressed: isActive === "true" },
      { key: "agency", label: "Digital agency", value: counts.agency, note: "Projects and services", onClick: toggle(setDepartment, department, "digital_agency"), pressed: department === "digital_agency" },
      { key: "procurement", label: "Procurement", value: counts.procurement, note: "Supply and sourcing", onClick: toggle(setDepartment, department, "procurement"), pressed: department === "procurement" },
      { key: "both", label: "Both", value: counts.both, note: "Agency and procurement", onClick: toggle(setDepartment, department, "both"), pressed: department === "both" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, isActive, department]);

  const submit = async (fn, success, after) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(success);
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
    isActive && { key: "s", label: isActive === "true" ? "Active" : "Inactive", clear: () => set(setIsActive)("") },
    department && { key: "d", label: DEPARTMENT_LABEL[department], clear: () => set(setDepartment)("") },
  ].filter(Boolean);

  const toolbar = (
    <div className="px-toolbar" role="search" aria-label="Filter clients">
      <SearchField label="Search clients" value={q} onChange={setQ} placeholder="Company, contact, email or code" />
      <SelectField label="Status" value={isActive} onChange={set(setIsActive)} options={STATUS_OPTIONS} />
      <SelectField label="Department" value={department} onChange={set(setDepartment)} options={DEPT_OPTIONS} />
      <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
    </div>
  );

  const resultBar = (
    <div className="px-result-bar">
      <span aria-live="polite">{loading ? "Loading clients…" : error ? "Clients unavailable" : `${meta.total} client${meta.total === 1 ? "" : "s"}`}</span>
      {chips.length ? (
        <div className="px-active-filters">
          {chips.map((c) => (
            <button key={c.key} type="button" className="px-filter-chip" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
              {c.label}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="px-btn px-btn--ghost px-btn--sm" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );

  let content;
  if (error) {
    content = <ErrorState title="Clients didn't load" message={error} onRetry={load} />;
  } else if (!loading && !items.length) {
    content = filtered ? (
      <EmptyState
        icon={SearchX}
        title="No clients match these filters"
        message="Try a different search, or clear the filters."
        action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
      />
    ) : (
      <EmptyState
        icon={Building2}
        title="No clients yet"
        message="Client accounts hold projects, services, files and portal users. Clients are also created when a won deal is converted."
        action={canWrite ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} aria-hidden="true" />New client</Button> : null}
      />
    );
  } else {
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Clients" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Client" field="companyName" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Main contact" field="contactName" sort={sort} onSort={set(setSort)} />
              <th scope="col" className="px-hide-tab">Department</th>
              <SortHeader label="Status" field="isActive" sort={sort} onSort={set(setSort)} firstDir="desc" />
              <th scope="col" className="px-hide-lg px-hide-sm">Portal login</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading clients" />
            ) : (
              items.map((c) => {
                const src = logoSrc(c);
                const actions = [
                  { key: "open", label: "Open client", icon: ExternalLink, onSelect: () => nav(`/portal/customers/${c._id}`) },
                  canWrite ? { key: "edit", label: "Edit client", icon: Pencil, onSelect: () => setEditing(c) } : null,
                  canWrite && !c.ownerUserId ? { key: "login", label: "Create main login", icon: KeyRound, onSelect: () => setLoginFor(c) } : null,
                  canWrite ? { key: "sep", separator: true } : null,
                  canWrite
                    ? { key: "toggle", label: c.isActive ? "Deactivate client" : "Reactivate client", icon: Power, onSelect: () => setToggling(c) }
                    : null,
                ];
                return (
                  <tr
                    key={c._id}
                    data-clickable="true"
                    onClick={(e) => {
                      if (e.target.closest("a, button, [role='menu']")) return;
                      nav(`/portal/customers/${c._id}`);
                    }}
                  >
                    <td className="px-primary">
                      <div className="px-cell-with-logo">
                        <span className="px-logo" aria-hidden="true">
                          {src ? <img src={src} alt="" /> : clientInitials(c.companyName)}
                        </span>
                        <div className="px-cell-main">
                          <Link to={`/portal/customers/${c._id}`}>{c.companyName || "Unnamed client"}</Link>
                          <span>{[c.code, c.industry, c.country].filter(Boolean).join(", ") || "No code"}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Main contact">
                      <div className="px-cell-main">
                        <b style={{ fontWeight: 500 }}>{c.contactName || "No contact"}</b>
                        <span>{c.primaryEmail || "No email"}</span>
                      </div>
                    </td>
                    <td data-label="Department" className="px-hide-tab">
                      {DEPARTMENT_LABEL[departmentOf(c)]}
                    </td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={c.isActive ? "ok" : "neutral"} dot={Boolean(c.isActive)}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </span>
                    </td>
                    <td data-label="Portal login" className="px-hide-lg px-hide-sm">
                      {c.ownerUserId ? "Linked" : <span className="px-muted">None</span>}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={c.companyName || "client"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? (
          <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun={meta.total === 1 ? "client" : "clients"} label="Clients pages" />
        ) : null}
      </>
    );
  }

  return (
    <>
      <PageFrame
        title="Clients"
        description="Client accounts, their contacts and the work Expresso does for them."
        breadcrumb={[{ label: "Clients" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={
          canWrite ? (
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={14} aria-hidden="true" />
              New client
            </Button>
          ) : null
        }
      >
        {access.isInternal ? <MetricsStrip label="Clients summary" items={metrics} /> : null}
        <Panel flush bare label="Client list" className="px-list-panel">
          {toolbar}
          {resultBar}
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? (
        <>
          <CustomerFormModal
            open={createOpen}
            mode="create"
            busy={busy}
            onClose={() => setCreateOpen(false)}
            onSubmit={(payload) =>
              submit(() => createCustomer(payload), "Client created.", (res) => {
                setCreateOpen(false);
                const id = res?.item?._id;
                if (id) nav(`/portal/customers/${id}`);
              })
            }
          />
          <CustomerFormModal
            open={Boolean(editing)}
            mode="edit"
            initial={editing}
            busy={busy}
            onClose={() => setEditing(null)}
            onSubmit={(payload) => submit(() => updateCustomer(editing._id, payload), "Client updated.", () => setEditing(null))}
          />
          <CreateLoginModal
            open={Boolean(loginFor)}
            customer={loginFor}
            busy={busy}
            onClose={() => setLoginFor(null)}
            onSubmit={(payload) => submit(() => createCustomerLogin(loginFor._id, payload), "Login created and linked to the client.", () => setLoginFor(null))}
          />
          <ConfirmDialog
            open={Boolean(toggling)}
            icon={Power}
            tone={toggling?.isActive ? "warn" : "info"}
            title={toggling?.isActive ? "Deactivate this client?" : "Reactivate this client?"}
            confirmLabel={toggling?.isActive ? "Deactivate client" : "Reactivate client"}
            onClose={() => setToggling(null)}
            onConfirm={async () => {
              const c = toggling;
              try {
                await updateCustomer(c._id, { isActive: !c.isActive });
                toast.success(c.isActive ? `${c.companyName} deactivated.` : `${c.companyName} reactivated.`);
                setToggling(null);
                await refresh();
              } catch (e) {
                toast.error(e?.response?.data?.message || "The status didn't change. Try again.");
              }
            }}
            details={
              toggling?.isActive
                ? [
                    "The client is marked inactive. Nothing is deleted.",
                    "Projects, services, invoices and files stay as they are.", "Its portal users can still sign in. To stop that, deactivate their accounts in Users and roles, or remove them from the Users tab.",
                    "You can reactivate the client at any time.",
                  ]
                : ["The client is marked active again."]
            }
          >
            {`"${toggling?.companyName || "This client"}"`}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
