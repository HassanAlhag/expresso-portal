import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Plus, RefreshCw, X } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Button from "../../../shared/ui/Button";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import SearchField from "../../../shared/ui/SearchField";
import SelectField from "../../../shared/ui/SelectField";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";

import { listProjects, createProject, archiveProject, getProjectStats } from "../api";
import { PROJECT_TYPE_OPTIONS, PROJECT_PRIORITY_OPTIONS } from "../constants";
import { MODE_LABEL, STATUS_LABEL } from "../format";
import ProjectList from "../components/ProjectList";
import ProjectFormModal from "../components/ProjectFormModal";

export const ALL_INCLUDING_ARCHIVED = "__all";
const LIMIT = 12;
const DEFAULT_SORT = "-createdAt";

// Status filter (R3): the default hides archived projects, "Archived" shows
// only them, and "All, including archived" asks the API for both.
export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All except archived" },
  { value: ALL_INCLUDING_ARCHIVED, label: "All, including archived" },
  ...["draft", "planned", "active", "on_hold", "in_review", "completed", "cancelled", "archived"].map((v) => ({
    value: v,
    label: STATUS_LABEL[v],
  })),
];

const TYPE_OPTIONS = [{ value: "", label: "Any type" }, ...PROJECT_TYPE_OPTIONS.filter((o) => o.value)];
const PRIORITY_OPTIONS = [{ value: "", label: "Any priority" }, ...PROJECT_PRIORITY_OPTIONS.filter((o) => o.value)];
const MODE_OPTIONS = [{ value: "", label: "Any mode" }, ...Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))];
// Every sort the API supports. Priority sorts by its stored text, so it is
// labelled as alphabetical rather than implying urgency order.
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-updatedAt", label: "Recently updated" },
  { value: "name", label: "Name, A to Z" },
  { value: "-name", label: "Name, Z to A" },
  { value: "status", label: "Status, A to Z" },
  { value: "priority", label: "Priority, alphabetical" },
  { value: "team", label: "Team, A to Z" },
];

export function buildListParams({ q, status, type, priority, projectMode, sort, page }) {
  const params = { q, type, priority, projectMode, sort, page, limit: LIMIT };
  if (status === ALL_INCLUDING_ARCHIVED) params.includeArchived = "true";
  else if (status) params.status = status;
  return params;
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ProjectsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  // UI gating only; the API still enforces these (clients never hold them).
  const canCreate = access.can("projects.write");
  const canArchive = access.can("projects.delete");
  const canOpenClient = access.canOpen("/portal/customers");

  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [projectMode, setProjectMode] = useState("");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toArchive, setToArchive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listProjects(buildListParams({ q: debouncedQ.trim(), status, type, priority, projectMode, sort, page }));
      setItems(Array.isArray(res?.items) ? res.items : []);
      setMeta({ page: res?.page || page, pages: res?.pages || 1, total: res?.total ?? 0, limit: res?.limit || LIMIT });
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "The server didn't respond. Try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, type, priority, projectMode, sort, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getProjectStats());
    } catch {
      setStats(null); // the summary is optional; the list still works
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Changing the search resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const set = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  const filtersActive = Boolean(debouncedQ.trim() || status || type || priority || projectMode);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setType("");
    setPriority("");
    setProjectMode("");
    setPage(1);
  };

  const chips = [
    debouncedQ.trim() && { key: "q", label: `Search: ${debouncedQ.trim()}`, clear: () => setQ("") },
    status && { key: "status", label: STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label, clear: () => set(setStatus)("") },
    type && { key: "type", label: TYPE_OPTIONS.find((o) => o.value === type)?.label, clear: () => set(setType)("") },
    priority && { key: "priority", label: `${PRIORITY_OPTIONS.find((o) => o.value === priority)?.label} priority`, clear: () => set(setPriority)("") },
    projectMode && { key: "mode", label: MODE_LABEL[projectMode], clear: () => set(setProjectMode)("") },
  ].filter(Boolean);

  const by = stats?.byStatus || {};
  const metrics = useMemo(() => {
    if (!stats) return [];
    const toggle = (value) => () => set(setStatus)(status === value ? "" : value);
    return [
      {
        key: "active",
        label: "Active",
        value: by.active || 0,
        note: `${by.planned || 0} planned, ${by.on_hold || 0} on hold`,
        onClick: toggle("active"),
        pressed: status === "active",
      },
      {
        key: "review",
        label: "In review",
        value: by.in_review || 0,
        note: by.in_review ? "Waiting for sign-off" : "Nothing waiting",
        noteTone: by.in_review ? "warn" : undefined,
        onClick: toggle("in_review"),
        pressed: status === "in_review",
      },
      {
        key: "completed",
        label: "Completed",
        value: by.completed || 0,
        note: `${stats.total || 0} projects in total`,
        onClick: toggle("completed"),
        pressed: status === "completed",
      },
      {
        key: "archived",
        label: "Archived",
        value: by.archived || 0,
        note: "Hidden from the default list",
        onClick: toggle("archived"),
        pressed: status === "archived",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, status]);

  const onCreate = async (payload) => {
    setBusy(true);
    try {
      const res = await createProject(payload);
      setCreateOpen(false);
      const id = res?.item?._id || res?._id;
      if (id) nav(`/portal/projects/${id}`);
      else {
        await Promise.all([load(), loadStats()]);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "The project wasn't created. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmArchive = async () => {
    const p = toArchive;
    try {
      await archiveProject(p._id);
      toast.success(`${p.name || "Project"} archived. Its history is kept.`);
      setToArchive(null);
      await Promise.all([load(), loadStats()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "The project wasn't archived. Try again.");
    }
  };

  const toolbar = (
    <div className="px-toolbar" role="search" aria-label="Filter projects">
      <SearchField label="Search projects" value={q} onChange={setQ} placeholder="Name, code, team or tag" />
      <SelectField label="Status" value={status} onChange={set(setStatus)} options={STATUS_FILTER_OPTIONS} />
      <SelectField label="Type" value={type} onChange={set(setType)} options={TYPE_OPTIONS} />
      <SelectField label="Priority" value={priority} onChange={set(setPriority)} options={PRIORITY_OPTIONS} />
      <SelectField label="Mode" value={projectMode} onChange={set(setProjectMode)} options={MODE_OPTIONS} />
      <SelectField label="Sort by" value={sort} onChange={set(setSort)} options={SORT_OPTIONS.some((o) => o.value === sort) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: sort, label: "Custom" }]} />
    </div>
  );

  const resultBar = (
    <div className="px-result-bar">
      <span aria-live="polite">
        {loading ? "Loading projects…" : error ? "Projects unavailable" : `${meta.total} project${meta.total === 1 ? "" : "s"}`}
        {!loading && !error && !status ? " (archived hidden)" : ""}
      </span>
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

  return (
    <>
      <PageFrame
        title="Projects"
        description="Client work, custom requests, pre-contract work and internal initiatives."
        breadcrumb={[{ label: "Projects" }]}
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => {
              load();
              loadStats();
            }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        }
        primaryAction={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus size={14} aria-hidden="true" />
              New project
            </Button>
          ) : null
        }
      >
        <MetricsStrip label="Projects by status" items={metrics} />

        <ProjectList
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
          onCreate={canCreate ? () => setCreateOpen(true) : undefined}
          onOpen={(p, to) => nav(to || `/portal/projects/${p._id}`)}
          canArchive={canArchive}
          onArchive={setToArchive}
          canOpenClient={canOpenClient}
          showBudget={access.isInternal}
          toolbar={toolbar}
          resultBar={resultBar}
        />
      </PageFrame>

      <ConfirmDialog
        open={Boolean(toArchive)}
        title="Archive this project?"
        confirmLabel="Archive project"
        icon={Archive}
        onConfirm={confirmArchive}
        onClose={() => setToArchive(null)}
        details={[
          "Its jobs, invoices, files and history are kept. Nothing is deleted.",
          "It leaves the default project list. Choose the Archived status filter to find it.",
          "Someone who can edit projects can bring it back by changing its status.",
        ]}
      >
        {`"${toArchive?.name || "This project"}" will be archived.`}
      </ConfirmDialog>

      <ProjectFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreate} busy={busy} />
    </>
  );
}
