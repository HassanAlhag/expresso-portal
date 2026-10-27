// R4-B / P3-8: comment author type. Staff see Team / Vendor / Client; the
// external thread keeps "Expresso" for staff and "Your team" for colleagues,
// so a vendor author needs no special handling there.
import React from "react";
import { render, screen, within } from "@testing-library/react";
import TicketThread from "./components/TicketThread";
import ClientTicketDetail from "./client/ClientTicketDetail";

jest.mock("react-router-dom", () => ({
  useParams: () => ({ id: "t1" }),
  useNavigate: () => jest.fn(),
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });
jest.mock("./api", () => ({ getTicket: jest.fn(), addTicketComment: jest.fn(), updateTicket: jest.fn() }));
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }) }));
const api = require("./api");

const msg = (id, authorRole, extra = {}) => ({ _id: id, body: `${authorRole} message ${id}`, authorRole, authorId: `author-${id}`, visibility: "client", createdAt: "2026-10-20T00:00:00Z", ...extra });

test("staff thread labels each author type: admin → Team, vendor → Vendor, client → Client", () => {
  render(<TicketThread comments={[msg("1", "admin"), msg("2", "vendor"), msg("3", "client")]} isAdmin />);
  const label = (text) => within(screen.getByText(text).closest("div.rounded-xl")).getByText(/^(Team|Vendor|Client)$/).textContent; // eslint-disable-line testing-library/no-node-access
  expect(label("admin message 1")).toBe("Team");
  expect(label("vendor message 2")).toBe("Vendor");
  expect(label("client message 3")).toBe("Client");
});

test("internal notes keep their internal styling whatever the author type", () => {
  render(<TicketThread comments={[msg("4", "admin", { visibility: "internal" })]} isAdmin />);
  expect(screen.getByText("admin message 4").closest("div.rounded-xl").className).toMatch(/amber/); // eslint-disable-line testing-library/no-node-access
});

test("external (vendor) view: staff show as Expresso, own messages as You, vendor colleagues as Your team", async () => {
  localStorage.setItem("portal_user", JSON.stringify({ _id: "author-me", role: "vendor", isInternal: false, permissions: ["tickets.read", "tickets.write"] }));
  api.getTicket.mockResolvedValue({
    ok: true,
    item: { _id: "t1", title: "Quote clarification", status: "open", type: "support", comments: [msg("a", "admin"), msg("b", "vendor"), { ...msg("me", "vendor"), authorId: "author-me" }] },
  });
  render(<ClientTicketDetail />);
  await screen.findByText("admin message a");
  const who = (text) => screen.getByText(text).closest("li").querySelector(".px-thread-who").firstChild.textContent; // eslint-disable-line testing-library/no-node-access
  expect(who("admin message a")).toBe("Expresso");
  expect(who("vendor message b")).toBe("Your team");
  expect(who("vendor message me")).toBe("You");
  localStorage.clear();
});
