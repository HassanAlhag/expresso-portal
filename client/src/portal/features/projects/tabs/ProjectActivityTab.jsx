import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ClipboardList } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Timeline from "../../../shared/ui/Timeline";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { listJobs } from "../../jobs/api";
import { JOB_STATUS_TONE, formatDate, humanize } from "../format";

// Activity (PUI-2). Production records no project activity log yet, so this
// shows what exists: the project's jobs, newest first, from GET /api/jobs.
export default function ProjectActivityTab({ projectId }) {
  const [state, setState] = useState({ loading: true, failed: false, message: "", items: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!projectId) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, failed: false }));
    listJobs({ projectId, limit: 30, sort: "-createdAt" })
      .then((res) => !cancelled && setState({ loading: false, failed: false, message: "", items: res?.items || [] }))
      .catch((e) => !cancelled && setState({ loading: false, failed: true, message: e?.response?.data?.message || "", items: [] }));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  if (state.loading) return <LoadingState rows={5} label="Loading activity" />;
  if (state.failed) {
    return <ErrorState title="Activity didn't load" message={state.message || undefined} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  if (!state.items.length) {
    return (
      <EmptyState icon={Activity} title="No activity yet" message="Jobs created for this project will appear here, newest first." />
    );
  }

  return (
    <Panel title="Job activity" sub="Jobs created for this project, newest first. A full project activity log isn't recorded yet.">
      <Timeline
        label="Job activity"
        items={state.items.map((j) => ({
          key: j._id,
          icon: ClipboardList,
          tone: JOB_STATUS_TONE[j.status] === "ok" ? "ok" : JOB_STATUS_TONE[j.status] === "warn" ? "warn" : "info",
          dateTime: j.createdAt,
          when: formatDate(j.createdAt),
          content: (
            <>
              <Link to={`/portal/jobs/${j._id}`}>
                <b>{j.title || "Untitled job"}</b>
              </Link>{" "}
              created
              <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                <Badge tone={JOB_STATUS_TONE[j.status] || "neutral"} dot>
                  {humanize(j.status, "Unknown")}
                </Badge>
                <span className="px-muted" style={{ fontSize: 13 }}>
                  {humanize(j.type, "Job")}
                </span>
              </span>
            </>
          ),
        }))}
      />
    </Panel>
  );
}
