// Staff dashboard data (PUI-2).
//
// Each source is requested only when the signed-in user holds the permission
// its endpoint enforces, so a user is never sent data their role excludes and
// the dashboard is composed from the areas they can access. Every figure is
// derived from what these existing endpoints return; nothing is estimated.
import { listJobs } from "../../jobs/api";
import { getTicketStats, listTickets } from "../../tickets/api";
import { listCustomers } from "../../customers/api";
import { listProjects, getProjectStats } from "../../projects/api";
import { listDeals } from "../../crm/api";
import { getProcurementStats } from "../../procurement/api";
import { getBillingStats } from "../../billing/api";
import { getExpenseStats, getLeaveStats } from "../../hr/api";

export const SOURCES = [
  { key: "billing", perm: "billing.read", label: "Billing", load: () => getBillingStats() },
  { key: "projectStats", perm: "projects.read", label: "Projects", load: () => getProjectStats() },
  { key: "projects", perm: "projects.read", label: "Projects", load: () => listProjects({ status: "active", sort: "-updatedAt", limit: 5, page: 1 }) },
  { key: "jobs", perm: "jobs.read", label: "Jobs", load: () => listJobs({ limit: 100, page: 1 }) },
  { key: "ticketStats", perm: "tickets.read", label: "Support", load: () => getTicketStats() },
  { key: "tickets", perm: "tickets.read", label: "Support", load: () => listTickets({ limit: 50, page: 1 }) },
  { key: "deals", perm: "crm.read", label: "CRM", load: () => listDeals({ limit: 100, page: 1 }) },
  { key: "customers", perm: "customers.read", label: "Clients", load: () => listCustomers({ limit: 6, page: 1, sort: "-createdAt" }) },
  { key: "procurement", perm: "procurement.read", label: "Procurement", load: () => getProcurementStats() },
  { key: "expenses", perm: "hr.expenses.read", label: "Expenses", load: () => getExpenseStats() },
  { key: "leaves", perm: "hr.leaves.read", label: "Leave", load: () => getLeaveStats() },
];

export function plannedSources(access) {
  return SOURCES.filter((s) => access.can(s.perm));
}

/** Loads only the permitted sources. Returns { data, failed, requested }. */
export async function loadStaffDashboard(access) {
  const planned = plannedSources(access);
  const results = await Promise.allSettled(planned.map((s) => s.load()));
  const data = {};
  const failed = [];
  results.forEach((r, i) => {
    const { key, label } = planned[i];
    if (r.status === "fulfilled" && r.value) data[key] = r.value;
    else failed.push({ key, label });
  });
  return { data, failed, requested: planned.map((s) => s.key) };
}

/* ── derivation ─────────────────────────────────────────────────────── */

export const JOB_STAGES = [
  { key: "planning", label: "Planning", color: "var(--px-line-strong)", statuses: ["brief", "content_ready", "script", "pre_production"] },
  { key: "production", label: "In production", color: "var(--px-lotus)", statuses: ["designing", "shooting", "editing"] },
  { key: "review", label: "In review", color: "var(--px-warn)", statuses: ["internal_review", "client_review"] },
  { key: "ready", label: "Approved or scheduled", color: "var(--px-lotus-600)", statuses: ["approved", "scheduled"] },
  { key: "delivered", label: "Delivered", color: "var(--px-ok)", statuses: ["published", "delivered"] },
];
const REVIEW = new Set(["internal_review", "client_review"]);
const CLOSED_TICKET = new Set(["closed", "resolved", "done"]);

export const items = (res) => (Array.isArray(res?.items) ? res.items : []);

export function compactMoney(n) {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(v >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(Math.round(v));
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function deriveStaff(data, access) {
  const has = (k) => Object.prototype.hasOwnProperty.call(data, k);
  const jobs = items(data.jobs);
  const tickets = items(data.tickets);
  const deals = items(data.deals);
  const reviewJobs = jobs.filter((j) => REVIEW.has(j.status));
  const openDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "won");
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.value || 0), 0);
  const ticketBy = data.ticketStats?.byStatus || {};
  const openTicketCount = has("ticketStats")
    ? Object.entries(ticketBy).reduce((s, [k, v]) => (CLOSED_TICKET.has(String(k).toLowerCase()) ? s : s + Number(v || 0)), 0)
    : tickets.filter((t) => !CLOSED_TICKET.has(String(t.status || "").toLowerCase())).length;
  const overdueTickets = Number(data.ticketStats?.overdue || 0);
  const pBy = data.projectStats?.byStatus || {};
  const billing = data.billing || null;
  const overdueInvoices = billing?.byStatus?.overdue || { count: 0, amount: 0 };
  const proc = data.procurement?.totals || null;
  const pendingExpenses = Number(data.expenses?.totals?.pending || 0);
  const submittedLeaves = Number(data.leaves?.totals?.submitted || 0);
  const go = (path) => (access.canOpen(path) ? path : undefined);

  // 1. What needs my attention? Real counts only, most severe first.
  const attention = [];
  if (billing && overdueInvoices.count > 0) {
    attention.push({
      key: "invoices",
      tone: "bad",
      kind: "invoice",
      short: plural(overdueInvoices.count, "overdue invoice"),
      title: `${plural(overdueInvoices.count, "invoice is", "invoices are")} overdue`,
      sub: `AED ${Number(billing.totalOverdue || 0).toLocaleString("en-US")} still to collect on overdue invoices`,
      to: go("/portal/billing"),
      actionLabel: "Review",
    });
  }
  if (overdueTickets > 0) {
    attention.push({
      key: "tickets",
      tone: "bad",
      kind: "ticket",
      short: plural(overdueTickets, "overdue ticket"),
      title: `${plural(overdueTickets, "support ticket is", "support tickets are")} overdue`,
      sub: `${plural(openTicketCount, "ticket")} open in total`,
      to: go("/portal/tickets"),
      actionLabel: "Open tickets",
    });
  }
  if (reviewJobs.length > 0) {
    const names = reviewJobs.slice(0, 2).map((j) => j.title).filter(Boolean);
    attention.push({
      key: "jobs-review",
      tone: "warn",
      kind: "job",
      short: plural(reviewJobs.length, "job") + " in review",
      title: `${plural(reviewJobs.length, "job is", "jobs are")} waiting for review`,
      sub: names.length ? `${names.join(", ")}${reviewJobs.length > names.length ? ` and ${reviewJobs.length - names.length} more` : ""}` : "Internal or client review",
      to: go("/portal/productions"),
      actionLabel: "Review",
    });
  }
  if (Number(pBy.in_review || 0) > 0) {
    attention.push({
      key: "projects-review",
      tone: "warn",
      kind: "project",
      short: plural(pBy.in_review, "project") + " in review",
      title: `${plural(pBy.in_review, "project is", "projects are")} in review`,
      sub: "Waiting for sign-off",
      to: go("/portal/projects"),
      actionLabel: "Open projects",
    });
  }
  if (proc && proc.pending > 0) {
    attention.push({
      key: "procurement",
      tone: "warn",
      kind: "procurement",
      short: plural(proc.pending, "procurement request"),
      title: `${plural(proc.pending, "procurement request needs", "procurement requests need")} a response`,
      sub: "New, being assessed or quoted",
      to: go("/portal/procurement"),
      actionLabel: "Open",
    });
  }
  if (pendingExpenses > 0) {
    attention.push({
      key: "expenses",
      tone: "info",
      kind: "people",
      short: plural(pendingExpenses, "expense claim"),
      title: `${plural(pendingExpenses, "expense claim is", "expense claims are")} pending`,
      sub: "Waiting for approval",
      to: go("/portal/hr/expenses"),
      actionLabel: "Review",
    });
  }
  if (submittedLeaves > 0) {
    attention.push({
      key: "leaves",
      tone: "info",
      kind: "people",
      short: plural(submittedLeaves, "leave request"),
      title: `${plural(submittedLeaves, "leave request is", "leave requests are")} waiting`,
      sub: "Submitted and not yet decided",
      to: go("/portal/hr/leaves"),
      actionLabel: "Review",
    });
  }

  // 2. How is the business performing? At most four figures.
  const metrics = [
    billing && {
      key: "receivables",
      label: "Outstanding receivables",
      prefix: "AED",
      value: compactMoney(billing.totalOutstanding),
      note: Number(billing.totalOverdue || 0) > 0 ? `AED ${compactMoney(billing.totalOverdue)} overdue` : "Nothing overdue",
      noteTone: Number(billing.totalOverdue || 0) > 0 ? "bad" : "ok",
      to: go("/portal/billing"),
    },
    has("projectStats") && {
      key: "projects",
      label: "Active projects",
      value: Number(pBy.active || 0),
      note: `${pBy.in_review || 0} in review, ${pBy.on_hold || 0} on hold`,
      to: go("/portal/projects"),
    },
    has("deals") && {
      key: "pipeline",
      label: "Open pipeline",
      prefix: "AED",
      value: compactMoney(pipelineValue),
      note: `${plural(openDeals.length, "open deal")}, ${wonDeals.length} won`,
      to: go("/portal/crm/deals"),
    },
    (has("ticketStats") || has("tickets")) && {
      key: "tickets",
      label: "Open tickets",
      value: openTicketCount,
      note: overdueTickets ? `${overdueTickets} overdue` : "None overdue",
      noteTone: overdueTickets ? "bad" : "ok",
      to: go("/portal/tickets"),
    },
    has("jobs") && {
      key: "jobs",
      label: "Jobs in production",
      value: jobs.filter((j) => JOB_STAGES[1].statuses.includes(j.status)).length,
      note: `${reviewJobs.length} waiting for review`,
      to: go("/portal/productions"),
    },
  ]
    .filter(Boolean)
    .slice(0, 4);

  // Job pipeline across the loaded jobs.
  const stageCounts = JOB_STAGES.map((s) => ({ ...s, count: jobs.filter((j) => s.statuses.includes(j.status)).length }));

  // 3. What changed? Newest records across the areas the user can see.
  const recent = [
    ...jobs.map((j) => ({ key: `j-${j._id}`, at: j.createdAt, kind: "job", title: j.title || "Untitled job", verb: "Job created", to: go(`/portal/jobs/${j._id}`) })),
    ...tickets.map((t) => ({ key: `t-${t._id}`, at: t.createdAt, kind: "ticket", title: t.title || t.subject || "Ticket", verb: "Ticket opened", to: go(`/portal/tickets/${t._id}`) })),
    ...items(data.customers).map((c) => ({ key: `c-${c._id}`, at: c.createdAt, kind: "client", title: c.companyName || "Client", verb: "Client added", to: go(`/portal/customers/${c._id}`) })),
    ...deals.map((d) => ({ key: `d-${d._id}`, at: d.createdAt, kind: "deal", title: d.title || "Deal", verb: "Deal created", to: go(`/portal/crm/deals/${d._id}`) })),
  ]
    .filter((r) => r.at && !Number.isNaN(new Date(r.at).getTime()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  return {
    attention,
    metrics,
    stageCounts,
    jobsTotal: jobs.length,
    reviewJobs,
    tickets: tickets.slice(0, 5),
    openTicketCount,
    activeProjects: items(data.projects),
    billing,
    openDeals: [...openDeals].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)).slice(0, 4),
    openDealCount: openDeals.length,
    pipelineValue,
    customers: items(data.customers).slice(0, 5),
    procurement: proc,
    pendingExpenses,
    submittedLeaves,
    has,
    recent,
  };
}

/** Shortcuts the user can actually open, in a stable order. */
export const SHORTCUTS = [
  { key: "projects", label: "Projects", sub: "Delivery and milestones", to: "/portal/projects" },
  { key: "clients", label: "Clients", sub: "Accounts and contacts", to: "/portal/customers" },
  { key: "productions", label: "Production", sub: "Jobs and approvals", to: "/portal/productions" },
  { key: "billing", label: "Billing", sub: "Invoices and payments", to: "/portal/billing" },
  { key: "crm", label: "CRM deals", sub: "Pipeline and conversions", to: "/portal/crm/deals" },
  { key: "procurement", label: "Procurement", sub: "Requests and vendors", to: "/portal/procurement" },
  { key: "tickets", label: "Support", sub: "Tickets and requests", to: "/portal/tickets" },
  { key: "files", label: "Files", sub: "Media library", to: "/portal/files" },
  { key: "reports", label: "Reports", sub: "Management reporting", to: "/portal/reports" },
  { key: "users", label: "Users and roles", sub: "Access and invitations", to: "/portal/users" },
];
