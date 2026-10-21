import React from "react";
import { Link } from "react-router-dom";
import { Archive, Building2, CalendarDays, Pencil, Plus, RefreshCw, Settings2 } from "lucide-react";
import Button from "../../../shared/ui/Button";
import RowActions from "../../../shared/ui/RowActions";
import ProjectStatusPill from "./ProjectStatusPill";
import ProjectPriorityPill from "./ProjectPriorityPill";
import { customerOf, formatDate, initials } from "../format";

// Project identity and actions (PUI-2). Every action is passed in only when
// the user may take it; the API enforces the same permissions.
export default function ProjectHeader({
  project,
  busy,
  canOpenClient,
  onEdit,
  onCreateJob,
  createJobBlockedReason,
  onRefresh,
  onArchive,
}) {
  const customer = customerOf(project);
  const isInternal = project?.projectMode === "internal";
  const owner = project?.ownerUserId?.fullName;
  const start = formatDate(project?.startDate);
  const due = formatDate(project?.endDate);
  const archived = project?.status === "archived";

  const more = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: onRefresh },
    onArchive && !archived ? { key: "sep", separator: true } : null,
    onArchive && !archived ? { key: "archive", label: "Archive project", icon: Archive, onSelect: onArchive } : null,
  ];

  return (
    <header className="px-record-head">
      <div className="px-record-id">
        <div className="px-record-tags">
          <ProjectStatusPill status={project?.status} />
          <ProjectPriorityPill priority={project?.priority} />
          {project?.code ? <span className="px-code">{project.code}</span> : null}
        </div>
        <h1>{project?.name || "Untitled project"}</h1>
        <ul className="px-record-meta" aria-label="Project summary">
          <li>
            {isInternal ? (
              <>
                <Settings2 size={15} aria-hidden="true" />
                Internal project{project?.team ? `, ${project.team}` : ""}
              </>
            ) : customer ? (
              <>
                <Building2 size={15} aria-hidden="true" />
                {canOpenClient && customer._id ? (
                  <Link to={`/portal/customers/${customer._id}`}>{customer.companyName || "Client"}</Link>
                ) : (
                  <span>{customer.companyName || "Client"}</span>
                )}
              </>
            ) : (
              <>
                <Building2 size={15} aria-hidden="true" />
                No client linked
              </>
            )}
          </li>
          {start || due ? (
            <li>
              <CalendarDays size={15} aria-hidden="true" />
              {start && due ? `${start} to ${due}` : start ? `Starts ${start}` : `Due ${due}`}
            </li>
          ) : null}
          <li>
            <span className="px-muted">Owner</span>
            {owner ? (
              <span className="px-person">
                <i aria-hidden="true">{initials(owner)}</i>
                {owner}
              </span>
            ) : (
              <span>Unassigned</span>
            )}
          </li>
        </ul>
      </div>

      <div className="px-record-actions">
        {onEdit ? (
          <Button variant="outline" onClick={onEdit} disabled={busy}>
            <Pencil size={15} aria-hidden="true" />
            Edit
          </Button>
        ) : null}
        {onCreateJob ? (
          <Button
            onClick={onCreateJob}
            disabled={busy || Boolean(createJobBlockedReason)}
            title={createJobBlockedReason || undefined}
          >
            <Plus size={15} aria-hidden="true" />
            Create job
          </Button>
        ) : null}
        <RowActions label={project?.name || "project"} actions={more} />
      </div>
    </header>
  );
}
