import { useMemo } from "react";

const STORAGE_KEY = "portal_permissions";

function readStoredPermissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Returns the current user's effective permission set.
 *
 * Permissions are written to localStorage by PortalLogin after a successful login
 * (and refreshed on /api/auth/me calls). The backend is always the authoritative
 * source — this hook is for UI gating only.
 *
 * Usage:
 *   const { hasPermission, permissions } = usePortalPermissions();
 *   if (hasPermission("hr.expenses.approve")) { ... }
 */
export function usePortalPermissions() {
  const permissions = useMemo(() => readStoredPermissions(), []);
  const permSet = useMemo(() => new Set(permissions), [permissions]);

  return {
    permissions,
    /** Returns true if the user holds the given permission (or is super_admin). */
    hasPermission: (perm) => permSet.has(perm),
    /** Returns true if the user holds ALL of the listed permissions. */
    hasAllPermissions: (perms) => perms.every((p) => permSet.has(p)),
    /** Returns true if the user holds AT LEAST ONE of the listed permissions. */
    hasAnyPermission: (perms) => perms.some((p) => permSet.has(p)),
  };
}
