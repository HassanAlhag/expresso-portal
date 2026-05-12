const INTERNAL_ROLES = new Set([
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

const EXTERNAL_CLIENT_ROLES = new Set([
  "client",
  "staff_client",
  "procurement_client",
  "client_admin",
]);

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function isInternalRole(role) {
  return INTERNAL_ROLES.has(normalizeRole(role));
}

export function isExternalClientRole(role) {
  return EXTERNAL_CLIENT_ROLES.has(normalizeRole(role));
}

export function canSeeAllTenantRecords(req) {
  return isInternalRole(req.user?.role);
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
