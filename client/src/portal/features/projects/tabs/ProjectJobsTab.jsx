import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, SearchX } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import SearchField from "../../../shared/ui/SearchField";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import { JOB_DONE, JOB_STATUS_TONE, dueInfo, formatDate, humanize } from "../format";

const PRIORITY_TONE = { urgent: "bad", high: "warn" };

// Jobs for this project (PUI-2): the project's real delivery work, from
// GET /api/jobs?projectId=… . Search runs on the server.
export default function ProjectJobsTab({ loading, error, items = [], q, setQ, onRetry, onCreate, createBlockedReason, busy }) {
  const action = onCreate ? (
    <Button size="sm" onClick={onCreate} disabled={busy || Boolean(createBlockedReason)} title={createBlockedReason || undefined}>
      <Plus size={14} aria-hidden="true" />
      New job
    </Button>
  ) : null;

  let content;
  if (error) {
    content = <ErrorState title="Jobs didn't load" message={error} onRetry={onRetry} />;
  } else if (!loading && !items.length) {
    content = q ? (
      <EmptyState icon={SearchX} title="No jobs match this search" message="Try another word, or clear the search." />
    ) : (
      <EmptyState
        icon={ClipboardList}
        title="No jobs yet"
        message="Jobs are the delivery work for this project: designs, shoots, posts, builds and reviews."
        action={action}
      />
    );
  } else {
    content = (
      <table className="px-table px-table--stack" aria-label="Project jobs" aria-busy={loading || undefined}>
        <thead>
          <tr>
            <th scope="col">Job</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Due</th>
            <th scope="col" className="px-hide-lg">Created</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows rows={4} cols={5} label="Loading jobs" />
          ) : (
            items.map((j) => {
              const d = j.dueDate ? dueInfo({ endDate: j.dueDate, status: JOB_DONE.has(j.status) ? "completed" : "active" }) : null;
              return (
                <tr key={j._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/jobs/${j._id}`}>{j.title || "Untitled job"}</Link>
                      <span>{[...new Set([humanize(j.type, "Job"), j.workflowType ? humanize(j.workflowType) : null, j.platform].filter(Boolean))].join(", ")}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span>
                      <Badge tone={JOB_STATUS_TONE[j.status] || "neutral"} dot>
                        {humanize(j.status, "Unknown")}
                      </Badge>
                    </span>
                  </td>
                  <td data-label="Priority">
                    <span className="px-priority" data-tone={PRIORITY_TONE[j.priority]}>
                      {humanize(j.priority || "normal")}
                    </span>
                  </td>
                  <td data-label="Due">
                    {j.dueDate ? (
                      <span className="px-due">
                        <span className="px-num">{formatDate(j.dueDate)}</span>
                        {d ? <small data-tone={d.tone || undefined}>{d.text}</small> : null}
                      </span>
                    ) : (
                      <span className="px-muted">No due date</span>
                    )}
                  </td>
                  <td data-label="Created" className="px-hide-lg px-num">
                    {formatDate(j.createdAt)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  }

  return (
    <Panel title="Jobs" sub="Delivery work linked to this project" flush action={action && items.length ? action : null}>
      <div className="px-toolbar" role="search" aria-label="Search jobs">
        <SearchField label="Search jobs" value={q} onChange={setQ} placeholder="Title, notes, concept or script" />
      </div>
      {content}
    </Panel>
  );
}

