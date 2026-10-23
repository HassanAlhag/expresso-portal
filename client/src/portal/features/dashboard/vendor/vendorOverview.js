// Vendor overview data (PUI-5). Both lists come from the RFQ API, which
// applies the R2 vendor rule (approved categories; published RFQs, or
// later ones the vendor quoted on; own quotation status only). Counts are
// list totals; anything worked out from loaded rows says when the set was
// cut short.
import { listRfqs } from "../../procurement/api";

const LIMIT = 100; // the RFQ list maximum
const items = (r) => (Array.isArray(r?.items) ? r.items : []);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function loadVendorOverview() {
  const [open, quoted] = await Promise.allSettled([listRfqs({ limit: LIMIT, page: 1 }), listRfqs({ quoted: "true", limit: LIMIT, page: 1 })]);
  const wrap = (r) => (r.status === "fulfilled" ? { ok: true, data: r.value } : { ok: false });
  return { open: wrap(open), quoted: wrap(quoted) };
}

const byDeadline = (a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);

export function deriveVendorOverview(data, now = new Date()) {
  const unavailable = { value: "—", note: "Didn't load", noteTone: "bad" };
  const openRows = items(data.open.data);
  const openTotal = Number(data.open.data?.total ?? openRows.length);
  const openComplete = openTotal <= openRows.length;
  const notQuoted = openRows.filter((r) => !r.myQuotationStatus);
  const quotedRows = items(data.quoted.data);
  const quotedTotal = Number(data.quoted.data?.total ?? quotedRows.length);
  const quotedComplete = quotedTotal <= quotedRows.length;
  const accepted = quotedRows.filter((r) => r.myQuotationStatus === "accepted").length;
  const resubmittable = quotedRows.filter((r) => r.myQuotationStatus === "rejected" && r.status === "published");

  const metrics = [
    data.open.ok ? { key: "open", label: "Open RFQs", value: openTotal, note: "In your approved categories", to: "/portal/procurement/rfqs" } : { key: "open", label: "Open RFQs", ...unavailable },
    data.open.ok ? { key: "todo", label: "Not quoted yet", value: notQuoted.length, note: openComplete ? "Open and waiting for your quote" : "Among the 100 newest open RFQs", noteTone: notQuoted.length ? "warn" : undefined } : { key: "todo", label: "Not quoted yet", ...unavailable },
    data.quoted.ok ? { key: "quoted", label: "Your quotations", value: quotedTotal, note: "Open, closed or awarded", to: "/portal/procurement/rfqs?view=quoted" } : { key: "quoted", label: "Your quotations", ...unavailable },
    data.quoted.ok ? { key: "accepted", label: "Accepted", value: accepted, note: quotedComplete ? "Quotations Expresso accepted" : "Among your 100 newest" } : { key: "accepted", label: "Accepted", ...unavailable },
  ];

  const attention = [];
  [...notQuoted].sort(byDeadline).slice(0, 5).forEach((r) => {
    const days = r.deadline ? Math.ceil((new Date(r.deadline).getTime() - now.getTime()) / 86400000) : null;
    attention.push({
      key: `q-${r._id}`,
      kind: "rfq",
      tone: days !== null && days <= 3 ? "warn" : "info",
      title: r.title || r.rfqNumber || "RFQ",
      sub: [r.rfqNumber, days === null ? "No deadline" : days < 0 ? "Deadline passed" : days === 0 ? "Due today" : `Due in ${plural(days, "day")}`].filter(Boolean).join(", "),
      to: `/portal/procurement/rfqs/${r._id}`,
      actionLabel: "Quote",
    });
  });
  resubmittable.slice(0, 3).forEach((r) =>
    attention.push({ key: `r-${r._id}`, kind: "rejected", tone: "bad", title: r.title || r.rfqNumber, sub: "Your quotation wasn't accepted. The RFQ is still open, so you can send a new one.", to: `/portal/procurement/rfqs/${r._id}`, actionLabel: "Open" })
  );

  return { metrics, attention, recentQuoted: quotedRows.slice(0, 6), failed: ["open", "quoted"].filter((k) => !data[k].ok), notQuotedCount: notQuoted.length };
}
