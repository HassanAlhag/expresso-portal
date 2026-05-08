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

// Path prefixes each restricted role may visit. null = unrestricted.
const ROLE_PREFIXES = {
  client: [
    "/portal/projects",
    "/portal/files",
    "/portal/billing",
    "/portal/tickets",
    "/portal/profile",
    "/portal/settings",
  ],
  vendor: [
    "/portal/procurement",
    "/portal/tickets",
    "/portal/profile",
    "/portal/settings",
  ],
  staff: [
    "/portal/customers",
    "/portal/projects",
    "/portal/productions",
    "/portal/jobs",
    "/portal/media-library",
    "/portal/files",
    "/portal/portfolio",
    "/portal/services",
    "/portal/enrollments",
    "/portal/procurement/rfqs",
    "/portal/procurement/vendor-applications",
    "/portal/hr/expenses",
    "/portal/hr/leaves",
    "/portal/hr/skills",
    "/portal/tickets",
    "/portal/crm",
    "/portal/reports",
    "/portal/activity",
    "/portal/profile",
    "/portal/settings",
  ],
};

function isAllowed(role, pathname) {
  const r = String(role || "").toLowerCase();
  if (r === "super_admin" || r === "admin") return true;
  const prefixes = ROLE_PREFIXES[r];
  if (!prefixes) return true; // unknown role — allow, let backend enforce
  const p = pathname.replace(/\/$/, "");
  if (p === "/portal") return true;
  return prefixes.some((pre) => p === pre || p.startsWith(pre + "/"));
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
