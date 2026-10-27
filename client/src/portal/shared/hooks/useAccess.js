import { useEffect, useMemo, useState } from "react";
import { isAllowedByPermissions } from "../../app/ProtectedRoute";

// UI gating helpers (PUI-2). The API is always the authority; these decide
// what a page asks for and shows, so a user is never sent a request or a
// control the server would refuse. They follow the API's rule exactly:
// super_admin passes, every other role (admin included) needs the permission
// in its effective permission list. `canOpen` applies the route rules with
// that same rule, so a link is only offered when its page and data are allowed.
const EXTERNAL_ROLES = new Set(["client", "staff_client", "procurement_client", "client_admin", "vendor"]);

// Signed-in user as last confirmed by the API (/auth/me). Pages, the route
// guard and the navigation read it from here; writePortalSession stores a
// refreshed copy and tells them to re-evaluate (R4-A).
export const PORTAL_SESSION_EVENT = "portal:session-updated";

export function writePortalSession(user) {
  if (!user) return;
  try {
    localStorage.setItem("portal_user", JSON.stringify(user));
    localStorage.setItem("portal_permissions", JSON.stringify(user.permissions || []));
  } catch {
    // storage unavailable: the API still enforces every decision
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PORTAL_SESSION_EVENT));
}

/** Re-renders when the stored session changes (this tab or another tab). */
export function usePortalSessionVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const onStorage = (e) => {
      if (!e.key || e.key === "portal_user" || e.key === "portal_permissions") bump();
    };
    window.addEventListener(PORTAL_SESSION_EVENT, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PORTAL_SESSION_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return version;
}

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
  const version = usePortalSessionVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-read storage when the session changes
  return useMemo(() => makeAccess(readPortalUser()), [version]);
}
