// R4-A access consistency (P3-5 / P3-6). The UI follows the API rule: only
// super_admin bypasses; admin and custom roles need the permission. The
// session is refreshed from /auth/me on focus and access decisions follow it.
/* eslint-disable testing-library/no-unnecessary-act */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import ProtectedRoute, { isAllowed } from "./ProtectedRoute";
import { getNavSectionsByRole } from "./portalNav";
import PortalLayout, { SESSION_REFRESH_MS } from "../layouts/PortalLayout";
import { useAccess } from "../shared/hooks/useAccess";
import { ToastProvider } from "../shared/ui/Toast";
import FilesPage from "../features/files/pages/FilesPage";
import TicketDetailsPage from "../features/tickets/pages/TicketDetailsPage";

let mockPath = "/portal";
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useLocation: () => ({ pathname: mockPath }),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: "t1" }),
      Navigate: ({ to }) => React.createElement("div", { "data-testid": "redirect", "data-to": to }),
      Outlet: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
      NavLink: ({ to, children, className, end, ...rest }) =>
        React.createElement("a", { href: to, className: typeof className === "function" ? className({ isActive: false }) : className, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../shared/api/auth.api", () => ({ me: jest.fn() }));
jest.mock("../features/messaging/api", () => ({ getNotificationCounts: jest.fn() }));
jest.mock("../features/jobs/api", () => ({ listJobs: jest.fn() }));
jest.mock("../features/files/api", () => ({
  listFiles: jest.fn(), uploadFiles: jest.fn(), updateFile: jest.fn(), deleteFile: jest.fn(), openFile: jest.fn(),
}));
jest.mock("../features/tickets/api", () => ({
  getTicket: jest.fn(), addTicketComment: jest.fn(), updateTicketStatus: jest.fn(), approveTicket: jest.fn(), updateTicket: jest.fn(), deleteTicket: jest.fn(),
}));
jest.mock("../features/iam/users/api", () => ({ listUsers: jest.fn() }));
const { me } = require("../shared/api/auth.api");

// CRA resets mock implementations before every test, so set them here.
function mockApis() {
  require("../features/messaging/api").getNotificationCounts.mockResolvedValue({ unreadMessages: 0 });
  require("../features/jobs/api").listJobs.mockResolvedValue({ items: [] });
  require("../features/files/api").listFiles.mockResolvedValue({
    items: [{ _id: "f1", originalName: "brief.pdf", visibility: "internal", createdAt: "2026-10-01T00:00:00Z" }], page: 1, pages: 1, total: 1,
  });
  require("../features/tickets/api").getTicket.mockResolvedValue({
    item: { _id: "t1", title: "Sample request", status: "open", type: "support", comments: [] },
  });
  require("../features/iam/users/api").listUsers.mockResolvedValue({ users: [] });
}

const token = (role) => `x.${btoa(JSON.stringify({ id: "u1", role }))}.y`;
function signIn(user, tokenRole = user.role) {
  localStorage.setItem("portal_token", token(tokenRole));
  localStorage.setItem("portal_user", JSON.stringify(user));
  localStorage.setItem("portal_permissions", JSON.stringify(user.permissions || []));
}
const guarded = (path) => {
  mockPath = path;
  return render(<ProtectedRoute><p>page content</p></ProtectedRoute>);
};
const allowed = () => Boolean(screen.queryByText("page content")) && !screen.queryByTestId("redirect");
const navLabels = (role, perms, isInternal = true) =>
  getNavSectionsByRole(role, perms, isInternal).flatMap((s) => s.items.map((i) => i.label));
// Every permission any staff menu item needs: what the default admin holds for navigation purposes.
const STAFF_MENU_PERMS = [...new Set(getNavSectionsByRole("super_admin", []).flatMap((s) => s.items.map((i) => i.permission)).filter(Boolean))];

beforeEach(() => {
  localStorage.clear();
  mockPath = "/portal";
  mockApis();
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} });
});
afterEach(() => jest.restoreAllMocks());

// ═══ ProtectedRoute ══════════════════════════════════════════════════════════
describe("ProtectedRoute", () => {
  test("super_admin passes without listed permissions", () => {
    signIn({ role: "super_admin", permissions: [], isInternal: true });
    guarded("/portal/billing");
    expect(allowed()).toBe(true);
  });
  test("a default admin holding the permission passes", () => {
    signIn({ role: "admin", permissions: STAFF_MENU_PERMS, isInternal: true });
    guarded("/portal/billing");
    expect(allowed()).toBe(true);
  });
  test("a restricted admin without the permission is redirected (no role-name bypass)", () => {
    signIn({ role: "admin", permissions: ["projects.read"], isInternal: true });
    guarded("/portal/billing");
    expect(screen.getByTestId("redirect").getAttribute("data-to")).toBe("/portal");
  });
  test("a custom internal role with the permission passes; without it, it is redirected", () => {
    signIn({ role: "delivery_lead", permissions: ["projects.read"], isInternal: true });
    guarded("/portal/projects");
    expect(allowed()).toBe(true);
  });
  test("a custom internal role without the permission is redirected", () => {
    signIn({ role: "delivery_lead", permissions: ["projects.read"], isInternal: true });
    guarded("/portal/billing");
    expect(screen.getByTestId("redirect")).toBeTruthy();
  });
  test("the refreshed stored role wins over a stale token role", () => {
    // Signed in as admin; the role was since changed to a limited custom role.
    signIn({ role: "delivery_lead", permissions: ["projects.read"], isInternal: true }, "super_admin");
    guarded("/portal/billing");
    expect(screen.getByTestId("redirect")).toBeTruthy();
  });
  test("external persona rules still apply", () => {
    signIn({ role: "client", permissions: ["crm.read", "projects.read"], isInternal: false });
    expect(isAllowed("client", "/portal/crm")).toBe(false);
    expect(isAllowed("client", "/portal/projects")).toBe(true);
  });
});

// ═══ Navigation ══════════════════════════════════════════════════════════════
describe("navigation", () => {
  test("a default admin sees the same menu as super_admin (no practical regression)", () => {
    expect(navLabels("admin", STAFF_MENU_PERMS)).toEqual(navLabels("super_admin", []));
  });
  test("a restricted admin only sees what its permissions allow", () => {
    const labels = navLabels("admin", ["projects.read", "tickets.read"]);
    expect(labels).toContain("Projects");
    expect(labels).not.toContain("Users");
    expect(labels).not.toContain("Roles");
    expect(labels.length).toBeLessThan(navLabels("super_admin", []).length);
  });
  test("custom internal roles are filtered by permission", () => {
    const labels = navLabels("delivery_lead", ["projects.read"]);
    expect(labels).toContain("Projects");
    expect(labels).not.toContain("Users");
  });
});

// ═══ Menu / route alignment ══════════════════════════════════════════════════
describe("menu and route agree", () => {
  test("website editors: read access shows the menu items and opens the pages", () => {
    signIn({ role: "web_reader", permissions: ["website.read"], isInternal: true });
    const labels = navLabels("web_reader", ["website.read"]);
    expect(labels).toEqual(expect.arrayContaining(["Digital Services", "Tech Solutions"]));
    expect(isAllowed("web_reader", "/portal/website/digital-services")).toBe(true);
    expect(isAllowed("web_reader", "/portal/website/solutions")).toBe(true);
  });
  test("Skill Matrix needs hr.staff.read in both the menu and the route", () => {
    signIn({ role: "scorer", permissions: ["hr.scorecards.read"], isInternal: true });
    expect(navLabels("scorer", ["hr.scorecards.read"])).not.toContain("Skill Matrix");
    expect(isAllowed("scorer", "/portal/hr/skills")).toBe(false);
    signIn({ role: "hr_reader", permissions: ["hr.staff.read"], isInternal: true });
    expect(navLabels("hr_reader", ["hr.staff.read"])).toContain("Skill Matrix");
    expect(isAllowed("hr_reader", "/portal/hr/skills")).toBe(true);
  });
});

// ═══ Delete actions follow the API permission ════════════════════════════════
describe("delete actions", () => {
  const renderPage = (Page) => render(<ToastProvider><Page /></ToastProvider>);

  test("staff Files: Delete appears only with files.delete", async () => {
    signIn({ role: "delivery_lead", permissions: ["files.read"], isInternal: true });
    const view = renderPage(FilesPage);
    await screen.findAllByText("brief.pdf");
    expect(screen.queryByTitle("Delete")).toBeNull();
    view.unmount();
    signIn({ role: "delivery_lead", permissions: ["files.read", "files.delete"], isInternal: true });
    renderPage(FilesPage);
    await screen.findAllByText("brief.pdf");
    expect(screen.getByTitle("Delete")).toBeTruthy();
  });

  test("staff ticket: Delete follows tickets.delete, not the super_admin name", async () => {
    signIn({ role: "admin", permissions: ["tickets.read", "tickets.write", "tickets.delete"], isInternal: true });
    const view = renderPage(TicketDetailsPage);
    await screen.findByText("Sample request");
    expect(screen.getByTitle("Delete ticket")).toBeTruthy();
    view.unmount();
    signIn({ role: "admin", permissions: ["tickets.read", "tickets.write"], isInternal: true });
    renderPage(TicketDetailsPage);
    await screen.findByText("Sample request");
    expect(screen.queryByTitle("Delete ticket")).toBeNull();
  });
});

// ═══ Permission refresh on focus ═════════════════════════════════════════════
function Probe() {
  const access = useAccess();
  return <span data-testid="probe">{access.can("billing.read") ? "billing:yes" : "billing:no"}</span>;
}

test("focus refresh: new permissions from /auth/me reach useAccess, throttled to about once a minute", async () => {
  const before = { _id: "u1", role: "finance_lead", permissions: ["projects.read"], isInternal: true };
  const after = { ...before, permissions: ["projects.read", "billing.read"] };
  signIn(before);
  me.mockResolvedValue({ user: before });
  let now = 1_000_000;
  jest.spyOn(Date, "now").mockImplementation(() => now);

  render(<><PortalLayout /><Probe /></>);
  await waitFor(() => expect(me).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId("probe").textContent).toBe("billing:no");

  // Within the throttle window: no request.
  me.mockResolvedValue({ user: after });
  now += 5_000;
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(me).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("probe").textContent).toBe("billing:no");

  // After the window: one refresh, and access decisions update.
  now += SESSION_REFRESH_MS;
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("billing:yes"));
  expect(me).toHaveBeenCalledTimes(2);
  expect(JSON.parse(localStorage.getItem("portal_permissions"))).toContain("billing.read");

  // A second focus straight after does not call the API again.
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(me).toHaveBeenCalledTimes(2);
});
