// PUI-2 review: the UI follows effective permissions. The `admin` role is
// never treated as unrestricted by its name (the API bypasses checks for
// super_admin only).
import { makeAccess } from "./useAccess";
import { isAllowed, isAllowedByPermissions } from "../../app/ProtectedRoute";

jest.mock("react-router-dom", () => ({ Navigate: () => null, useLocation: () => ({ pathname: "/" }) }), { virtual: true });

function signIn(role, permissions, isInternal = true) {
  localStorage.setItem("portal_user", JSON.stringify({ role, permissions, isInternal }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

beforeEach(() => localStorage.clear());

test("admin gets exactly its effective permissions in PUI-2 decisions", () => {
  signIn("admin", ["projects.read", "tickets.read"]);
  const a = makeAccess({ role: "admin", permissions: ["projects.read", "tickets.read"], isInternal: true });
  expect(a.can("projects.read")).toBe(true);
  expect(a.can("billing.read")).toBe(false);
  expect(a.can("projects.delete")).toBe(false);
  expect(a.canOpen("/portal/projects")).toBe(true);
  expect(a.canOpen("/portal/billing")).toBe(false);
  expect(a.canOpen("/portal/users")).toBe(false);
  expect(a.canOpen("/portal")).toBe(true);
});

test("super_admin passes everything, as on the API", () => {
  signIn("super_admin", []);
  const a = makeAccess({ role: "super_admin", permissions: [] });
  expect(a.can("billing.read")).toBe(true);
  expect(a.canOpen("/portal/billing")).toBe(true);
});

test("the route guard follows effective permissions for admin too (R4-A removed the role-name bypass)", () => {
  signIn("admin", ["projects.read"]);
  expect(isAllowed("admin", "/portal/billing")).toBe(false);
  expect(isAllowed("admin", "/portal/projects")).toBe(true);
  expect(isAllowedByPermissions("admin", "/portal/billing")).toBe(false);
  expect(isAllowedByPermissions("admin", "/portal/projects")).toBe(true);
  signIn("project_manager", ["projects.read"]);
  expect(isAllowed("project_manager", "/portal/billing")).toBe(isAllowedByPermissions("project_manager", "/portal/billing"));
});

test("client roles: external route rules still apply", () => {
  signIn("client", ["projects.read", "crm.read"], false);
  const a = makeAccess({ role: "client", permissions: ["projects.read", "crm.read"], isInternal: false });
  expect(a.isInternal).toBe(false);
  expect(a.canOpen("/portal/projects")).toBe(true);
  expect(a.canOpen("/portal/crm")).toBe(false);
});
