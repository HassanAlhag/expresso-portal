// src/portal/app/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { readPortalUser, usePortalSessionVersion } from "../shared/hooks/useAccess";

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const ROUTE_PERMISSIONS = [
  ["/portal/users/invites", "iam.invites.send"],
  ["/portal/users/access-requests", "iam.invites.send"],
  ["/portal/users", "iam.users.read"],
  ["/portal/roles", "iam.roles.read"],
  ["/portal/teams", "iam.teams.read"],
  ["/portal/customers", "customers.read"],
  ["/portal/projects", "projects.read"],
  ["/portal/service-delivery", "projects.read"],
  // The production workspace shows delivery jobs (GET /api/jobs).
  ["/portal/productions", "jobs.read"],
  ["/portal/jobs", "jobs.read"],
  ["/portal/content-calendar", "jobs.read"],
  ["/portal/media-library", "media.read"],
  ["/portal/files", "files.read"],
  ["/portal/messages", "messaging.read"],
  ["/portal/brand-kit", "brand_kit.read"],
  ["/portal/website/portfolio", "portfolio.read"],
  ["/portal/portfolio", "portfolio.read"],
  ["/portal/services", "services.read"],
  ["/portal/enrollments", "enrollments.read"],
  ["/portal/billing", "billing.read"],
  ["/portal/tickets", "tickets.read"],
  ["/portal/crm", "crm.read"],
  ["/portal/procurement/vendor-applications", "procurement.approve"],
  ["/portal/procurement", "procurement.read"],
  ["/portal/hr/staff", "hr.staff.read"],
  ["/portal/hr/expenses", "hr.expenses.read"],
  ["/portal/hr/monthly-expenses", "hr.expenses.approve"],
  ["/portal/hr/leaves", "hr.leaves.read"],
  // The skills matrix reads staff records (GET /api/hr/staff → hr.staff.read).
  ["/portal/hr/skills", "hr.staff.read"],
  // KPI pages use the KPI permission, not hr.staff.read (must precede /portal/hr).
  ["/portal/hr/kpi", "hr.kpi.read"],
  ["/portal/hr", "hr.staff.read"],
  ["/portal/reports", "reports.read"],
  ["/portal/activity", "activity.read"],
  ["/portal/careers", "website.read"],
  ["/portal/website", "website.read"],
];

const EXTERNAL_CLIENT_ROLES = new Set([
  "client",
  "staff_client",
  "procurement_client",
  "client_admin",
]);

// Routes that are ALWAYS internal — no client role may access them,
// even if permissions were accidentally granted via the role editor.
const EXTERNAL_ROUTE_DENYLIST = [
  // CRM — internal pipeline data
  "/portal/crm",
  // HR — internal people management
  "/portal/hr",
  // IAM — internal access control
  "/portal/users",
  "/portal/roles",
  "/portal/teams",
  // Audit — internal system logs
  "/portal/activity",
  // Website / content management — internal publishing tools
  "/portal/website",
  "/portal/careers",
  // Asset & content management — internal library/publishing tools
  "/portal/media-library",
  "/portal/website/portfolio",
  // Service catalog & enrollment management — internal commercial tools
  "/portal/services",
  "/portal/enrollments",
  // Procurement internals — vendors, categories, RFQs, applications
  "/portal/procurement/vendor-applications",
  "/portal/procurement/vendors",
  "/portal/procurement/categories",
  "/portal/procurement/rfqs",
];

function readPermissions() {
  try {
    const rawPermissions = localStorage.getItem("portal_permissions");
    if (rawPermissions) {
      const parsed = JSON.parse(rawPermissions);
      if (Array.isArray(parsed)) return parsed;
    }

    const rawUser = localStorage.getItem("portal_user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (Array.isArray(parsedUser?.permissions)) return parsedUser.permissions;
    }
  } catch {
    return [];
  }

  return [];
}

function readIsInternal(role) {
  // Prefer the server's classification (custom roles, role registry); fall
  // back to the system role list for sessions created before it existed.
  try {
    const user = JSON.parse(localStorage.getItem("portal_user") || "{}");
    if (typeof user?.isInternal === "boolean") return user.isInternal;
  } catch {
    // ignore
  }
  return !EXTERNAL_CLIENT_ROLES.has(role) && role !== "vendor";
}

// Vendors may open the RFQ list and individual RFQs (not create or edit). The
// API decides what each vendor actually sees: published RFQs in their
// approved categories and their own quotations only.
function isVendorRfqView(role, p) {
  if (role !== "vendor") return false;
  if (p === "/portal/procurement/rfqs") return true;
  const m = p.match(/^\/portal\/procurement\/rfqs\/([^/]+)$/);
  return Boolean(m) && m[1] !== "new";
}

/**
 * Route guard rule. Same as the API (R4-A): super_admin passes; every other
 * role, admin included, needs the route's permission in its effective list.
 * The inherited `admin` role-name bypass was removed (P3-5).
 */
export function isAllowed(role, pathname) {
  return isAllowedByPermissions(role, pathname);
}

/**
 * The route rule from the user's effective permissions, with the same
 * bypass as the API (super_admin only). Used for links and actions a page
 * offers (PUI-2), so `admin` is never treated as unrestricted by role name.
 */
export function isAllowedByPermissions(role, pathname) {
  const r = String(role || "").toLowerCase();
  if (r === "super_admin") return true;
  return checkRoute(r, pathname);
}

function checkRoute(r, pathname) {
  const p = pathname.replace(/\/$/, "");
  if (p === "/portal") return true;
  if (p === "/portal/profile" || p === "/portal/settings") return true;

  if (
    !readIsInternal(r) &&
    !isVendorRfqView(r, p) &&
    EXTERNAL_ROUTE_DENYLIST.some((prefix) => p === prefix || p.startsWith(prefix + "/"))
  ) {
    return false;
  }

  const match = ROUTE_PERMISSIONS.find(
    ([prefix]) => p === prefix || p.startsWith(prefix + "/")
  );

  if (!match) return false;

  const permissions = new Set(readPermissions());
  return permissions.has(match[1]);
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  usePortalSessionVersion(); // re-check when the session is refreshed
  const token = localStorage.getItem("portal_token");
  if (!token) return <Navigate to="/portal/login" replace />;

  const payload = parseToken(token);
  if (!payload) return <Navigate to="/portal/login" replace />;

  // Prefer the role last confirmed by /auth/me (refreshed on focus); the
  // token's role is only a fallback before the first refresh.
  const role = readPortalUser()?.role || payload.role;
  if (!isAllowed(role, location.pathname)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
