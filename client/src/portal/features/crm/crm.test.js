// PUI-3 — CRM (overview, leads, deals and their conversions) in the
// production design system. act() flushes the mocked API calls a render or
// interaction starts.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "x1" };
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useSearchParams: () => [new URLSearchParams(), () => {}],
      useLocation: () => ({ pathname: "/portal/crm" }),
      Navigate: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () => {
  const ok = (v) => jest.fn(() => Promise.resolve(v));
  return {
    listDeals: ok({ items: [], total: 0 }),
    getDeal: jest.fn(),
    createDeal: jest.fn(),
    updateDeal: jest.fn(),
    deleteDeal: jest.fn(),
    convertDealToCustomer: jest.fn(),
    listLeads: ok({ items: [], total: 0 }),
    listLeadAssignees: ok({ items: [] }),
    getLead: jest.fn(),
    createLead: jest.fn(),
    updateLead: jest.fn(),
    deleteLead: jest.fn(),
    convertLeadToDeal: jest.fn(),
    listAccounts: ok({ items: [], total: 0 }),
    getAccount: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    listContacts: ok({ items: [], total: 0 }),
    getContact: jest.fn(),
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    listActivities: ok({ items: [], total: 0 }),
    createActivity: jest.fn(),
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
  };
});
jest.mock("../enrollments/components/CreateEnrollmentModal", () => () => null);
jest.mock("../enrollments/api", () => ({ createEnrollment: jest.fn() }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const LeadsPage = require("./pages/LeadsPage").default;
const { buildLeadParams, INCLUDE_CONVERTED } = require("./pages/LeadsPage");
const LeadDetailsPage = require("./pages/LeadDetailsPage").default;
const DealDetailsPage = require("./pages/DealDetailsPage").default;
const CRMDashboardPage = require("./pages/CRMDashboardPage").default;
const { deriveCrmOverview } = require("./lib/dashboardData");
const { LEAD_CONVERSION_DETAILS, DEAL_CONVERSION_DETAILS, conversionError } = require("./lib/convert");
const { makeAccess } = require("../../shared/hooks/useAccess");

const CRM_ALL = ["crm.read", "crm.write", "crm.delete", "customers.read"];

function signIn(role, permissions, isInternal = true) {
  localStorage.setItem("portal_user", JSON.stringify({ fullName: "Layla Haddad", role, permissions, isInternal }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}
async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}
async function mount(el) {
  await act(async () => {
    render(el);
  });
}
const lead = (over = {}) => ({ _id: "l1", fullName: "Mona Farouk", companyName: "Bayan Health", email: "mona@bayan.example", status: "qualified", source: "website", ...over });
const deal = (over = {}) => ({ _id: "d1", title: "Store locator", stage: "won", value: 145000, currency: "AED", ...over });
const leadParams = () => api.listLeads.mock.calls.map((c) => c[0]).filter((p) => p.limit !== 1).at(-1);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "x1" };
  // CRA resets mock implementations before each test; give every list call a real empty answer.
  for (const fn of ["listDeals", "listLeads", "listAccounts", "listContacts", "listActivities"]) api[fn].mockResolvedValue({ items: [], total: 0 });
  api.listLeadAssignees.mockResolvedValue({ items: [] });
});

describe("Leads", () => {
  test("converted leads are hidden by default and explicitly reachable", async () => {
    signIn("sales", CRM_ALL);
    api.listLeads.mockImplementation((p) => Promise.resolve({ items: p.limit === 1 ? [] : [lead()], total: p.limit === 1 ? 2 : 1 }));
    await mount(<LeadsPage />);
    expect(leadParams()).not.toHaveProperty("status");
    expect(leadParams()).not.toHaveProperty("includeConverted");
    expect(screen.getByText(/\(converted hidden\)/)).toBeTruthy();
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: INCLUDE_CONVERTED } }));
    expect(leadParams()).toMatchObject({ includeConverted: "true" });
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "converted" } }));
    expect(leadParams().status).toBe("converted");
    expect(buildLeadParams({ q: "", status: "", source: "", sort: "-createdAt", page: 1 })).not.toHaveProperty("includeConverted");
  });

  test("read-only CRM users (including a limited admin) get no create, edit, convert or delete", async () => {
    for (const role of ["viewer", "admin"]) {
      localStorage.clear();
      signIn(role, ["crm.read"]);
      api.listLeads.mockImplementation((p) => Promise.resolve({ items: p.limit === 1 ? [] : [lead()], total: 1 }));
      const { unmount } = render(<LeadsPage />);
      await act(async () => {});
      expect(screen.queryByRole("button", { name: /New lead/ })).toBe(null);
      await interact(() => fireEvent.click(screen.getByRole("button", { name: /More actions for Mona Farouk/ })));
      expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Open lead"]);
      unmount();
    }
  });

  test("conversion is offered only for leads not yet converted", async () => {
    signIn("sales", CRM_ALL);
    api.listLeads.mockImplementation((p) =>
      Promise.resolve({ items: p.limit === 1 ? [] : [lead(), lead({ _id: "l2", fullName: "Ali Rahim", status: "converted", convertedDealId: { _id: "d9" } })], total: 2 })
    );
    await mount(<LeadsPage />);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /More actions for Mona Farouk/ })));
    expect(within(screen.getByRole("menu")).getByText("Convert to deal")).toBeTruthy();
    await interact(() => fireEvent.keyDown(document, { key: "Escape" }));
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /More actions for Ali Rahim/ })));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).not.toContain("Convert to deal");
    expect(items).toContain("Open deal");
  });

  test("lead conversion: clear prerequisites, one submission, and the new deal opens", async () => {
    signIn("sales", CRM_ALL);
    api.getLead.mockResolvedValue({ ok: true, item: lead() });
    let resolve;
    api.convertLeadToDeal.mockImplementation(() => new Promise((r) => (resolve = r)));
    await mount(<LeadDetailsPage />);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Convert to deal/ })));
    const dialog = screen.getByRole("dialog", { name: "Convert this lead to a deal?" });
    for (const d of LEAD_CONVERSION_DETAILS) expect(dialog.textContent).toContain(d);
    expect(dialog.textContent).not.toMatch(/atomic|all or nothing|guarantee/i);
    const submit = within(dialog).getByRole("button", { name: /Convert to deal/ });
    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit); // a double click must not convert twice
    });
    expect(api.convertLeadToDeal).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ok: true, item: { _id: "d42" } }));
    expect(mockNavigate).toHaveBeenCalledWith("/portal/crm/deals/d42");
  });

  test("a failed lead conversion explains what to do and stays open", async () => {
    signIn("sales", CRM_ALL);
    api.getLead.mockResolvedValue({ ok: true, item: lead() });
    api.convertLeadToDeal.mockRejectedValue({ response: { status: 409, data: { message: "This lead is already linked to a deal" } } });
    await mount(<LeadDetailsPage />);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Convert to deal/ })));
    await interact(() => fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Convert to deal/ })));
    expect(within(screen.getByRole("dialog")).getByRole("alert").textContent).toMatch(/already linked to a deal/);
  });

  test("conversion messages match the all-or-nothing behaviour (R4-C)", () => {
    const all = [...LEAD_CONVERSION_DETAILS, ...DEAL_CONVERSION_DETAILS].join(" ");
    expect(all).not.toMatch(/not atomic|from the portal|part of it/i);
    expect(conversionError({ response: { status: 500 } }, "deal")).toBe("The conversion didn't complete. Nothing was saved.");
    expect(conversionError({ response: { status: 500, data: { message: "The conversion didn't complete. Nothing was saved." } } }, "lead")).not.toMatch(/part of it/i);
    const unavailable = "Conversion is unavailable: the database does not support transactions. Nothing was changed.";
    expect(conversionError({ response: { status: 503, data: { message: unavailable } } }, "lead")).toBe(unavailable);
    expect(conversionError(new Error("Network Error"), "lead")).toMatch(/didn't respond.*trying again is safe/);
    for (const status of [500, 503]) expect(conversionError({ response: { status } }, "lead")).not.toMatch(/may have been saved/);
  });

  test("retrying a lead that the server reports as already converted opens the existing deal", async () => {
    signIn("sales", CRM_ALL);
    api.getLead.mockResolvedValue({ ok: true, item: lead() });
    api.convertLeadToDeal.mockResolvedValue({ ok: true, alreadyConverted: true, message: "This lead is already converted", item: { _id: "d7" } });
    await mount(<LeadDetailsPage />);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Convert to deal/ })));
    await interact(() => fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Convert to deal/ })));
    expect(mockNavigate).toHaveBeenCalledWith("/portal/crm/deals/d7");
  });
});

describe("Deal to client conversion", () => {
  async function renderDeal(d) {
    api.getDeal.mockResolvedValue({ ok: true, item: d });
    await mount(<DealDetailsPage />);
    await screen.findByRole("heading", { level: 1, name: d.title });
  }

  test("a won, unconverted deal can be converted after a confirmation that describes the effects", async () => {
    signIn("sales", CRM_ALL);
    api.convertDealToCustomer.mockResolvedValue({ ok: true, customer: { _id: "c7", companyName: "Acme Company" } });
    await renderDeal(deal());
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Convert to client/ })));
    const dialog = screen.getByRole("alertdialog", { name: "Convert this won deal to a client?" });
    for (const d of DEAL_CONVERSION_DETAILS) expect(dialog.textContent).toContain(d);
    expect(dialog.textContent).toMatch(/existing client with the same email or company name is reused/);
    expect(dialog.textContent).not.toMatch(/atomic|all or nothing|guarantee/i);
    const confirmBtn = within(dialog).getByRole("button", { name: "Convert to client" });
    await interact(() => {
      fireEvent.click(confirmBtn);
      fireEvent.click(confirmBtn); // a double click must not convert twice
    });
    expect(api.convertDealToCustomer).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith("Acme Company is linked to this deal.");
  });

  test("retrying a deal the server reports as already converted shows the linked client", async () => {
    signIn("sales", CRM_ALL);
    api.convertDealToCustomer.mockResolvedValue({ ok: true, alreadyConverted: true, customer: { _id: "c7", companyName: "Acme Company" } });
    await renderDeal(deal());
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Convert to client/ })));
    await interact(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Convert to client" })));
    expect(mockToast.success).toHaveBeenCalledWith("Acme Company is linked to this deal.");
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  test("a deal that is not won shows the prerequisite instead of the action", async () => {
    signIn("sales", CRM_ALL);
    await renderDeal(deal({ stage: "proposal" }));
    expect(screen.queryByRole("button", { name: /Convert to client/ })).toBe(null);
    expect(screen.getByText("Once the deal is won, it can be converted into a client account.")).toBeTruthy();
  });

  test("an already converted deal never offers conversion again, even without client access", async () => {
    signIn("sales", ["crm.read", "crm.write"]); // no customers.read: no client page link either
    await renderDeal(deal({ customerId: { _id: "c7", companyName: "Acme Company" } }));
    expect(screen.queryByRole("button", { name: /Convert to client/ })).toBe(null);
    expect(screen.queryByRole("link", { name: /Open client/ })).toBe(null);
    expect(screen.getByText("Converted to a client")).toBeTruthy();
  });

  test("read-only CRM users see no conversion, edit or delete", async () => {
    signIn("viewer", ["crm.read"]);
    await renderDeal(deal());
    expect(screen.queryByRole("button", { name: /Convert to client/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Edit/ })).toBe(null);
    expect(screen.queryByText("Once the deal is won, it can be converted into a client account.")).toBe(null);
  });
});

describe("CRM overview", () => {
  const stageItems = (stage) => ({ won: [deal(), deal({ _id: "d2", title: "Old retainer", customerId: "c1" })], proposal: [deal({ _id: "d3", stage: "proposal", value: 50000 })] }[stage] || []);

  test("figures come from real totals; a value is withheld when not every deal is loaded", async () => {
    signIn("sales", CRM_ALL);
    api.listLeads.mockImplementation((p) => Promise.resolve({ items: [], total: p.status === "qualified" ? 4 : p.status ? 2 : 0 }));
    api.listDeals.mockImplementation((p) => Promise.resolve({ items: stageItems(p.stage), total: p.stage === "proposal" ? 150 : stageItems(p.stage).length }));
    api.listAccounts.mockResolvedValue({ items: [], total: 12 });
    api.listActivities.mockResolvedValue({ items: [{ _id: "a1", subject: "Call Mona", status: "pending", dueAt: "2020-01-01", entityType: "lead", entityId: "l1" }], total: 1 });
    await mount(<CRMDashboardPage />);
    const summary = screen.getByRole("region", { name: "Sales summary" });
    expect(within(summary).getByText("12")).toBeTruthy(); // accounts total from the API
    expect(within(summary).getByText("Value not totalled: too many to add up here")).toBeTruthy(); // proposal has 150 deals, 1 loaded
    expect(screen.getByText("Call Mona")).toBeTruthy(); // overdue follow-up needs attention
    expect(screen.getByText("1 won deal not yet converted to a client")).toBeTruthy();
    expect(screen.getByText("4 qualified leads waiting to be converted")).toBeTruthy();
  });

  test("loading, then error with retry", async () => {
    signIn("sales", CRM_ALL);
    api.listAccounts.mockRejectedValueOnce(new Error("down"));
    render(<CRMDashboardPage />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    await act(async () => {});
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/The sales overview didn't load/);
    api.listAccounts.mockResolvedValue({ items: [], total: 0 });
    await interact(() => fireEvent.click(within(alert).getByRole("button", { name: /Try again/ })));
    expect(screen.getByRole("region", { name: "Sales summary" })).toBeTruthy();
  });

  test("a read-only user (and a limited admin) cannot create leads from the overview", async () => {
    signIn("admin", ["crm.read"]);
    await mount(<CRMDashboardPage />);
    expect(screen.queryByRole("button", { name: /New lead/ })).toBe(null);
  });

  test("nothing needing attention is said plainly", () => {
    const empty = { items: [], total: 0 };
    const view = deriveCrmOverview({ leads: {}, stages: Object.fromEntries(["discovery", "qualified", "proposal", "negotiation", "verbal_commitment", "won", "lost"].map((s) => [s, empty])), pending: [], pendingTotal: 0 });
    expect(view.attention).toEqual([]);
    expect(view.summary.openValue).toBe(0);
  });
});

test("authenticated client users never get CRM: the route rules and permissions refuse it", () => {
  signIn("client_admin", ["customers.read", "crm.read"], false); // even a stale crm.read
  const access = makeAccess({ role: "client_admin", permissions: ["customers.read", "crm.read"], isInternal: false });
  for (const path of ["/portal/crm", "/portal/crm/leads", "/portal/crm/deals/d1", "/portal/crm/accounts"]) expect(access.canOpen(path)).toBe(false);
});
