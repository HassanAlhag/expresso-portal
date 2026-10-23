import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, Hash, LifeBuoy, MessageSquareReply, RefreshCw, Send, Star, UserRound } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import TextField from "../../../shared/ui/TextField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";

import { addTicketComment, getTicket, updateTicket } from "../api";
import { APPROVAL_LABEL, TERMINAL_TICKET_STATUSES, TICKET_PRIORITY_LABEL, TICKET_STATUS_TONE, TICKET_TYPE_LABEL, date, ticketStatusLabel } from "../format";

// One support request, client and vendor view (PUI-5): what was asked, the
// conversation (the API leaves out internal notes), replying, and rating
// the outcome once it's resolved. Staff-only controls are not here.
export default function ClientTicketDetail() {
  const { id } = useParams();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("tickets.write");
  const me = String(access.user?._id || access.user?.id || "");

  const [ticket, setTicket] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(false);
  const running = useRef(false);

  usePageCrumbs(ticket ? [{ label: "Support requests", to: "/portal/tickets" }, { label: ticket.ref || "Request" }] : []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await getTicket(id);
      setTicket(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ticket && !loadError) return <LoadingState rows={6} label="Loading your request" />;
  if (loadError || !ticket) {
    const s = loadError?.status;
    // 403 and 404 read the same, so the page doesn't confirm another company's request exists.
    return (
      <ErrorState
        title={s === 403 || s === 404 ? "Request not found" : "This request didn't load"}
        message={s === 403 || s === 404 ? "It may have been removed, or it isn't one of your requests." : loadError?.message || undefined}
        onRetry={s === 403 || s === 404 ? undefined : load}
      />
    );
  }

  const terminal = TERMINAL_TICKET_STATUSES.includes(ticket.status);
  const thread = (ticket.comments || []).filter((c) => c.visibility !== "internal");

  const send = async (e) => {
    e?.preventDefault();
    const body = reply.trim();
    if (!body || running.current) return;
    running.current = true;
    setSending(true);
    try {
      await addTicketComment(ticket._id, { body });
      setReply("");
      toast.success("Reply sent.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Your reply wasn't sent. Try again.");
    } finally {
      running.current = false;
      setSending(false);
    }
  };

  const rate = async (n) => {
    if (rating) return;
    setRating(true);
    try {
      await updateTicket(ticket._id, { satisfactionRating: n });
      toast.success("Thank you for rating this request.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Your rating wasn't saved. Try again.");
    } finally {
      setRating(false);
    }
  };

  return (
    <div className="px-stack" style={{ gap: 20 }}>
      <header className="px-record-head">
        <div className="px-record-id">
          <div className="px-record-tags">
            <Badge tone={TICKET_STATUS_TONE[ticket.status] || "neutral"} dot>{ticketStatusLabel(ticket.status)}</Badge>
            <span className="px-code">{TICKET_TYPE_LABEL[ticket.type] || "Support"}</span>
          </div>
          <h1>{ticket.title}</h1>
          <ul className="px-record-meta" aria-label="Request summary">
            {ticket.ref ? (
              <li>
                <Hash size={15} aria-hidden="true" />
                {ticket.ref}
              </li>
            ) : null}
            <li>
              <CalendarDays size={15} aria-hidden="true" />
              Opened {date(ticket.createdAt)}
            </li>
            <li>
              <Clock size={15} aria-hidden="true" />
              Last update {date(ticket.lastActivityAt || ticket.updatedAt)}
            </li>
          </ul>
        </div>
        <div className="px-record-actions">
          <Button variant="outline" onClick={load}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </header>

      {ticket.status === "waiting_client" ? (
        <Alert tone="warn" icon={MessageSquareReply} title="Expresso is waiting for your reply">
          Answer in the conversation below so the work can continue.
        </Alert>
      ) : null}

      <div className="px-grid px-cols-detail">
        <div className="px-stack">
          <Panel title="Your request">
            <p className="px-prose" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.description}</p>
          </Panel>
          {terminal && ticket.resolution ? (
            <Panel title="Resolution" sub={ticket.resolvedAt ? `Resolved ${date(ticket.resolvedAt)}` : undefined}>
              <p className="px-prose" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.resolution}</p>
            </Panel>
          ) : null}
          <Panel title="Conversation" sub={`${thread.length} message${thread.length === 1 ? "" : "s"}`}>
            {thread.length ? (
              <ol className="px-thread" aria-label="Conversation">
                {thread.map((c, i) =>
                  c.event ? (
                    <li key={c._id || i} className="px-thread-event">
                      <span>{c.body}</span> <time dateTime={c.createdAt}>{date(c.createdAt, { time: true })}</time>
                    </li>
                  ) : (
                    <li key={c._id || i} className="px-thread-msg" data-mine={String(c.authorId?._id || c.authorId) === me || undefined}>
                      <div className="px-thread-who">
                        {String(c.authorId?._id || c.authorId) === me ? "You" : c.authorRole === "admin" ? "Expresso" : "Your team"}
                        <time dateTime={c.createdAt}>{date(c.createdAt, { time: true })}</time>
                      </div>
                      <p>{c.body}</p>
                    </li>
                  )
                )}
              </ol>
            ) : (
              <div className="px-inline-empty">
                <LifeBuoy size={18} aria-hidden="true" />
                <span>No replies yet. Expresso will answer here.</span>
              </div>
            )}
            {canWrite ? (
              <form onSubmit={send} className="px-stack" style={{ marginTop: 14, gap: 8 }} aria-label="Reply">
                <TextField label={terminal ? "Add a note to this finished request" : "Your reply"} multiline rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
                <div>
                  <Button type="submit" disabled={!reply.trim() || sending}>
                    <Send size={14} aria-hidden="true" />
                    {sending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </form>
            ) : null}
          </Panel>
        </div>
        <div className="px-stack">
          <Panel title="Details">
            <KeyValue
              className="px-kv--side"
              items={[
                { label: "Priority", value: TICKET_PRIORITY_LABEL[ticket.priority] || ticket.priority },
                { label: "Needed by", value: date(ticket.dueDate), hidden: !ticket.dueDate },
                { label: "Handled by", value: ticket.assigneeId?.fullName ? <span><UserRound size={13} aria-hidden="true" /> {ticket.assigneeId.fullName}</span> : "Not assigned yet" },
                { label: "Decision", value: APPROVAL_LABEL[ticket.approvalStatus] || APPROVAL_LABEL.pending, hidden: ticket.type !== "change_request" },
                { label: "Vendor", value: ticket.vendor, hidden: ticket.type !== "procurement" || !ticket.vendor },
                { label: "Your PO reference", value: ticket.purchaseOrderRef, hidden: ticket.type !== "procurement" || !ticket.purchaseOrderRef },
                { label: "Delivery needed by", value: date(ticket.deliveryDate), hidden: ticket.type !== "procurement" || !ticket.deliveryDate },
              ]}
            />
          </Panel>
          {terminal && canWrite ? (
            <Panel title="How did we do?" sub="Rate the outcome of this request">
              <div role="group" aria-label="Rating, 1 to 5" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button key={n} size="sm" variant={ticket.satisfactionRating === n ? "primary" : "outline"} aria-pressed={ticket.satisfactionRating === n} aria-label={`${n} of 5`} onClick={() => rate(n)} disabled={rating}>
                    <Star size={13} aria-hidden="true" />
                    {n}
                  </Button>
                ))}
              </div>
              {ticket.satisfactionRating ? (
                <p className="px-muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
                  <CheckCircle2 size={13} aria-hidden="true" /> You rated this {ticket.satisfactionRating} of 5. You can change it.
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
