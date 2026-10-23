import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Pencil, RefreshCw, SearchX, Trash2, UserPlus, Users, X } from "lucide-react";

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

import { listStaff, getStaffStats, createStaff, updateStaff, deleteStaff } from "../api";
import { HR_DEPARTMENT_OPTIONS, STAFF_EMPLOYMENT_TYPE_OPTIONS, STAFF_STATUS_OPTIONS } from "../constants/hr.constants";
import { STAFF_STATUS_TONE, date, employmentTypeLabel, humanize, staffStatusLabel } from "../format";
import StaffFormModal from "../components/StaffFormModal";
import { STAFF_DELETE_DETAILS } from "../staff/staffTabs";

const LIMIT = 15;
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "fullName", label: "Name, A to Z" },
  { value: "-fullName", label: "Name, Z to A" },
  { value: "department", label: "Department" },
  { value: "-joiningDate", label: "Joined most recently" },
  { value: "joiningDate", label: "Joined longest ago" },
];

export function buildStaffParams({ q, status, department, employmentType, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (status) p.status = status;
  if (department) p.department = department;
  if (employmentType) p.employmentType = employmentType;
  return p;
}

// Staff directory (PUI-4, hr.staff.read). Write and delete follow the
// effective hr.staff.write and hr.staff.delete permissions.
export default function StaffPage() {
  const toast = useToast();
  const nav = useNavigate();
  const access = useAccess();
  const canWrite = access.can("hr.staff.write");
  const canDelete = access.can("hr.staff.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [sort, setSort] = useState("fullName");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listStaff(buildStaffParams({ q: dq.trim(), status, department, employmentType, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, department, employmentType, sort, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getStaffStats());
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    setPage(1);
  }, [dq]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const refresh = () => Promise.all([load(), loadStats()]);
  const filtered = Boolean(dq.trim() || status || department || employmentType);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setDepartment("");
    setEmploymentType("");
    setPage(1);
  };

  const t = stats?.totals;
  const metrics = useMemo(() => {
    if (!t) return [];
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      { key: "active", label: "Active", value: t.active || 0, note: "Working now", onClick: toggle("active"), pressed: status === "active" },
      { key: "leave", label: "On leave", value: t.onLeave || 0, note: "Status set to On leave", onClick: toggle("on_leave"), pressed: status === "on_leave" },
      { key: "inactive", label: "Inactive or terminated", value: t.inactive || 0, note: "Records kept" },
      { key: "total", label: "Staff records", value: t.total || 0, note: "Every status" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, status]);

  const openForm = (item = null) => {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  };

  const submitForm = async (payload) => {
    setFormBusy(true);
    setFormError("");
    try {
      const res = editing ? await updateStaff(editing._id, payload) : await createStaff(payload);
      toast.success(editing ? "Staff record updated." : "Staff record created.");
      setFormOpen(false);
      if (!editing && res?.item?._id) nav(`/portal/hr/staff/${res.item._id}`);
      else await refresh();
    } catch (e) {
      setFormError(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setFormBusy(false);
    }
  };

  const remove = async () => {
    try {
      await deleteStaff(removing._id);
      toast.success("Staff record deleted.");
      setRemoving(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The record wasn't deleted. Try again.");
    }
  };

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: staffStatusLabel(status), clear: () => set(setStatus)("") },
    department && { key: "d", label: humanize(department), clear: () => set(setDepartment)("") },
    employmentType && { key: "e", label: employmentTypeLabel(employmentType), clear: () => set(setEmploymentType)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Staff didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No staff match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState icon={Users} title="No staff records yet" message="Staff records hold each employee's role, department and HR details." action={canWrite ? <Button onClick={() => openForm()}><UserPlus size={14} aria-hidden="true" />New staff record</Button> : null} />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Staff" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Name" field="fullName" sort={sort} onSort={set(setSort)} />
              <SortHeader label="Department" field="department" sort={sort} onSort={set(setSort)} />
              <th scope="col" className="px-hide-tab">Employment</th>
              <SortHeader label="Joined" field="joiningDate" sort={sort} onSort={set(setSort)} className="px-hide-tab" />
              <SortHeader label="Status" field="status" sort={sort} onSort={set(setSort)} />
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={6} label="Loading staff" />
            ) : (
              items.map((item) => {
                const actions = [
                  { key: "open", label: "Open record", icon: ExternalLink, onSelect: () => nav(`/portal/hr/staff/${item._id}`) },
                  canWrite ? { key: "edit", label: "Edit record", icon: Pencil, onSelect: () => openForm(item) } : null,
                  canDelete ? { key: "sep", separator: true } : null,
                  canDelete ? { key: "delete", label: "Delete record", icon: Trash2, tone: "muted", onSelect: () => setRemoving(item) } : null,
                ].filter(Boolean);
                return (
                  <tr key={item._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <Link to={`/portal/hr/staff/${item._id}`}>{item.fullName || "Unnamed"}</Link>
                        <span>{[item.jobTitle, item.managerStaffId?.fullName ? `reports to ${item.managerStaffId.fullName}` : null].filter(Boolean).join(", ") || item.email || "No job title"}</span>
                      </div>
                    </td>
                    <td data-label="Department">
                      {humanize(item.department)}
                      {item.teamId?.label ? <small className="px-muted" style={{ display: "block" }}>{item.teamId.label}</small> : null}
                    </td>
                    <td data-label="Employment" className="px-hide-tab">{employmentTypeLabel(item.employmentType)}</td>
                    <td data-label="Joined" className="px-num px-hide-tab">{date(item.joiningDate)}</td>
                    <td data-label="Status">
                      <Badge tone={STAFF_STATUS_TONE[item.status] || "neutral"} dot>{staffStatusLabel(item.status)}</Badge>
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={item.fullName || "staff record"} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="people" label="Staff pages" /> : null}
      </>
    );

  return (
    <>
      <PageFrame
        title="Staff"
        description="Employee records: role, department, reporting line and status."
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "Staff" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => openForm()}><UserPlus size={14} aria-hidden="true" />New staff record</Button> : null}
      >
        <MetricsStrip label="Staff summary" items={metrics} />
        <Panel flush bare label="Staff" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter staff">
            <SearchField label="Search staff" value={q} onChange={setQ} placeholder="Name, email, phone or job title" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={[{ value: "", label: "Any status" }, ...STAFF_STATUS_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Department" value={department} onChange={set(setDepartment)} options={[{ value: "", label: "Any department" }, ...HR_DEPARTMENT_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Employment" value={employmentType} onChange={set(setEmploymentType)} options={[{ value: "", label: "Any type" }, ...STAFF_EMPLOYMENT_TYPE_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading staff…" : error ? "Staff unavailable" : `${meta.total} ${meta.total === 1 ? "person" : "people"}`}</span>
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

      {canWrite ? <StaffFormModal open={formOpen} initial={editing} busy={formBusy} error={formError} onClose={() => setFormOpen(false)} onSubmit={submitForm} /> : null}

      <ConfirmDialog
        open={Boolean(removing)}
        icon={Trash2}
        tone="bad"
        danger
        title="Delete this staff record?"
        confirmLabel="Delete record"
        details={STAFF_DELETE_DETAILS}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
      >
        {removing ? `${removing.fullName}${removing.jobTitle ? `, ${removing.jobTitle}` : ""}.` : ""}
      </ConfirmDialog>
    </>
  );
}
