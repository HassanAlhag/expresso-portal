// PUI-5 — Client portal: overview, support requests, files, navigation.
// The API is the boundary (company scoping, no internal tickets or notes);
// these tests check the portal asks only for what the user may see, shows
// nothing staff-only, and never turns a failed request into zero.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "t1" };
let mockSearch = new URLSearchParams();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useSearchParams: () => [mockSearch, (p) => { mockSearch = new URLSearchParams(p); }],
      useLocation: () => ({ pathname: "/portal" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../../tickets/api", () => ({ getTicketStats: jest.fn(), listTickets: jest.fn(), createTicket: jest.fn(), getTicket: jest.fn(), updateTicket: jest.fn(), addTicketComment: jest.fn() }));
jest.mock("../../projects/api", () => ({ listProjects: jest.fn() }));
jest.mock("../../billing/api", () => ({ getBillingStats: jest.fn() }));
jest.mock("../../files/api", () => ({ listFiles: jest.fn(), uploadFiles: jest.fn(), openFile: jest.fn() }));
jest.mock("../../jobs/api", () => ({ listJobs: jest.fn() }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const tickets = require("../../tickets/api");
const projects = require("../../projects/api");
const billing = require("../../billing/api");
const files = require("../../files/api");
const jobs = require("../../jobs/api");
const ClientDashboard = require("./ClientDashboard").default;
const { loadClientOverview, deriveClientOverview } = require("./clientOverview");
const ClientTicketsList = require("../../tickets/client/ClientTicketsList").default;
const ClientTicketDetail = require("../../tickets/client/ClientTicketDetail").default;
const ClientFiles = require("../../files/client/ClientFiles").default;
const { getNavSectionsByRole } = require("../../../app/portalNav");
const { CommandBarProvider, useCommandBar } = require("../../../shared/ui/CommandBar");
const { makeAccess } = require("../../../shared/hooks/useAccess");

const CLIENT = ["projects.read", "files.read", "files.write", "billing.read", "tickets.read", "tickets.write", "messaging.read", "messaging.write", "brand_kit.read"];
function signIn(role = "client", permissions = CLIENT, extra = {}) {
  const user = { _id: "me", fullName: "Omar Saleh", role, permissions, isInternal: false, clientId: "c1", ...extra };
  localStorage.setItem("portal_user", JSON.stringify(user));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
  return makeAccess(user);
}
const listOf = (items, total = items.length) => ({ ok: true, items, total, page: 1, pages: 1, limit: 12 });
const ticket = (over = {}) => ({ _id: "t1", ref: "TKT-0007", type: "support", title: "Contact form broken", description: "It shows an error.", status: "waiting_client", priority: "medium", createdAt: "2026-10-01T09:00:00Z", lastActivityAt: "2026-10-20T09:00:00Z", comments: [], ...over });

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "t1" };
  mockSearch = new URLSearchParams();
  tickets.getTicketStats.mockResolvedValue({ ok: true, byStatus: { open: 1, waiting_client: 2, resolved: 4, closed: 1 } });
  tickets.listTickets.mockImplementation((p) => Promise.resolve(listOf(p.status === "waiting_client" ? [ticket()] : [ticket(), ticket({ _id: "t2", title: "New page", status: "in_progress" })], p.status === "waiting_client" ? 2 : 8)));
  projects.listProjects.mockResolvedValue(listOf([{ _id: "p1", name: "Website rebuild", status: "active" }], 3));
  billing.getBillingStats.mockResolvedValue({ ok: true, byStatus: { sent: { count: 2 }, overdue: { count: 1 }, paid: { count: 9 } } });
  files.listFiles.mockResolvedValue(listOf([{ _id: "f1", title: "Brand guide", createdAt: "2026-10-02T00:00:00Z" }], 14));
});

describe("Client overview", () => {
  test("asks only for what the client may see; counts come from stats and list totals", async () => {
    const access = signIn();
    const data = await loadClientOverview(access);
    expect(jobs.listJobs).not.toHaveBeenCalled(); // no jobs.read
    const view = deriveClientOverview(data);
    const m = Object.fromEntries(view.metrics.map((x) => [x.key, x]));
    expect(m.projects.value).toBe(3); // list total, not the 1 loaded row
    expect(m.tickets.value).toBe(3); // open + waiting_client from stats
    expect(m.tickets.note).toBe("2 waiting for you");
    expect(m.invoices.value).toBe(3); // sent + overdue counts, no money totals
    expect(m.invoices.note).toBe("1 overdue");
    expect(m.files.value).toBe(14);
    expect(view.attention.map((a) => a.title)).toEqual(expect.arrayContaining(["Contact form broken", "1 invoice overdue"]));
  });

  test("a failed source shows a dash, never zero", async () => {
    const access = signIn();
    billing.getBillingStats.mockRejectedValue(new Error("down"));
    const view = deriveClientOverview(await loadClientOverview(access));
    expect(view.metrics.find((x) => x.key === "invoices").value).toBe("—");
    expect(view.failed).toEqual(["billing"]);
  });

  test("renders the briefing, needs-attention and shortcuts the client may use", async () => {
    signIn("client", ["tickets.read", "projects.read"]);
    await act(async () => {
      render(<ClientDashboard />);
    });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/2 support requests are waiting for your reply/);
    expect(screen.getByRole("region", { name: "Your summary" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /New support request/ })).toBe(null); // no tickets.write
    expect(screen.queryByText(/Shared documents/)).toBe(null); // no files.read
    expect(billing.getBillingStats).not.toHaveBeenCalled();
  });
});

describe("Support requests (client view)", () => {
  test("lists the company's requests with counts from the stats endpoint", async () => {
    signIn();
    await act(async () => {
      render(<ClientTicketsList />);
    });
    const summary = screen.getByRole("region", { name: "Your requests" });
    expect(within(summary).getByText("5")).toBeTruthy(); // resolved + closed
    await interact(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "waiting_client" } }));
    expect(tickets.listTickets.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 12, sort: "-lastActivityAt", status: "waiting_client" });
  });

  test("a new request offers only external kinds and sends no staff fields", async () => {
    signIn();
    tickets.createTicket.mockResolvedValue({ ok: true, item: { _id: "t9" } });
    await act(async () => {
      render(<ClientTicketsList />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /New request/ })));
    const dialog = screen.getByRole("dialog", { name: "New support request" });
    const kinds = [...within(dialog).getByLabelText("Kind of request").options].map((o) => o.value);
    expect(kinds).toEqual(["support", "change_request", "procurement"]);
    fireEvent.change(within(dialog).getByLabelText(/Subject/), { target: { value: "Logo is blurry" } });
    fireEvent.change(within(dialog).getByLabelText(/Details/), { target: { value: "On the home page." } });
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: /Send request/ })));
    const payload = tickets.createTicket.mock.calls[0][0];
    expect(payload).toEqual({ type: "support", title: "Logo is blurry", description: "On the home page.", category: "general", priority: "medium" });
    expect(mockNavigate).toHaveBeenCalledWith("/portal/tickets/t9");
  });

  test("detail: the conversation, a reply sent once, and no staff controls", async () => {
    signIn();
    let release;
    tickets.getTicket.mockResolvedValue({ ok: true, item: ticket({ assigneeId: { fullName: "Mona Ali" }, comments: [{ _id: "c1", body: "Can you share a screenshot?", authorRole: "admin", authorId: "u5", visibility: "client", createdAt: "2026-10-19T00:00:00Z" }, { _id: "c2", body: "Staff-only note", authorRole: "admin", authorId: "u5", visibility: "internal" }] }) });
    tickets.addTicketComment.mockImplementation(() => new Promise((r) => (release = () => r({ ok: true }))));
    await act(async () => {
      render(<ClientTicketDetail />);
    });
    expect(screen.getByText("Expresso is waiting for your reply")).toBeTruthy();
    expect(screen.getByText("Can you share a screenshot?")).toBeTruthy();
    expect(screen.queryByText("Staff-only note")).toBe(null);
    expect(screen.queryByText(/Take ownership|Change status|Assign/)).toBe(null);
    fireEvent.change(screen.getByLabelText("Your reply"), { target: { value: "Attached." } });
    const send = screen.getByRole("button", { name: /Send reply/ });
    await act(async () => {
      fireEvent.click(send);
      fireEvent.click(send);
    });
    await act(async () => release());
    expect(tickets.addTicketComment).toHaveBeenCalledTimes(1);
    expect(tickets.addTicketComment).toHaveBeenCalledWith("t1", { body: "Attached." });
  });

  test("detail: another company's request reads as not found (no existence leak)", async () => {
    signIn();
    tickets.getTicket.mockRejectedValue({ response: { status: 403, data: { message: "Forbidden" } } });
    await act(async () => {
      render(<ClientTicketDetail />);
    });
    expect(screen.getByText("Request not found")).toBeTruthy();
  });

  test("detail: a resolved request can be rated", async () => {
    signIn();
    tickets.getTicket.mockResolvedValue({ ok: true, item: ticket({ status: "resolved", resolution: "Fixed the form." }) });
    tickets.updateTicket.mockResolvedValue({ ok: true });
    await act(async () => {
      render(<ClientTicketDetail />);
    });
    expect(screen.getByText("Fixed the form.")).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "4 of 5" })));
    expect(tickets.updateTicket).toHaveBeenCalledWith("t1", { satisfactionRating: 4 });
  });
});

describe("Files (client view)", () => {
  test("lists shared files and uploads for the company only, with no staff actions", async () => {
    signIn();
    files.uploadFiles.mockResolvedValue({ ok: true });
    await act(async () => {
      render(<ClientFiles />);
    });
    expect(files.listFiles.mock.calls[0][0]).toEqual({ page: 1, limit: 12, sort: "-createdAt" });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Brand guide" })));
    expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Open"]);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await interact(() => fireEvent.click(screen.getAllByRole("button", { name: /Share a file/ })[0]));
    const dialog = screen.getByRole("dialog", { name: "Share files with Expresso" });
    const file = new File(["x"], "brief.pdf", { type: "application/pdf" });
    fireEvent.change(within(dialog).getByLabelText("Choose files"), { target: { files: [file] } });
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: /Share file/ })));
    const arg = files.uploadFiles.mock.calls[0][0];
    expect(arg.visibility).toBe("client");
    expect(arg).not.toHaveProperty("customerId");
    expect(arg.files).toHaveLength(1);
  });
});

describe("Client navigation", () => {
  const labels = (sections) => sections.flatMap((s) => s.items.map((i) => i.label));

  test("clients get their own menu; internal modules stay out even if granted", () => {
    const items = labels(getNavSectionsByRole("client_admin", [...CLIENT, "customers.read", "crm.read", "hr.staff.read", "procurement.read"], false));
    expect(items).toEqual(["Overview", "Projects", "Procurement requests", "Support requests", "Messages", "Files", "Invoices", "Brand Kit", "Company", "Profile", "Settings"]);
  });

  test("a custom external role (isInternal false) gets the client menu, not the staff one", () => {
    const items = labels(getNavSectionsByRole("acme_portal_user", ["projects.read", "crm.read"], false));
    expect(items).toEqual(["Overview", "Projects", "Profile", "Settings"]);
  });

  test("the command bar offers clients only places they can open", async () => {
    signIn("client", ["tickets.read", "projects.read"]);
    function Opener() {
      const { setOpen } = useCommandBar();
      return <button type="button" onClick={() => setOpen(true)}>open</button>;
    }
    await act(async () => {
      render(
        <CommandBarProvider getItems={() => [{ id: "hr", label: "Go to HR", to: "/portal/hr" }, { id: "t", label: "Go to Tickets", to: "/portal/tickets" }, { id: "crm", label: "Go to CRM", to: "/portal/crm" }]}>
          <Opener />
        </CommandBarProvider>
      );
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "open" })));
    expect(screen.getByText("Go to Tickets")).toBeTruthy();
    expect(screen.queryByText("Go to HR")).toBe(null);
    expect(screen.queryByText("Go to CRM")).toBe(null);
  });
});
