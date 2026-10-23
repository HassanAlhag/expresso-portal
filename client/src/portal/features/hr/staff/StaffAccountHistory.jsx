import React, { useEffect, useState } from "react";
import { History, Link2Off } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Timeline from "../../../shared/ui/Timeline";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import { api } from "../../../shared/api/client";
import { date, idOf } from "../format";

const actionText = (a) => String(a || "").replaceAll(".", " ").replaceAll("_", " ").trim() || "Change";

// Account history tab of a staff record (PUI-4, activity.read): audit
// entries about the linked portal account, newest first.
export default function StaffAccountHistory({ staff }) {
  const userId = idOf(staff.linkedUserId);
  const [state, setState] = useState({ status: userId ? "loading" : "idle", items: [], total: 0 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));
    api
      .get(`/users/${userId}/activity`, { params: { limit: 30 } })
      .then(({ data }) => !cancelled && setState({ status: "ready", items: data?.items || [], total: Number(data?.total ?? 0) }))
      .catch(() => !cancelled && setState({ status: "failed", items: [], total: 0 }));
    return () => {
      cancelled = true;
    };
  }, [userId, n]);

  if (!userId)
    return (
      <Panel title="Account history">
        <div className="px-inline-empty">
          <Link2Off size={18} aria-hidden="true" />
          <span>No portal user is linked to this record.</span>
        </div>
      </Panel>
    );

  return (
    <Panel title="Account history" sub={state.status === "ready" && state.total > state.items.length ? `Newest ${state.items.length} of ${state.total} entries` : "Changes recorded against the linked portal account"}>
      {state.status === "loading" ? (
        <LoadingState rows={3} label="Loading account history" />
      ) : state.status === "failed" ? (
        <ErrorState title="Account history didn't load" onRetry={() => setN((x) => x + 1)} />
      ) : !state.items.length ? (
        <div className="px-inline-empty">
          <History size={18} aria-hidden="true" />
          <span>Nothing recorded yet.</span>
        </div>
      ) : (
        <Timeline
          label="Account history"
          items={state.items.map((e) => ({ key: e._id, icon: History, content: <span style={{ textTransform: "capitalize" }}>{actionText(e.action)}</span>, when: date(e.createdAt), dateTime: e.createdAt }))}
        />
      )}
    </Panel>
  );
}
