import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Badge from "../../../shared/ui/Badge";
import {
  JOB_STATUS_TONE,
  MODE_LABEL,
  SOURCE_LABEL,
  customerOf,
  dueInfo,
  formatDate,
  formatMoney,
  humanize,
  upcomingJobs,
} from "../format";

// Overview (PUI-2): what the project is, what is coming up, and the facts
// people look for (dates, owner, client). Only fields the API returns.
// Internal notes and the internal budget are staff information. The API does
// not send them to client users (PUI-2 decision); `isInternal` keeps them out
// of the client layout as well.
export default function ProjectOverviewTab({ project, jobs, jobsLoading, showJobs, onShowJobs, canOpenClient, isInternal: viewerIsInternal = true }) {
  const customer = customerOf(project);
  const isInternal = project?.projectMode === "internal";
  const due = dueInfo(project);
  const tags = Array.isArray(project?.tags) ? project.tags : [];
  const next = upcomingJobs(jobs || []);

  return (
    <div className="px-grid px-cols-detail">
      <div className="px-stack">
        <Panel title="About this project">
          {project?.description ? (
            <p className="px-prose">{project.description}</p>
          ) : (
            <p className="px-muted" style={{ margin: 0 }}>No description yet.</p>
          )}
        </Panel>

        {showJobs ? (
          <Panel
            title="Coming up"
            sub="Open jobs with a due date, soonest first"
            flush
            action={
              <button type="button" className="px-link" onClick={onShowJobs}>
                All jobs
              </button>
            }
          >
            {jobsLoading ? (
              <p className="px-muted" style={{ padding: "8px 20px 16px", margin: 0 }} role="status">
                Loading jobs…
              </p>
            ) : next.length ? (
              <ul className="px-list">
                {next.map((j) => {
                  const d = dueInfo({ endDate: j.dueDate, status: "active" });
                  return (
                    <li key={j._id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="px-t">
                          <Link to={`/portal/jobs/${j._id}`}>{j.title || "Untitled job"}</Link>
                        </div>
                        <div className="px-s">{humanize(j.type, "Job")}</div>
                      </div>
                      <div className="px-r">
                        <Badge tone={JOB_STATUS_TONE[j.status] || "neutral"} dot>
                          {humanize(j.status)}
                        </Badge>
                        <span data-tone={d?.tone || undefined}>{formatDate(j.dueDate, { year: false })}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-inline-empty">
                <ClipboardList size={18} aria-hidden="true" />
                <span>No open jobs with a due date.</span>
              </div>
            )}
          </Panel>
        ) : null}

        <Panel title="Details">
          <KeyValue
            items={[
              { label: "Type", value: humanize(project?.type) },
              { label: "Mode", value: MODE_LABEL[project?.projectMode] || humanize(project?.projectMode) },
              { label: "Source", value: SOURCE_LABEL[project?.source] || humanize(project?.source) },
              { label: "Team", value: project?.team },
              {
                label: "Related service",
                value: project?.enrollmentId?.serviceTemplateId?.name || (project?.enrollmentId ? "Linked" : "None"),
              },
              {
                label: "Tags",
                value: tags.length ? (
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </span>
                ) : null,
              },
              { label: "Created", value: formatDate(project?.createdAt) },
            ]}
          />
        </Panel>

        {viewerIsInternal && project?.notes ? (
          <Panel title="Internal notes">
            <p className="px-prose">{project.notes}</p>
          </Panel>
        ) : null}
      </div>

      <div className="px-stack">
        <Panel title="Schedule">
          <KeyValue
            className="px-kv--side"
            items={[
              { label: "Start", value: formatDate(project?.startDate) },
              {
                label: "Due",
                value: project?.endDate ? (
                  <span className="px-due">
                    {formatDate(project.endDate)}
                    {due ? <small data-tone={due.tone || undefined}>{due.text}</small> : null}
                  </span>
                ) : null,
              },
              { label: "Target launch", value: formatDate(project?.targetLaunchDate) },
              { label: "Budget", value: formatMoney(project?.budget, project?.currency), hidden: !viewerIsInternal || project?.budget == null },
            ]}
          />
        </Panel>

        <Panel title="People">
          <KeyValue
            className="px-kv--side"
            items={[
              { label: "Owner", value: project?.ownerUserId?.fullName || "Unassigned" },
              { label: "Owner email", value: project?.ownerUserId?.email, hidden: !project?.ownerUserId?.email },
              { label: "Team", value: project?.team },
            ]}
          />
        </Panel>

        {!isInternal ? (
          <Panel
            title="Client"
            action={
              canOpenClient && customer?._id ? (
                <Link className="px-link" to={`/portal/customers/${customer._id}`}>
                  Open client
                </Link>
              ) : null
            }
          >
            {customer ? (
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Company", value: customer.companyName },
                  { label: "Contact", value: customer.contactName },
                  { label: "Email", value: customer.primaryEmail },
                  { label: "Phone", value: customer.phone },
                ]}
              />
            ) : (
              <p className="px-muted" style={{ margin: 0 }}>
                No client is linked to this project yet. Jobs can only be created once a client is linked.
              </p>
            )}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
