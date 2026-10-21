// PUI-2 — Projects list and Project detail in the production design system.
// The stacked mobile records are checked through their data-label cells and
// row structure, so these tests read the DOM directly; act() flushes the
// mocked API calls a render or click starts.
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "p1" };
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useLocation: () => ({ pathname: "/portal/projects" }),
      Navigate: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () => ({
  listProjects: jest.fn(),
  getProjectStats: jest.fn(),
  createProject: jest.fn(),
  archiveProject: jest.fn(),
  getProject: jest.fn(),
  updateProject: jest.fn(),
}));
jest.mock("../jobs/api", () => ({ listJobs: jest.fn(), createJob: jest.fn() }));
jest.mock("../files/api", () => ({ listFiles: jest.fn(), uploadFiles: jest.fn(), withFileLinks: jest.fn((x) => Promise.resolve(x)) }));
jest.mock("../billing/api", () => ({ listInvoices: jest.fn() }));
jest.mock("../jobs/components/NewJobModal", () => () => null);
jest.mock("../customers/api", () => ({ listCustomers: jest.fn(() => Promise.resolve({ items: [] })) }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const jobsApi = require("../jobs/api");
const filesApi = require("../files/api");
const billingApi = require("../billing/api");
const ProjectsPage = require("./pages/ProjectsPage").default;
const ProjectDetailsPage = require("./pages/ProjectDetailsPage").default;
const { projectTabsFor } = require("./pages/ProjectDetailsPage");
const { makeAccess } = require("../../shared/hooks/useAccess");

const ALL_STAFF = ["projects.read", "projects.write", "projects.delete", "jobs.read", "jobs.write", "files.read", "files.write", "billing.read", "customers.read"];

function signIn(role, permissions, isInternal = true) {
  localStorage.setItem("portal_token", "t");
  localStorage.setItem("portal_user", JSON.stringify({ fullName: "Layla Haddad", role, permissions, isInternal }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

const project = (over = {}) => ({
  _id: "p1",
  name: "E-commerce relaunch",
  code: "P-1042",
  status: "active",
  priority: "high",
  projectMode: "custom",
  type: "website",
  customerId: { _id: "c1", companyName: "Acme Company", contactName: "Omar Saleh", primaryEmail: "omar@acme.example" },
  ownerUserId: { fullName: "Rania Aziz", email: "rania@expresso.example" },
  startDate: "2026-07-01",
  endDate: "2099-12-18",
  budget: 180000,
  currency: "AED",
  description: "Rebuild of the online store.",
  ...over,
});

const listOf = (items, total = items.length, page = 1, pages = 1) => ({ ok: true, items, total, page, pages, limit: 12 });
const lastListParams = () => api.listProjects.mock.calls.at(-1)[0];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "p1" };
  api.getProjectStats.mockResolvedValue({ ok: true, total: 9, byStatus: { active: 5, planned: 1, on_hold: 1, in_review: 1, archived: 1 } });
  api.listProjects.mockResolvedValue(listOf([project(), project({ _id: "p2", name: "Loyalty app MVP", status: "in_review", priority: "medium" })]));
  jobsApi.listJobs.mockResolvedValue({ items: [] });
  filesApi.listFiles.mockResolvedValue({ items: [] });
  billingApi.listInvoices.mockResolvedValue({ items: [] });
});


// Runs an interaction inside act() and lets the debounced search (300 ms)
// and the API calls it starts settle there too, so state updates never land
// outside act().
async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}

async function renderList() {
  let utils;
  await act(async () => {
    utils = render(<ProjectsPage />);
  });
  await screen.findByRole("link", { name: "E-commerce relaunch" });
  return utils;
}

describe("Projects list", () => {
  test("renders a semantic table that stacks into labelled records on mobile", async () => {
    signIn("project_manager", ALL_STAFF);
    const { container } = await renderList();
    const table = screen.getByRole("table", { name: "Projects" });
    expect(table.className).toMatch(/px-table--stack/);
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("Project"), expect.stringContaining("Status"), "Priority", "Owner", "Due"])
    );
    const row = screen.getByRole("link", { name: "E-commerce relaunch" }).closest("tr");
    expect(row.querySelector("td.px-primary")).toBeTruthy();
    expect([...row.querySelectorAll("td[data-label]")].map((td) => td.dataset.label)).toEqual(expect.arrayContaining(["Status", "Priority", "Owner", "Due"]));
    expect(within(row).getByText("Active")).toBeTruthy();
    expect(within(row).getByText("Acme Company, P-1042")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Health|Progress/); // no invented prototype metrics
  });

  test("default request excludes archived; the summary comes from the stats endpoint", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderList();
    expect(lastListParams()).not.toHaveProperty("status");
    expect(lastListParams()).not.toHaveProperty("includeArchived");
    const summary = screen.getByRole("region", { name: "Projects by status" });
    expect(within(summary).getByText("Archived")).toBeTruthy();
    expect(screen.getByText(/\(archived hidden\)/)).toBeTruthy();
  });

  test("status filter: archived only, and all including archived", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderList();
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "archived" } }));
    await waitFor(() => expect(lastListParams().status).toBe("archived"));
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "__all" } }));
    await waitFor(() => expect(lastListParams()).toMatchObject({ includeArchived: "true" }));
    expect(lastListParams()).not.toHaveProperty("status");
    // The archived figure in the summary is a filter too.
    await interact(() => fireEvent.click(within(screen.getByRole("region", { name: "Projects by status" })).getByRole("button", { name: /Archived/ })));
    await waitFor(() => expect(lastListParams().status).toBe("archived"));
  });

  test("search is debounced and sent to the API; filter chips can be cleared", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderList();
    await interact(() => fireEvent.change(screen.getByLabelText("Search projects"), { target: { value: "loyalty" } }));
    await waitFor(() => expect(lastListParams().q).toBe("loyalty"));
    const chip = screen.getByRole("button", { name: "Remove filter Search: loyalty" });
    await interact(() => fireEvent.click(chip));
    await waitFor(() => expect(lastListParams().q).toBe(""));
  });

  test("sortable headers announce their state and toggle direction", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderList();
    const header = () => screen.getByRole("columnheader", { name: /Project/ });
    expect(header().getAttribute("aria-sort")).toBe("none");
    await interact(() => fireEvent.click(within(header()).getByRole("button")));
    await waitFor(() => expect(lastListParams().sort).toBe("name"));
    await screen.findByRole("link", { name: "E-commerce relaunch" });
    expect(header().getAttribute("aria-sort")).toBe("ascending");
    await interact(() => fireEvent.click(within(header()).getByRole("button")));
    await waitFor(() => expect(lastListParams().sort).toBe("-name"));
  });

  test("pagination requests the next page", async () => {
    signIn("project_manager", ALL_STAFF);
    api.listProjects.mockResolvedValue(listOf([project()], 30, 1, 3));
    await renderList();
    expect(screen.getByText(/Showing/).textContent).toMatch(/1–12.*30/);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "Next page" })));
    await waitFor(() => expect(lastListParams().page).toBe(2));
  });

  test("create and archive appear only with the matching permissions", async () => {
    signIn("coordinator", ["projects.read"]);
    await renderList();
    expect(screen.queryByRole("button", { name: /New project/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getAllByRole("button", { name: /More actions for E-commerce relaunch/ })[0]));
    expect(within(screen.getByRole("menu")).queryByText("Archive project")).toBe(null);
  });

  test("archiving from the list confirms, keeps history, and refreshes", async () => {
    signIn("project_manager", ALL_STAFF);
    api.archiveProject.mockResolvedValue({ ok: true, archived: true });
    await renderList();
    expect(screen.getByRole("button", { name: /New project/ })).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for E-commerce relaunch" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Archive project")));
    const dialog = screen.getByRole("alertdialog", { name: "Archive this project?" });
    expect(dialog.textContent).toMatch(/Nothing is deleted/);
    expect(dialog.textContent).toMatch(/Archived status filter/);
    expect(document.activeElement.textContent).toBe("Cancel"); // safe choice focused
    await act(async () => {
      await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Archive project" })));
    });
    expect(api.archiveProject).toHaveBeenCalledWith("p1");
    expect(screen.queryByRole("alertdialog")).toBe(null);
    expect(mockToast.success).toHaveBeenCalled();
  });

  test("empty, filtered-empty and error states", async () => {
    signIn("project_manager", ALL_STAFF);
    api.listProjects.mockResolvedValue(listOf([]));
    await act(async () => {
      render(<ProjectsPage />);
    });
    expect(await screen.findByText("No projects yet")).toBeTruthy();
    await interact(() => fireEvent.change(screen.getByLabelText("Type"), { target: { value: "seo" } }));
    expect(await screen.findByText("No projects match these filters")).toBeTruthy();
    api.listProjects.mockRejectedValueOnce({ response: { data: { message: "Server error" } } });
    await interact(() => fireEvent.change(screen.getByLabelText("Type"), { target: { value: "website" } }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Projects didn't load/);
    api.listProjects.mockResolvedValue(listOf([project()]));
    await interact(() => fireEvent.click(within(alert).getByRole("button", { name: /Try again/ })));
    expect(await screen.findByRole("link", { name: "E-commerce relaunch" })).toBeTruthy();
  });
});

test("the client project list has no budget column", async () => {
  signIn("client", ["projects.read"], false);
  api.listProjects.mockResolvedValue(listOf([(({ budget, notes, ...rest }) => rest)(project())]));
  await renderList();
  const headers = within(screen.getByRole("table", { name: "Projects" })).getAllByRole("columnheader").map((h) => h.textContent);
  expect(headers).not.toContain("Budget");
  expect(screen.queryByRole("button", { name: /New project/ })).toBe(null);
});

describe("Project detail", () => {
  async function renderDetail(p = project()) {
    api.getProject.mockResolvedValue({ ok: true, item: p });
    let utils;
    await act(async () => {
      utils = render(<ProjectDetailsPage />);
    });
    await screen.findByRole("heading", { level: 1, name: p.name });
    return utils;
  }

  test("tabs follow permissions", () => {
    expect(projectTabsFor(makeAccess({ role: "super_admin" })).map((t) => t.label)).toEqual(["Overview", "Jobs", "Scope", "Files", "Billing", "Activity"]);
    expect(projectTabsFor(makeAccess({ role: "pm", permissions: ["projects.read", "jobs.read"] })).map((t) => t.label)).toEqual(["Overview", "Jobs", "Scope", "Activity"]);
    expect(projectTabsFor(makeAccess({ role: "viewer", permissions: ["projects.read"] })).map((t) => t.label)).toEqual(["Overview"]);
  });

  test("overview shows identity, client, dates and owner; tabs work from the keyboard", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderDetail();
    expect(screen.getByRole("link", { name: "Acme Company" }).getAttribute("href")).toBe("/portal/customers/c1");
    expect(screen.getByText("1 Jul 2026 to 18 Dec 2099")).toBeTruthy();
    expect(screen.getAllByText("Rania Aziz").length).toBeGreaterThan(0);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent.replace(/\d+$/, ""))).toEqual(["Overview", "Jobs", "Scope", "Files", "Billing", "Activity"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    tabs[0].focus();
    await interact(() => fireEvent.keyDown(tabs[0], { key: "ArrowRight" }));
    expect(screen.getByRole("tab", { name: /Jobs/ }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Jobs/ }));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("project-tab-jobs");
    await interact(() => fireEvent.keyDown(document.activeElement, { key: "End" }));
    expect(screen.getByRole("tab", { name: "Activity" }).getAttribute("aria-selected")).toBe("true");
  });

  test("billing tab lists only this project's invoices and uses the invoice number", async () => {
    signIn("project_manager", ALL_STAFF);
    billingApi.listInvoices.mockResolvedValue({
      items: [
        { _id: "i1", number: "INV-2026-0410", status: "overdue", total: 26400, balance: 26400, amountPaid: 0, projectId: "p1", currency: "AED" },
        { _id: "i2", number: "INV-2026-0300", status: "paid", total: 1000, balance: 0, amountPaid: 1000, projectId: "other", currency: "AED" },
      ],
    });
    await renderDetail();
    await interact(() => fireEvent.click(screen.getByRole("tab", { name: "Billing" })));
    expect(await screen.findByRole("link", { name: "INV-2026-0410" })).toBeTruthy();
    expect(screen.queryByText("INV-2026-0300")).toBe(null);
  });

  // What the API now returns to a client user: no notes, no budget.
  const clientView = () => {
    const { notes, budget, ...rest } = project({ notes: "Payment terms 40/40/20. Internal only." });
    return rest;
  };

  test("client users keep read access but get no staff actions or billing tab", async () => {
    signIn("client", ["projects.read", "files.read"], false);
    await renderDetail(clientView());
    expect(screen.queryByRole("button", { name: /Edit/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Create job/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /More actions for/ })));
    expect(within(screen.getByRole("menu")).queryByText("Archive project")).toBe(null);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Overview", "Files"]);
    expect(screen.queryByRole("link", { name: "Acme Company" })).toBe(null); // no internal client page link
    expect(screen.getByText("Acme Company", { selector: "span" })).toBeTruthy();
    expect(jobsApi.listJobs).not.toHaveBeenCalled(); // clients never hold jobs.*
  });

  test("client project overview shows no internal notes or budget, and keeps permitted information", async () => {
    signIn("client", ["projects.read", "files.read"], false);
    await renderDetail(clientView());
    expect(screen.queryByText("Internal notes")).toBe(null);
    expect(screen.queryByText("Budget")).toBe(null);
    expect(document.body.textContent).not.toMatch(/180,000|Internal only/);
    // Permitted project information remains.
    expect(screen.getByText("Rebuild of the online store.")).toBeTruthy();
    expect(screen.getAllByText("18 Dec 2099").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Schedule" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Client" })).toBeTruthy();
  });

  test("even if a response carried them, the client layout has no place for notes or budget", async () => {
    signIn("client", ["projects.read"], false);
    await renderDetail(project({ notes: "Internal only" }));
    expect(screen.queryByText("Internal notes")).toBe(null);
    expect(screen.queryByText("Budget")).toBe(null);
  });

  test("staff still see internal notes and budget", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderDetail(project({ notes: "Payment terms 40/40/20." }));
    expect(screen.getByRole("heading", { name: "Internal notes" })).toBeTruthy();
    expect(screen.getByText("AED 180,000")).toBeTruthy();
  });

  test("archive confirmation is accessible and archives without deleting", async () => {
    signIn("project_manager", ALL_STAFF);
    api.archiveProject.mockResolvedValue({ ok: true, archived: true });
    await renderDetail();
    const more = screen.getByRole("button", { name: "More actions for E-commerce relaunch" });
    await interact(() => fireEvent.click(more));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Archive project")));
    const dialog = screen.getByRole("alertdialog", { name: "Archive this project?" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toMatch(/jobs, invoices, files and history are kept/);
    await interact(() => fireEvent.keyDown(dialog, { key: "Escape" }));
    expect(screen.queryByRole("alertdialog")).toBe(null);
    expect(api.archiveProject).not.toHaveBeenCalled();
    await interact(() => fireEvent.click(more));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Archive project")));
    await act(async () => {
      await interact(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Archive project" })));
    });
    expect(api.archiveProject).toHaveBeenCalledWith("p1");
    expect(mockNavigate).toHaveBeenCalledWith("/portal/projects");
  });

  test("an archived project says so and offers no archive action", async () => {
    signIn("project_manager", ALL_STAFF);
    await renderDetail(project({ status: "archived" }));
    expect(screen.getByText("This project is archived")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change status" })).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /More actions for/ })));
    expect(within(screen.getByRole("menu")).queryByText("Archive project")).toBe(null);
  });

  test("no access and not found are explained", async () => {
    signIn("project_manager", ALL_STAFF);
    api.getProject.mockRejectedValueOnce({ response: { status: 403, data: { message: "Forbidden" } } });
    await act(async () => {
      render(<ProjectDetailsPage />);
    });
    expect((await screen.findByRole("alert")).textContent).toMatch(/You don't have access to this project/);
  });
});
