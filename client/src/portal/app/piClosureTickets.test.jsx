// PI closure — staff ticket detail follows tickets.write (as the API does on
// every ticket mutation) instead of a client-side role list. Internal notes
// are shown by the internal/external classification; posting one needs
// tickets.write. tickets.delete is unchanged.
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { signIn, renderPage, setupDom, CUSTOM_INTERNAL } from "./piClosure.test.helpers";
import TicketDetailsPage from "../features/tickets/pages/TicketDetailsPage";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => jest.fn(),
      useParams: () => ({ id: "t1" }),
      useLocation: () => ({ pathname: "/portal/tickets/t1" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../features/tickets/api");
jest.mock("../features/iam/users/api");

const ticketsApi = require("../features/tickets/api");
const usersApi = require("../features/iam/users/api");

const ticket = {
  _id: "t1",
  title: "Sample request",
  status: "open",
  type: "support",
  comments: [
    { _id: "c1", body: "Staff-only context", authorRole: "admin", visibility: "internal", createdAt: "2026-10-01T00:00:00Z" },
    { _id: "c2", body: "Client question", authorRole: "client", visibility: "client", createdAt: "2026-10-01T01:00:00Z" },
  ],
};

beforeEach(() => {
  setupDom();
  ticketsApi.getTicket.mockResolvedValue({ item: ticket });
  usersApi.listUsers.mockResolvedValue({ users: [] });
});

const loaded = () => screen.findByText("Sample request");

it("internal user with tickets.read only: sees internal notes, no staff tools or reply", async () => {
  signIn({ role: "admin", permissions: ["tickets.read"], isInternal: true });
  renderPage(<TicketDetailsPage />);
  await loaded();
  expect(screen.getByText("Staff-only context")).toBeTruthy();
  expect(screen.getAllByText("Internal").length).toBeGreaterThan(0);
  expect(screen.queryByText("Workflow")).toBeNull();
  expect(screen.queryByRole("button", { name: /^send$/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /client-visible/i })).toBeNull();
  expect(screen.queryByTitle("Delete ticket")).toBeNull();
  expect(usersApi.listUsers).not.toHaveBeenCalled();
});

it("custom internal role with tickets.write: staff tools, reply and internal-note choice", async () => {
  signIn({ role: CUSTOM_INTERNAL, permissions: ["tickets.read", "tickets.write"], isInternal: true });
  renderPage(<TicketDetailsPage />);
  await loaded();
  expect(screen.getByText("Workflow")).toBeTruthy();
  expect(screen.getByRole("button", { name: /send/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /client-visible/i })).toBeTruthy();
  await waitFor(() => expect(usersApi.listUsers).toHaveBeenCalled());
  expect(screen.queryByTitle("Delete ticket")).toBeNull();
});

it("built-in staff role without tickets.write gets no staff tools (no role-name list)", async () => {
  signIn({ role: "operations_manager", permissions: ["tickets.read", "tickets.delete"], isInternal: true });
  renderPage(<TicketDetailsPage />);
  await loaded();
  expect(screen.queryByText("Workflow")).toBeNull();
  expect(screen.queryByRole("button", { name: /send/i })).toBeNull();
  // tickets.delete is unchanged and independent.
  expect(screen.getByTitle("Delete ticket")).toBeTruthy();
});
