import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, List, Plus, RefreshCw, Trash2, UserPlus, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import Alert from "../../../shared/ui/Alert";
import ErrorState from "../../../shared/ui/ErrorState";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

import JobsList from "../components/JobsList";
import JobsPipelineBoard from "../components/JobsPipelineBoard";
import NewJobModal from "../components/NewJobModal";
import { JobEditDialog, BulkAssignDialog } from "../components/JobDialogs";
import { bulkAssignJobs, bulkDeleteJobs, createJob, deleteJob, listJobs, updateJob } from "../api";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listEnrollments } from "../../enrollments/api";
import { JOB_SORT_OPTIONS, JOB_STATUSES, JOB_STATUS_GROUPS, JOB_TYPES } from "../constants";

// Jobs (PI tail, PUI patterns). General delivery work: everything except
// video production, which has its own Production workspace (same Job
// records, workflowType "video"). The list is server-paginated; the board
// shows the newest matching jobs and says so when there are more. Actions
// follow the user's effective permissions (R4-A): jobs.write to create, edit,
// move and assign; jobs.delete to delete. The API enforces the same rules.
const LIST_LIMIT = 20;
const BOARD_LIMIT = 100;
const DEFAULT_SORT = "-createdAt";
const VIEW_KEY = "portal_jobs_view";
// URL filters (?status=, ?type=, ?q=, ?workflow=all) let links open a view.
// workflow=all also shows video jobs (used by dashboard links, which count
// every job); the result bar says so and it can be cleared.

const GROUP_OPTIONS = Object.values(JOB_STATUS_GROUPS).map((g) => ({ value: g.statuses.join(","), label: g.label }));
const STATUS_OPTIONS = [JOB_STATUSES[0], ...GROUP_OPTIONS, ...JOB_STATUSES.slice(1)];
const KNOWN_STATUS = new Set(STATUS_OPTIONS.map((o) => o.value));
const KNOWN_TYPE = new Set(JOB_TYPES.map((o) => o.value));

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "board";
  } catch {
    return "board";
  }
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** List params for the current filters. */
export function buildJobParams({ q, status, type, sort, allWorkflows }) {
  const params = { q, status, type, sort };
  if (!allWorkflows) params.notWorkflowType = "video";
  return params;
}

export default function JobsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("jobs.write");
  const canDelete = access.can("jobs.delete");
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "";
  const initialType = searchParams.get("type") || "";
  const [q, setQ] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebounced(q);
  const [status, setStatus] = useState(KNOWN_STATUS.has(initialStatus) ? initialStatus : "");
  const [type, setType] = useState(KNOWN_TYPE.has(initialType) ? initialType : "");
  const [allWorkflows, setAllWorkflows] = useState(searchParams.get("workflow") === "all");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [view, setView] = useState(readView);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIST_LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busyId, setBusyId] = useState("");

  const base = useMemo(() => buildJobParams({ q: debouncedQ.trim(), status, type, sort, allWorkflows }), [debouncedQ, status, type, sort, allWorkflows]);

  // Keep the address in step with the filters, so a view can be shared.
  useEffect(() => {
    const next = {};
    if (status) next.status = status;
    if (type) next.type = type;
    if (debouncedQ.trim()) next.q = debouncedQ.trim();
    if (allWorkflows) next.workflow = "all";
    setSearchParams(next, { replace: true });
  }, [status, type, debouncedQ, allWorkflows, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = view === "list" ? { ...base, page, limit: LIST_LIMIT } : { ...base, page: 1, limit: BOARD_LIMIT };
      const res = await listJobs(params);
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || 1, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || params.limit });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [base, page, view]);

  // Exact counts for the summary: one small request per figure (limit 1,
  // the API's total), across this workspace's jobs, not just one page.
  const loadCounts = useCallback(async () => {
    const scope = allWorkflows ? {} : { notWorkflowType: "video" };
    const count = (s) => listJobs({ ...scope, status: s, limit: 1, page: 1 }).then((r) => r?.total ?? 0);
    try {
      const [review, production, onHold] = await Promise.all([
        count(JOB_STATUS_GROUPS.review.statuses.join(",")),
        count(JOB_STATUS_GROUPS.production.statuses.join(",")),
        count("on_hold"),
      ]);
      setCounts({ review, production, onHold });
    } catch {
      setCounts(null); // the summary is optional; the jobs still load
    }
  }, [allWorkflows]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // A new search starts from the first page; selection is per page.
  useEffect(() => setPage(1), [debouncedQ]);
  useEffect(() => setSelected(new Set()), [base, page, view]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // per-browser convenience only
    }
  };

  const filtersActive = Boolean(debouncedQ.trim() || status || type || allWorkflows);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setType("");
    setAllWorkflows(false);
    setPage(1);
  };
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;
  const chips = [
    debouncedQ.trim() && { key: "q", label: `Search: ${debouncedQ.trim()}`, clear: () => setQ("") },
    status && { key: "status", label: statusLabel, clear: () => set(setStatus)("") },
    type && { key: "type", label: JOB_TYPES.find((o) => o.value === type)?.label, clear: () => set(setType)("") },
    allWorkflows && { key: "wf", label: "Including video production jobs", clear: () => set(setAllWorkflows)(false) },
  ].filter(Boolean);

  const metrics = useMemo(() => {
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    const review = JOB_STATUS_GROUPS.review.statuses.join(",");
    const production = JOB_STATUS_GROUPS.production.statuses.join(",");
    return [
      {
        key: "total",
        label: "Matching jobs",
        value: loading ? "…" : error ? "—" : meta.total,
        note: filtersActive ? "With the current filters" : allWorkflows ? "All jobs" : "All jobs except video production",
      },
      counts && { key: "review", label: "In review", value: counts.review, note: "Internal or client review", noteTone: counts.review ? "warn" : undefined, onClick: toggle(review), pressed: status === review },
      counts && { key: "production", label: "In production", value: counts.production, note: "Design, shoot or edit", onClick: toggle(production), pressed: status === production },
      counts && { key: "hold", label: "On hold", value: counts.onHold, note: counts.onHold ? "Paused jobs" : "Nothing paused", onClick: toggle("on_hold"), pressed: status === "on_hold" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, status, meta.total, loading, error, filtersActive, allWorkflows]);

  const refresh = () => Promise.all([load(), loadCounts()]);

  const createFromModal = async (payload) => {
    const res = await createJob(payload); // a failure throws: the dialog stays open
    toast.success("Job created.");
    const id = res?.item?._id || res?._id;
    if (id) nav(`/portal/jobs/${id}`);
    else refresh();
    return res;
  };

  const saveEdit = async (patch) => {
    await updateJob(editJob._id, patch); // throws on failure: the dialog shows it
    setEditJob(null);
    toast.success("Job saved.");
    await refresh();
  };

  const moveJob = async (job, nextStatus) => {
    if (!job?._id || !nextStatus || nextStatus === job.status) return;
    setBusyId(job._id);
    try {
      await updateJob(job._id, { status: nextStatus });
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The job wasn't moved. Try again.");
    } finally {
      setBusyId("");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteJob(toDelete._id);
      toast.success(`${toDelete.title || "Job"} deleted.`);
      setToDelete(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The job wasn't deleted. Try again.");
    }
  };

  const bulkAssign = async ({ assignees, mode }) => {
    const res = await bulkAssignJobs({ ids: [...selected], assignees, mode }); // throws: dialog shows it
    toast.success(`Staff assigned on ${res?.modified ?? selected.size} job${selected.size === 1 ? "" : "s"}.`);
    setBulkAssignOpen(false);
    setSelected(new Set());
    await refresh();
  };

  const bulkDelete = async () => {
    try {
      const res = await bulkDeleteJobs([...selected]);
      toast.success(`${res?.deleted ?? selected.size} job${selected.size === 1 ? "" : "s"} deleted.`);
      setBulkDeleteOpen(false);
      setSelected(new Set());
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The jobs weren't deleted. Try again.");
    }
  };

  const selectable = view === "list" && (canWrite || canDelete);
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => (items.length && items.every((j) => prev.has(j._id)) ? new Set() : new Set(items.map((j) => j._id))));

  const toolbar = (
    <div className="px-toolbar" role="search" aria-label="Filter jobs">
      <SearchField label="Search jobs" value={q} onChange={setQ} placeholder="Title, notes, brief, script, caption or location" />
      <SelectField label="Status" value={status} onChange={set(setStatus)} options={STATUS_OPTIONS} />
      <SelectField label="Type" value={type} onChange={set(setType)} options={JOB_TYPES} />
      {view === "list" ? <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={JOB_SORT_OPTIONS.some((o) => o.value === sort) ? JOB_SORT_OPTIONS : [...JOB_SORT_OPTIONS, { value: sort, label: "Custom" }]} /> : null}
    </div>
  );

  const resultText = loading
    ? "Loading jobs…"
    : error
      ? "Jobs unavailable"
      : view === "board"
        ? `${items.length} of ${meta.total} job${meta.total === 1 ? "" : "s"} on the board, newest first`
        : `${meta.total} job${meta.total === 1 ? "" : "s"}`;

  const resultBar = (
    <div className="px-result-bar">
      <span aria-live="polite">{resultText}</span>
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

  const bulkBar =
    selectable && selected.size ? (
      <div className="px-bulk-bar" role="region" aria-label="Selected jobs">
        <span>{`${selected.size} job${selected.size === 1 ? "" : "s"} selected`}</span>
        <div>
          {canWrite ? (
            <Button variant="outline" size="sm" onClick={() => setBulkAssignOpen(true)}>
              <UserPlus size={14} aria-hidden="true" />
              Assign staff
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} aria-hidden="true" />
              Delete selected
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      </div>
    ) : null;

  let content;
  if (view === "board") {
    content = error ? (
      <ErrorState title="Jobs didn't load" message={error} onRetry={load} />
    ) : !loading && !items.length ? (
      <JobsList items={[]} filtered={filtersActive} onClearFilters={clearFilters} onCreate={canWrite ? () => setCreateOpen(true) : undefined} onOpen={() => {}} />
    ) : (
      <>
        {!loading && meta.total > items.length ? (
          <Alert title={`The board shows the ${items.length} newest of ${meta.total} matching jobs`}>
            Column counts are for the jobs shown. Use the list to see every job, or narrow the filters.
          </Alert>
        ) : null}
        <JobsPipelineBoard items={items} loading={loading} canMove={canWrite} onMove={moveJob} busyId={busyId} />
      </>
    );
  } else {
    content = (
      <JobsList
        items={items}
        meta={meta}
        loading={loading}
        error={error}
        onRetry={load}
        sort={sort}
        onSort={set(setSort)}
        onPage={setPage}
        filtered={filtersActive}
        onClearFilters={clearFilters}
        onCreate={canWrite ? () => setCreateOpen(true) : undefined}
        onOpen={(j) => nav(`/portal/jobs/${j._id}`)}
        onEdit={canWrite ? setEditJob : undefined}
        onDelete={canDelete ? setToDelete : undefined}
        selectable={selectable}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />
    );
  }

  return (
    <>
      <PageFrame
        title="Jobs"
        description={
          <>
            Design, photo, post, page and task work for clients. Video and reel production is in <Link to="/portal/productions">Production</Link>.
          </>
        }
        breadcrumb={[{ label: "Jobs" }]}
        secondaryActions={
          <>
            <div className="px-choice-row" role="radiogroup" aria-label="View">
              <button type="button" role="radio" aria-checked={view === "board"} className="px-choice" onClick={() => changeView("board")}>
                <LayoutGrid size={14} aria-hidden="true" />
                By stage
              </button>
              <button type="button" role="radio" aria-checked={view === "list"} className="px-choice" onClick={() => changeView("list")}>
                <List size={14} aria-hidden="true" />
                List
              </button>
            </div>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </Button>
          </>
        }
        primaryAction={
          canWrite ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} aria-hidden="true" />
              New job
            </Button>
          ) : null
        }
      >
        <MetricsStrip label="Jobs summary" items={metrics} />
        <Panel flush bare label="Job list" className="px-list-panel">
          {toolbar}
          {resultBar}
          {bulkBar}
          {content}
        </Panel>
      </PageFrame>

      {canWrite ? (
        <NewJobModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          listCustomers={listCustomers}
          listProjects={(p) => listProjects({ ...p, page: 1, sort: "-createdAt" })}
          listEnrollments={listEnrollments}
          createJob={createFromModal}
        />
      ) : null}
      {canWrite ? <JobEditDialog open={Boolean(editJob)} job={editJob} onClose={() => setEditJob(null)} onSubmit={saveEdit} /> : null}
      {canWrite ? <BulkAssignDialog open={bulkAssignOpen} count={selected.size} onClose={() => setBulkAssignOpen(false)} onSubmit={bulkAssign} /> : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this job?"
        confirmLabel="Delete job"
        icon={Trash2}
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        details={["It is removed permanently, with its notes and approval history.", "To keep it but take it off the board, set its status to Archived instead."]}
      >
        {`"${toDelete?.title || "This job"}" will be deleted.`}
      </ConfirmDialog>
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.size} job${selected.size === 1 ? "" : "s"}?`}
        confirmLabel="Delete jobs"
        icon={Trash2}
        danger
        onConfirm={bulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
        details={["They are removed permanently, with their notes and approval history.", "Jobs generated from a service enrollment can be generated again from it."]}
      >
        The selected jobs will be deleted.
      </ConfirmDialog>
    </>
  );
}
