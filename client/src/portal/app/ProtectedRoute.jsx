// src/portal/app/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const ROUTE_PERMISSIONS = [
  ["/portal/users/invites", "iam.invites.send"],
  ["/portal/users", "iam.users.read"],
  ["/portal/roles", "iam.roles.read"],
  ["/portal/teams", "iam.teams.read"],
  ["/portal/customers", "customers.read"],
  ["/portal/projects", "projects.read"],
  ["/portal/productions", "productions.read"],
  ["/portal/jobs", "jobs.read"],
  ["/portal/media-library", "media.read"],
  ["/portal/files", "files.read"],
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
  ["/portal/hr/monthly-expenses", "hr.expenses.read"],
  ["/portal/hr/leaves", "hr.leaves.read"],
  ["/portal/hr/skills", "hr.scorecards.read"],
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

const EXTERNAL_ROUTE_DENYLIST = [
  "/portal/procurement/vendor-applications",
  "/portal/procurement/vendors",
  "/portal/procurement/categories",
  "/portal/procurement/rfqs",
  "/portal/crm",
  "/portal/hr",
  "/portal/users",
  "/portal/roles",
  "/portal/teams",
  "/portal/activity",
  "/portal/website",
  "/portal/careers",
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

function isAllowed(role, pathname) {
  const r = String(role || "").toLowerCase();
  if (r === "super_admin" || r === "admin") return true;

  const p = pathname.replace(/\/$/, "");
  if (p === "/portal") return true;
  if (p === "/portal/profile" || p === "/portal/settings") return true;

  if (
    EXTERNAL_CLIENT_ROLES.has(r) &&
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
  const token = localStorage.getItem("portal_token");
  if (!token) return <Navigate to="/portal/login" replace />;

  const payload = parseToken(token);
  if (!payload) return <Navigate to="/portal/login" replace />;

  if (!isAllowed(payload.role, location.pathname)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
