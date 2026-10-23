// PUI-4 — internal Procurement in the production design system: overview,
// requests (shared with client users), vendors, categories, vendor
// applications and the staff RFQ pages. Vendor users keep the existing RFQ
// views (the vendor portal is PUI-5). Effective permissions only.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "r1" };
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useLocation: () => ({ pathname: "/portal/procurement" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () =>
  Object.fromEntries(
    ["listCategories", "createCategory", "updateCategory", "deleteCategory", "listVendors", "createVendor", "updateVendor", "deleteVendor", "listRequests", "getRequest", "createRequest", "updateRequest", "deleteRequest", "createRfqFromRequest", "listCustomers", "getProcurementStats", "getCategoryTree", "listVendorApplications", "getVendorApplication", "approveVendorApplication", "rejectVendorApplication", "listRfqs", "getRfq", "createRfq", "updateRfq", "publishRfq", "closeRfq", "getMatchedVendors", "listQuotations", "submitQuotation", "updateQuotationStatus"].map((k) => [k, jest.fn()])
  )
);
jest.mock("../customers/api", () => ({ listCustomers: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../iam/users/api", () => ({ listUsers: jest.fn(() => Promise.resolve({ users: [] })) }));
jest.mock("../media-library/components/MediaPickerModal", () => () => null);
jest.mock("../../shared/utils/assetUrl", () => ({ getAssetUrl: (u) => u }));
jest.mock("./vendor/VendorRFQsView", () => () => "vendor rfq list");
jest.mock("./vendor/VendorRFQDetailView", () => () => "vendor rfq detail");
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const ProcurementDashboardPage = require("./pages/ProcurementDashboardPage").default;
const ProcurementRequestsPage = require("./pages/ProcurementRequestsPage").default;
const ProcurementRequestDetailsPage = require("./pages/ProcurementRequestDetailsPage").default;
const ProcurementVendorsPage = require("./pages/ProcurementVendorsPage").default;
const VendorApplicationsPage = require("./pages/VendorApplicationsPage").default;
const RFQsPage = require("./pages/RFQsPage").default;
const RFQDetailsPage = require("./pages/RFQDetailsPage").default;
const { loadProcurementOverview } = require("./lib/overview");
const { makeAccess } = require("../../shared/hooks/useAccess");

function signIn(role, permissions, isInternal = true) {
  const user = { _id: "me", fullName: "Sara Khan", role, permissions, isInternal };
  localStorage.setItem("portal_user", JSON.stringify(user));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
  return makeAccess(user);
}
const MANAGER = ["procurement.read", "procurement.write", "procurement.approve", "procurement.delete"];
const listOf = (items, total = items.length) => ({ ok: true, items, total, page: 1, pages: 1, limit: 15 });
const request = (over = {}) => ({ _id: "r1", ref: "PR-0042", title: "Conference cameras", status: "new", priority: "high", budget: 48000, currency: "AED", customerId: { _id: "c1", companyName: "Acme Company" }, categoryId: { _id: "k1", name: "Cameras" }, createdAt: "2026-10-01T00:00:00Z", timeline: {}, ...over });
const STATS = { ok: true, total: 11, byStatus: { new: 3, assessing: 1, quoted: 1, approved: 2, ordered: 1, delivered: 2, cancelled: 1 }, totals: { pending: 5, inProgress: 3, delivered: 2, cancelled: 1, urgent: 1, high: 2 }, recentRequests: [request()] };

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}
const menuItems = () => within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "r1" };
  api.getProcurementStats.mockResolvedValue(STATS);
  api.listRequests.mockResolvedValue(listOf([request(), request({ _id: "r2", ref: "PR-0043", title: "Laptops", status: "ordered" })]));
  api.getCategoryTree.mockResolvedValue({ tree: [] });
  api.listRfqs.mockImplementation((p) => Promise.resolve(listOf(p.limit === 1 ? [] : [{ _id: "q1", rfqNumber: "RFQ-2026-0007", title: "Cameras", status: "draft", subcategoryIds: [] }], { draft: 2, published: 4, closed: 1, awarded: 3 }[p.status] ?? 1)));
  api.listVendorApplications.mockImplementation((p) => Promise.resolve(listOf(p.limit === 1 ? [] : [{ _id: "a1", companyName: "Lens House", contactName: "Rami", email: "rami@lens.example", status: "pending" }], { pending: 2, approved: 5, rejected: 1 }[p.status] ?? 1)));
});

describe("Overview", () => {
  test("client users load only their own request figures, nothing staff-only", async () => {
    const access = signIn("client_admin", ["procurement.read", "procurement.write"], false);
    await loadProcurementOverview(access);
    expect(api.getProcurementStats).toHaveBeenCalled();
    expect(api.listRfqs).not.toHaveBeenCalled();
    expect(api.listVendorApplications).not.toHaveBeenCalled();
  });

  test("staff see real counts and what needs attention", async () => {
    signIn("procurement_manager", MANAGER);
    await act(async () => {
      render(<ProcurementDashboardPage />);
    });
    const summary = screen.getByRole("region", { name: "Procurement summary" });
    expect(within(summary).getByText("11 requests in all, 1 cancelled")).toBeTruthy();
    expect(screen.getByText("3 new requests to assess")).toBeTruthy();
    expect(screen.getByText("2 vendor applications waiting for review")).toBeTruthy();
    expect(screen.getByText("2 draft RFQs not published")).toBeTruthy();
  });
});

describe("Requests", () => {
  async function renderList() {
    await act(async () => {
      render(<ProcurementRequestsPage />);
    });
  }

  test("search and filters go to the API; counts come from the stats endpoint", async () => {
    signIn("procurement_manager", MANAGER);
    await renderList();
    expect(within(screen.getByRole("region", { name: "Request summary" })).getByText("11 requests in all")).toBeTruthy();
    await interact(() => fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "urgent" } }));
    expect(api.listRequests.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 15, priority: "urgent" });
  });

  test("delete is offered only for New or Cancelled requests, with procurement.delete", async () => {
    signIn("procurement_manager", MANAGER);
    await renderList();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Conference cameras" })));
    expect(menuItems()).toEqual(["Open request", "Delete request"]);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Laptops" })));
    expect(menuItems()).toEqual(["Open request"]);
  });

  test("client users don't see other companies' names or the internal assignee", async () => {
    signIn("client_admin", ["procurement.read", "procurement.write"], false);
    api.listRequests.mockResolvedValue(listOf([request({ assignedTo: { fullName: "Internal Person" } })]));
    await renderList();
    expect(screen.queryByText(/Acme Company/)).toBe(null);
    expect(screen.queryByText("Internal Person")).toBe(null);
  });

  test("staff create an RFQ from a request; the dialog says the budget stays internal", async () => {
    signIn("procurement_manager", MANAGER);
    api.getRequest.mockResolvedValue({ ok: true, item: request() });
    api.createRfqFromRequest.mockResolvedValue({ ok: true, item: { _id: "q9" } });
    await act(async () => {
      render(<ProcurementRequestDetailsPage />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Create RFQ/ })));
    const dialog = screen.getByRole("alertdialog", { name: "Create an RFQ from this request?" });
    expect(dialog.textContent).toMatch(/budget stays internal/);
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Create draft RFQ" })));
    expect(api.createRfqFromRequest).toHaveBeenCalledWith("r1");
    expect(mockNavigate).toHaveBeenCalledWith("/portal/procurement/rfqs/q9");
  });

  test("an existing RFQ opens instead of creating a second one", async () => {
    signIn("procurement_manager", MANAGER);
    api.getRequest.mockResolvedValue({ ok: true, item: request() });
    api.createRfqFromRequest.mockRejectedValue({ response: { status: 409, data: { item: { _id: "q1" } } } });
    await act(async () => {
      render(<ProcurementRequestDetailsPage />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Create RFQ/ })));
    await interact(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Create draft RFQ" })));
    expect(mockNavigate).toHaveBeenCalledWith("/portal/procurement/rfqs/q1");
  });

  test("client users get no staff actions on their request", async () => {
    signIn("client_admin", ["procurement.read", "procurement.write"], false);
    api.getRequest.mockResolvedValue({ ok: true, item: request({ customerId: "c1" }) });
    await act(async () => {
      render(<ProcurementRequestDetailsPage />);
    });
    expect(screen.queryByRole("button", { name: /Create RFQ/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /^More actions for/ })));
    expect(menuItems()).toEqual(["Refresh"]); // no status, sourcing, cancel or delete
  });

  test("timeline dates are read from the request's timeline", async () => {
    signIn("procurement_manager", MANAGER);
    api.getRequest.mockResolvedValue({ ok: true, item: request({ status: "ordered", timeline: { approvedAt: "2026-10-03T00:00:00Z", orderedAt: "2026-10-05T00:00:00Z" } }) });
    await act(async () => {
      render(<ProcurementRequestDetailsPage />);
    });
    const history = screen.getByRole("list", { name: "Request history" }).textContent;
    expect(history).toMatch(/Approved/);
    expect(history).toMatch(/Ordered/);
  });
});

describe("Vendors and applications", () => {
  test("read-only staff see the directory with no actions; counts are whole-directory totals", async () => {
    signIn("procurement_viewer", ["procurement.read"]);
    api.listVendors.mockImplementation((p) => Promise.resolve(listOf(p.limit === 1 ? [] : [{ _id: "v1", name: "Lens House", isActive: true, categories: [] }], p.isActive === "true" ? 7 : 9)));
    await act(async () => {
      render(<ProcurementVendorsPage />);
    });
    expect(screen.queryByRole("button", { name: /New vendor/ })).toBe(null);
    expect(screen.queryByRole("button", { name: "More actions for Lens House" })).toBe(null);
    const summary = screen.getByRole("region", { name: "Vendor summary" });
    expect(within(summary).getByText("7")).toBeTruthy();
    expect(within(summary).getByText("2")).toBeTruthy();
  });

  test("approving shows whether the invitation email went out", async () => {
    signIn("procurement_manager", MANAGER);
    api.getVendorApplication.mockResolvedValue({ ok: true, item: { _id: "a1", companyName: "Lens House", contactName: "Rami", email: "rami@lens.example", status: "pending", categorySelections: [] } });
    api.approveVendorApplication.mockResolvedValue({ ok: true, invitation: { email: "rami@lens.example", emailSent: false } });
    await act(async () => {
      render(<VendorApplicationsPage />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "Lens House" })));
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /^Approve$/ })));
    await interact(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Approve and send invitation" })));
    expect(api.approveVendorApplication).toHaveBeenCalledWith("a1");
    expect(screen.getByText("The invitation email wasn't sent")).toBeTruthy();
  });
});

describe("RFQs", () => {
  test("vendor users keep the existing vendor views", async () => {
    signIn("vendor", ["procurement.read"], false);
    await act(async () => {
      render(<RFQsPage />);
    });
    expect(screen.getByText("vendor rfq list")).toBeTruthy();
    expect(api.listRfqs).not.toHaveBeenCalled();
    await act(async () => {
      render(<RFQDetailsPage />);
    });
    expect(screen.getByText("vendor rfq detail")).toBeTruthy();
  });

  test("staff list: counts per status from list totals", async () => {
    signIn("procurement_manager", MANAGER);
    await act(async () => {
      render(<RFQsPage />);
    });
    const summary = screen.getByRole("region", { name: "RFQ summary" });
    expect(within(summary).getByText("4")).toBeTruthy(); // published
    expect(screen.getByRole("link", { name: "Cameras" })).toBeTruthy();
  });

  const rfq = { _id: "q1", rfqNumber: "RFQ-2026-0007", title: "Cameras", status: "published", description: "Four PTZ cameras", subcategoryIds: [], attachments: [{ name: "Spec", url: "ftp://files.example/receipt.pdf" }] };

  test("accepting a quotation needs procurement.approve and says the RFQ is awarded", async () => {
    signIn("procurement_manager", MANAGER);
    mockParams = { id: "q1" };
    api.getRfq.mockResolvedValue({ ok: true, item: rfq });
    api.listQuotations.mockResolvedValue({ ok: true, items: [{ _id: "qt1", vendorId: { name: "Lens House" }, price: 9000, currency: "AED", status: "submitted" }] });
    api.updateQuotationStatus.mockResolvedValue({ ok: true });
    await act(async () => {
      render(<RFQDetailsPage />);
    });
    expect(screen.queryByRole("link", { name: "Spec" })).toBe(null); // not a web link
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for quotation from Lens House" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Accept")));
    const dialog = screen.getByRole("alertdialog", { name: "Accept this quotation?" });
    expect(dialog.textContent).toMatch(/becomes Awarded/);
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: "Accept quotation" })));
    expect(api.updateQuotationStatus).toHaveBeenCalledWith("qt1", "accepted");
  });

  test("without procurement.approve there is no publishing or deciding", async () => {
    signIn("procurement_officer", ["procurement.read", "procurement.write"]);
    mockParams = { id: "q1" };
    api.getRfq.mockResolvedValue({ ok: true, item: { ...rfq, status: "draft" } });
    api.listQuotations.mockResolvedValue({ ok: true, items: [{ _id: "qt1", vendorId: { name: "Lens House" }, price: 9000, status: "submitted" }] });
    await act(async () => {
      render(<RFQDetailsPage />);
    });
    expect(screen.getByRole("button", { name: /Edit/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Publish/ })).toBe(null);
    expect(screen.queryByRole("button", { name: "More actions for quotation from Lens House" })).toBe(null);
  });
});
