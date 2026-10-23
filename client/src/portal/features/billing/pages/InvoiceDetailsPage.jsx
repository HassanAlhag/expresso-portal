import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, Building2, CalendarDays, CheckCircle2, FolderKanban, Pencil, Plus, Printer, RefreshCw, Send, Trash2, Wallet } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Alert from "../../../shared/ui/Alert";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";

import { getInvoice, markInvoicePaid, voidInvoice, updateInvoice, recordPayment, deletePayment } from "../api";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PAYMENT_METHODS, date, money, overdueDays, paymentMethodLabel, idOf } from "../format";
import InvoiceFormDialog from "../components/InvoiceFormDialog";
import { invoiceActionCopy } from "../components/invoiceActions";

const today = () => new Date().toISOString().slice(0, 10);
// The API populates payments.recordedBy with "name email", but users store
// their name as fullName, so the email is the reliable fallback.
const recorder = (p) => p?.recordedBy?.fullName || p?.recordedBy?.name || p?.recordedBy?.email || "";

// Invoice detail (PUI-4). Staff with billing.write manage the invoice and its
// payments; everyone else, including client users, reads it.
export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("billing.write");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(null); // sent | paid | void
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", method: "bank_transfer", paidAt: today(), note: "" });
  const [removing, setRemoving] = useState(null);

  usePageCrumbs(item ? [{ label: "Billing", to: "/portal/billing" }, { label: item.number || "Draft invoice" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getInvoice(id);
      setItem(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !item) return <LoadingState rows={6} label="Loading invoice" />;
  if (loadError || !item) {
    const s = loadError?.status;
    return (
      <ErrorState
        title={s === 404 ? "Invoice not found" : s === 403 ? "You don't have access to this invoice" : "This invoice didn't load"}
        message={s === 404 ? "It may have been removed, or the link is wrong." : s === 403 ? "Ask an administrator if you need it." : loadError?.message || undefined}
        onRetry={s === 404 || s === 403 ? undefined : load}
      />
    );
  }

  const name = item.number || "Draft invoice";
  const isVoid = item.status === "void";
  const late = overdueDays(item);
  const client = item.customerId && typeof item.customerId === "object" ? item.customerId : null;
  const project = item.projectId && typeof item.projectId === "object" ? item.projectId : null;
  const enrollment = item.enrollmentId && typeof item.enrollmentId === "object" ? item.enrollmentId : null;
  const canPay = canWrite && !["paid", "void"].includes(item.status);
  const payments = Array.isArray(item.payments) ? item.payments : [];

  const runAction = async () => {
    try {
      if (pending === "sent") await updateInvoice(item._id, { status: "sent" });
      if (pending === "paid") await markInvoicePaid(item._id);
      if (pending === "void") await voidInvoice(item._id);
      toast.success(invoiceActionCopy(pending, item).done);
      setPending(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Refresh and try again.");
    }
  };

  const more = [
    { key: "print", label: "Print", icon: Printer, onSelect: () => window.print() },
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => load() },
    canWrite && !isVoid ? { key: "sep", separator: true } : null,
    canWrite && !isVoid ? { key: "void", label: "Void invoice", icon: Ban, tone: "muted", onSelect: () => setPending("void") } : null,
  ];

  const copy = pending ? invoiceActionCopy(pending, item) : null;

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={INVOICE_STATUS_TONE[item.status] || "neutral"} dot={item.status !== "draft"}>
                {INVOICE_STATUS_LABEL[item.status] || item.status}
              </Badge>
              <span className="px-code">{item.currency || "AED"}</span>
            </div>
            <h1>{name}</h1>
            <ul className="px-record-meta" aria-label="Invoice summary">
              <li>
                <Building2 size={15} aria-hidden="true" />
                {client && access.canOpen("/portal/customers") ? <Link to={`/portal/customers/${client._id}`}>{client.companyName}</Link> : client?.companyName || "No client"}
              </li>
              {project ? (
                <li>
                  <FolderKanban size={15} aria-hidden="true" />
                  {access.canOpen("/portal/projects") ? <Link to={`/portal/projects/${idOf(project)}`}>{project.name || project.title}</Link> : project.name || project.title}
                </li>
              ) : null}
              {item.dueDate ? (
                <li>
                  <CalendarDays size={15} aria-hidden="true" />
                  Due {date(item.dueDate)}
                </li>
              ) : null}
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite && !isVoid ? (
              <Button variant="outline" onClick={() => { setFormError(""); setEditOpen(true); }}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canWrite && item.status === "draft" ? (
              <Button onClick={() => setPending("sent")}>
                <Send size={15} aria-hidden="true" />
                Mark as sent
              </Button>
            ) : canPay ? (
              <Button onClick={() => setPending("paid")}>
                <CheckCircle2 size={15} aria-hidden="true" />
                Mark as paid
              </Button>
            ) : null}
            <RowActions label={name} actions={more} />
          </div>
        </header>

        {isVoid ? (
          <Alert tone="info" icon={Ban} title="This invoice is void">
            It keeps its number and any payments already recorded, and no longer counts in billing totals.
          </Alert>
        ) : late ? (
          <Alert tone="warn" title={`${late} day${late === 1 ? "" : "s"} past due`}>
            {`${money(item.balance, item.currency)} is still outstanding.`}
          </Alert>
        ) : null}

        <div className="px-grid px-cols-detail">
          <div className="px-stack">
            <Panel title="Lines" flush>
              {(item.items || []).length ? (
                <table className="px-table px-table--stack" aria-label="Invoice lines">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col" className="px-num">Qty</th>
                      <th scope="col" className="px-num">Unit price</th>
                      <th scope="col" className="px-num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.items.map((it, i) => (
                      <tr key={it._id || i}>
                        <td className="px-primary">
                          <div className="px-cell-main">
                            <b>{it.title}</b>
                            {it.description ? <span>{it.description}</span> : null}
                          </div>
                        </td>
                        <td data-label="Qty" className="px-num">{it.qty}</td>
                        <td data-label="Unit price" className="px-num">{money(it.unitPrice, item.currency)}</td>
                        <td data-label="Amount" className="px-num">{money(it.amount, item.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-muted" style={{ margin: 0, padding: "4px 20px 16px" }}>No lines.</p>
              )}
              <dl className="px-totals px-totals--panel" aria-label="Invoice totals">
                <dt>Subtotal</dt>
                <dd>{money(item.subtotal, item.currency)}</dd>
                {Number(item.discount) > 0 ? (
                  <>
                    <dt>Discount</dt>
                    <dd>−{money(item.discount, item.currency)}</dd>
                  </>
                ) : null}
                {Number(item.tax) > 0 ? (
                  <>
                    <dt>Tax{Number(item.taxRate) > 0 ? ` (${item.taxRate}%)` : ""}</dt>
                    <dd>{money(item.tax, item.currency)}</dd>
                  </>
                ) : null}
                <dt className="px-total">Total</dt>
                <dd className="px-total">{money(item.total, item.currency)}</dd>
              </dl>
            </Panel>

            <Panel
              title="Payments"
              sub={payments.length ? `${money(item.amountPaid, item.currency)} received` : undefined}
              flush
              action={
                canPay ? (
                  <Button size="sm" onClick={() => { setPay({ amount: String(item.balance || ""), method: "bank_transfer", paidAt: today(), note: "" }); setFormError(""); setPayOpen(true); }}>
                    <Plus size={14} aria-hidden="true" />
                    Record payment
                  </Button>
                ) : null
              }
            >
              {payments.length ? (
                <table className="px-table px-table--stack" aria-label="Payments">
                  <thead>
                    <tr>
                      <th scope="col">Received</th>
                      <th scope="col">Method</th>
                      <th scope="col" className="px-num">Amount</th>
                      {canWrite ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="px-primary">
                          <div className="px-cell-main">
                            <b>{date(p.paidAt)}</b>
                            {p.note || (access.isInternal && recorder(p)) ? (
                              <span>{[p.note, access.isInternal && recorder(p) ? `Recorded by ${recorder(p)}` : null].filter(Boolean).join(", ")}</span>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="Method">{paymentMethodLabel(p.method)}</td>
                        <td data-label="Amount" className="px-num">{money(p.amount, item.currency)}</td>
                        {canWrite ? (
                          <td className="px-actions-cell">
                            <RowActions label={`payment of ${money(p.amount, item.currency)}`} actions={[{ key: "rm", label: "Remove payment", icon: Trash2, onSelect: () => setRemoving(p) }]} />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-inline-empty">
                  <Wallet size={18} aria-hidden="true" />
                  <span>No payments recorded yet.</span>
                </div>
              )}
            </Panel>

            {item.notes ? (
              <Panel title="Notes" sub={access.isInternal ? "Shown to the client" : undefined}>
                <p className="px-prose">{item.notes}</p>
              </Panel>
            ) : null}
          </div>

          <div className="px-stack">
            <Panel title="Amounts">
              <div className="px-figs px-figs--tight" style={{ "--px-fig-n": 2 }}>
                <div className="px-fig">
                  <span>Paid</span>
                  <b data-tone={Number(item.amountPaid) > 0 ? "ok" : undefined}>{money(item.amountPaid, item.currency)}</b>
                </div>
                <div className="px-fig">
                  <span>Balance</span>
                  <b data-tone={!isVoid && Number(item.balance) > 0 && late ? "bad" : undefined}>{isVoid ? "Void" : money(item.balance, item.currency)}</b>
                </div>
              </div>
            </Panel>
            <Panel title="Details">
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Client", value: client?.companyName },
                  { label: "Contact", value: client?.contactName },
                  { label: "Email", value: client?.primaryEmail },
                  { label: "Project", value: project?.name || project?.title, hidden: !project },
                  { label: "Enrollment", value: enrollment?.name || enrollment?.title, hidden: !enrollment },
                  { label: "Issued", value: date(item.issuedAt) || "Not yet" },
                  { label: "Due", value: date(item.dueDate) },
                  { label: "Paid", value: date(item.paidAt), hidden: !item.paidAt },
                ]}
              />
            </Panel>
          </div>
        </div>
      </div>

      {canWrite ? (
        <>
          <InvoiceFormDialog
            open={editOpen}
            mode="edit"
            invoice={item}
            busy={formBusy}
            error={formError}
            onClose={() => setEditOpen(false)}
            onSubmit={async (payload) => {
              setFormBusy(true);
              setFormError("");
              try {
                await updateInvoice(item._id, payload);
                toast.success("Invoice updated.");
                setEditOpen(false);
                await load();
              } catch (e) {
                setFormError(e?.response?.data?.message || "The changes weren't saved. Try again.");
              } finally {
                setFormBusy(false);
              }
            }}
          />
          <FormDialog
            open={payOpen}
            title="Record a payment"
            description={`${name}, ${money(item.balance, item.currency)} outstanding.`}
            onClose={() => setPayOpen(false)}
            busy={formBusy}
            error={formError}
            canSubmit={Number(pay.amount) > 0}
            submitLabel="Record payment"
            submitIcon={Wallet}
            onSubmit={async () => {
              setFormBusy(true);
              setFormError("");
              try {
                const res = await recordPayment(item._id, { amount: Number(pay.amount), method: pay.method, paidAt: pay.paidAt, note: pay.note.trim() });
                toast.success(res?.item?.status === "paid" ? "Payment recorded. The invoice is now paid." : "Payment recorded.");
                setPayOpen(false);
                await load();
              } catch (e) {
                setFormError(e?.response?.data?.message || "The payment wasn't recorded. Try again.");
              } finally {
                setFormBusy(false);
              }
            }}
          >
            <fieldset className="px-form-section">
              <legend>Payment</legend>
              <div className="px-form-grid px-form-grid--2">
                <TextField label={`Amount (${item.currency || "AED"})`} required type="number" min="0" inputMode="decimal" value={pay.amount} onChange={(e) => setPay((s) => ({ ...s, amount: e.target.value }))} hint="When the balance is fully paid, the invoice becomes Paid." />
                <SelectField label="Method" value={pay.method} onChange={(v) => setPay((s) => ({ ...s, method: v }))} options={PAYMENT_METHODS} />
                <TextField label="Received on" type="date" value={pay.paidAt} onChange={(e) => setPay((s) => ({ ...s, paidAt: e.target.value }))} />
                <TextField label="Reference or note" value={pay.note} onChange={(e) => setPay((s) => ({ ...s, note: e.target.value }))} placeholder="Optional" />
              </div>
            </fieldset>
          </FormDialog>
          <ConfirmDialog
            open={Boolean(pending)}
            icon={copy?.icon}
            tone={copy?.tone}
            danger={copy?.danger}
            title={copy?.title}
            confirmLabel={copy?.confirm}
            details={copy?.details}
            onClose={() => setPending(null)}
            onConfirm={runAction}
          >
            {copy?.lead}
          </ConfirmDialog>
          <ConfirmDialog
            open={Boolean(removing)}
            icon={Trash2}
            tone="bad"
            danger
            title="Remove this payment?"
            confirmLabel="Remove payment"
            onClose={() => setRemoving(null)}
            onConfirm={async () => {
              try {
                await deletePayment(item._id, removing._id);
                toast.success("Payment removed. The balance has been recalculated.");
                setRemoving(null);
                await load();
              } catch (e) {
                toast.error(e?.response?.data?.message || "The payment wasn't removed. Try again.");
              }
            }}
            details={[
              "The payment is deleted and the paid amount and balance are recalculated.",
              ...(item.status === "paid" ? ["The invoice stays marked Paid even though money will be outstanding again. The status isn't reopened automatically (a known limitation)."] : []),
            ]}
          >
            {removing ? `${money(removing.amount, item.currency)} received ${date(removing.paidAt)}.` : ""}
          </ConfirmDialog>
        </>
      ) : null}
    </>
  );
}
