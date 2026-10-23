import React, { useEffect, useRef, useState } from "react";
import { ClipboardCheck, XCircle } from "lucide-react";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import { useToast } from "../../../shared/ui/Toast";
import { approveExpense, deleteExpense, markExpensePaid, registerExpense, rejectExpense } from "../api";
import { expenseActionCopy } from "./expenseActions";
import { money, monthLabel } from "../format";

// The dialogs behind every expense claim action (PUI-4): confirmations for
// approve, mark paid and delete, a reason for reject, a month for register.
// `action` is { kind, item } or null; onDone(kind) runs after success.
export default function ExpenseActionDialogs({ action, onClose, onDone }) {
  const toast = useToast();
  const kind = action?.kind;
  const item = action?.item;
  const [reason, setReason] = useState("");
  const [month, setMonth] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  useEffect(() => {
    if (!action) return;
    setReason("");
    setMonth(item?.registeredMonth || item?.claimMonth || new Date().toISOString().slice(0, 7));
  }, [action, item]);

  const confirmable = ["approve", "paid", "delete"].includes(kind);
  const copy = confirmable ? expenseActionCopy(kind, item) : null;

  const run = async (fn, success) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      onClose();
      await onDone?.(kind);
    } catch (e) {
      toast.error(e?.response?.data?.message || "That didn't work. Refresh and try again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={confirmable}
        icon={copy?.icon}
        tone={copy?.tone}
        danger={copy?.danger}
        title={copy?.title}
        confirmLabel={copy?.confirm}
        details={copy?.details}
        onClose={onClose}
        onConfirm={async () => {
          const fn = { approve: approveExpense, paid: markExpensePaid, delete: deleteExpense }[kind];
          await run(() => fn(item._id), copy.done);
        }}
      >
        {copy?.lead}
      </ConfirmDialog>

      <FormDialog
        open={kind === "reject"}
        title="Reject this expense claim?"
        description={item ? `${item.title}: ${money(item.amount, item.currency)} for ${item.staffName || "unnamed"}.` : ""}
        onClose={onClose}
        onSubmit={() => run(() => rejectExpense(item._id, reason.trim()), "Claim rejected.")}
        busy={busy}
        submitLabel="Reject claim"
        submitIcon={XCircle}
      >
        <fieldset className="px-form-section">
          <legend>Reason</legend>
          <TextField label="Why it's being rejected" multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} hint="Optional. The person who claimed can read it." />
        </fieldset>
      </FormDialog>

      <FormDialog
        open={kind === "register"}
        title="Register this claim to a month?"
        description={item ? `${item.title}: ${money(item.amount, item.currency)} for ${item.staffName || "unnamed"}.` : ""}
        onClose={onClose}
        onSubmit={() => run(() => registerExpense(item._id, month), `Claim registered to ${monthLabel(month)}.`)}
        busy={busy}
        canSubmit={/^\d{4}-\d{2}$/.test(month)}
        submitLabel="Register claim"
        submitIcon={ClipboardCheck}
      >
        <fieldset className="px-form-section">
          <legend>Month</legend>
          <TextField
            label="Register to"
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            hint="It joins that month's expense summary as unpaid. After this it can't be edited or deleted."
          />
        </fieldset>
      </FormDialog>
    </>
  );
}
