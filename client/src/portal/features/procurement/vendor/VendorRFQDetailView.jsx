import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, FileText, Hash, Plus, RefreshCw, Send, X } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";

import { getRfq, submitQuotation } from "../api";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, date, money, safeUrl } from "../format";
import { deadlineNote } from "./VendorRFQsView";

const CURRENCIES = ["AED", "USD", "EUR", "SAR", "GBP"].map((c) => ({ value: c, label: c }));
const BLANK = { price: "", currency: "AED", deliveryDays: "", notes: "", attachments: [] };

function Attachments({ items = [] }) {
  if (!items.length) return <p className="px-muted" style={{ margin: 0 }}>None.</p>;
  return (
    <ul className="px-list">
      {items.map((a, i) => (
        <li key={i} style={{ padding: "6px 0" }}>
          {safeUrl(a.url) ? <a href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">{a.name || a.url}</a> : <span>{a.name || a.url}</span>}
        </li>
      ))}
    </ul>
  );
}

// One RFQ, vendor view (PUI-5). The API shows it only while published in the
// vendor's approved categories, or afterwards if the vendor quoted on it, and
// returns only vendor-safe fields and the vendor's own quotation.
export default function VendorRFQDetailView() {
  const { id } = useParams();
  const toast = useToast();
  const [rfq, setRfq] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  usePageCrumbs(rfq ? [{ label: "RFQs", to: "/portal/procurement/rfqs" }, { label: rfq.rfqNumber || "RFQ" }] : []);

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

  useEffect(() => {
    load();
  }, [load]);

  if (!rfq && !loadError) return <LoadingState rows={6} label="Loading RFQ" />;
  if (loadError || !rfq) {
    const s = loadError?.status;
    return (
      <ErrorState
        title={s === 403 || s === 404 ? "RFQ not available" : "This RFQ didn't load"}
        message={s === 403 || s === 404 ? "It isn't open to your categories, or it has closed and you didn't quote on it." : loadError?.message || undefined}
        onRetry={s === 403 || s === 404 ? undefined : load}
      />
    );
  }

  const mine = rfq.myQuotation || null;
  const open = rfq.status === "published";
  const canQuote = open && (!mine || mine.status === "rejected");
  const showForm = canQuote && (!mine || composing);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const setAtt = (i, patch) => setForm((f) => ({ ...f, attachments: f.attachments.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const price = Number(form.price);
  const valid = form.price !== "" && price > 0 && (form.deliveryDays === "" || Number(form.deliveryDays) >= 1);

  const submit = async (e) => {
    e?.preventDefault();
    if (!valid || running.current) return;
    running.current = true;
    setSaving(true);
    setError("");
    try {
      await submitQuotation(rfq._id, {
        price,
        currency: form.currency,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : null,
        notes: form.notes.trim(),
        attachments: form.attachments.filter((a) => safeUrl(a.url)).map((a) => ({ name: a.name.trim(), url: a.url.trim() })),
      });
      toast.success("Quotation sent to Expresso.");
      setComposing(false);
      setForm(BLANK);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Your quotation wasn't sent. Check it and try again.");
    } finally {
      running.current = false;
      setSaving(false);
    }
  };

  const cats = (rfq.subcategoryIds || []).filter((c) => typeof c === "object");

  return (
    <div className="px-stack" style={{ gap: 20 }}>
      <header className="px-record-head">
        <div className="px-record-id">
          <div className="px-record-tags">
            <Badge tone={RFQ_STATUS_TONE[rfq.status] || "neutral"} dot>{open ? "Open for quotes" : RFQ_STATUS_LABEL[rfq.status] || rfq.status}</Badge>
          </div>
          <h1>{rfq.title}</h1>
          <ul className="px-record-meta" aria-label="RFQ summary">
            <li>
              <Hash size={15} aria-hidden="true" />
              {rfq.rfqNumber}
            </li>
            <li>
              <CalendarDays size={15} aria-hidden="true" />
              {deadlineNote(rfq.deadline)}
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

      {!open ? (
        <Alert tone="info" title={rfq.status === "awarded" ? "This RFQ has been awarded" : "This RFQ is closed"}>
          It no longer takes quotations. Your quotation and its status are below.
        </Alert>
      ) : null}

      <div className="px-grid px-cols-detail">
        <div className="px-stack">
          <Panel title="What's needed">
            {rfq.description ? <p className="px-prose" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{rfq.description}</p> : <p className="px-muted" style={{ margin: 0 }}>No description.</p>}
          </Panel>

          {mine && !composing ? (
            <Panel title="Your quotation" sub={mine.submittedAt ? `Sent ${date(mine.submittedAt)}` : undefined} action={<Badge tone={QUOTE_STATUS_TONE[mine.status] || "neutral"} dot>{QUOTE_STATUS_LABEL[mine.status] || mine.status}</Badge>}>
              <div className="px-stack">
                <KeyValue
                  items={[
                    { label: "Price", value: money(mine.price, mine.currency) },
                    { label: "Delivery", value: mine.deliveryDays ? `${mine.deliveryDays} days` : "" },
                    { label: "Notes", value: mine.notes ? <span style={{ whiteSpace: "pre-wrap" }}>{mine.notes}</span> : "" },
                  ]}
                />
                {(mine.attachments || []).length ? <Attachments items={mine.attachments} /> : null}
                {mine.status === "rejected" && open ? (
                  <Alert tone="warn" title="This quotation wasn't accepted">
                    The RFQ is still open, so you can send a new one. It replaces this quotation.
                    <div style={{ marginTop: 8 }}>
                      <Button size="sm" onClick={() => { setForm(BLANK); setError(""); setComposing(true); }}>
                        <Send size={14} aria-hidden="true" />
                        Send a new quotation
                      </Button>
                    </div>
                  </Alert>
                ) : null}
              </div>
            </Panel>
          ) : null}

          {showForm ? (
            <Panel title={mine ? "New quotation" : "Send your quotation"} sub="Expresso reviews it and updates its status here. Once sent, it can't be changed unless it's rejected.">
              <form className="px-stack" onSubmit={submit} aria-label="Quotation">
                {error ? <Alert tone="bad" title="Not sent">{error}</Alert> : null}
                <div className="px-form-grid px-form-grid--3">
                  <TextField label="Price" type="number" min="0" step="any" inputMode="decimal" required value={form.price} onChange={set("price")} />
                  <SelectField label="Currency" value={form.currency} onChange={set("currency")} options={CURRENCIES} />
                  <TextField label="Delivery (days)" type="number" min="1" inputMode="numeric" value={form.deliveryDays} onChange={set("deliveryDays")} hint="Optional" />
                </div>
                <TextField label="Notes" multiline rows={4} value={form.notes} onChange={set("notes")} hint="Terms, conditions or clarifications." />
                <div className="px-stack" style={{ gap: 8 }}>
                  {form.attachments.map((a, i) => (
                    <div key={i} className="px-form-grid px-form-grid--2" style={{ alignItems: "end" }}>
                      <TextField label={`Document ${i + 1} name`} value={a.name} onChange={(e) => setAtt(i, { name: e.target.value })} />
                      <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <TextField label={`Document ${i + 1} link`} value={a.url} onChange={(e) => setAtt(i, { url: e.target.value })} placeholder="https://" />
                        </div>
                        <Button variant="ghost" aria-label={`Remove document ${i + 1}`} onClick={() => setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))}>
                          <X size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, attachments: [...f.attachments, { name: "", url: "" }] }))}>
                      <Plus size={14} aria-hidden="true" />
                      Add a document link
                    </Button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button type="submit" disabled={!valid || saving}>
                    <Send size={14} aria-hidden="true" />
                    {saving ? "Sending…" : "Send quotation"}
                  </Button>
                  {mine ? <Button variant="outline" onClick={() => setComposing(false)} disabled={saving}>Cancel</Button> : null}
                </div>
              </form>
            </Panel>
          ) : null}
        </div>
        <div className="px-stack">
          <Panel title="Details">
            <KeyValue
              className="px-kv--side"
              items={[
                { label: "Published", value: date(rfq.publishedAt) },
                { label: "Deadline", value: rfq.deadline ? date(rfq.deadline) : "None" },
                { label: "Closed", value: date(rfq.closedAt), hidden: !rfq.closedAt },
              ]}
            />
          </Panel>
          <Panel title="Categories" flush>
            {cats.length ? (
              <ul className="px-list">
                {cats.map((c) => (
                  <li key={c._id}>
                    <span className="px-t">{c.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-muted" style={{ margin: 0, padding: "12px 20px" }}>None.</p>
            )}
          </Panel>
          <Panel title="Documents">
            <Attachments items={rfq.attachments || []} />
            {!(rfq.attachments || []).length ? null : (
              <p className="px-muted" style={{ margin: "8px 0 0", fontSize: 12.5 }}>
                <FileText size={12} aria-hidden="true" /> Links open in a new tab.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
