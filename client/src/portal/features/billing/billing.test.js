// PUI-4 — Billing list and invoice detail in the production design system.
// act() flushes the mocked API calls a render or interaction starts.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "inv1" };
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useLocation: () => ({ pathname: "/portal/billing" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () => ({
  getBillingStats: jest.fn(),
  listInvoices: jest.fn(),
  getInvoice: jest.fn(),
  createInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  markInvoicePaid: jest.fn(),
  voidInvoice: jest.fn(),
  recordPayment: jest.fn(),
  deletePayment: jest.fn(),
  markOverdueInvoices: jest.fn(),
}));
jest.mock("../customers/api", () => ({ listCustomers: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../projects/api", () => ({ listProjects: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../enrollments/api", () => ({ listEnrollments: jest.fn(() => Promise.resolve({ items: [] })) }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const BillingPage = require("./pages/BillingPage").default;
const InvoiceDetailsPage = require("./pages/InvoiceDetailsPage").default;

function signIn(role, permissions, isInternal = true) {
  localStorage.setItem("portal_user", JSON.stringify({ _id: "me", fullName: "Sara Khan", role, permissions, isInternal }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

const invoice = (over = {}) => ({
  _id: "inv1",
  number: "INV-2026-0012",
  status: "sent",
  currency: "AED",
  customerId: { _id: "c1", companyName: "Acme Company" },
  issuedAt: "2026-09-01T00:00:00Z",
  dueDate: "2099-10-01T00:00:00Z",
  subtotal: 1000,
  total: 1000,
  amountPaid: 0,
  balance: 1000,
  items: [{ _id: "l1", title: "Design", qty: 1, unitPrice: 1000, amount: 1000 }],
  payments: [],
  ...over,
});
const listOf = (items, total = items.length) => ({ ok: true, items, total, page: 1, pages: 1, limit: 12 });
const STATS = { ok: true, totalOutstanding: 5000, totalOverdue: 1200, totalPaid: 30000, byStatus: { draft: { count: 2 }, sent: { count: 3 }, overdue: { count: 1 }, paid: { count: 9 } } };

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "inv1" };
  api.getBillingStats.mockResolvedValue(STATS);
  api.listInvoices.mockResolvedValue(listOf([invoice(), invoice({ _id: "inv2", number: "", status: "draft" })]));
});

async function renderList() {
  await act(async () => {
    render(<BillingPage />);
  });
}

describe("Billing list", () => {
  test("figures come from the stats endpoint, not from the loaded page", async () => {
    signIn("finance", ["billing.read", "billing.write"]);
    await renderList();
    const summary = screen.getByRole("region", { name: /summary/i });
    expect(within(summary).getByText("4 unpaid invoices")).toBeTruthy(); // sent 3 + overdue 1, from byStatus
    expect(within(summary).getByText("2")).toBeTruthy(); // drafts
  });

  test("a failed stats request shows no figures rather than zeros", async () => {
    signIn("finance", ["billing.read"]);
    api.getBillingStats.mockRejectedValue(new Error("down"));
    await renderList();
    expect(screen.queryByRole("region", { name: /summary/i })).toBe(null);
  });

  test("write actions follow billing.write; drafts can be marked as sent", async () => {
    signIn("finance", ["billing.read", "billing.write"]);
    api.updateInvoice.mockResolvedValue({ ok: true });
    await renderList();
    await interact(() => fireEvent.click(screen.getAllByRole("button", { name: /^More actions for/ })[1]));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(expect.arrayContaining(["Open invoice", "Mark as sent", "Mark as paid", "Void invoice"]));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Mark as sent")));
    const dialog = screen.getByRole("alertdialog", { name: "Mark this invoice as sent?" });
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Mark as sent" })));
    expect(api.updateInvoice).toHaveBeenCalledWith("inv2", { status: "sent" });
  });

  test("a limited admin (role named admin, read only) gets no write actions", async () => {
    signIn("admin", ["billing.read"]);
    await renderList();
    expect(screen.queryByRole("button", { name: /New invoice/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Mark overdue/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getAllByRole("button", { name: /^More actions for/ })[0]));
    expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Open invoice"]);
  });

  test("a client user reads invoices only", async () => {
    signIn("client_admin", ["billing.read"], false);
    await renderList();
    expect(screen.queryByRole("button", { name: /New invoice/ })).toBe(null);
    expect(api.markOverdueInvoices).not.toHaveBeenCalled();
  });
});

describe("Invoice detail", () => {
  async function renderDetail(inv = invoice()) {
    api.getInvoice.mockResolvedValue({ ok: true, item: inv });
    await act(async () => {
      render(<InvoiceDetailsPage />);
    });
  }

  test("payments show who recorded them (the API populates name and email; users store fullName)", async () => {
    signIn("finance", ["billing.read", "billing.write"]);
    await renderDetail(invoice({ amountPaid: 400, balance: 600, payments: [{ _id: "p1", amount: 400, method: "cash", paidAt: "2026-09-10T00:00:00Z", recordedBy: { _id: "u1", email: "sara@expresso.example" } }] }));
    expect(screen.getByText(/Recorded by sara@expresso\.example/)).toBeTruthy();
  });

  test("recording a payment sends it once, even on a double submit", async () => {
    signIn("finance", ["billing.read", "billing.write"]);
    let release;
    api.recordPayment.mockImplementation(() => new Promise((r) => (release = () => r({ ok: true, item: invoice() }))));
    await renderDetail();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Record payment/ })));
    const dialog = screen.getByRole("dialog", { name: "Record a payment" });
    const submit = within(dialog).getByRole("button", { name: /Record payment/ });
    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    await act(async () => release());
    expect(api.recordPayment).toHaveBeenCalledTimes(1);
  });

  test("a client user sees no payment or void controls", async () => {
    signIn("client_admin", ["billing.read"], false);
    await renderDetail();
    expect(screen.queryByRole("button", { name: /Record payment/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Edit/ })).toBe(null);
    expect(screen.queryByText(/Recorded by/)).toBe(null);
  });
});
