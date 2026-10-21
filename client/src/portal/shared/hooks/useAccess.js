import { useMemo } from "react";
import { isAllowedByPermissions } from "../../app/ProtectedRoute";

// UI gating helpers (PUI-2). The API is always the authority; these decide
// what a page asks for and shows, so a user is never sent a request or a
// control the server would refuse. They follow the API's rule exactly:
// super_admin passes, every other role (admin included) needs the permission
// in its effective permission list. `canOpen` applies the route rules with
// that same rule, so a link is only offered when its page and data are allowed.
const EXTERNAL_ROLES = new Set(["client", "staff_client", "procurement_client", "client_admin", "vendor"]);

export function readPortalUser() {
  try {
    return JSON.parse(localStorage.getItem("portal_user") || "{}") || {};
  } catch {
    return {};
  }
}

function readPermissions(user) {
  if (Array.isArray(user?.permissions) && user.permissions.length) return user.permissions;
  try {
    const raw = JSON.parse(localStorage.getItem("portal_permissions") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function makeAccess(user = {}) {
  const role = String(user.role || "").toLowerCase();
  const perms = new Set(readPermissions(user));
  const bypass = role === "super_admin"; // same as the API; never by the name "admin"
  const isInternal = typeof user.isInternal === "boolean" ? user.isInternal : !EXTERNAL_ROLES.has(role);
  const can = (perm) => bypass || perms.has(perm);
  return {
    user,
    role,
    isInternal,
    can,
    canAny: (list) => list.some(can),
    canOpen: (path) => isAllowedByPermissions(role, path),
  };
}

export function useAccess() {
  return useMemo(() => makeAccess(readPortalUser()), []);
}
