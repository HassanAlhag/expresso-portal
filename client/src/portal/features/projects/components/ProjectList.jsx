import React from "react";
import { Link } from "react-router-dom";
import { Archive, ExternalLink, FolderKanban, SearchX, Plus, Building2 } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import RowActions from "../../../shared/ui/RowActions";
import Button from "../../../shared/ui/Button";
import ProjectStatusPill from "./ProjectStatusPill";
import ProjectPriorityPill from "./ProjectPriorityPill";
import { customerOf, dueInfo, formatDate, formatMoney, initials, projectSubline } from "../format";


// Projects table (PUI-2). Desktop: one efficient table with sortable
// headers. Tablet drops owner and budget. Mobile turns each row into a
// stacked record (px-table--stack) instead of squeezing the table sideways.
export default function ProjectList({
  items = [],
  meta = { page: 1, pages: 1, total: 0, limit: 12 },
  loading,
  error,
  onRetry,
  sort,
  onSort,
  onPage,
  filtered,
  onClearFilters,
  onCreate,
  onOpen,
  canArchive,
  onArchive,
  canOpenClient,
  showBudget = true,
  toolbar,
  resultBar,
}) {
  const body = () => {
    if (loading) return <SkeletonRows rows={6} cols={showBudget ? 7 : 6} label="Loading projects" />;
    return items.map((p) => {
      const due = dueInfo(p);
      const owner = p.ownerUserId?.fullName;
      const client = customerOf(p);
      const actions = [
        { key: "open", label: "Open project", icon: ExternalLink, onSelect: () => onOpen(p) },
        canOpenClient && client?._id
          ? { key: "client", label: "Open client", icon: Building2, onSelect: () => onOpen(p, `/portal/customers/${client._id}`) }
          : null,
        canArchive && p.status !== "archived" ? { key: "sep", separator: true } : null,
        canArchive && p.status !== "archived"
          ? { key: "archive", label: "Archive project", icon: Archive, onSelect: () => onArchive(p) }
          : null,
      ];
      return (
        <tr
          key={p._id}
          data-clickable="true"
          onClick={(e) => {
            if (e.target.closest("a, button, [role='menu']")) return;
            onOpen(p);
          }}
        >
          <td className="px-primary">
            <div className="px-cell-main">
              <Link to={`/portal/projects/${p._id}`}>{p.name || "Untitled project"}</Link>
              <span>{projectSubline(p)}</span>
            </div>
          </td>
          <td data-label="Status">
            <span>
              <ProjectStatusPill status={p.status} />
            </span>
          </td>
          <td data-label="Priority">
            <ProjectPriorityPill priority={p.priority} />
          </td>
          <td data-label="Owner" className="px-hide-tab">
            {owner ? (
              <span className="px-person">
                <i aria-hidden="true">{initials(owner)}</i>
                {owner}
              </span>
            ) : (
              <span className="px-muted">Unassigned</span>
            )}
          </td>
          <td data-label="Due">
            {p.endDate ? (
              <span className="px-due">
                <span className="px-num">{formatDate(p.endDate)}</span>
                {due ? <small data-tone={due.tone || undefined}>{due.text}</small> : null}
              </span>
            ) : (
              <span className="px-muted">No due date</span>
            )}
          </td>
          {showBudget ? (
            <td data-label="Budget" className="px-num px-hide-lg px-hide-sm">
              {formatMoney(p.budget, p.currency) || <span className="px-muted">—</span>}
            </td>
          ) : null}
          <td className="px-actions-cell">
            <RowActions label={p.name || "project"} actions={actions} />
          </td>
        </tr>
      );
    });
  };

  let content;
  if (error) {
    content = (
      <ErrorState
        title="Projects didn't load"
        message={typeof error === "string" ? error : undefined}
        onRetry={onRetry}
      />
    );
  } else if (!loading && !items.length) {
    content = filtered ? (
      <EmptyState
        icon={SearchX}
        title="No projects match these filters"
        message="Try a different search, or clear the filters to see every project you can access."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        message="Projects hold client work, custom requests, pre-contract work and internal initiatives."
        action={
          onCreate ? (
            <Button onClick={onCreate}>
              <Plus size={14} aria-hidden="true" />
              New project
            </Button>
          ) : null
        }
      />
    );
  } else {
    content = (
      <>
        <div className="px-table-wrap">
          <table className="px-table px-table--stack" aria-busy={loading || undefined} aria-label="Projects">
            <thead>
              <tr>
                <SortHeader label="Project" field="name" sort={sort} onSort={onSort} />
                <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />
                <th scope="col">Priority</th>
                <th scope="col" className="px-hide-tab">Owner</th>
                <th scope="col">Due</th>
                {showBudget ? <th scope="col" className="px-num px-hide-lg px-hide-sm">Budget</th> : null}
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>{body()}</tbody>
          </table>
        </div>
        {!loading && meta.total ? (
          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            limit={meta.limit || 12}
            onPage={onPage}
            noun={meta.total === 1 ? "project" : "projects"}
            label="Projects pages"
          />
        ) : null}
      </>
    );
  }

  return (
    <Panel flush bare label="Project list" className="px-list-panel">
      {toolbar}
      {resultBar}
      {content}
    </Panel>
  );
}
