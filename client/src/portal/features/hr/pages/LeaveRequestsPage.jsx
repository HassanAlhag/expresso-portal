import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, CalendarDays, CalendarPlus, CheckCircle2, Pencil, RefreshCw, SearchX, Trash2, X, XCircle } from "lucide-react";

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
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";

import { listLeaves, getLeaveStats, createLeave, updateLeave, deleteLeave, approveLeave, rejectLeave, cancelLeave } from "../api";
import { HR_DEPARTMENT_OPTIONS, LEAVE_STATUS_OPTIONS, LEAVE_TYPE_OPTIONS } from "../constants/hr.constants";
import { LEAVE_STATUS_LABEL, LEAVE_STATUS_TONE, canDecide, date, humanize, isOwnRecord, leaveTypeLabel } from "../format";
import LeaveRequestFormModal from "../components/LeaveRequestFormModal";

const LIMIT = 12;
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "startDate", label: "Starting soonest" },
  { value: "-startDate", label: "Starting latest" },
  { value: "staffName", label: "Staff, A to Z" },
];

export function buildLeaveParams({ q, status, leaveType, department, sort, page }) {
  const p = { q, sort, page, limit: LIMIT };
  if (status) p.status = status;
  if (leaveType) p.leaveType = leaveType;
  if (department) p.department = department;
  return p;
}

// What each action does (the API's own rules).
const ACTION_COPY = {
  approve: { title: "Approve this leave request?", confirm: "Approve", icon: CheckCircle2, tone: "info", details: ["Its status becomes Approved and you are recorded as the approver.", "Approved leave can be cancelled later but not deleted."], done: "Leave approved." },
  cancel: { title: "Cancel this leave request?", confirm: "Cancel request", icon: Ban, tone: "warn", details: ["Its status becomes Cancelled. The record is kept."], done: "Leave request cancelled." },
  delete: { title: "Delete this leave request?", confirm: "Delete request", icon: Trash2, tone: "bad", danger: true, details: ["The request is deleted and can't be restored.", "To keep a record, cancel it instead."], done: "Leave request deleted." },
};

// Leave requests (PUI-4). Approvers see everyone's requests; everyone else
// sees and manages their own (the API scopes the list and every action).
export default function LeaveRequestsPage() {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.leaves.write");
  const canApproveAny = access.can("hr.leaves.approve");
  const canDelete = access.can("hr.leaves.delete");

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState("-createdAt");
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
  const [pending, setPending] = useState(null); // { kind, item }
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);
  const rejectRunning = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listLeaves(buildLeaveParams({ q: dq.trim(), status, leaveType, department, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dq, status, leaveType, department, sort, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getLeaveStats());
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
  const filtered = Boolean(dq.trim() || status || leaveType || department);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setLeaveType("");
    setDepartment("");
    setPage(1);
  };

  const t = stats?.totals;
  const metrics = useMemo(() => {
    if (!t) return [];
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      { key: "submitted", label: canApproveAny ? "Waiting for a decision" : "Waiting for approval", value: t.submitted || 0, note: canApproveAny ? "Submitted requests" : "Your submitted requests", noteTone: t.submitted ? "warn" : undefined, onClick: toggle("submitted"), pressed: status === "submitted" },
      { key: "upcoming", label: "Upcoming approved leave", value: t.upcoming || 0, note: "Starting today or later" },
      { key: "approved", label: "Approved", value: t.approved || 0, note: `${t.rejected || 0} rejected, ${t.cancelled || 0} cancelled`, onClick: toggle("approved"), pressed: status === "approved" },
      { key: "total", label: canApproveAny ? "All requests" : "Your requests", value: t.total || 0, note: "Every status" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, status, canApproveAny]);

  const mine = (item) => isOwnRecord(access, item);
  const canEditItem = (item) => canWrite && item.status === "submitted" && (mine(item) || canApproveAny);
  const canCancelItem = (item) => canWrite && ["submitted", "approved"].includes(item.status) && (mine(item) || canApproveAny);

  const runAction = async () => {
    const { kind, item } = pending;
    try {
      if (kind === "approve") await approveLeave(item._id);
      if (kind === "cancel") await cancelLeave(item._id);
      if (kind === "delete") await deleteLeave(item._id);
      toast.success(ACTION_COPY[kind].done);
      setPending(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Refresh and try again.");
    }
  };

  const submitReject = async () => {
    if (rejectRunning.current) return;
    rejectRunning.current = true;
    setRejectBusy(true);
    try {
      await rejectLeave(rejecting._id, reason.trim());
      toast.success("Leave request rejected.");
      setRejecting(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The request wasn't rejected. Try again.");
    } finally {
      rejectRunning.current = false;
      setRejectBusy(false);
    }
  };

  const openForm = (item = null) => {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  };

  const submitForm = async (payload) => {
    setFormBusy(true);
    setFormError("");
    try {
      if (editing) await updateLeave(editing._id, payload);
      else await createLeave(payload);
      toast.success(editing ? "Leave request updated." : "Leave request submitted.");
      setFormOpen(false);
      await refresh();
    } catch (e) {
      setFormError(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setFormBusy(false);
    }
  };

  const chips = [
    dq.trim() && { key: "q", label: `Search: ${dq.trim()}`, clear: () => setQ("") },
    status && { key: "s", label: LEAVE_STATUS_LABEL[status], clear: () => set(setStatus)("") },
    leaveType && { key: "t", label: leaveTypeLabel(leaveType), clear: () => set(setLeaveType)("") },
    department && { key: "d", label: humanize(department), clear: () => set(setDepartment)("") },
  ].filter(Boolean);

  let content;
  if (error) content = <ErrorState title="Leave requests didn't load" message={error} onRetry={load} />;
  else if (!loading && !items.length)
    content = filtered ? (
      <EmptyState icon={SearchX} title="No leave requests match these filters" message="Try a different search, or clear the filters." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
    ) : (
      <EmptyState
        icon={CalendarDays}
        title="No leave requests yet"
        message={canApproveAny ? "Requests submitted by the team appear here for a decision." : "Your leave requests appear here."}
        action={canWrite ? <Button onClick={() => openForm()}><CalendarPlus size={14} aria-hidden="true" />New leave request</Button> : null}
      />
    );
  else
    content = (
      <>
        <table className="px-table px-table--stack" aria-label="Leave requests" aria-busy={loading || undefined}>
          <thead>
            <tr>
              <SortHeader label="Staff" field="staffName" sort={sort} onSort={set(setSort)} />
              <th scope="col">Type</th>
              <SortHeader label="Dates" field="startDate" sort={sort} onSort={set(setSort)} />
              <th scope="col" className="px-num px-hide-tab">Days</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={6} label="Loading leave requests" />
            ) : (
              items.map((item) => {
                const decide = item.status === "submitted" && canDecide(access, "hr.leaves.approve", item);
                const actions = [
                  decide ? { key: "approve", label: "Approve", icon: CheckCircle2, onSelect: () => setPending({ kind: "approve", item }) } : null,
                  decide ? { key: "reject", label: "Reject", icon: XCircle, onSelect: () => { setReason(""); setRejecting(item); } } : null,
                  canEditItem(item) ? { key: "edit", label: "Edit request", icon: Pencil, onSelect: () => openForm(item) } : null,
                  canCancelItem(item) ? { key: "cancel", label: "Cancel request", icon: Ban, onSelect: () => setPending({ kind: "cancel", item }) } : null,
                  canDelete && item.status !== "approved" ? { key: "sep", separator: true } : null,
                  canDelete && item.status !== "approved" ? { key: "delete", label: "Delete request", icon: Trash2, tone: "muted", onSelect: () => setPending({ kind: "delete", item }) } : null,
                ];
                return (
                  <tr key={item._id}>
                    <td className="px-primary">
                      <div className="px-cell-main">
                        <b>{item.staffName || "Unnamed"}{mine(item) ? <span className="px-muted" style={{ fontWeight: 400 }}> (you)</span> : null}</b>
                        <span>{[humanize(item.department, ""), item.reason].filter(Boolean).join(", ") || "No reason given"}</span>
                      </div>
                    </td>
                    <td data-label="Type">{leaveTypeLabel(item.leaveType)}</td>
                    <td data-label="Dates" className="px-num">{`${date(item.startDate, { year: false })} to ${date(item.endDate)}`}</td>
                    <td data-label="Days" className="px-num px-hide-tab">{item.days || 1}</td>
                    <td data-label="Status">
                      <span>
                        <Badge tone={LEAVE_STATUS_TONE[item.status] || "neutral"} dot>{LEAVE_STATUS_LABEL[item.status] || humanize(item.status)}</Badge>
                      </span>
                      {item.status === "rejected" && item.rejectionReason ? <small className="px-muted" style={{ display: "block", marginTop: 4 }}>{item.rejectionReason}</small> : null}
                    </td>
                    <td className="px-actions-cell">
                      <RowActions label={`${item.staffName || "leave"} leave`} actions={actions} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && meta.total ? <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={setPage} noun="requests" label="Leave pages" /> : null}
      </>
    );

  const copy = pending ? ACTION_COPY[pending.kind] : null;

  return (
    <>
      <PageFrame
        title="Leave"
        description={canApproveAny ? "Leave requests from the team, and the decisions on them." : "Your leave requests and their status."}
        breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "Leave" }]}
        secondaryActions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={canWrite ? <Button onClick={() => openForm()}><CalendarPlus size={14} aria-hidden="true" />New leave request</Button> : null}
      >
        <MetricsStrip label="Leave summary" items={metrics} />
        <Panel flush bare label="Leave requests" className="px-list-panel">
          <div className="px-toolbar" role="search" aria-label="Filter leave requests">
            <SearchField label="Search leave" value={q} onChange={setQ} placeholder="Name, reason or notes" />
            <SelectField label="Status" value={status} onChange={set(setStatus)} options={[{ value: "", label: "Any status" }, ...LEAVE_STATUS_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Type" value={leaveType} onChange={set(setLeaveType)} options={[{ value: "", label: "Any type" }, ...LEAVE_TYPE_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Department" value={department} onChange={set(setDepartment)} options={[{ value: "", label: "Any department" }, ...HR_DEPARTMENT_OPTIONS.filter((o) => o.value)]} />
            <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
          </div>
          <div className="px-result-bar">
            <span aria-live="polite">{loading ? "Loading leave requests…" : error ? "Leave requests unavailable" : `${meta.total} request${meta.total === 1 ? "" : "s"}`}</span>
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

      {canWrite ? <LeaveRequestFormModal open={formOpen} initial={editing} busy={formBusy} error={formError} onClose={() => setFormOpen(false)} onSubmit={submitForm} /> : null}

      <ConfirmDialog
        open={Boolean(pending)}
        icon={copy?.icon}
        tone={copy?.tone}
        danger={copy?.danger}
        title={copy?.title}
        confirmLabel={copy?.confirm}
        details={copy?.details}
        onClose={() => setPending(null)}
        onConfirm={runAction}
      >
        {pending ? `${pending.item.staffName}: ${leaveTypeLabel(pending.item.leaveType)}, ${date(pending.item.startDate, { year: false })} to ${date(pending.item.endDate)} (${pending.item.days || 1} day${pending.item.days === 1 ? "" : "s"}).` : ""}
      </ConfirmDialog>

      <FormDialog
        open={Boolean(rejecting)}
        title="Reject this leave request?"
        description={rejecting ? `${rejecting.staffName}: ${leaveTypeLabel(rejecting.leaveType)}, ${date(rejecting.startDate, { year: false })} to ${date(rejecting.endDate)}.` : ""}
        onClose={() => setRejecting(null)}
        onSubmit={submitReject}
        busy={rejectBusy}
        submitLabel="Reject request"
        submitIcon={XCircle}
      >
        <fieldset className="px-form-section">
          <legend>Reason</legend>
          <TextField label="Why it's being rejected" multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} hint="Optional. The person who asked can read it." />
        </fieldset>
      </FormDialog>
    </>
  );
}
