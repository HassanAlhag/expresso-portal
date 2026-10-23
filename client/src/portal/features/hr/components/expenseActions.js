import { Ban, CheckCircle2, ClipboardCheck, Pencil, Trash2, Wallet, XCircle } from "lucide-react";
import { canDecide, isOwnRecord, monthLabel, money } from "../format";

// Expense claim actions (PUI-4), shared by the list and the detail page.
// Each is offered only when the API would allow it:
//   approve / reject   hr.expenses.approve, a submitted claim, not your own (super_admin excepted)
//   register           hr.expenses.approve, an approved claim
//   mark paid          hr.expenses.approve, a registered claim not yet paid
//   edit               hr.expenses.write, not registered or paid, your own (or you approve)
//   delete             hr.expenses.delete, not registered or paid
export function expenseActionsFor(access, item, handlers) {
  const approver = access.can("hr.expenses.approve");
  const own = isOwnRecord(access, item);
  const decide = item.status === "submitted" && canDecide(access, "hr.expenses.approve", item);
  const locked = ["registered", "paid"].includes(item.status);
  const canEdit = access.can("hr.expenses.write") && !locked && (own || approver);
  const canDelete = access.can("hr.expenses.delete") && !locked;
  return [
    decide ? { key: "approve", label: "Approve", icon: CheckCircle2, onSelect: () => handlers.confirm("approve", item) } : null,
    decide ? { key: "reject", label: "Reject", icon: XCircle, onSelect: () => handlers.reject(item) } : null,
    approver && item.status === "approved" ? { key: "register", label: "Register to a month", icon: ClipboardCheck, onSelect: () => handlers.register(item) } : null,
    approver && item.status === "registered" && item.paymentStatus !== "paid" ? { key: "paid", label: "Mark as paid", icon: Wallet, onSelect: () => handlers.confirm("paid", item) } : null,
    canEdit ? { key: "edit", label: "Edit claim", icon: Pencil, onSelect: () => handlers.edit(item) } : null,
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete claim", icon: Trash2, tone: "muted", onSelect: () => handlers.confirm("delete", item) } : null,
  ].filter(Boolean);
}

export function expenseActionCopy(kind, item) {
  const lead = item ? `${item.title}: ${money(item.amount, item.currency)} for ${item.staffName || "unnamed"}.` : "";
  switch (kind) {
    case "approve":
      return { title: "Approve this expense claim?", confirm: "Approve", icon: CheckCircle2, tone: "info", lead, details: ["Its status becomes Approved and you are recorded as the approver.", "Next it can be registered to a month for payment."], done: "Claim approved." };
    case "paid":
      return { title: "Mark this claim as paid?", confirm: "Mark as paid", icon: Wallet, tone: "info", lead, details: [`It was registered to ${monthLabel(item?.registeredMonth) || "a month"}.`, "Its status and payment status become Paid. It can no longer be edited or deleted."], done: "Claim marked as paid." };
    case "delete":
      return { title: "Delete this expense claim?", confirm: "Delete claim", icon: Trash2, tone: "bad", danger: true, lead, details: ["The claim is deleted and can't be restored.", "Registered and paid claims can't be deleted."], done: "Claim deleted." };
    default:
      return { title: "", confirm: "", details: [], done: "", icon: Ban };
  }
}
