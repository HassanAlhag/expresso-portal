import React, { StrictMode, Suspense } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BusinessSuitePage from "./BusinessSuitePage";
import DigitalSolutionDetailPage from "../DigitalSolutions/DigitalSolutionDetailPage";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: jest.fn(),
}), { virtual: true });
jest.mock("./CASPage", () => () => <h1>CAS preserved product page</h1>);
jest.mock("../ITSolutions/ITSolutionDetailsPage", () => () => <h1>Generic CMS product</h1>);

const originalFetch = global.fetch;
const response = (items = []) => ({ ok: true, json: async () => ({ ok: true, items }) });
afterEach(() => { global.fetch = originalFetch; });

test("direct Business Suite slug resolves without a CMS record, and CAS keeps its own page", async () => {
  const router = jest.requireMock("react-router-dom");
  global.fetch = jest.fn().mockResolvedValue(response());
  router.useParams.mockReturnValue({ slug: "business-suite" });
  const view = render(<Suspense fallback={<p>Loading route</p>}><DigitalSolutionDetailPage /></Suspense>);
  expect(await screen.findByRole("heading", { level: 1, name: "Expresso Business Suite" })).toBeTruthy();
  expect(screen.queryByText("Generic CMS product")).toBeNull();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/web-content/solutions?kind=digital"));
  expect(screen.getByRole("link", { name: "Digital Solutions", exact: true }).getAttribute("href")).toBe("/digital-solutions");
  router.useParams.mockReturnValue({ slug: "cas" });
  view.rerender(<Suspense fallback={<p>Loading route</p>}><DigitalSolutionDetailPage /></Suspense>);
  expect(await screen.findByRole("heading", { name: "CAS preserved product page" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Expresso Business Suite" })).toBeNull();
});

test("the product combines responsive sample visuals, seven connected modules and accurate claims", async () => {
  global.fetch = jest.fn().mockResolvedValue(response());
  render(<BusinessSuitePage />);
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  const names = ["CRM", "Projects", "HR & People", "Finance", "Procurement", "Client Portal", "Vendor Portal"];
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(names);
  expect(screen.getAllByRole("tablist")).toHaveLength(1);
  expect(within(screen.getByRole("tabpanel")).getByText("Lead-to-deal and deal-to-client conversion")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Finance" }));
  expect(within(screen.getByRole("tabpanel")).getByText("Outstanding balances and finance statistics")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Finance" }), { key: "End" });
  expect(screen.getByRole("tab", { name: "Vendor Portal" }).getAttribute("aria-selected")).toBe("true");
  expect(within(screen.getByRole("tabpanel")).getByText("Own quotation and status visibility")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Vendor Portal" }), { key: "Home" });
  expect(screen.getByRole("tab", { name: "CRM" }).getAttribute("aria-selected")).toBe("true");
  for (const image of screen.getAllByRole("img")) {
    expect(image.getAttribute("alt")).toMatch(/Illustrative/);
    expect(image.getAttribute("src")).toMatch(/\/images\/products\/business-suite\//);
  }
  expect(screen.getByRole("link", { name: "Explore modules", exact: true }).getAttribute("href")).toBe("#modules");
  expect(screen.getByRole("region", { name: "Business Suite modules and workflows" }).getAttribute("id")).toBe("modules");
  expect(screen.getByText("CRM + Projects")).toBeTruthy();
  expect(screen.getByText("Procurement + Vendor Portal")).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/payroll|full accounting|reconciliation|supplier payments|inventory|performance AI/i);
});

test("demo actions use one consistent label, and the final CTA has a single action", async () => {
  global.fetch = jest.fn().mockResolvedValue(response());
  render(<BusinessSuitePage />);
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  const demos = screen.getAllByRole("link", { name: /business suite demo/i });
  expect(demos).toHaveLength(2);
  for (const link of demos) {
    expect(link.textContent).toBe("Request a Business Suite Demo");
    expect(link.getAttribute("href")).toBe("/contact-us?interest=business-suite-demo");
  }
  const closing = screen.getByRole("region", { name: "Build the Business Suite around your operation." });
  expect(within(closing).getByText("Ready to get started?")).toBeTruthy();
  expect(within(closing).getByText("Start with the modules you need today and expand as your business grows.")).toBeTruthy();
  // One action, followed only by the two navigation links below the card.
  expect(within(closing).getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Request a Business Suite Demo", "All Digital Solutions", "Looking for clinic software? Explore CAS →",
  ]);
  expect(screen.queryByRole("link", { name: /talk to expresso/i })).toBeNull();
});

test("published Suite blocks and metadata replace defaults on the real product presentation", async () => {
  const suite = { slug: "business-suite", kind: "digital", title: "Expresso Business Suite for teams", tagline: "Approved introduction", description: "Approved modular description", heroImageUrl: "/approved-suite.webp", demoCtaHref: "/contact-us?interest=walkthrough", demoCtaLabel: "Book a walkthrough", blocks: [{ type: "useCases", title: "CRM", subtitle: "Customer workspace", items: ["Company contacts"] }] };
  global.fetch = jest.fn().mockResolvedValue(response([suite, suite]));
  render(<BusinessSuitePage />);
  expect(await screen.findByRole("heading", { level: 1, name: suite.title })).toBeTruthy();
  expect(screen.getAllByRole("tab")).toHaveLength(1);
  expect(within(screen.getByRole("tabpanel")).getByText("Company contacts")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Expresso Business Suite product view" }).getAttribute("src")).toBe(suite.heroImageUrl);
  expect(screen.getAllByRole("link", { name: suite.demoCtaLabel }).every((link) => link.getAttribute("href") === suite.demoCtaHref)).toBe(true);
  expect(screen.getAllByRole("link").every((link) => !link.getAttribute("href").startsWith("/portal"))).toBe(true);
});

test.each([
  ["CRM", "crm"], ["Projects", "projects"], ["HR & People", "hr"],
  ["Finance", "finance"], ["Procurement", "procurement"],
  ["Client Portal", "client-portal"], ["Vendor Portal", "vendor-portal"],
])("%s keeps its capability copy and has its own coordinated product visual", async (name, view) => {
  global.fetch = jest.fn().mockResolvedValue(response());
  render(<BusinessSuitePage />);
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  fireEvent.click(screen.getByRole("tab", { name, exact: true }));
  const panel = screen.getByRole("tabpanel", { name, exact: true });
  expect(within(panel).getByRole("img").getAttribute("src")).toBe(`/images/products/business-suite/${view}-desktop.svg`);
  expect(within(panel).getByRole("img").getAttribute("alt")).toMatch(/^Illustrative Expresso/);
  expect(within(panel).getAllByRole("listitem")).toHaveLength(3);
});

test("visual workflows, platform relationships, People and combinations preserve the approved content", async () => {
  global.fetch = jest.fn().mockResolvedValue(response());
  render(<BusinessSuitePage />);
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  const delivery = screen.getByRole("list", { name: "From the first conversation to the invoice." });
  expect(within(delivery).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "LeadCapture an enquiry.", "DealDevelop the opportunity.", "ClientConvert the relationship.",
    "ProjectOrganise the delivery.", "InvoiceBill for the work.",
  ]);
  const sourcing = screen.getByRole("list", { name: "From a requirement to an award." });
  expect(within(sourcing).getAllByRole("listitem")).toHaveLength(4);
  const platform = screen.getByRole("list", { name: "Connected platform relationships" });
  for (const name of ["CRM → Clients → Projects → Billing", "Procurement ↔ Vendors / RFQs", "HR & People ↔ Internal operations"]) {
    expect(within(platform).getByRole("heading", { name, exact: true })).toBeTruthy();
  }
  const people = screen.getByRole("region", { name: "One team. Everyday needs connected." });
  expect(within(people).getByRole("img").getAttribute("src")).toBe("/images/products/business-suite/hr-detail.svg");
  for (const name of ["Leave", "Expenses", "Goals"]) expect(within(people).getByRole("heading", { name })).toBeTruthy();
  const combinations = screen.getByRole("region", { name: "Choose the modules that fit your operation." });
  for (const name of ["CRM + Projects", "HR + Finance", "Procurement + Vendor Portal", "Full Business Suite"]) {
    expect(within(combinations).getByRole("heading", { name, exact: true })).toBeTruthy();
  }
  expect(within(combinations).getByText("These are illustrative combinations, not fixed packages or prices.", { exact: false })).toBeTruthy();
});

test("API failure preserves the core product and exposes a retry rather than a missing product", async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new TypeError("Offline")).mockResolvedValue(response());
  render(<BusinessSuitePage />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 1, name: "Expresso Business Suite" })).toBeTruthy();
  expect(screen.getAllByRole("tab")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
});

test("Strict Mode cleanup ignores old detail responses after unmount and remount", async () => {
  const requests = [];
  global.fetch = jest.fn(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  const view = render(<StrictMode><BusinessSuitePage /></StrictMode>);
  view.unmount();
  render(<StrictMode><BusinessSuitePage /></StrictMode>);
  await act(async () => {
    requests[0].reject(new TypeError("Old failure"));
    requests[1].resolve(response([{ slug: "business-suite", kind: "digital", title: "Stale title" }]));
    requests[2].reject(new TypeError("Cleaned-up effect"));
    requests[3].resolve(response());
  });
  expect(screen.getByRole("heading", { level: 1, name: "Expresso Business Suite" })).toBeTruthy();
  expect(screen.queryByText("Stale title")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});
