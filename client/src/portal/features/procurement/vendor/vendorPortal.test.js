// PUI-5 — Vendor portal: overview, RFQ lists, RFQ detail and quotations.
// The API applies the R2 vendor rule and returns vendor-safe fields and the
// vendor's own quotation only; these tests check the portal asks for the
// right lists, shows only that data, and sends a quotation once.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "q1" };
let mockSearch = new URLSearchParams();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useSearchParams: () => [mockSearch, (p) => { mockSearch = new URLSearchParams(p); }],
      useLocation: () => ({ pathname: "/portal/procurement/rfqs" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../api", () => ({ listRfqs: jest.fn(), getRfq: jest.fn(), submitQuotation: jest.fn(), getProcurementStats: jest.fn(), listVendorApplications: jest.fn() }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("../api");
const VendorRFQsView = require("./VendorRFQsView").default;
const VendorRFQDetailView = require("./VendorRFQDetailView").default;
const { buildVendorRfqParams } = require("./VendorRFQsView");
const { deriveVendorOverview, loadVendorOverview } = require("../../dashboard/vendor/vendorOverview");
const ProcurementDashboardPage = require("../pages/ProcurementDashboardPage").default;
const { getNavSectionsByRole } = require("../../../app/portalNav");

function signIn(permissions = ["procurement.read"]) {
  localStorage.setItem("portal_user", JSON.stringify({ _id: "v1", fullName: "Sara Rahman", role: "vendor", permissions, isInternal: false }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}
const listOf = (items, total = items.length) => ({ ok: true, items, total, page: 1, pages: 1, limit: 15 });
const soon = new Date(Date.now() + 2 * 86400000).toISOString();
const rfq = (over = {}) => ({ _id: "q1", rfqNumber: "RFQ-2026-0007", title: "PTZ cameras", status: "published", deadline: soon, subcategoryIds: [{ _id: "k1", name: "Cameras" }], attachments: [], ...over });

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "q1" };
  mockSearch = new URLSearchParams();
  api.listRfqs.mockImplementation((p) =>
    Promise.resolve(
      p.quoted
        ? listOf([rfq({ _id: "q2", title: "Laptops", status: "awarded", myQuotationStatus: "accepted" }), rfq({ _id: "q3", title: "Routers", myQuotationStatus: "rejected" })], 2)
        : listOf([rfq(), rfq({ _id: "q3", title: "Routers", myQuotationStatus: "rejected" })], 2)
    )
  );
});

describe("Vendor overview", () => {
  test("open RFQs, what needs a quote, and the vendor's own quotations — from the API's lists", async () => {
    signIn();
    const view = deriveVendorOverview(await loadVendorOverview());
    expect(api.listRfqs.mock.calls.map((c) => c[0])).toEqual([{ limit: 100, page: 1 }, { quoted: "true", limit: 100, page: 1 }]);
    const m = Object.fromEntries(view.metrics.map((x) => [x.key, x.value]));
    expect(m).toEqual({ open: 2, todo: 1, quoted: 2, accepted: 1 });
    expect(view.attention.map((a) => a.title)).toEqual(["PTZ cameras", "Routers"]);
    expect(view.attention[0].sub).toMatch(/Due in 2 days/);
  });

  test("a failed list shows dashes, not zeros", async () => {
    signIn();
    api.listRfqs.mockRejectedValue(new Error("down"));
    const view = deriveVendorOverview(await loadVendorOverview());
    expect(view.metrics.every((x) => x.value === "—")).toBe(true);
  });

  test("the procurement address shows vendors their overview, not company figures", async () => {
    signIn();
    await act(async () => {
      render(<ProcurementDashboardPage />);
    });
    expect(api.getProcurementStats).not.toHaveBeenCalled();
    expect(api.listVendorApplications).not.toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Your RFQ summary" })).toBeTruthy();
  });
});

describe("Vendor RFQ lists", () => {
  test("open RFQs by default; 'Your quotations' asks for the vendor's quoted RFQs", async () => {
    signIn();
    expect(buildVendorRfqParams({ view: "open", q: "", page: 1 })).toEqual({ page: 1, limit: 15 });
    await act(async () => {
      render(<VendorRFQsView />);
    });
    const table = screen.getByRole("table", { name: "Open RFQs" });
    expect(within(table).getByText("Not quoted")).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("tab", { name: /Your quotations/ })));
    expect(mockSearch.get("view")).toBe("quoted");
  });
});

describe("Vendor RFQ detail and quotation", () => {
  async function renderDetail(item) {
    api.getRfq.mockResolvedValue({ ok: true, item });
    await act(async () => {
      render(<VendorRFQDetailView />);
    });
  }

  test("an open RFQ without a quotation: the vendor sends one, once", async () => {
    signIn();
    let release;
    api.submitQuotation.mockImplementation(() => new Promise((r) => (release = () => r({ ok: true }))));
    await renderDetail(rfq({ description: "Four cameras", attachments: [{ name: "Spec", url: "ftp://files.example/spec.pdf" }] }));
    expect(screen.queryByRole("link", { name: "Spec" })).toBe(null); // not a web link
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: "9500" } });
    fireEvent.change(screen.getByLabelText(/Delivery/), { target: { value: "14" } });
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: " Incl. install " } });
    const send = screen.getByRole("button", { name: /Send quotation/ });
    await act(async () => {
      fireEvent.click(send);
      fireEvent.click(send);
    });
    await act(async () => release());
    expect(api.submitQuotation).toHaveBeenCalledTimes(1);
    expect(api.submitQuotation).toHaveBeenCalledWith("q1", { price: 9500, currency: "AED", deliveryDays: 14, notes: "Incl. install", attachments: [] });
  });

  test("a submitted quotation is shown, with no form", async () => {
    signIn();
    await renderDetail(rfq({ myQuotation: { price: 9000, currency: "AED", deliveryDays: 10, status: "under_review", submittedAt: "2026-10-10T00:00:00Z" } }));
    expect(screen.getByText("AED 9,000")).toBeTruthy();
    expect(screen.getByText("Under review")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send quotation/ })).toBe(null);
  });

  test("a rejected quotation on an open RFQ can be replaced", async () => {
    signIn();
    await renderDetail(rfq({ myQuotation: { price: 9000, currency: "AED", status: "rejected" } }));
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Send a new quotation/ })));
    expect(screen.getByRole("form", { name: "Quotation" })).toBeTruthy();
  });

  test("a closed RFQ the vendor quoted on shows the quotation and takes no new one", async () => {
    signIn();
    await renderDetail(rfq({ status: "awarded", myQuotation: { price: 9000, currency: "AED", status: "accepted" } }));
    expect(screen.getByText("This RFQ has been awarded")).toBeTruthy();
    expect(screen.queryByRole("form", { name: "Quotation" })).toBe(null);
  });

  test("an RFQ outside the vendor's categories reads as unavailable", async () => {
    signIn();
    api.getRfq.mockRejectedValue({ response: { status: 404 } });
    await act(async () => {
      render(<VendorRFQDetailView />);
    });
    expect(screen.getByText("RFQ not available")).toBeTruthy();
  });
});

test("vendor navigation: RFQs and account, plus support only with tickets.read", () => {
  const labels = (perms) => getNavSectionsByRole("vendor", perms).flatMap((s) => s.items.map((i) => i.label));
  expect(labels(["procurement.read"])).toEqual(["Overview", "RFQs", "Profile", "Settings"]);
  expect(labels(["procurement.read", "tickets.read", "procurement.approve", "crm.read"])).toEqual(["Overview", "RFQs", "Support requests", "Profile", "Settings"]);
});
