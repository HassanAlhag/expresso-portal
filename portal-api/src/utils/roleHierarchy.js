// Role hierarchy for user, invite and access-request management (R4-A, P3-6).
// The route permission (iam.users.write, iam.invites.send, …) decides WHETHER
// someone may manage users; this rule decides WHOM. It is a security rule,
// not a permission check: super_admin manages anyone; admin manages anyone
// except super_admin and admin; no other role manages anyone. Self-management
// and last-super-admin guards live in the controllers and are separate.
// Single shared copy; previously duplicated in the users and invites controllers.
export function canManageRole(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();

  if (actor === "super_admin") return true;
  if (actor === "admin") return !["super_admin", "admin"].includes(target);
  return false;
}
