import { Ban, CheckCircle2, Clock, Send } from "lucide-react";
import { money } from "../format";

// Confirmation copy for invoice actions (PUI-4). Each line describes what the
// existing endpoint actually does.
export function invoiceActionCopy(kind, inv) {
  const name = inv?.number || "this invoice";
  const outstanding = Math.max(0, Number(inv?.total || 0) - Number(inv?.amountPaid || 0));
  switch (kind) {
    case "sent":
      return {
        icon: Send,
        tone: "info",
        title: "Mark this invoice as sent?",
        confirm: "Mark as sent",
        lead: `${name} for ${money(inv?.total, inv?.currency)}.`,
        details: ["Its status becomes Sent and today becomes its issue date.", "Nothing is emailed: send the invoice to the client yourself."],
        done: `${name} marked as sent.`,
      };
    case "paid":
      return {
        icon: CheckCircle2,
        tone: "info",
        title: "Mark this invoice as paid?",
        confirm: "Mark as paid",
        lead: `${name}.`,
        details: [
          outstanding > 0
            ? `A payment of ${money(outstanding, inv?.currency)} (the outstanding balance) is recorded as "Marked as paid".`
            : "Nothing is outstanding, so no payment is added.",
          "Its status becomes Paid. To record a partial or dated payment instead, open the invoice and use Record payment.",
        ],
        done: `${name} marked as paid.`,
      };
    case "void":
      return {
        icon: Ban,
        tone: "bad",
        danger: true,
        title: "Void this invoice?",
        confirm: "Void invoice",
        lead: `${name} for ${money(inv?.total, inv?.currency)}.`,
        details: [
          "Its status becomes Void. It is not deleted and keeps its number.",
          "Payments already recorded stay on it. No new payments can be added.",
          "It no longer counts in outstanding or collected totals.",
        ],
        done: `${name} voided.`,
      };
    case "overdue":
      return {
        icon: Clock,
        tone: "warn",
        title: "Mark past-due invoices as overdue?",
        confirm: "Mark overdue",
        lead: "This updates every invoice, not only the ones on this page.",
        details: ["Every Sent invoice whose due date has passed becomes Overdue.", "Drafts, paid and void invoices are not changed."],
        done: "Done.",
      };
    default:
      return { title: "", confirm: "", details: [], done: "" };
  }
}
