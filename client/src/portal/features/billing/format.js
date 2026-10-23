// Billing display helpers (PUI-4). Labels and tones only; the invoice model,
// statuses and R3 numbering are unchanged.

export const INVOICE_STATUSES = ["draft", "sent", "overdue", "paid", "void"];
export const INVOICE_STATUS_LABEL = { draft: "Draft", sent: "Sent", overdue: "Overdue", paid: "Paid", void: "Void" };
export const INVOICE_STATUS_TONE = { draft: "outline", sent: "info", overdue: "bad", paid: "ok", void: "idle" };

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];
export const paymentMethodLabel = (m) => PAYMENT_METHODS.find((x) => x.value === m)?.label || "Other";

export function money(amount, currency = "AED", digits = 2) {
  if (amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount))) return "—";
  return `${currency || "AED"} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function compactMoney(amount, currency = "AED") {
  const v = Number(amount || 0);
  let s;
  if (Math.abs(v) >= 1_000_000) s = `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  else if (Math.abs(v) >= 1_000) s = `${(v / 1_000).toFixed(v >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  else s = String(Math.round(v));
  return `${currency || "AED"} ${s}`;
}

export function date(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Days past due for an unpaid, issued invoice (real due date only). */
export function overdueDays(inv, now = new Date()) {
  if (!inv?.dueDate || !["sent", "overdue"].includes(inv.status)) return 0;
  const due = new Date(inv.dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((today - new Date(due.getFullYear(), due.getMonth(), due.getDate())) / 86400000);
  return days > 0 ? days : 0;
}

/** Totals exactly as the API computes them (discount is a flat amount). */
export function computeTotals(items = [], discount = 0, taxRate = 0) {
  const subtotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0), 0);
  const discountAmt = Math.max(0, Number(discount || 0));
  const taxable = Math.max(0, subtotal - discountAmt);
  const tax = taxable * (Number(taxRate || 0) / 100);
  return { subtotal, discount: discountAmt, tax, total: taxable + tax };
}

export const idOf = (v) => (v && typeof v === "object" ? v._id : v || "");
