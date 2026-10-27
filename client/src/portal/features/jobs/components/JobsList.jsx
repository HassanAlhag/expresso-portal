import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ExternalLink, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import SortHeader from "../../../shared/ui/SortHeader";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import Pagination from "../../../shared/ui/Pagination";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import RowActions from "../../../shared/ui/RowActions";
import Button from "../../../shared/ui/Button";
import Badge from "../../../shared/ui/Badge";
import { customerName, dueNote, formatDate, initials, jobStage, jobStatusLabel, jobStatusTone, jobTypeLabel, personName, projectName } from "../format";

// Jobs table (PI tail, PUI-2 table pattern): sortable headers, server
// pagination, stacked records on phones, one actions menu per row with only
// the actions the user may take, and a selection column when bulk actions
// are available.
export default function JobsList({
  items = [],
  meta = { page: 1, pages: 1, total: 0, limit: 20 },
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
  onEdit,
  onDelete,
  selectable = false,
  selected = new Set(),
  onToggle,
  onToggleAll,
}) {
  if (error) return <ErrorState title="Jobs didn't load" message={typeof error === "string" ? error : undefined} onRetry={onRetry} />;
  if (!loading && !items.length) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="No jobs match these filters"
        message="Try a different search, or clear the filters to see every job."
        action={<Button variant="outline" onClick={onClearFilters}>Clear filters</Button>}
      />
    ) : (
      <EmptyState
        icon={ClipboardList}
        title="No jobs yet"
        message="Jobs are pieces of delivery work for a client: posts, designs, pages, photos and tasks."
        action={onCreate ? <Button onClick={onCreate}><Plus size={14} aria-hidden="true" />New job</Button> : null}
      />
    );
  }

  const allSelected = items.length > 0 && items.every((j) => selected.has(j._id));
  const cols = selectable ? 7 : 6;

  return (
    <>
      <div className="px-table-wrap">
        <table className="px-table px-table--stack" aria-busy={loading || undefined} aria-label="Jobs">
          <thead>
            <tr>
              {selectable ? (
                <th scope="col" className="px-select-cell">
                  <input type="checkbox" aria-label="Select all jobs on this page" checked={allSelected} onChange={onToggleAll} disabled={loading} />
                </th>
              ) : null}
              <SortHeader label="Job" field="title" sort={sort} onSort={onSort} />
              <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />
              <th scope="col" className="px-hide-tab">Stage</th>
              <th scope="col" className="px-hide-tab">Staff</th>
              <SortHeader label="Due" field="dueDate" sort={sort} onSort={onSort} />
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <SkeletonRows rows={6} cols={cols} label="Loading jobs" />
              : items.map((j) => {
                  const due = dueNote(j);
                  const staff = (j.assignees || []).map(personName).filter(Boolean);
                  const sub = [customerName(j), projectName(j), jobTypeLabel(j.type)].filter(Boolean).join(" · ");
                  const actions = [
                    { key: "open", label: "Open job", icon: ExternalLink, onSelect: () => onOpen(j) },
                    onEdit ? { key: "edit", label: "Edit job", icon: Pencil, onSelect: () => onEdit(j) } : null,
                    onDelete ? { key: "sep", separator: true } : null,
                    onDelete ? { key: "delete", label: "Delete job", icon: Trash2, tone: "bad", onSelect: () => onDelete(j) } : null,
                  ];
                  return (
                    <tr
                      key={j._id}
                      data-clickable="true"
                      onClick={(e) => {
                        if (e.target.closest("a, button, input, label, [role='menu']")) return;
                        onOpen(j);
                      }}
                    >
                      {selectable ? (
                        <td className="px-select-cell">
                          <input type="checkbox" aria-label={`Select ${j.title || "job"}`} checked={selected.has(j._id)} onChange={() => onToggle(j._id)} />
                        </td>
                      ) : null}
                      <td className="px-primary">
                        <div className="px-cell-main">
                          <Link to={`/portal/jobs/${j._id}`}>{j.title || "Untitled job"}</Link>
                          <span>{sub}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span><Badge tone={jobStatusTone(j.status)}>{jobStatusLabel(j.status)}</Badge></span>
                      </td>
                      <td data-label="Stage" className="px-hide-tab">{jobStage(j.status).label}</td>
                      <td data-label="Staff" className="px-hide-tab">
                        {staff.length ? (
                          <span className="px-person">
                            <i aria-hidden="true">{initials(staff[0])}</i>
                            {staff.length > 1 ? `${staff[0]} +${staff.length - 1}` : staff[0]}
                          </span>
                        ) : (
                          <span className="px-muted">Unassigned</span>
                        )}
                      </td>
                      <td data-label="Due">
                        {j.dueDate ? (
                          <span className="px-due">
                            <span className="px-num">{formatDate(j.dueDate)}</span>
                            {due ? <small data-tone={due.tone}>{due.text}</small> : null}
                          </span>
                        ) : (
                          <span className="px-muted">No due date</span>
                        )}
                      </td>
                      <td className="px-actions-cell">
                        <RowActions label={j.title || "job"} actions={actions} />
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!loading && meta.total ? (
        <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit || 20} onPage={onPage} noun={meta.total === 1 ? "job" : "jobs"} label="Jobs pages" />
      ) : null}
    </>
  );
}
