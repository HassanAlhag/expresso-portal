import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileText, FolderKanban, LifeBuoy, MessageCircle, Plus, ReceiptText, ThumbsUp, UploadCloud } from "lucide-react";

import Briefing from "../../../shared/ui/Briefing";
import MetricsStrip from "../../../shared/ui/MetricsStrip";
import Panel from "../../../shared/ui/Panel";
import AttentionList from "../../../shared/ui/AttentionList";
import Badge from "../../../shared/ui/Badge";
import Alert from "../../../shared/ui/Alert";
import LoadingState from "../../../shared/ui/LoadingState";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import ProjectStatusPill from "../../projects/components/ProjectStatusPill";
import { formatDate } from "../../projects/format";
import { TICKET_STATUS_TONE, date, ticketStatusLabel } from "../../tickets/format";
import { openFile } from "../../files/api";
import { deriveClientOverview, loadClientOverview } from "./clientOverview";

const KIND_ICON = { ticket: LifeBuoy, invoice: ReceiptText, review: ThumbsUp };

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Client overview (PUI-5): what Expresso is doing for the company, what
// needs the client, their documents and invoices, and how to reach us.
export default function ClientDashboard() {
  const access = useAccess();
  const toast = useToast();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setData(await loadClientOverview(access));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.user?._id, access.role]);

  useEffect(() => {
    load();
  }, [load]);

  const first = String(access.user?.fullName || "").trim().split(/\s+/)[0];
  const when = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const view = data ? deriveClientOverview(data) : null;
  const waiting = view?.waitingTotal || 0;

  const shortcuts = [
    access.can("tickets.write") && access.canOpen("/portal/tickets") && { to: "/portal/tickets?new=1", label: "New support request", icon: Plus },
    access.can("files.write") && access.canOpen("/portal/files") && { to: "/portal/files", label: "Share a file", icon: UploadCloud },
    access.canOpen("/portal/messages") && { to: "/portal/messages", label: "Message your team", icon: MessageCircle },
  ].filter(Boolean);

  const open = async (f) => {
    try {
      await openFile(f);
    } catch {
      toast.error("That file couldn't be opened. Try again.");
    }
  };

  return (
    <div className="px-stack" style={{ gap: 20 }}>
      <Briefing when={when} links={shortcuts}>
        {greeting()}
        {first ? `, ${first}` : ""}.{" "}
        {!view ? "Loading your workspace…" : waiting ? `${waiting} support request${waiting === 1 ? " is" : "s are"} waiting for your reply.` : "Nothing is waiting for you right now."}
      </Briefing>

      {!view ? (
        <LoadingState rows={6} label="Loading your overview" />
      ) : (
        <>
          {view.failed.length ? (
            <Alert tone="warn" icon={AlertTriangle} title="Some of your information didn't load">
              Figures that didn't load show a dash instead of a number. Refresh the page to try again.
            </Alert>
          ) : null}
          <MetricsStrip label="Your summary" items={view.metrics} />
          <div className="px-grid px-cols-main">
            <div className="px-stack">
              <Panel title="Needs your attention" flush>
                <AttentionList
                  items={view.attention.map((a) => ({ ...a, icon: KIND_ICON[a.kind] }))}
                  empty={
                    <div className="px-inline-empty">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>Nothing needs you at the moment.</span>
                    </div>
                  }
                />
              </Panel>
              {access.can("projects.read") ? (
                <Panel title="Active projects" flush action={access.canOpen("/portal/projects") ? <Link className="px-link" to="/portal/projects">All projects</Link> : null}>
                  {view.projects.length ? (
                    <ul className="px-list">
                      {view.projects.map((p) => (
                        <li key={p._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              <Link to={`/portal/projects/${p._id}`}>{p.name || "Project"}</Link>
                            </div>
                            <div className="px-s">{[p.targetLaunchDate ? `Target ${formatDate(p.targetLaunchDate)}` : null, p.endDate ? `Ends ${formatDate(p.endDate)}` : null].filter(Boolean).join(", ") || "In progress"}</div>
                          </div>
                          <ProjectStatusPill status={p.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <FolderKanban size={18} aria-hidden="true" />
                      <span>No active projects.</span>
                    </div>
                  )}
                </Panel>
              ) : null}
            </div>
            <div className="px-stack">
              {access.can("tickets.read") ? (
                <Panel title="Recent support requests" flush action={<Link className="px-link" to="/portal/tickets">All requests</Link>}>
                  {view.recentTickets.length ? (
                    <ul className="px-list">
                      {view.recentTickets.map((t) => (
                        <li key={t._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              <Link to={`/portal/tickets/${t._id}`}>{t.title || "Support request"}</Link>
                            </div>
                            <div className="px-s">{[t.ref, date(t.lastActivityAt || t.updatedAt)].filter(Boolean).join(", ")}</div>
                          </div>
                          <Badge tone={TICKET_STATUS_TONE[t.status] || "neutral"} dot>{ticketStatusLabel(t.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <LifeBuoy size={18} aria-hidden="true" />
                      <span>No support requests yet.</span>
                    </div>
                  )}
                </Panel>
              ) : null}
              {access.can("files.read") ? (
                <Panel title="Latest documents" flush action={<Link className="px-link" to="/portal/files">All files</Link>}>
                  {view.files.length ? (
                    <ul className="px-list">
                      {view.files.map((f) => (
                        <li key={f._id}>
                          <div style={{ minWidth: 0 }}>
                            <div className="px-t">
                              <button type="button" onClick={() => open(f)}>
                                {f.title || f.originalName || "File"}
                              </button>
                            </div>
                            <div className="px-s">{[f.projectId?.name, date(f.createdAt)].filter(Boolean).join(", ")}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-inline-empty">
                      <FileText size={18} aria-hidden="true" />
                      <span>No documents shared yet.</span>
                    </div>
                  )}
                </Panel>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
