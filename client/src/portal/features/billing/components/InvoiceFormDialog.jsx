import React, { useEffect, useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import IconButton from "../../../shared/ui/IconButton";
import Button from "../../../shared/ui/Button";
import RecordPicker from "../../../shared/ui/RecordPicker";
import { listCustomers } from "../../customers/api";
import { listProjects } from "../../projects/api";
import { listEnrollments } from "../../enrollments/api";
import { computeTotals, money } from "../format";

const blankItem = () => ({ title: "", description: "", qty: 1, unitPrice: 0 });

function fromInvoice(inv) {
  return {
    customer: inv?.customerId && typeof inv.customerId === "object" ? inv.customerId : null,
    project: null,
    enrollment: null,
    currency: inv?.currency || "AED",
    dueDate: inv?.dueDate ? String(inv.dueDate).slice(0, 10) : "",
    taxRate: String(inv?.taxRate ?? 0),
    discount: String(inv?.discount ?? 0),
    notes: inv?.notes || "",
    items: inv?.items?.length
      ? inv.items.map((it) => ({ title: it.title || "", description: it.description || "", qty: it.qty ?? 1, unitPrice: it.unitPrice ?? 0 }))
      : [blankItem()],
  };
}

// Create or edit an invoice (PUI-4). Same fields as before: create chooses the
// client and optional project/enrollment; edit changes dates, money and lines.
// The number is allocated by the server (R3). Totals preview the server's own
// calculation.
export default function InvoiceFormDialog({ open, mode = "create", invoice, busy, error, onClose, onSubmit }) {
  const [f, setF] = useState(fromInvoice(null));

  useEffect(() => {
    if (open) setF(fromInvoice(mode === "edit" ? invoice : null));
  }, [open, mode, invoice]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setItem = (i, patch) => setF((s) => ({ ...s, items: s.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const totals = computeTotals(f.items, f.discount, f.taxRate);
  const hasLine = f.items.some((it) => String(it.title || "").trim());
  const canSubmit = hasLine && (mode === "edit" || Boolean(f.customer?._id));

  const submit = () => {
    const items = f.items
      .filter((it) => String(it.title || "").trim())
      .map((it) => ({ title: it.title.trim(), description: String(it.description || "").trim(), qty: Number(it.qty || 0), unitPrice: Number(it.unitPrice || 0) }));
    const common = {
      currency: f.currency.trim() || "AED",
      dueDate: f.dueDate || null,
      taxRate: Number(f.taxRate || 0),
      discount: Number(f.discount || 0),
      notes: f.notes,
      items,
    };
    if (mode === "edit") onSubmit(common);
    else
      onSubmit({
        ...common,
        customerId: f.customer?._id,
        projectId: f.project?._id || null,
        enrollmentId: f.enrollment?._id || null,
        status: "draft",
      });
  };

  return (
    <FormDialog
      open={open}
      title={mode === "edit" ? `Edit invoice ${invoice?.number || ""}`.trim() : "New invoice"}
      description={mode === "edit" ? "Change dates, amounts and lines. Payments are recorded separately." : "Created as a draft. The invoice number is assigned automatically."}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      canSubmit={canSubmit}
      submitLabel={mode === "edit" ? "Save changes" : "Create draft invoice"}
      submitIcon={mode === "edit" ? Pencil : FileText}
    >
      {mode === "create" ? (
        <fieldset className="px-form-section">
          <legend>Who it's for</legend>
          <RecordPicker
            label="Client"
            required
            value={f.customer}
            onChange={(v) => setF((s) => ({ ...s, customer: v }))}
            load={(q) => listCustomers({ q, limit: 20 })}
            getLabel={(c) => c.companyName || "Client"}
            getSub={(c) => c.contactName || c.primaryEmail}
          />
          <div className="px-form-grid px-form-grid--2">
            <RecordPicker
              label="Project"
              value={f.project}
              onChange={(v) => setF((s) => ({ ...s, project: v }))}
              load={(q) => listProjects({ q, limit: 20, ...(f.customer?._id ? { customerId: f.customer._id } : {}) })}
              getLabel={(p) => p.name || p.title || "Project"}
              getSub={(p) => p.code}
              placeholder="Optional"
            />
            <RecordPicker
              label="Enrollment"
              value={f.enrollment}
              onChange={(v) => setF((s) => ({ ...s, enrollment: v }))}
              load={(q) => listEnrollments({ q, limit: 20, ...(f.customer?._id ? { customerId: f.customer._id } : {}) })}
              getLabel={(e) => e.name || e.title || e.serviceTemplateId?.name || "Enrollment"}
              placeholder="Optional"
            />
          </div>
        </fieldset>
      ) : null}

      <fieldset className="px-form-section">
        <legend>Lines</legend>
        <ol className="px-lines">
          {f.items.map((it, i) => (
            <li key={i} className="px-line">
              <TextField label={`Line ${i + 1}`} value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} placeholder="What you are billing for" />
              <TextField label="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Optional" />
              <TextField label="Qty" type="number" min="0" inputMode="decimal" value={String(it.qty)} onChange={(e) => setItem(i, { qty: e.target.value })} />
              <TextField label={`Unit price (${f.currency || "AED"})`} type="number" min="0" inputMode="decimal" value={String(it.unitPrice)} onChange={(e) => setItem(i, { unitPrice: e.target.value })} />
              <span className="px-line-amount px-num" aria-label={`Line ${i + 1} amount`}>
                {money(Number(it.qty || 0) * Number(it.unitPrice || 0), f.currency)}
              </span>
              <IconButton
                label={`Remove line ${i + 1}`}
                disabled={f.items.length <= 1}
                onClick={() => setF((s) => ({ ...s, items: s.items.filter((_, j) => j !== i) }))}
              >
                <Trash2 size={15} aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ol>
        <div>
          <Button size="sm" variant="outline" onClick={() => setF((s) => ({ ...s, items: [...s.items, blankItem()] }))}>
            <Plus size={14} aria-hidden="true" />
            Add line
          </Button>
        </div>
      </fieldset>

      <fieldset className="px-form-section">
        <legend>Terms</legend>
        <div className="px-form-grid px-form-grid--2">
          <TextField label="Currency" value={f.currency} onChange={set("currency")} placeholder="AED" />
          <TextField label="Due date" type="date" value={f.dueDate} onChange={set("dueDate")} />
          <TextField label={`Discount (${f.currency || "AED"})`} type="number" min="0" inputMode="decimal" value={f.discount} onChange={set("discount")} hint="A flat amount off the subtotal." />
          <TextField label="Tax rate (%)" type="number" min="0" inputMode="decimal" value={f.taxRate} onChange={set("taxRate")} />
        </div>
        <dl className="px-totals" aria-label="Invoice totals">
          <dt>Subtotal</dt>
          <dd>{money(totals.subtotal, f.currency)}</dd>
          {totals.discount > 0 ? (
            <>
              <dt>Discount</dt>
              <dd>−{money(totals.discount, f.currency)}</dd>
            </>
          ) : null}
          {totals.tax > 0 ? (
            <>
              <dt>Tax ({f.taxRate}%)</dt>
              <dd>{money(totals.tax, f.currency)}</dd>
            </>
          ) : null}
          <dt className="px-total">Total</dt>
          <dd className="px-total">{money(totals.total, f.currency)}</dd>
        </dl>
        <TextField
          label="Notes shown to the client"
          multiline
          rows={3}
          value={f.notes}
          onChange={set("notes")}
          placeholder="Payment terms, bank details"
          hint="Clients can read these notes on their invoice. Don't put internal remarks here."
        />
      </fieldset>
    </FormDialog>
  );
}
