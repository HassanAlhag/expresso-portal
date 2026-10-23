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
import { JOB_STATUS_TONE, formatDate, humanize } from "../../projects/format";

// Client activity (PUI-3). Production keeps no client activity log, so this
// shows what exists: the client's jobs, newest first, as on Project detail.
export default function CustomerActivityTab({ customerId }) {
  const [state, setState] = useState({ loading: true, failed: false, items: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!customerId) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, failed: false }));
    listJobs({ customerId, limit: 30, sort: "-createdAt" })
      .then((res) => {
        if (cancelled) return;
        // The jobs list filters by customerId on the server; keep only this client's jobs.
        const items = (res?.items || []).filter((j) => String(j?.customerId?._id || j?.customerId || "") === String(customerId));
        setState({ loading: false, failed: false, items });
      })
      .catch(() => !cancelled && setState({ loading: false, failed: true, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [customerId, attempt]);

  if (state.loading) return <LoadingState rows={5} label="Loading activity" />;
  if (state.failed) return <ErrorState title="Activity didn't load" onRetry={() => setAttempt((n) => n + 1)} />;
  if (!state.items.length) {
    return <EmptyState icon={Activity} title="No activity yet" message="Jobs created for this client will appear here, newest first." />;
  }
  return (
    <Panel title="Job activity" sub="Jobs created for this client, newest first. A full client activity log isn't recorded yet.">
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
                {j.projectId?.name ? <span className="px-muted" style={{ fontSize: 13 }}>{j.projectId.name}</span> : null}
              </span>
            </>
          ),
        }))}
      />
    </Panel>
  );
}
