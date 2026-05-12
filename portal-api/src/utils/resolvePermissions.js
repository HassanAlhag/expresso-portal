import Role from "../modules/iam/roles/role.model.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  VALID_PERMISSION_KEYS,
} from "../config/permissions.js";

/**
 * Compute the effective permission set for a user.
 *
 * Resolution order:
 *   1. Load the user's role document from DB.
 *   2. If the role has no permissions configured, fall back to DEFAULT_ROLE_PERMISSIONS
 *      for that role key (backward compatibility — existing roles just work).
 *   3. Add the user's extraPermissions (per-user grants).
 *   4. Remove the user's revokedPermissions (per-user revocations).
 *
 * @param {string} roleKey
 * @param {string[]} extraPermissions   — user-level grants
 * @param {string[]} revokedPermissions — user-level revocations
 * @returns {Promise<string[]>}
 */
export async function resolvePermissions(roleKey, extraPermissions = [], revokedPermissions = []) {
  if (roleKey === "super_admin") return [];

  try {
    const roleDoc = await Role.findOne({ key: roleKey }).select("permissions").lean();

    const rolePermissions = Array.isArray(roleDoc?.permissions)
      ? roleDoc.permissions.filter((p) => VALID_PERMISSION_KEYS.has(p))
      : [];

    const base = rolePermissions.length > 0
      ? rolePermissions
      : (DEFAULT_ROLE_PERMISSIONS[roleKey] || []);

    const effective = new Set([...base, ...extraPermissions]);
    revokedPermissions.forEach((p) => effective.delete(p));

    return [...effective];
  } catch {
    return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
  }
}
