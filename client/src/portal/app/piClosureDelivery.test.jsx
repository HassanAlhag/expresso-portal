// PI closure — delivery pages (services, enrollments, content calendar,
// messages, brand kit) follow the API's permissions, and Messages / Brand Kit
// use the internal/external classification instead of a role-name list.
import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { signIn, renderPage, fillApi, setupDom, CUSTOM_INTERNAL, CUSTOM_EXTERNAL } from "./piClosure.test.helpers";
import ServicesPage from "../features/services/pages/ServicesPage";
import EnrollmentDetailsPage from "../features/enrollments/pages/EnrollmentDetailsPage";
import ContentCalendarPage from "../features/social/pages/ContentCalendarPage";
import MessagesPage from "../features/messaging/pages/MessagesPage";
import BrandKitPage from "../features/brand-kit/pages/BrandKitPage";
import ProductionsPage from "../features/productions/pages/ProductionsPage";
import ProductionDetailsPage from "../features/productions/pages/ProductionDetailsPage";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => jest.fn(),
      useParams: () => ({ id: "e1" }),
      useLocation: () => ({ pathname: "/portal", search: "" }),
      useSearchParams: () => [new URLSearchParams(), jest.fn()],
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../features/services/api");
jest.mock("../features/productions/jobs.api");
jest.mock("../features/enrollments/api");
jest.mock("../features/jobs/api");
jest.mock("../features/customers/api");
jest.mock("../features/social/api");
jest.mock("../features/messaging/api");
jest.mock("../features/brand-kit/api");

const productionsApi = require("../features/productions/jobs.api");
const servicesApi = require("../features/services/api");
const enrollmentsApi = require("../features/enrollments/api");
const jobsApi = require("../features/jobs/api");
const customersApi = require("../features/customers/api");
const socialApi = require("../features/social/api");
const messagingApi = require("../features/messaging/api");
const brandApi = require("../features/brand-kit/api");

const service = { _id: "s1", name: "Social Retainer", status: "active" };
const enrollment = { _id: "e1", status: "active", serviceId: { _id: "s1", name: "Social Retainer" }, customerId: { _id: "c1", companyName: "Acme" } };

beforeEach(() => {
  setupDom();
  Element.prototype.scrollIntoView = () => {};
  fillApi(servicesApi, { items: [service], page: 1, pages: 1, total: 1 });
  fillApi(enrollmentsApi, { item: enrollment });
  fillApi(jobsApi, { items: [] });
  fillApi(customersApi, { items: [{ _id: "c1", companyName: "Acme" }] });
  fillApi(socialApi, { items: [] });
  fillApi(messagingApi, { items: [], messages: [] });
  fillApi(brandApi, { items: [] });
});

describe("Services", () => {
  it("services.read only: no New service, Builder, Edit or Archive", async () => {
    signIn({ role: "admin", permissions: ["services.read"] });
    renderPage(<ServicesPage />);
    expect(await screen.findAllByText("Social Retainer")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new service/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /builder/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /archive social retainer/i })).toBeNull();
  });
  it("services.write (custom internal role): create/edit, archive needs services.delete", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["services.read", "services.write"], isInternal: true });
    renderPage(<ServicesPage />);
    expect(await screen.findAllByText("Social Retainer")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /new service/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /archive social retainer/i })).toBeNull();
  });
  it("services.delete: archive offered", async () => {
    signIn({ role: "staff", permissions: ["services.read", "services.delete"] });
    renderPage(<ServicesPage />);
    expect(await screen.findByRole("button", { name: /archive social retainer/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new service/i })).toBeNull();
  });
});

describe("Enrollment details", () => {
  it("enrollments.read only: no generate, delete or status update", async () => {
    signIn({ role: "admin", permissions: ["enrollments.read"] });
    renderPage(<EnrollmentDetailsPage />);
    await waitFor(() => expect(enrollmentsApi.getEnrollment).toHaveBeenCalled());
    // Header actions (back / refresh) render once the record has loaded.
    await waitFor(() => expect(screen.getAllByRole("button").length).toBeGreaterThan(1));
    expect(screen.queryByRole("button", { name: /generate jobs/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete enrollment/i })).toBeNull();
    expect(screen.queryByText(/update status/i)).toBeNull();
  });
  it("jobs.write alone allows Generate jobs (independent of enrollments.write)", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["enrollments.read", "jobs.write"], isInternal: true });
    renderPage(<EnrollmentDetailsPage />);
    expect((await screen.findAllByRole("button", { name: /generate jobs/i })).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /delete enrollment/i })).toBeNull();
  });
  it("enrollments.write without jobs.write: status update but no Generate jobs", async () => {
    signIn({ role: "staff", permissions: ["enrollments.read", "enrollments.write", "enrollments.delete"] });
    renderPage(<EnrollmentDetailsPage />);
    expect(await screen.findByRole("button", { name: /delete enrollment/i })).toBeTruthy();
    expect(screen.getAllByText(/update status/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /generate jobs/i })).toBeNull();
  });
});

describe("Content calendar", () => {
  it("social.metrics.read only: no metrics editing", async () => {
    signIn({ role: "admin", permissions: ["jobs.read", "social.metrics.read"] });
    renderPage(<ContentCalendarPage />);
    await waitFor(() => expect(socialApi.listSocialMetrics).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /add metrics/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit monthly metrics/i })).toBeNull();
  });
  it("social.metrics.write (custom internal role): metrics editing offered", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["jobs.read", "social.metrics.read", "social.metrics.write"], isInternal: true });
    renderPage(<ContentCalendarPage />);
    expect(await screen.findByRole("button", { name: /edit monthly metrics/i })).toBeTruthy();
  });
});

describe("Messages", () => {
  it("custom external role is treated as external: own thread, no client list", async () => {
    signIn({ role: CUSTOM_EXTERNAL, permissions: ["messaging.read", "messaging.write"], isInternal: false, clientId: "c1" });
    renderPage(<MessagesPage />);
    await waitFor(() => expect(messagingApi.listMessages).toHaveBeenCalledWith(expect.objectContaining({ customerId: "c1" })));
    expect(customersApi.listCustomers).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /send message/i })).toBeTruthy();
  });
  it("messaging.read only: can read, cannot send", async () => {
    signIn({ role: CUSTOM_EXTERNAL, permissions: ["messaging.read"], isInternal: false, clientId: "c1" });
    renderPage(<MessagesPage />);
    expect(await screen.findByText(/your role can't send messages/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /send message/i })).toBeNull();
  });
  it("custom internal role is treated as internal: loads the client list", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["messaging.read"], isInternal: true });
    renderPage(<MessagesPage />);
    await waitFor(() => expect(customersApi.listCustomers).toHaveBeenCalled());
  });
});

describe("Brand kit", () => {
  it("custom external role: own company only, no client picker, read-only without brand_kit.write", async () => {
    signIn({ role: CUSTOM_EXTERNAL, permissions: ["brand_kit.read"], isInternal: false, clientId: "c1" });
    renderPage(<BrandKitPage />);
    await waitFor(() => expect(brandApi.listBrandAssets).toHaveBeenCalledWith({ customerId: "c1" }));
    expect(customersApi.listCustomers).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /add asset/i })).toBeNull();
  });
  it("brand_kit.write: Add asset offered", async () => {
    signIn({ role: CUSTOM_EXTERNAL, permissions: ["brand_kit.read", "brand_kit.write"], isInternal: false, clientId: "c1" });
    renderPage(<BrandKitPage />);
    expect((await screen.findAllByRole("button", { name: /add asset/i })).length).toBeGreaterThan(0);
  });
  it("built-in admin without brand_kit.write: read-only", async () => {
    signIn({ role: "admin", permissions: ["brand_kit.read"] });
    renderPage(<BrandKitPage />);
    await waitFor(() => expect(customersApi.listCustomers).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /add asset/i })).toBeNull();
  });
});


describe("Productions workspace backed by Jobs", () => {
  it("on-hold and archived video jobs stay in Done instead of appearing as new briefs", async () => {
    signIn({ role: "staff", permissions: ["jobs.read"], isInternal: true });
    productionsApi.listProductionJobs.mockResolvedValue({ items: [
      { _id: "p1", title: "Held video", type: "video", status: "on_hold" },
      { _id: "p2", title: "Archived video", type: "video", status: "archived" },
    ] });
    renderPage(<ProductionsPage />);
    expect(await screen.findByText("Held video")).toBeTruthy();
    const done = within(screen.getByRole("region", { name: "Done jobs" }));
    expect(done.getByText("Held video")).toBeTruthy();
    expect(done.getByText("Archived video")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Brief jobs" })).queryByText("Held video")).toBeNull();
    expect(productionsApi.listProductionJobs).toHaveBeenCalledWith(expect.objectContaining({ workflowType: "video" }));
  });

  it("the detail tracker recognizes a current shooting job", async () => {
    signIn({ role: "staff", permissions: ["jobs.read"], isInternal: true });
    productionsApi.getProductionJob.mockResolvedValue({ item: { _id: "e1", title: "Video shoot", type: "video", status: "shooting" } });
    renderPage(<ProductionDetailsPage />);
    expect(await screen.findByText("Video shoot")).toBeTruthy();
    expect(screen.getByTitle("Shooting").getAttribute("aria-current")).toBe("step");
  });
});
