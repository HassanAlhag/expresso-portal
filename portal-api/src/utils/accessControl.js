import {
  SYSTEM_CLIENT_ROLES,
  isSystemInternalRole,
  normalizeRoleKey,
} from "./roleRegistry.js";

export function normalizeRole(role) {
  return normalizeRoleKey(role);
}

/**
 * Role-key-only classification (no DB). Prefer canSeeAllTenantRecords(req),
 * which uses the resolved req.user.isInternal flag set by requireAuth.
 */
export function isInternalRole(role) {
  return isSystemInternalRole(role);
}

export function isExternalClientRole(role) {
  return SYSTEM_CLIENT_ROLES.has(normalizeRoleKey(role));
}

export function isInternalUser(req) {
  if (typeof req?.user?.isInternal === "boolean") return req.user.isInternal;
  return isSystemInternalRole(req?.user?.role);
}

export function canSeeAllTenantRecords(req) {
  return isInternalUser(req);
}

export function getUserClientId(req) {
  return req.user?.clientId ? String(req.user.clientId) : "";
}

export function requireOwnClient(req, recordCustomerId) {
  if (canSeeAllTenantRecords(req)) return true;
  const clientId = getUserClientId(req);
  if (!clientId) return false;
  return String(recordCustomerId || "") === clientId;
}

export function requireInternalUser(req, res, next) {
  if (canSeeAllTenantRecords(req)) return next();
  return res.status(403).json({ ok: false, message: "Forbidden" });
}
