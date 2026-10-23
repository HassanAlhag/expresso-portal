import React from "react";
import StaffDashboard from "../staff/StaffDashboard";
import ClientDashboard from "../client/ClientDashboard";
import VendorDashboard from "../vendor/VendorDashboard";
import { getWorkspaceKind } from "../../../app/portalNav";
import { readPortalUser } from "../../../shared/hooks/useAccess";

function tokenRole() {
  try {
    const token = localStorage.getItem("portal_token");
    return token ? JSON.parse(atob(token.split(".")[1]))?.role || null : null;
  } catch {
    return null;
  }
}

// Home page. Each workspace gets its own overview (staff PUI-2; client and
// vendor PUI-5). The lens follows the signed-in role, and an external custom
// role (isInternal false) gets the client overview.
export default function DashboardPage() {
  const user = readPortalUser();
  const lens = getWorkspaceKind({ role: tokenRole() || user.role, isInternal: user.isInternal });
  if (lens === "vendor") return <VendorDashboard />;
  if (lens === "client") return <ClientDashboard />;
  return <StaffDashboard />;
}
