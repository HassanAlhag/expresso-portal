import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Award, CalendarDays, CheckCircle2, Eye, FileText, Inbox, Lock, Pencil, RefreshCw, Send, XCircle } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import RowActions from "../../../shared/ui/RowActions";
import SkeletonRows from "../../../shared/ui/SkeletonRows";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";

import { closeRfq, getMatchedVendors, getRfq, listQuotations, publishRfq, updateQuotationStatus } from "../api";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, date, idOf, money, safeUrl } from "../format";

const QUOTE_COPY = {
  under_review: { title: "Mark this quotation as under review?", confirm: "Mark under review", icon: Eye, tone: "info", details: ["The vendor sees its status as Under review."], done: "Quotation marked under review." },
  accepted: { title: "Accept this quotation?", confirm: "Accept quotation", icon: Award, tone: "info", details: ["The RFQ becomes Awarded and stops taking quotations.", "Other quotations keep their current status; reject them separately if needed."], done: "Quotation accepted. The RFQ is awarded." },
  rejected: { title: "Reject this quotation?", confirm: "Reject quotation", icon: XCircle, tone: "bad", details: ["The vendor sees it as Rejected and may submit a new quotation while the RFQ is published."], done: "Quotation rejected." },
};

// RFQ, staff view (PUI-4, internal). Editing needs procurement.write;
// publishing, closing and deciding on quotations need procurement.approve.
export default function RfqStaffDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("procurement.write");
  const canApprove = access.can("procurement.approve");

  const [rfq, setRfq] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [quotes, setQuotes] = useState({ status: "loading", items: [] });
  const [dialog, setDialog] = useState(null); // publish | close | { kind, quote }
  const [matched, setMatched] = useState(null);
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  usePageCrumbs(rfq ? [{ label: "Procurement", to: "/portal/procurement" }, { label: "RFQs", to: "/portal/procurement/rfqs" }, { label: rfq.rfqNumber || "RFQ" }] : []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await getRfq(id);
      setRfq(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    }
  }, [id]);

  const loadQuotes = useCallback(async () => {
    setQuotes((q) => ({ ...q, status: "loading" }));
    try {
      const res = await listQuotations(id);
      setQuotes({ status: "ready", items: res?.items || [] });
    } catch {
      setQuotes({ status: "failed", items: [] });
    }
  }, [id]);

  useEffect(() => {
    load();
    loadQuotes();
  }, [load, loadQuotes]);

  const openPublish = () => {
    setNotify(false);
    setMatched(null);
    setDialog("publish");
    getMatchedVendors(id)
      .then((r) => setMatched(Number(r?.total ?? (r?.items || []).length)))
      .catch(() => setMatched("failed"));
  };

  const guarded = async (fn) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const publish = () =>
    guarded(async () => {
      try {
        const res = await publishRfq(id, { notifyVendors: notify });
        toast.success(notify ? `Published. ${res?.notified ?? 0} vendor${res?.notified === 1 ? "" : "s"} emailed.` : "Published. Matched vendors can now see it.");
        setDialog(null);
        await load();
      } catch (e) {
        toast.error(e?.response?.data?.message || "The RFQ wasn't published. Try again.");
      }
    });

  const close = async () => {
    try {
      await closeRfq(id);
      toast.success("RFQ closed. It no longer takes quotations.");
      setDialog(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "The RFQ wasn't closed. Try again.");
    }
  };

  const decide = async () => {
    const { kind, quote } = dialog;
    try {
      await updateQuotationStatus(quote._id, kind);
      toast.success(QUOTE_COPY[kind].done);
      setDialog(null);
      await Promise.all([load(), loadQuotes()]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "The quotation wasn't updated. Try again.");
    }
  };

  if (!rfq && !loadError) return <LoadingState rows={6} label="Loading RFQ" />;
  if (loadError || !rfq) {
    const s = loadError?.status;
    return <ErrorState title={s === 404 ? "RFQ not found" : "This RFQ didn't load"} message={s === 404 ? "It may have been removed, or the link is wrong." : loadError?.message || undefined} onRetry={s === 404 ? undefined : load} />;
  }

  const cats = (rfq.subcategoryIds || []).filter((c) => typeof c === "object");
  const attachments = rfq.attachments || [];
  const menu = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => { load(); loadQuotes(); } },
    canApprove && rfq.status === "published" ? { key: "sep", separator: true } : null,
    canApprove && rfq.status === "published" ? { key: "close", label: "Close RFQ", icon: Lock, tone: "muted", onSelect: () => setDialog("close") } : null,
  ];
  const quoteCopy = dialog && typeof dialog === "object" ? QUOTE_COPY[dialog.kind] : null;

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={RFQ_STATUS_TONE[rfq.status] || "neutral"} dot>{RFQ_STATUS_LABEL[rfq.status] || rfq.status}</Badge>
              <span className="px-code">{rfq.rfqNumber}</span>
            </div>
            <h1>{rfq.title || "Untitled RFQ"}</h1>
            <ul className="px-record-meta" aria-label="RFQ summary">
              <li>
                <CalendarDays size={15} aria-hidden="true" />
                {rfq.deadline ? `Deadline ${date(rfq.deadline)}` : "No deadline"}
              </li>
              {rfq.requestId ? (
                <li>
                  <Inbox size={15} aria-hidden="true" />
                  <Link to={`/portal/procurement/requests/${idOf(rfq.requestId)}`}>From a procurement request</Link>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite && rfq.status === "draft" ? (
              <Button variant="outline" onClick={() => nav(`/portal/procurement/rfqs/${id}/edit`)}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canApprove && rfq.status === "draft" ? (
              <Button onClick={openPublish}>
                <Send size={15} aria-hidden="true" />
                Publish
              </Button>
            ) : null}
            <RowActions label={rfq.rfqNumber || "RFQ"} actions={menu} />
          </div>
        </header>

        {rfq.status === "draft" ? (
          <Alert tone="info" title="Draft: only staff can see it">
            Publishing shows it to active vendors registered in its categories. Only drafts can be edited.
          </Alert>
        ) : null}

        <div className="px-grid px-cols-detail">
          <div className="px-stack">
            <Panel title="Requirements" sub={rfq.status === "draft" ? "Vendors will see this once published" : "Shown to matched vendors"}>
              {rfq.description ? <p className="px-prose" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{rfq.description}</p> : <p className="px-muted" style={{ margin: 0 }}>No description.</p>}
            </Panel>
            <Panel title="Quotations" sub={quotes.status === "ready" ? `${quotes.items.length} received` : undefined} flush>
              {quotes.status === "failed" ? (
                <ErrorState title="Quotations didn't load" onRetry={loadQuotes} />
              ) : quotes.status === "ready" && !quotes.items.length ? (
                <div className="px-inline-empty">
                  <FileText size={18} aria-hidden="true" />
                  <span>{rfq.status === "draft" ? "Quotations arrive after the RFQ is published." : "No quotations yet."}</span>
                </div>
              ) : (
                <table className="px-table px-table--stack" aria-label="Quotations" aria-busy={quotes.status === "loading" || undefined}>
                  <thead>
                    <tr>
                      <th scope="col">Vendor</th>
                      <th scope="col" className="px-num">Price</th>
                      <th scope="col" className="px-num px-hide-tab">Delivery</th>
                      <th scope="col">Status</th>
                      {canApprove ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.status === "loading" ? (
                      <SkeletonRows rows={3} cols={canApprove ? 5 : 4} label="Loading quotations" />
                    ) : (
                      quotes.items.map((qt) => {
                        const actions = [
                          qt.status === "submitted" ? { key: "review", label: "Mark under review", icon: Eye, onSelect: () => setDialog({ kind: "under_review", quote: qt }) } : null,
                          !["accepted", "rejected"].includes(qt.status) ? { key: "accept", label: "Accept", icon: CheckCircle2, onSelect: () => setDialog({ kind: "accepted", quote: qt }) } : null,
                          !["accepted", "rejected"].includes(qt.status) ? { key: "sep", separator: true } : null,
                          !["accepted", "rejected"].includes(qt.status) ? { key: "reject", label: "Reject", icon: XCircle, tone: "muted", onSelect: () => setDialog({ kind: "rejected", quote: qt }) } : null,
                        ];
                        return (
                          <tr key={qt._id}>
                            <td className="px-primary">
                              <div className="px-cell-main">
                                <b>{qt.vendorId?.name || "Vendor removed"}</b>
                                <span>{[qt.vendorId?.contactPerson, qt.vendorId?.email, `sent ${date(qt.submittedAt || qt.createdAt)}`].filter(Boolean).join(", ")}</span>
                                {qt.notes ? <span>{qt.notes}</span> : null}
                              </div>
                            </td>
                            <td data-label="Price" className="px-num">{money(qt.price, qt.currency)}</td>
                            <td data-label="Delivery" className="px-num px-hide-tab">{qt.deliveryDays ? `${qt.deliveryDays} days` : "—"}</td>
                            <td data-label="Status">
                              <Badge tone={QUOTE_STATUS_TONE[qt.status] || "neutral"} dot>{QUOTE_STATUS_LABEL[qt.status] || qt.status}</Badge>
                            </td>
                            {canApprove ? (
                              <td className="px-actions-cell">
                                <RowActions label={`quotation from ${qt.vendorId?.name || "vendor"}`} actions={actions} />
                              </td>
                            ) : null}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
          <div className="px-stack">
            <Panel title="Details">
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Created", value: `${date(rfq.createdAt)}${rfq.createdBy?.fullName ? ` by ${rfq.createdBy.fullName}` : ""}` },
                  { label: "Published", value: date(rfq.publishedAt) || "Not yet" },
                  { label: "Closed", value: date(rfq.closedAt), hidden: !rfq.closedAt },
                  { label: "Deadline", value: date(rfq.deadline) || "None" },
                ]}
              />
            </Panel>
            <Panel title="Categories" sub="Vendors in these see it once published" flush>
              {cats.length ? (
                <ul className="px-list">
                  {cats.map((c) => (
                    <li key={c._id}>
                      <span className="px-t">{c.name}</span>
                      {c.code ? <span className="px-code">{c.code}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-muted" style={{ margin: 0, padding: "12px 20px" }}>None.</p>
              )}
            </Panel>
            <Panel title="Attachments" flush>
              {attachments.length ? (
                <ul className="px-list">
                  {attachments.map((a, i) => (
                    <li key={i}>
                      {safeUrl(a.url) ? <a href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">{a.name || a.url}</a> : <span>{a.name || a.url}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-muted" style={{ margin: 0, padding: "12px 20px" }}>None.</p>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {canApprove ? (
        <>
          <FormDialog open={dialog === "publish"} title="Publish this RFQ?" description={`${rfq.rfqNumber}: ${rfq.title}`} onClose={() => setDialog(null)} onSubmit={publish} busy={busy} submitLabel="Publish" submitIcon={Send}>
            <fieldset className="px-form-section">
              <legend>Vendors</legend>
              <p className="px-muted" style={{ margin: 0 }}>
                {matched === null ? "Counting matched vendors…" : matched === "failed" ? "The matched vendors couldn't be counted." : `${matched} active vendor${matched === 1 ? "" : "s"} registered in its categories will see it.`}
              </p>
              <label className="px-check">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Email the matched vendors that it's published
              </label>
              <p className="px-muted" style={{ margin: 0, fontSize: 12.5 }}>Once published it can't be edited. It can be closed.</p>
            </fieldset>
          </FormDialog>
          <ConfirmDialog open={dialog === "close"} icon={Lock} tone="warn" title="Close this RFQ?" confirmLabel="Close RFQ" details={["It stops taking quotations. Vendors who already quoted can still see it.", "Quotations received are kept."]} onClose={() => setDialog(null)} onConfirm={close}>
            {`${rfq.rfqNumber}: ${rfq.title}.`}
          </ConfirmDialog>
          <ConfirmDialog open={Boolean(quoteCopy)} icon={quoteCopy?.icon} tone={quoteCopy?.tone} danger={dialog?.kind === "rejected"} title={quoteCopy?.title} confirmLabel={quoteCopy?.confirm} details={quoteCopy?.details} onClose={() => setDialog(null)} onConfirm={decide}>
            {dialog?.quote ? `${dialog.quote.vendorId?.name || "Vendor"}: ${money(dialog.quote.price, dialog.quote.currency)}.` : ""}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
