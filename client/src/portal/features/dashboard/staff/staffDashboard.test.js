// PUI-2 — staff dashboard composed from the user's real permissions.
// act() flushes the mocked API calls the dashboard starts; the metric count
// and panel lookups read the DOM directly.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => jest.fn(),
      useLocation: () => ({ pathname: "/portal" }),
      Navigate: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../../jobs/api", () => ({ listJobs: jest.fn() }));
jest.mock("../../tickets/api", () => ({ listTickets: jest.fn(), getTicketStats: jest.fn() }));
jest.mock("../../customers/api", () => ({ listCustomers: jest.fn() }));
jest.mock("../../projects/api", () => ({ listProjects: jest.fn(), getProjectStats: jest.fn() }));
jest.mock("../../crm/api", () => ({ listDeals: jest.fn() }));
jest.mock("../../procurement/api", () => ({ getProcurementStats: jest.fn() }));
jest.mock("../../billing/api", () => ({ getBillingStats: jest.fn() }));
jest.mock("../../hr/api", () => ({ getExpenseStats: jest.fn(), getLeaveStats: jest.fn() }));

const jobs = require("../../jobs/api");
const tickets = require("../../tickets/api");
const customers = require("../../customers/api");
const projects = require("../../projects/api");
const crm = require("../../crm/api");
const procurement = require("../../procurement/api");
const billing = require("../../billing/api");
const hr = require("../../hr/api");
const StaffDashboard = require("./StaffDashboard").default;
const { deriveStaff, plannedSources } = require("./staffData");
const { makeAccess } = require("../../../shared/hooks/useAccess");

const FINANCE = [billing.getBillingStats];
const PROCUREMENT = [procurement.getProcurementStats];
const HR = [hr.getExpenseStats, hr.getLeaveStats];
const CRM = [crm.listDeals];

function signIn(role, permissions) {
  localStorage.setItem("portal_user", JSON.stringify({ fullName: "Layla Haddad", role, permissions, isInternal: true }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

function seed() {
  jobs.listJobs.mockResolvedValue({
    items: [
      { _id: "j1", title: "Homepage hero", status: "client_review", createdAt: "2026-10-20T08:00:00Z" },
      { _id: "j2", title: "Brand film edit", status: "editing", createdAt: "2026-10-19T08:00:00Z" },
    ],
  });
  tickets.getTicketStats.mockResolvedValue({ byStatus: { open: 2, in_progress: 1, closed: 9 }, overdue: 1 });
  tickets.listTickets.mockResolvedValue({ items: [{ _id: "t1", title: "Checkout shows wrong VAT", status: "open", createdAt: "2026-10-21T07:00:00Z" }] });
  customers.listCustomers.mockResolvedValue({ items: [{ _id: "c1", companyName: "Acme Company", isActive: true, createdAt: "2026-10-01T07:00:00Z" }] });
  projects.getProjectStats.mockResolvedValue({ total: 9, byStatus: { active: 5, in_review: 1, on_hold: 1 } });
  projects.listProjects.mockResolvedValue({ items: [{ _id: "p1", name: "E-commerce relaunch", status: "active", endDate: "2099-12-18", customerId: { companyName: "Acme Company" } }] });
  crm.listDeals.mockResolvedValue({ items: [{ _id: "d1", title: "Store locator", value: 145000, stage: "proposal" }, { _id: "d2", title: "Old", value: 5000, stage: "won" }] });
  billing.getBillingStats.mockResolvedValue({ totalRevenue: 412000, totalPaid: 300000, totalOutstanding: 287000, totalOverdue: 121500, totalInvoices: 12, byStatus: { overdue: { count: 3, amount: 121500 } } });
  procurement.getProcurementStats.mockResolvedValue({ totals: { pending: 4, inProgress: 2, urgent: 1, high: 2 } });
  hr.getExpenseStats.mockResolvedValue({ totals: { pending: 2 } });
  hr.getLeaveStats.mockResolvedValue({ totals: { submitted: 3 } });
}

async function renderDashboard() {
  let utils;
  await act(async () => {
    utils = render(<StaffDashboard />);
  });
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  seed();
});

test("a limited staff role only requests and shows the areas it can access", async () => {
  signIn("project_coordinator", ["projects.read", "jobs.read", "tickets.read"]);
  await renderDashboard();
  for (const fn of [...FINANCE, ...PROCUREMENT, ...HR, ...CRM, customers.listCustomers]) expect(fn).not.toHaveBeenCalled();
  expect(projects.getProjectStats).toHaveBeenCalled();
  expect(jobs.listJobs).toHaveBeenCalled();
  expect(tickets.getTicketStats).toHaveBeenCalled();

  const summary = screen.getByRole("region", { name: "Business summary" });
  const labels = within(summary).getAllByText(/./, { selector: ".px-m-label" }).map((n) => n.textContent);
  expect(labels).toEqual(["Active projects", "Open tickets", "Jobs in production"]);
  expect(screen.queryByRole("heading", { name: "Cash" })).toBe(null);
  expect(screen.queryByRole("heading", { name: "Pipeline" })).toBe(null);
  expect(screen.queryByRole("heading", { name: "Operations" })).toBe(null);
  expect(document.body.textContent).not.toMatch(/AED|receivable|invoice/i);
  // Useful content from what they can see.
  expect(screen.getByRole("heading", { name: "Delivery" })).toBeTruthy();
  expect(screen.getByText("1 support ticket is overdue")).toBeTruthy();
  expect(screen.getByText("1 job is waiting for review")).toBeTruthy();
});

test("full access shows finance, sales, procurement and people, from real figures only", async () => {
  signIn("super_admin", []);
  await renderDashboard();
  for (const fn of [...FINANCE, ...PROCUREMENT, ...HR, ...CRM]) expect(fn).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("heading", { name: "Cash" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Pipeline" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Operations" })).toBeTruthy();
  const summary = screen.getByRole("region", { name: "Business summary" });
  expect(summary.querySelectorAll(".px-metric")).toHaveLength(4); // never a wall of cards
  expect(within(summary).getByText("287k")).toBeTruthy();
  expect(within(summary).getByText("AED 122k overdue")).toBeTruthy();
  expect(screen.getByText("3 invoices are overdue")).toBeTruthy();
  expect(screen.getByText("4 procurement requests need a response")).toBeTruthy();
  expect(screen.getByText("2 expense claims are pending")).toBeTruthy();
});

test("an admin role with limited permissions is not treated as unrestricted", async () => {
  signIn("admin", ["projects.read", "tickets.read"]);
  await renderDashboard();
  for (const fn of [...FINANCE, ...PROCUREMENT, ...HR, ...CRM, customers.listCustomers, jobs.listJobs]) expect(fn).not.toHaveBeenCalled();
  expect(projects.getProjectStats).toHaveBeenCalled();
  expect(screen.queryByRole("heading", { name: "Cash" })).toBe(null);
  const links = within(screen.getByRole("heading", { name: "Go to" }).closest("section")).getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(links).not.toContain("/portal/billing");
  expect(links).not.toContain("/portal/users");
});

test("quick links and actions only lead to pages the user can open", async () => {
  signIn("project_coordinator", ["projects.read", "jobs.read", "tickets.read"]);
  await renderDashboard();
  const goTo = screen.getByRole("heading", { name: "Go to" }).closest("section");
  const links = within(goTo).getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(links).toEqual(expect.arrayContaining(["/portal/projects", "/portal/productions", "/portal/tickets"]));
  expect(links).not.toEqual(expect.arrayContaining(["/portal/billing"]));
  expect(links).not.toContain("/portal/users");
  expect(links).not.toContain("/portal/crm/deals");
  // Briefing jump links come from the attention items the user can act on.
  expect(screen.getByRole("link", { name: /overdue ticket/ }).getAttribute("href")).toBe("/portal/tickets");
});

test("mobile condensation is layout only: every row stays in the page, with its full-list link", async () => {
  signIn("super_admin", []);
  tickets.listTickets.mockResolvedValue({
    items: [1, 2, 3, 4, 5].map((n) => ({ _id: `t${n}`, title: `Ticket ${n}`, status: "open", createdAt: `2026-10-1${n}T07:00:00Z` })),
  });
  await renderDashboard();
  const ticketsPanel = screen.getByRole("heading", { name: "Recent tickets" }).closest("section");
  const list = within(ticketsPanel).getByRole("list");
  expect(list.className).toMatch(/px-cap-m3/); // phone widths show 3 rows
  expect(within(list).getAllByRole("listitem")).toHaveLength(5); // desktop and assistive tech keep all 5
  expect(within(ticketsPanel).getByRole("link", { name: "All tickets" })).toBeTruthy();
  // Priority sections are never condensed.
  const attention = screen.getByRole("heading", { name: "Needs your attention" }).closest("section");
  expect(attention.querySelector(".px-cap-m2, .px-cap-m3")).toBe(null);
});

test("loading state, then content", async () => {
  signIn("super_admin", []);
  let resolve;
  billing.getBillingStats.mockReturnValue(new Promise((r) => (resolve = r)));
  render(<StaffDashboard />);
  expect(screen.getByText(/Loading your workspace/)).toBeTruthy();
  expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  await act(async () => resolve({ totalOutstanding: 0, totalOverdue: 0, totalRevenue: 0, totalPaid: 0, byStatus: {} }));
  expect(screen.queryByText(/Loading your workspace/)).toBe(null);
});

test("everything failing shows a retry; partial failure names what is missing", async () => {
  signIn("project_coordinator", ["projects.read", "tickets.read"]);
  for (const fn of [projects.getProjectStats, projects.listProjects, tickets.getTicketStats, tickets.listTickets]) fn.mockRejectedValue(new Error("x"));
  await renderDashboard();
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toMatch(/Your dashboard didn't load/);
  seed();
  tickets.getTicketStats.mockRejectedValue(new Error("x"));
  tickets.listTickets.mockRejectedValue(new Error("x"));
  await act(async () => {
    fireEvent.click(within(alert).getByRole("button", { name: /Try again/ }));
  });
  expect(screen.getByText("Some sections didn't load")).toBeTruthy();
  expect(screen.getByText(/Support is missing from this view/)).toBeTruthy();
});

test("a role with none of the dashboard areas gets an explanation, and no requests", async () => {
  signIn("receptionist", ["profile.read"]);
  await renderDashboard();
  expect(screen.getByText("No dashboard sections for your role")).toBeTruthy();
  for (const fn of [jobs.listJobs, tickets.listTickets, projects.getProjectStats, ...FINANCE, ...CRM]) expect(fn).not.toHaveBeenCalled();
});

test("nothing needing attention is said plainly", () => {
  const access = makeAccess({ role: "super_admin" });
  const view = deriveStaff({ projectStats: { byStatus: { active: 2 } }, jobs: { items: [] } }, access);
  expect(view.attention).toEqual([]);
  expect(view.metrics.map((m) => m.label)).toEqual(["Active projects", "Jobs in production"]);
  expect(plannedSources(makeAccess({ role: "x", permissions: ["billing.read"] })).map((s) => s.key)).toEqual(["billing"]);
});

test("job links open the Jobs list filtered to the jobs counted, video included (PI tail)", () => {
  const access = makeAccess({ role: "super_admin" });
  const view = deriveStaff(
    { jobs: { items: [{ _id: "j1", title: "Reel cut", status: "client_review", workflowType: "video" }, { _id: "j2", title: "Banner", status: "editing" }] } },
    access
  );
  const review = view.attention.find((a) => a.key === "jobs-review");
  expect(review.to).toBe("/portal/jobs?status=internal_review,client_review&workflow=all");
  expect(view.metrics.find((m) => m.key === "jobs").to).toBe("/portal/jobs?status=designing,shooting,editing&workflow=all");
  // Without access to Jobs there is no link at all.
  const noJobs = deriveStaff({ jobs: { items: [{ _id: "j1", status: "internal_review" }] } }, makeAccess({ role: "x", permissions: ["projects.read"] }));
  expect(noJobs.attention.find((a) => a.key === "jobs-review").to).toBeUndefined();
});
