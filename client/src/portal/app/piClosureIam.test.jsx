// PI closure — IAM pages follow iam.users.* / iam.roles.write / iam.teams.write
// exactly as the API does; role names never grant actions (only super_admin
// bypasses, like the API).
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { signIn, renderPage, fillApi, setupDom, CUSTOM_INTERNAL } from "./piClosure.test.helpers";
import UsersListPage from "../features/iam/users/pages/UsersListPage";
import UserDetailsPage from "../features/iam/users/pages/UserDetailsPage";
import RolesPage from "../features/iam/roles/pages/RolesPage";
import TeamsPage from "../features/iam/teams/pages/TeamsPage";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => jest.fn(),
      useParams: () => ({ id: "u2" }),
      useLocation: () => ({ pathname: "/portal" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../features/iam/users/api");
jest.mock("../features/iam/roles/api");
jest.mock("../features/iam/teams/api");
jest.mock("../features/customers/api");

const usersApi = require("../features/iam/users/api");
const rolesApi = require("../features/iam/roles/api");
const teamsApi = require("../features/iam/teams/api");
const customersApi = require("../features/customers/api");

const person = { _id: "u2", fullName: "Dana Field", email: "dana@example.test", role: "staff", isActive: true, isInternal: true };
const role = { _id: "r1", key: "designer_custom", label: "Designer", permissions: ["projects.read"], audience: "internal" };
const team = { _id: "t1", key: "design", label: "Design", isActive: true, userCount: 2 };

beforeEach(() => {
  setupDom();
  fillApi(usersApi, { users: [person], user: person, total: 1, page: 1, pages: 1, items: [], permissions: [] });
  fillApi(rolesApi, { items: [role] });
  fillApi(teamsApi, { items: [team] });
  fillApi(customersApi, { items: [] });
});

describe("Users", () => {
  it("iam.users.read only: no Add user, no status toggle, no delete", async () => {
    signIn({ role: "admin", permissions: ["iam.users.read"] });
    renderPage(<UsersListPage />);
    expect(await screen.findByText("Dana Field")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /add user/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate dana field/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete dana field/i })).toBeNull();
  });
  it("iam.users.write (custom internal role): Add user and status toggle, no delete", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["iam.users.read", "iam.users.write"], isInternal: true });
    renderPage(<UsersListPage />);
    expect(await screen.findByText("Dana Field")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /add user/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /deactivate dana field/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /delete dana field/i })).toBeNull();
  });
  it("iam.users.delete: delete offered without write actions", async () => {
    signIn({ role: "staff", permissions: ["iam.users.read", "iam.users.delete"] });
    renderPage(<UsersListPage />);
    expect(await screen.findByRole("button", { name: /delete dana field/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /deactivate dana field/i })).toBeNull();
  });
  it("user details read-only: no Edit, Reset password or status change", async () => {
    signIn({ role: "admin", permissions: ["iam.users.read"] });
    renderPage(<UserDetailsPage />);
    await waitFor(() => expect(usersApi.getUser).toHaveBeenCalled());
    expect(await screen.findAllByText("Dana Field")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reset password/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^edit$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();
  });
  it("user details with iam.users.write: actions offered", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["iam.users.read", "iam.users.write"], isInternal: true });
    renderPage(<UserDetailsPage />);
    expect(await screen.findByRole("button", { name: /reset password/i })).toBeTruthy();
  });
});

describe("Roles", () => {
  it("iam.roles.read only: no New role; editor opens view-only", async () => {
    signIn({ role: "admin", permissions: ["iam.roles.read"] });
    renderPage(<RolesPage />);
    fireEvent.click(await screen.findByText("Designer"));
    expect(await screen.findByText(/role access \(view only\)/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new role/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /select all/i })).toBeNull();
  });
  it("iam.roles.write (custom internal role): New role offered, editor editable", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["iam.roles.read", "iam.roles.write"], isInternal: true });
    renderPage(<RolesPage />);
    expect(await screen.findByRole("button", { name: /new role/i })).toBeTruthy();
    fireEvent.click(await screen.findByText("Designer"));
    expect(screen.queryByText(/role access \(view only\)/i)).toBeNull();
  });
});

describe("Teams", () => {
  it("iam.teams.read only: no New team, no row actions", async () => {
    signIn({ role: "admin", permissions: ["iam.teams.read"] });
    renderPage(<TeamsPage />);
    expect(await screen.findByText("Design")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new team/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate design/i })).toBeNull();
  });
  it("iam.teams.write: New team and row actions", async () => {
    signIn({ role: "staff", permissions: ["iam.teams.read", "iam.teams.write"] });
    renderPage(<TeamsPage />);
    expect(await screen.findByText("Design")).toBeTruthy();
    expect(screen.getByRole("button", { name: /new team/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /deactivate design/i })).toBeTruthy();
  });
});
