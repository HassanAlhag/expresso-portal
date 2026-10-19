import { resolveRoleContext } from "./roleRegistry.js";

/**
 * Compute the effective permission set for a user.
 * Kept for backward compatibility; see utils/roleRegistry.js.
 *
 * @param {string} roleKey
 * @param {string[]} extraPermissions   — user-level grants
 * @param {string[]} revokedPermissions — user-level revocations
 * @returns {Promise<string[]>}
 */
export async function resolvePermissions(roleKey, extraPermissions = [], revokedPermissions = []) {
  const { permissions } = await resolveRoleContext(roleKey, extraPermissions, revokedPermissions);
  return permissions;
}
