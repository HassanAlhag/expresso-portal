// PUI-3 — Clients list and Client detail in the production design system.
// act() flushes the mocked API calls a render or interaction starts; a few
// checks read stacked-record structure from the DOM directly.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "c1" };
let mockSearch = new URLSearchParams();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useSearchParams: () => [mockSearch, (p) => { mockSearch = new URLSearchParams(p); }],
      useLocation: () => ({ pathname: "/portal/customers" }),
      Navigate: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () => ({
  listCustomers: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  createCustomerLogin: jest.fn(),
  getCustomerById: jest.fn(),
  listCustomerUsers: jest.fn(),
  createCustomerUser: jest.fn(),
}));
jest.mock("../enrollments/api", () => ({ listEnrollments: jest.fn(() => Promise.resolve({ items: [] })), createEnrollment: jest.fn(), generateJobsFromEnrollment: jest.fn() }));
jest.mock("../projects/api", () => ({ listProjects: jest.fn(() => Promise.resolve({ items: [] })), createProject: jest.fn() }));
jest.mock("../jobs/api", () => ({ listJobs: jest.fn(() => Promise.resolve({ items: [] })), createJob: jest.fn() }));
jest.mock("../iam/users/api", () => ({ deleteUser: jest.fn() }));
jest.mock("../jobs/components/NewJobModal", () => () => null);
jest.mock("../enrollments/components/CreateEnrollmentModal", () => () => null);
jest.mock("../../shared/utils/assetUrl", () => ({ getAssetUrl: (u) => u }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const CustomersPage = require("./pages/CustomersPage").default;
const { buildClientParams } = require("./pages/CustomersPage");
const CustomerDetailsPage = require("./pages/CustomerDetailsPage").default;
const { clientTabsFor } = require("./pages/CustomerDetailsPage");
const CustomerFormModal = require("./components/CustomerFormModal").default;
const { makeAccess } = require("../../shared/hooks/useAccess");

const STAFF_ALL = ["customers.read", "customers.write", "customers.delete", "projects.read", "projects.write", "jobs.read", "crm.read"];

function signIn(role, permissions, isInternal = true) {
  localStorage.setItem("portal_user", JSON.stringify({ fullName: "Layla Haddad", role, permissions, isInternal }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

const client = (over = {}) => ({
  _id: "c1",
  companyName: "Acme Company",
  contactName: "Omar Saleh",
  primaryEmail: "omar@acme.example",
  phone: "+971 4 555 0101",
  code: "ACM-01",
  industry: "Retail",
  country: "UAE",
  department: "digital_agency",
  isActive: true,
  createdAt: "2026-06-01T09:00:00Z",
  ...over,
});
const listOf = (items, total = items.length, page = 1, pages = 1) => ({ ok: true, items, total, page, pages, limit: 12 });
const listCalls = () => api.listCustomers.mock.calls.map((c) => c[0]);
const lastListParams = () => listCalls().filter((p) => p.limit !== 1).at(-1);

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "c1" };
  mockSearch = new URLSearchParams();
  api.listCustomers.mockImplementation((p) =>
    Promise.resolve(p.limit === 1 ? listOf([], { true: 14, false: 3 }[p.isActive] ?? { digital_agency: 9, procurement: 5, both: 3 }[p.department] ?? 0) : listOf([client(), client({ _id: "c2", companyName: "Bayan Health Group", isActive: false, ownerUserId: "u9" })]))
  );
  api.listCustomerUsers.mockResolvedValue({ users: [{ _id: "u1", fullName: "Omar Saleh", email: "omar@acme.example", role: "client_admin", isActive: true }] });
});

async function renderList() {
  await act(async () => {
    render(<CustomersPage />);
  });
}

describe("Clients list", () => {
  test("a semantic table that stacks into labelled records, with real global counts", async () => {
    signIn("account_manager", STAFF_ALL);
    await renderList();
    const table = screen.getByRole("table", { name: "Clients" });
    expect(table.className).toMatch(/px-table--stack/);
    const row = within(table).getByRole("link", { name: "Acme Company" }).closest("tr");
    expect([...row.querySelectorAll("td[data-label]")].map((td) => td.dataset.label)).toEqual(expect.arrayContaining(["Main contact", "Status"]));
    // Counts come from list totals (one-row requests), never from the current page.
    const summary = screen.getByRole("region", { name: "Clients summary" });
    expect(within(summary).getByText("14")).toBeTruthy();
    expect(within(summary).getByText("3 inactive")).toBeTruthy();
    expect(listCalls().filter((p) => p.limit === 1)).toHaveLength(5);
  });

  test("filters, search and sorting reach the API; chips clear them", async () => {
    signIn("account_manager", STAFF_ALL);
    await renderList();
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "false" } }));
    expect(lastListParams().isActive).toBe("false");
    await interact(() => fireEvent.change(screen.getByLabelText("Department"), { target: { value: "procurement" } }));
    expect(lastListParams().department).toBe("procurement");
    await interact(() => fireEvent.change(screen.getByLabelText("Search clients"), { target: { value: "acme" } }));
    expect(lastListParams().q).toBe("acme");
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "Clear all" })));
    expect(lastListParams()).toEqual(buildClientParams({ q: "", isActive: "", department: "", sort: "-createdAt", page: 1 }));
    const header = () => screen.getByRole("columnheader", { name: /Client/ });
    await interact(() => fireEvent.click(within(header()).getByRole("button")));
    expect(lastListParams().sort).toBe("companyName");
    expect(header().getAttribute("aria-sort")).toBe("ascending");
  });

  test("pagination requests the next page", async () => {
    signIn("account_manager", STAFF_ALL);
    api.listCustomers.mockImplementation((p) => Promise.resolve(p.limit === 1 ? listOf([], 0) : listOf([client()], 30, p.page || 1, 3)));
    await renderList();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "Next page" })));
    expect(lastListParams().page).toBe(2);
  });

  test("read-only staff and a limited admin see no create, edit or status controls", async () => {
    for (const role of ["coordinator", "admin"]) {
      localStorage.clear();
      signIn(role, ["customers.read"]);
      const { unmount } = render(<CustomersPage />);
      await act(async () => {});
      expect(screen.queryByRole("button", { name: /New client/ })).toBe(null);
      await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Acme Company" })));
      const items = within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent);
      expect(items).toEqual(["Open client"]);
      unmount();
    }
  });

  test("an authenticated client user sees only their record, with no staff summary or actions", async () => {
    signIn("client_admin", ["customers.read"], false);
    await renderList();
    expect(screen.queryByRole("region", { name: "Clients summary" })).toBe(null);
    expect(listCalls().filter((p) => p.limit === 1)).toHaveLength(0); // no staff counts requested
    expect(screen.queryByRole("button", { name: /New client/ })).toBe(null);
  });

  test("deactivating keeps everything and says portal users can still sign in", async () => {
    signIn("super_admin", []);
    api.updateCustomer.mockResolvedValue({ ok: true });
    await renderList();
    expect(screen.getByRole("button", { name: /New client/ })).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Acme Company" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Deactivate client")));
    const dialog = screen.getByRole("alertdialog", { name: "Deactivate this client?" });
    expect(dialog.textContent).toMatch(/Nothing is deleted/);
    expect(dialog.textContent).toMatch(/portal users can still sign in/);
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Deactivate client" })));
    expect(api.updateCustomer).toHaveBeenCalledWith("c1", { isActive: false });
  });

  test("loading, empty, filtered-empty and error are different states", async () => {
    signIn("account_manager", STAFF_ALL);
    let release;
    api.listCustomers.mockImplementation((p) => (p.limit === 1 ? Promise.resolve(listOf([], 0)) : new Promise((r) => (release = () => r(listOf([]))))));
    render(<CustomersPage />);
    expect(screen.getByText("Loading clients…")).toBeTruthy();
    await act(async () => release());
    expect(screen.getByText("No clients yet")).toBeTruthy();
    api.listCustomers.mockImplementation((p) => Promise.resolve(listOf([], 0)));
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "true" } }));
    expect(screen.getByText("No clients match these filters")).toBeTruthy();
    api.listCustomers.mockImplementation((p) => (p.limit === 1 ? Promise.resolve(listOf([], 0)) : Promise.reject({ response: { data: { message: "Server error" } } })));
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "false" } }));
    expect(screen.getByRole("alert").textContent).toMatch(/Clients didn't load/);
    expect(screen.getByText("Clients unavailable")).toBeTruthy(); // never "0 clients" on failure
  });
});

describe("Client detail", () => {
  async function renderDetail(c = client()) {
    api.getCustomerById.mockResolvedValue({ ok: true, item: c });
    await act(async () => {
      render(<CustomerDetailsPage />);
    });
    await screen.findByRole("heading", { level: 1, name: c.companyName });
  }

  test("tabs follow permissions and the client's department", () => {
    const tabs = (access, c) => clientTabsFor(access, c).map((t) => t.label);
    expect(tabs(makeAccess({ role: "super_admin" }), client())).toEqual(["Overview", "Projects", "Enrollments", "Jobs", "Productions", "Users", "Activity"]);
    expect(tabs(makeAccess({ role: "super_admin" }), client({ department: "procurement" }))).toEqual(["Overview", "Procurement", "Users", "Activity"]);
    expect(tabs(makeAccess({ role: "admin", permissions: ["customers.read"] }), client())).toEqual(["Overview", "Users"]);
  });

  test("staff see contact, account facts, internal notes and the CRM history", async () => {
    signIn("account_manager", STAFF_ALL);
    await renderDetail(client({ notes: "Pays on 45 days.", crmDealId: { _id: "d1", title: "Store locator", stage: "won", value: 145000, currency: "AED" } }));
    expect(screen.getByRole("heading", { name: "Internal notes" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Store locator" }).getAttribute("href")).toBe("/portal/crm/deals/d1");
    expect(screen.getByRole("button", { name: /Edit/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /New project/ })).toBeTruthy();
  });

  test("an authenticated client user gets no internal notes, CRM history or staff actions", async () => {
    signIn("client_admin", ["customers.read"], false);
    // Even if a response carried them, the client layout has no place for them.
    await renderDetail(client({ notes: "Internal only", crmDealId: { _id: "d1", title: "Store locator", stage: "won", value: 145000 } }));
    expect(screen.queryByText("Internal notes")).toBe(null);
    expect(screen.queryByText("Sales history")).toBe(null);
    expect(document.body.textContent).not.toMatch(/Internal only|Store locator|145,000/);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Overview", "Users"]);
    expect(screen.queryByRole("button", { name: /Edit/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Acme Company" })));
    expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Refresh"]);
  });

  test("permanent delete needs customers.delete and says exactly what happens", async () => {
    signIn("account_manager", STAFF_ALL);
    api.deleteCustomer.mockResolvedValue({ ok: true });
    await renderDetail();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Acme Company" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Delete permanently")));
    const dialog = screen.getByRole("alertdialog", { name: "Delete this client permanently?" });
    expect(dialog.textContent).toMatch(/can't be restored/);
    expect(dialog.textContent).toMatch(/refer to a client that no longer exists/);
    expect(dialog.textContent).toMatch(/deactivate the client instead/);
    expect(document.activeElement.textContent).toBe("Cancel");
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" })));
    expect(api.deleteCustomer).toHaveBeenCalledWith("c1");
    expect(mockNavigate).toHaveBeenCalledWith("/portal/customers");
  });

  test("without customers.delete there is no delete action", async () => {
    signIn("account_manager", ["customers.read", "customers.write"]);
    await renderDetail();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Acme Company" })));
    expect(within(screen.getByRole("menu")).queryByText("Delete permanently")).toBe(null);
    expect(within(screen.getByRole("menu")).getByText("Deactivate client")).toBeTruthy();
  });

  test("not found and no access are explained", async () => {
    signIn("account_manager", STAFF_ALL);
    api.getCustomerById.mockRejectedValueOnce({ response: { status: 403 } });
    await act(async () => {
      render(<CustomerDetailsPage />);
    });
    expect(screen.getByRole("alert").textContent).toMatch(/You don't have access to this client/);
  });
});

test("client form department choice is a real radio group: one Tab stop, arrow keys select", async () => {
  await act(async () => {
    render(<CustomerFormModal open mode="create" onClose={() => {}} onSubmit={() => {}} />);
  });
  const group = screen.getByRole("radiogroup", { name: "Department" });
  const radios = within(group).getAllByRole("radio");
  expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
  radios[0].focus();
  await interact(() => fireEvent.keyDown(radios[0], { key: "ArrowRight" }));
  expect(radios[1].getAttribute("aria-checked")).toBe("true");
  expect(document.activeElement).toBe(radios[1]);
  expect(radios.filter((r) => r.tabIndex === 0)).toEqual([radios[1]]);
});
