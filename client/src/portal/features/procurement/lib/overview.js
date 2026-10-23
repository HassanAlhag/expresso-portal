// Procurement overview data (PUI-4). Request figures come from the stats
// endpoint (whole-table counts, scoped to the user's own company for client
// users). Staff-only figures load only with the permission they need; each
// source settles on its own and a failed one is reported, never shown as zero.
import { getProcurementStats, listRfqs, listVendorApplications } from "../api";

const total = (r) => Number(r?.total ?? 0);

export async function loadProcurementOverview(access) {
  const calls = { stats: () => getProcurementStats() };
  if (access.isInternal && access.can("procurement.approve")) {
    calls.applications = () => listVendorApplications({ status: "pending", limit: 1, page: 1 }).then(total);
    calls.drafts = () => listRfqs({ status: "draft", limit: 1, page: 1 }).then(total);
  }
  if (access.isInternal) calls.published = () => listRfqs({ status: "published", limit: 1, page: 1 }).then(total);
  const keys = Object.keys(calls);
  const settled = await Promise.allSettled(keys.map((k) => calls[k]()));
  return Object.fromEntries(keys.map((k, i) => [k, settled[i].status === "fulfilled" ? { ok: true, data: settled[i].value } : { ok: false }]));
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function deriveProcurementOverview(data) {
  const s = data.stats?.ok ? data.stats.data : null;
  const t = s?.totals || {};
  const by = s?.byStatus || {};
  const metrics = s
    ? [
        { key: "waiting", label: "Waiting on us", value: t.pending || 0, note: "New, assessing or quoted", noteTone: t.pending ? "warn" : undefined, to: "/portal/procurement/requests" },
        { key: "progress", label: "In progress", value: t.inProgress || 0, note: "Approved or ordered" },
        { key: "delivered", label: "Delivered", value: t.delivered || 0, note: `${s.total || 0} requests in all, ${t.cancelled || 0} cancelled` },
        { key: "urgent", label: "Urgent or high", value: (t.urgent || 0) + (t.high || 0), note: "Priority, any status" },
      ]
    : [];

  const attention = [];
  if (by.new) attention.push({ key: "new", tone: "warn", kind: "request", title: `${plural(by.new, "new request")} to assess`, sub: "Not picked up yet", to: "/portal/procurement/requests", actionLabel: "Open requests" });
  if (data.applications?.ok && data.applications.data) attention.push({ key: "apps", tone: "warn", kind: "vendor", title: `${plural(data.applications.data, "vendor application")} waiting for review`, sub: "Approving one creates the vendor and emails an invitation", to: "/portal/procurement/vendor-applications", actionLabel: "Review" });
  if (data.drafts?.ok && data.drafts.data) attention.push({ key: "drafts", tone: "info", kind: "rfq", title: `${plural(data.drafts.data, "draft RFQ")} not published`, sub: "Vendors can't see an RFQ until it is published", to: "/portal/procurement/rfqs", actionLabel: "Open RFQs" });

  return {
    stats: s,
    metrics,
    attention,
    published: data.published?.ok ? data.published.data : null,
    failed: Object.entries(data).filter(([, v]) => !v.ok).map(([k]) => k),
  };
}
