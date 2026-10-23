import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Link2Off } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import ErrorState from "../../../shared/ui/ErrorState";
import { listJobs } from "../../jobs/api";
import { JOB_STATUSES } from "../../jobs/constants";
import { date, humanize, idOf } from "../format";

const LIMIT = 30;
const jobStatusLabel = (s) => JOB_STATUSES.find((o) => o.value === s)?.label || humanize(s);

// Assigned work tab of a staff record (PUI-4, jobs.read): jobs assigned to
// the linked portal user, newest first.
export default function StaffWorkTab({ staff }) {
  const userId = idOf(staff.linkedUserId);
  const [state, setState] = useState({ status: userId ? "loading" : "idle", items: [], total: 0 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));
    listJobs({ assigneeId: userId, limit: LIMIT, page: 1, sort: "-createdAt" })
      .then((r) => !cancelled && setState({ status: "ready", items: r?.items || [], total: Number(r?.total ?? (r?.items || []).length) }))
      .catch(() => !cancelled && setState({ status: "failed", items: [], total: 0 }));
    return () => {
      cancelled = true;
    };
  }, [userId, n]);

  if (!userId)
    return (
      <Panel title="Assigned work">
        <div className="px-inline-empty">
          <Link2Off size={18} aria-hidden="true" />
          <span>No portal user is linked to this record, so there is no assigned work to show. Link one by editing the record.</span>
        </div>
      </Panel>
    );

  const shown = state.items.length;
  return (
    <Panel
      title="Assigned work"
      sub={state.status === "ready" ? (state.total > shown ? `Newest ${shown} of ${state.total} jobs` : `${state.total} job${state.total === 1 ? "" : "s"}`) : undefined}
      flush
    >
      {state.status === "failed" ? (
        <ErrorState title="Assigned jobs didn't load" onRetry={() => setN((x) => x + 1)} />
      ) : state.status === "ready" && !shown ? (
        <div className="px-inline-empty">
          <Briefcase size={18} aria-hidden="true" />
          <span>No jobs are assigned to {staff.fullName}.</span>
        </div>
      ) : (
        <table className="px-table px-table--stack" aria-label={`Jobs assigned to ${staff.fullName}`} aria-busy={state.status === "loading" || undefined}>
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Status</th>
              <th scope="col" className="px-hide-tab">Created</th>
            </tr>
          </thead>
          <tbody>
            {state.status === "loading" ? (
              <SkeletonRows rows={3} cols={3} label="Loading assigned jobs" />
            ) : (
              state.items.map((j) => (
                <tr key={j._id}>
                  <td className="px-primary">
                    <div className="px-cell-main">
                      <Link to={`/portal/jobs/${j._id}`}>{j.title || "Untitled job"}</Link>
                      <span>{[j.customerId?.companyName, humanize(j.type, ""), j.projectId?.name].filter(Boolean).join(", ")}</span>
                    </div>
                  </td>
                  <td data-label="Status">{jobStatusLabel(j.status)}</td>
                  <td data-label="Created" className="px-num px-hide-tab">{date(j.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
