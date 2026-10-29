// Single source of truth for whether a role is internal (Expresso team) or
// external (client / vendor), and for which permissions external users can
// never hold. Previously these lists were hard-coded in several files and any
// custom role was silently treated as an external client (audit B8 / S6).

import Role from "../modules/iam/roles/role.model.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  VALID_PERMISSION_KEYS,
} from "../config/permissions.js";

/** System roles that belong to the Expresso team. */
export const SYSTEM_INTERNAL_ROLES = new Set([
  "super_admin",
  "admin",
  "operations_manager",
  "finance",
  "procurement_manager",
  "procurement_officer",
  "project_manager",
  "staff",
  "hr_management",
]);

/** System roles used by client companies. */
export const SYSTEM_CLIENT_ROLES = new Set([
  "client",
  "staff_client",
  "procurement_client",
  "client_admin",
]);

/**
 * Permission prefixes an external (non-internal) user can never hold, even if
 * an admin grants them through the role editor or per-user extras. Mirrors the
 * frontend EXTERNAL_ROUTE_DENYLIST, now enforced by the API.
 */
export const EXTERNAL_DENIED_PREFIXES = [
  "delivery.",
  "crm.",
  "hr.",
  "iam.",
  "activity.",
  "website.",
  "media.",
  "services.",
  "enrollments.",
  "portfolio.",
  "work.",
  "productions.",
  "jobs.",
  "social.",
  "customers.delete",
  "customers.write",
  "procurement.approve",
  "procurement.delete",
  "billing.write",
  "billing.delete",
  // Approved access model (R2): clients view their own company's projects and
  // use designed client actions only — never general project create/edit/
  // delete, and never ticket hard-delete.
  "projects.write",
  "projects.delete",
  "tickets.delete",
];

export function normalizeRoleKey(role) {
  return String(role || "").trim().toLowerCase();
}

/** Fallback classification when no Role document says otherwise. */
export function isSystemInternalRole(roleKey) {
  return SYSTEM_INTERNAL_ROLES.has(normalizeRoleKey(roleKey));
}

export function isExternalDenied(permission) {
  return EXTERNAL_DENIED_PREFIXES.some((prefix) => permission === prefix || permission.startsWith(prefix));
}

export function stripExternalDenied(permissions = []) {
  return permissions.filter((p) => !isExternalDenied(p));
}

/** Permissions in the list that an external role or user can never hold. */
export function externalDeniedIn(permissions = []) {
  return permissions.filter((p) => isExternalDenied(p));
}

function decideInternal(roleKey, roleDoc) {
  if (roleKey === "super_admin") return true;
  if (roleDoc && typeof roleDoc.isInternal === "boolean") return roleDoc.isInternal;
  return isSystemInternalRole(roleKey);
}

/**
 * Resolve a user's effective permissions and internal/external status.
 *   role permissions: a stored Role document is authoritative — an explicit
 *   empty list means no role permissions (approved R2 rule). Code defaults
 *   apply only when no Role document exists for a built-in role.
 *   + per-user extras − per-user revokes
 *   − external-denied permissions when the role is not internal
 */
export async function resolveRoleContext(
  roleKeyRaw,
  extraPermissions = [],
  revokedPermissions = []
) {
  const roleKey = normalizeRoleKey(roleKeyRaw);
  if (roleKey === "super_admin") return { permissions: [], isInternal: true };

  let roleDoc = null;
  try {
    roleDoc = await Role.findOne({ key: roleKey })
      .select("permissions isInternal")
      .lean();
  } catch {
    roleDoc = null;
  }

  const hasStoredConfig = Boolean(roleDoc) && Array.isArray(roleDoc.permissions);
  const base = hasStoredConfig
    ? roleDoc.permissions.filter((p) => VALID_PERMISSION_KEYS.has(p))
    : DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
  const roleSource = hasStoredConfig ? "stored" : DEFAULT_ROLE_PERMISSIONS[roleKey] ? "default" : "none";

  const effective = new Set([
    ...base,
    ...extraPermissions.filter((p) => VALID_PERMISSION_KEYS.has(p)),
  ]);
  revokedPermissions.forEach((p) => effective.delete(p));

  const isInternal = decideInternal(roleKey, roleDoc);
  const permissions = isInternal ? [...effective] : stripExternalDenied([...effective]);
  const rolePermissions = isInternal ? [...base] : stripExternalDenied([...base]);
  return { permissions, isInternal, rolePermissions, roleSource };
}
