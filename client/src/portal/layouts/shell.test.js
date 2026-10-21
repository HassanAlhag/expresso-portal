// PUI-1 — production application shell: permission-aware navigation,
// workspace lenses, collapse, mobile drawer, menus and the page frame.
// Shell state is exposed as data attributes on layout elements, so these
// tests read the DOM directly; act() flushes the shell's async /auth/me call.
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-unnecessary-act */
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PortalLayout from "./PortalLayout";
import PageFrame from "../shared/ui/PageFrame";
import { getNavSectionsByRole, getWorkspaceKind, getRouteCrumbs } from "../app/portalNav";
import { isAllowed } from "../app/ProtectedRoute";

// react-router-dom v7 can't be resolved by this Jest setup; a small stand-in
// keeps the components' real routing calls (NavLink active state, Link).
let mockPath = "/portal";
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    const isActive = (to, end) => (end ? mockPath === to : mockPath === to || mockPath.startsWith(to + "/"));
    return {
      useLocation: () => ({ pathname: mockPath }),
      useNavigate: () => mockNavigate,
      Navigate: () => null,
      Outlet: () => React.createElement("div", { "data-testid": "outlet" }, "page"),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
      NavLink: ({ to, end, children, className, onClick, ...rest }) => {
        const active = isActive(to, end);
        return React.createElement(
          "a",
          { href: to, onClick, className: typeof className === "function" ? className({ isActive: active }) : className, "aria-current": active ? "page" : undefined, ...rest },
          children
        );
      },
    };
  },
  { virtual: true }
);
jest.mock("../features/messaging/api", () => ({ getNotificationCounts: jest.fn(() => Promise.resolve({ unreadMessages: 2 })) }));
jest.mock("../features/jobs/api", () => ({ listJobs: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../shared/api/auth.api", () => ({ me: jest.fn() }));

const { me } = require("../shared/api/auth.api");

function setViewport(drawer) {
  window.matchMedia = (q) => ({
    matches: drawer && q.includes("max-width: 960px"),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}

const labels = (container) => [...container.querySelectorAll(".px-nav-item .px-nav-text")].map((n) => n.textContent);

beforeEach(() => {
  mockPath = "/portal";
  localStorage.clear();
  setViewport(false);
});

describe("navigation follows the real role and permissions", () => {
  test("staff see only the modules their permissions allow", () => {
    const sections = getNavSectionsByRole("staff", ["projects.read", "tickets.read"]);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="staff" />);
    const items = labels(container);
    expect(items).toEqual(expect.arrayContaining(["Dashboard", "Projects", "Tickets"]));
    expect(items).not.toEqual(expect.arrayContaining(["Leads"]));
    expect(items).not.toContain("Users");
    expect(items).not.toContain("Billing");
  });

  test("client roles never see internal modules, even if a permission was granted", () => {
    const sections = getNavSectionsByRole("client", ["projects.read", "billing.read", "tickets.read", "crm.read", "iam.users.read"]);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="client" user={{ fullName: "Omar Saleh" }} />);
    const items = labels(container);
    expect(items).toEqual(expect.arrayContaining(["Projects", "Billing", "Tickets"]));
    expect(items).not.toContain("Leads");
    expect(items).not.toContain("Users");
    expect(screen.getByText("Client workspace")).toBeTruthy();
  });

  test("vendors get the vendor navigation and workspace", () => {
    const sections = getNavSectionsByRole("vendor", ["procurement.read"]);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="vendor" user={{ fullName: "Sara Rahman" }} />);
    const items = labels(container);
    expect(items).toContain("RFQs");
    expect(items).not.toContain("Projects");
    expect(items).not.toContain("Clients");
    expect(screen.getByText("Vendor workspace")).toBeTruthy();
  });

  test("workspace lens comes from the signed-in user", () => {
    expect(getWorkspaceKind({ role: "super_admin" })).toBe("staff");
    expect(getWorkspaceKind({ role: "project_manager", isInternal: true })).toBe("staff");
    expect(getWorkspaceKind({ role: "client" })).toBe("client");
    expect(getWorkspaceKind({ role: "acme_custom", isInternal: false })).toBe("client");
    expect(getWorkspaceKind({ role: "vendor" })).toBe("vendor");
  });

  test("hiding items does not replace route guards: direct URLs stay protected", () => {
    localStorage.setItem("portal_user", JSON.stringify({ role: "client", permissions: ["crm.read"], isInternal: false }));
    localStorage.setItem("portal_permissions", JSON.stringify(["crm.read"]));
    expect(isAllowed("client", "/portal/crm")).toBe(false);
    localStorage.setItem("portal_user", JSON.stringify({ role: "vendor", permissions: ["procurement.read"], isInternal: false }));
    localStorage.setItem("portal_permissions", JSON.stringify(["procurement.read"]));
    expect(isAllowed("vendor", "/portal/procurement/vendors")).toBe(false);
  });
});

describe("sidebar behaviour", () => {
  test("the current page is marked active, including detail pages", () => {
    mockPath = "/portal/projects/abc123";
    const sections = getNavSectionsByRole("staff", ["projects.read", "customers.read"]);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="staff" />);
    const active = container.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain("Projects");
  });

  test("collapsed rail keeps every item understandable (accessible name and tooltip)", () => {
    const sections = getNavSectionsByRole("staff", ["projects.read"]);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="staff" collapsed onToggleCollapsed={() => {}} />);
    const link = container.querySelector('a[href="/portal/projects"]');
    expect(link.getAttribute("aria-label")).toBe("Projects");
    expect(link.querySelector(".px-tip").textContent).toBe("Projects");
    const toggle = screen.getByRole("button", { name: "Expand sidebar" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  test("groups can be folded with an accessible toggle", () => {
    const sections = getNavSectionsByRole("super_admin", []);
    const { container } = render(<Sidebar id="s" navSections={sections} workspace="staff" />);
    const crm = screen.getByRole("button", { name: "CRM" });
    const list = container.querySelector(`#${crm.getAttribute("aria-controls")}`);
    const before = crm.getAttribute("aria-expanded");
    fireEvent.click(crm);
    expect(crm.getAttribute("aria-expanded")).not.toBe(before);
    expect(list.hidden).toBe(crm.getAttribute("aria-expanded") === "false");
  });
});

describe("shell", () => {
  const staffUser = { fullName: "Layla Haddad", role: "project_manager", isInternal: true, permissions: ["projects.read", "tickets.read"], email: "layla@expresso.example" };

  async function renderShell(user = staffUser) {
    localStorage.setItem("portal_user", JSON.stringify(user));
    me.mockResolvedValue({ user });
    let utils;
    await act(async () => {
      utils = render(<PortalLayout />);
    });
    return utils;
  }

  test("desktop: collapse toggles the icon rail and is remembered", async () => {
    const { container } = await renderShell();
    const shell = container.querySelector(".px-shell");
    expect(shell.getAttribute("data-collapsed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(shell.getAttribute("data-collapsed")).toBe("true");
    expect(localStorage.getItem("portal_nav_collapsed")).toBe("1");
  });

  test("mobile: the drawer opens from the menu button, closes on Escape and returns focus", async () => {
    setViewport(true);
    const { container } = await renderShell();
    const shell = container.querySelector(".px-shell");
    const side = container.querySelector(".px-side");
    expect(side.getAttribute("aria-hidden")).toBe("true");
    const menuBtn = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menuBtn);
    expect(shell.getAttribute("data-nav-open")).toBe("true");
    expect(menuBtn.getAttribute("aria-expanded")).toBe("true");
    expect(side.getAttribute("aria-hidden")).toBe(null);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(shell.getAttribute("data-nav-open")).toBe("false");
    expect(document.activeElement).toBe(menuBtn);
  });

  test("account menu works from the keyboard and closes with Escape", async () => {
    await renderShell();
    const trigger = screen.getByRole("button", { name: "Account: Layla Haddad" });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const menu = screen.getByRole("menu", { name: "Account" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Your profile", "Settings", "Sign out"]);
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Account" })).toBe(null);
    expect(document.activeElement).toBe(trigger);
  });

  test("search and notifications are entry points only", async () => {
    await renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Search (coming soon)" }));
    expect(screen.getByRole("dialog", { name: "Search" }).textContent).toMatch(/planned/);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    expect(screen.getByRole("menu", { name: "Notifications" }).textContent).toMatch(/notification centre is planned/);
  });

  test("the contextual action follows permissions", async () => {
    await renderShell();
    expect(screen.getByRole("link", { name: /New ticket/ })).toBeTruthy();
  });

  test("no ticket permission, no ticket action", async () => {
    await renderShell({ ...staffUser, permissions: ["projects.read"] });
    expect(screen.queryByRole("link", { name: /New ticket/ })).toBe(null);
  });

  test("workspace lens is set on the shell for clients and vendors", async () => {
    const { container, unmount } = await renderShell({ fullName: "Omar Saleh", role: "client", isInternal: false, permissions: ["projects.read", "tickets.read"] });
    expect(container.querySelector(".portal-app").getAttribute("data-workspace")).toBe("client");
    expect(screen.getByRole("link", { name: /Get help/ })).toBeTruthy();
    unmount();
    const view = await renderShell({ fullName: "Sara Rahman", role: "vendor", isInternal: false, permissions: ["procurement.read"] });
    expect(view.container.querySelector(".portal-app").getAttribute("data-workspace")).toBe("vendor");
  });

  test("the prototype's persona switcher and controls are not in production", async () => {
    const { container } = await renderShell();
    expect(container.textContent).not.toMatch(/View as|Prototype/);
    expect(container.querySelector("[data-proto-persona], .proto")).toBe(null);
    const src = fs.readFileSync(path.join(__dirname, "PortalLayout.jsx"), "utf8") + fs.readFileSync(path.join(__dirname, "Topbar.jsx"), "utf8");
    expect(src).not.toMatch(/data-proto|persona switch/i);
  });

  test("a skip link leads to the main content", async () => {
    const { container } = await renderShell();
    expect(container.querySelector('a.px-skip[href="#px-main"]')).toBeTruthy();
    expect(container.querySelector("main#px-main")).toBeTruthy();
  });
});

describe("top bar context", () => {
  test("breadcrumbs come from the route when the page sets none", () => {
    const sections = getNavSectionsByRole("super_admin", []);
    expect(getRouteCrumbs("/portal/projects", sections)).toEqual([{ label: "Projects" }]);
    expect(getRouteCrumbs("/portal/crm/leads", sections)).toEqual([{ label: "CRM" }, { label: "Leads" }]);
    expect(getRouteCrumbs("/portal/projects/123", sections).at(-1)).toEqual({ label: "Details" });
  });

  test("top bar renders the breadcrumb with the current page marked", () => {
    mockPath = "/portal/crm/leads";
    const sections = getNavSectionsByRole("super_admin", []);
    render(<Topbar user={{ fullName: "A B" }} workspace="staff" navSections={sections} onOpenNav={() => {}} onLogout={() => {}} />);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByText("Leads").getAttribute("aria-current")).toBe("page");
  });
});

describe("page frame", () => {
  test("renders title, description and actions", () => {
    render(<PageFrame title="Projects" description="All delivery." primaryAction={<button>New project</button>} secondaryActions={<button>Refresh</button>}>content</PageFrame>);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeTruthy();
    expect(screen.getByText("All delivery.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New project" })).toBeTruthy();
    expect(screen.getByText("content")).toBeTruthy();
  });

  test("loading, error and empty states", () => {
    const retry = jest.fn();
    const { rerender } = render(<PageFrame title="X" loading>content</PageFrame>);
    expect(screen.getByRole("status")).toBeTruthy();
    rerender(<PageFrame title="X" error onRetry={retry}>content</PageFrame>);
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: /Try again/ }));
    expect(retry).toHaveBeenCalled();
    rerender(<PageFrame title="X" isEmpty empty={{ title: "No projects yet", message: "Create one." }}>content</PageFrame>);
    expect(screen.getByText("No projects yet")).toBeTruthy();
    expect(screen.queryByText("content")).toBe(null);
  });
});
