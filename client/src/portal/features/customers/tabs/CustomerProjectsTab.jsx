import React from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import ProjectStatusPill from "../../projects/components/ProjectStatusPill";
import ProjectPriorityPill from "../../projects/components/ProjectPriorityPill";
import { dueInfo, formatDate, humanize } from "../../projects/format";

// The client's projects (PUI-3), using the PUI-2 project status treatment.
// Archived projects are hidden, as in the Projects list (R3).
export default function CustomerProjectsTab({ projectsLoading, projectsError, projects = [], onNewProject, onRetry }) {
  const action = onNewProject ? (
    <Button size="sm" onClick={onNewProject}>
      <Plus size={14} aria-hidden="true" />
      New project
    </Button>
  ) : null;

  if (projectsError) return <ErrorState title="Projects didn't load" message={projectsError} onRetry={onRetry} />;
  if (!projectsLoading && !projects.length) {
    return <EmptyState icon={FolderKanban} title="No projects yet" message="Projects for this client will appear here. Archived projects are hidden." action={action} />;
  }

  return (
    <Panel title="Projects" sub="Archived projects are hidden" flush action={action}>
      <table className="px-table px-table--stack" aria-label="Client projects" aria-busy={projectsLoading || undefined}>
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Status</th>
            <th scope="col" className="px-hide-tab">Priority</th>
            <th scope="col">Due</th>
          </tr>
        </thead>
        <tbody>
          {projectsLoading ? (
            <SkeletonRows rows={3} cols={4} label="Loading projects" />
          ) : (
            projects.map((p) => {
              const due = dueInfo(p);
              return (
                <tr key={p._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/projects/${p._id}`}>{p.name || "Untitled project"}</Link>
                      <span>{[p.code, humanize(p.type, "")].filter(Boolean).join(", ") || "Project"}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span>
                      <ProjectStatusPill status={p.status} />
                    </span>
                  </td>
                  <td data-label="Priority" className="px-hide-tab">
                    <ProjectPriorityPill priority={p.priority} />
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Panel>
  );
}
