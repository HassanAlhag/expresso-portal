// Client overview data (PUI-5). Every source is scoped to the user's company
// by the API, loads only with the permission it needs, and settles on its
// own: a source that fails is reported, never shown as zero. Counts come
// from stats endpoints or list totals, never from a loaded page.
import { getTicketStats, listTickets } from "../../tickets/api";
import { listProjects } from "../../projects/api";
import { getBillingStats } from "../../billing/api";
import { listFiles } from "../../files/api";
import { listJobs } from "../../jobs/api";
import { countStatuses } from "../../tickets/format";

const items = (r) => (Array.isArray(r?.items) ? r.items : []);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function loadClientOverview(access) {
  const calls = {};
  if (access.can("tickets.read")) {
    calls.ticketStats = () => getTicketStats();
    calls.waiting = () => listTickets({ status: "waiting_client", sort: "-lastActivityAt", limit: 5, page: 1 });
    calls.recentTickets = () => listTickets({ sort: "-lastActivityAt", limit: 5, page: 1 });
  }
  if (access.can("projects.read")) calls.projects = () => listProjects({ status: "active", sort: "-updatedAt", limit: 5, page: 1 });
  if (access.can("billing.read")) calls.billing = () => getBillingStats();
  if (access.can("files.read")) calls.files = () => listFiles({ sort: "-createdAt", limit: 4, page: 1 });
  if (access.can("jobs.read")) calls.reviews = () => listJobs({ status: "client_review", limit: 1, page: 1 });
  const keys = Object.keys(calls);
  const settled = await Promise.allSettled(keys.map((k) => calls[k]()));
  return Object.fromEntries(keys.map((k, i) => [k, settled[i].status === "fulfilled" ? { ok: true, data: settled[i].value } : { ok: false }]));
}

export function deriveClientOverview(data) {
  const ok = (k) => Boolean(data[k]?.ok);
  const unavailable = { value: "—", note: "Didn't load", noteTone: "bad" };
  const by = data.ticketStats?.data?.byStatus || {};
  const bill = data.billing?.data?.byStatus || {};
  const unpaid = Number(bill.sent?.count || 0) + Number(bill.overdue?.count || 0);
  const overdue = Number(bill.overdue?.count || 0);

  const metrics = [];
  if (data.projects) metrics.push(ok("projects") ? { key: "projects", label: "Active projects", value: Number(data.projects.data?.total || 0), to: "/portal/projects" } : { key: "projects", label: "Active projects", ...unavailable });
  if (data.ticketStats)
    metrics.push(
      ok("ticketStats")
        ? { key: "tickets", label: "Open support requests", value: countStatuses(by), note: by.waiting_client ? `${by.waiting_client} waiting for you` : "None waiting for you", noteTone: by.waiting_client ? "warn" : undefined, to: "/portal/tickets" }
        : { key: "tickets", label: "Open support requests", ...unavailable }
    );
  if (data.billing)
    metrics.push(
      ok("billing")
        ? { key: "invoices", label: "Unpaid invoices", value: unpaid, note: overdue ? `${overdue} overdue` : "None overdue", noteTone: overdue ? "bad" : undefined, to: "/portal/billing" }
        : { key: "invoices", label: "Unpaid invoices", ...unavailable }
    );
  if (data.files) metrics.push(ok("files") ? { key: "files", label: "Shared documents", value: Number(data.files.data?.total || 0), note: "Files shared with you", to: "/portal/files" } : { key: "files", label: "Shared documents", ...unavailable });

  const attention = [];
  items(data.waiting?.data).forEach((t) =>
    attention.push({ key: `t-${t._id}`, kind: "ticket", tone: "warn", title: t.title || "Support request", sub: `${t.ref ? `${t.ref}, ` : ""}waiting for your reply`, to: `/portal/tickets/${t._id}`, actionLabel: "Reply" })
  );
  if (ok("billing") && overdue) attention.push({ key: "overdue", kind: "invoice", tone: "bad", title: `${plural(overdue, "invoice")} overdue`, sub: "Past the due date and not fully paid", to: "/portal/billing", actionLabel: "View invoices" });
  const reviews = Number(data.reviews?.data?.total || 0);
  if (ok("reviews") && reviews) attention.push({ key: "reviews", kind: "review", tone: "info", title: `${plural(reviews, "item")} waiting for your approval`, sub: "Content Expresso has sent for your review", to: "/portal/content-calendar", actionLabel: "Review" });

  return {
    metrics,
    attention,
    projects: items(data.projects?.data),
    recentTickets: items(data.recentTickets?.data),
    files: items(data.files?.data),
    failed: Object.entries(data).filter(([, v]) => !v.ok).map(([k]) => k),
    waitingTotal: Number(data.waiting?.data?.total || 0),
  };
}
