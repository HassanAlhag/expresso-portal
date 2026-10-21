// Stage R2 — portal page gates and permission-catalogue source.
import fs from "fs";
import path from "path";
import { isAllowed } from "./ProtectedRoute";
import { isExternalDeniedKey } from "../shared/hooks/usePermissionCatalog";

// The gate logic under test does not render; stub the router (react-router v7
// is not resolvable by this Jest setup). Jest hoists this above the imports.
jest.mock("react-router-dom", () => ({ Navigate: () => null, useLocation: () => ({ pathname: "/" }) }), { virtual: true });

function signIn({ role, permissions, isInternal }) {
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
  localStorage.setItem("portal_user", JSON.stringify({ role, permissions, isInternal }));
}

afterEach(() => localStorage.clear());

describe("KPI pages use the KPI permission", () => {
  test("hr.kpi.read alone opens the KPI pages", () => {
    signIn({ role: "kpi_reviewer", permissions: ["hr.kpi.read"], isInternal: true });
    expect(isAllowed("kpi_reviewer", "/portal/hr/kpi")).toBe(true);
    expect(isAllowed("kpi_reviewer", "/portal/hr/kpi/goals")).toBe(true);
  });

  test("hr.staff.read alone no longer opens the KPI pages", () => {
    signIn({ role: "hr_viewer", permissions: ["hr.staff.read"], isInternal: true });
    expect(isAllowed("hr_viewer", "/portal/hr/kpi")).toBe(false);
    expect(isAllowed("hr_viewer", "/portal/hr/staff")).toBe(true);
  });
});

describe("Production workspace uses the jobs permission it actually needs", () => {
  test("jobs.read opens the production workspace", () => {
    signIn({ role: "editor", permissions: ["jobs.read"], isInternal: true });
    expect(isAllowed("editor", "/portal/productions")).toBe(true);
  });

  test("productions.read alone does not", () => {
    signIn({ role: "viewer", permissions: ["productions.read"], isInternal: true });
    expect(isAllowed("viewer", "/portal/productions")).toBe(false);
  });
});

describe("Vendors can reach RFQ pages; the API decides what they see", () => {
  test("vendor can open the RFQ list and an RFQ", () => {
    signIn({ role: "vendor", permissions: ["procurement.read"], isInternal: false });
    expect(isAllowed("vendor", "/portal/procurement/rfqs")).toBe(true);
    expect(isAllowed("vendor", "/portal/procurement/rfqs/65f0c0ffee0000000000abcd")).toBe(true);
  });

  test("vendor cannot open RFQ create/edit or other internal procurement pages", () => {
    signIn({ role: "vendor", permissions: ["procurement.read"], isInternal: false });
    expect(isAllowed("vendor", "/portal/procurement/rfqs/new")).toBe(false);
    expect(isAllowed("vendor", "/portal/procurement/rfqs/65f0c0ffee0000000000abcd/edit")).toBe(false);
    expect(isAllowed("vendor", "/portal/procurement/vendors")).toBe(false);
    expect(isAllowed("vendor", "/portal/procurement/vendor-applications")).toBe(false);
  });

  test("clients still cannot open RFQ pages", () => {
    signIn({ role: "procurement_client", permissions: ["procurement.read"], isInternal: false });
    expect(isAllowed("procurement_client", "/portal/procurement/rfqs")).toBe(false);
    expect(isAllowed("procurement_client", "/portal/procurement")).toBe(true);
  });
});

describe("Permission catalogue has one source (the API)", () => {
  test("the portal no longer ships its own copy of the catalogue", () => {
    expect(fs.existsSync(path.join(__dirname, "..", "config", "permissions.js"))).toBe(false);
  });

  test("role editor and access tab load the catalogue from the API hook", () => {
    const roleEditor = fs.readFileSync(path.join(__dirname, "..", "features", "iam", "roles", "components", "RoleEditor.jsx"), "utf8");
    const accessTab = fs.readFileSync(path.join(__dirname, "..", "features", "iam", "users", "tabs", "AccessTab.jsx"), "utf8");
    for (const src of [roleEditor, accessTab]) {
      expect(src).toMatch(/usePermissionCatalog/);
      expect(src).not.toMatch(/config\/permissions/);
    }
    expect(accessTab).toMatch(/getEffectivePermissions/);
  });

  test("external-denied matching follows the API rule", () => {
    const prefixes = ["crm.", "projects.write", "projects.delete", "tickets.delete"];
    expect(isExternalDeniedKey("crm.read", prefixes)).toBe(true);
    expect(isExternalDeniedKey("projects.write", prefixes)).toBe(true);
    expect(isExternalDeniedKey("tickets.delete", prefixes)).toBe(true);
    expect(isExternalDeniedKey("projects.read", prefixes)).toBe(false);
    expect(isExternalDeniedKey("tickets.write", prefixes)).toBe(false);
  });
});
