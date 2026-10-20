import User from "../modules/iam/users/user.model.js";
import { verifyToken } from "../utils/jwt.js";
import { resolveRoleContext } from "../utils/roleRegistry.js";

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/**
 * Resolve the signed-in user for a request, or null when there is no valid,
 * current session. Shared by requireAuth and optionalAuth so both apply the
 * same checks (active user, token not older than the last password change,
 * effective permissions from the role registry).
 */
async function resolveRequestUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const decoded = verifyToken(token);

  const user = await User.findById(decoded.id).select(
    "fullName email role clientId permissions extraPermissions revokedPermissions isActive passwordChangedAt"
  );

  if (!user || user.isActive === false) return null;

  const tokenIatMs = (decoded?.iat || 0) * 1000;
  if (
    user.passwordChangedAt &&
    user.passwordChangedAt.getTime() > tokenIatMs
  ) {
    return null;
  }

  // Resolve effective permissions: role defaults + extra - revoked
  const { permissions: effectivePermissions, isInternal } =
    await resolveRoleContext(
      user.role,
      user.extraPermissions || [],
      user.revokedPermissions || []
    );

  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    clientId: user.clientId ? String(user.clientId) : null,
    permissions: effectivePermissions,
    isInternal,
    isActive: user.isActive !== false,
  };
}

export async function requireAuth(req, res, next) {
  try {
    const user = await resolveRequestUser(req);
    if (!user)
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}

/**
 * For public routes that also serve signed-in CMS editors: attaches req.user
 * when a valid session is present, and otherwise continues anonymously. It
 * never rejects, so public visitors are unaffected.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const user = await resolveRequestUser(req);
    if (user) req.user = user;
  } catch {
    // Invalid or expired token: treat the request as anonymous.
  }
  return next();
}

/** True when the user holds the permission. super_admin always does. */
export function userHasPermission(user, perm) {
  if (!user?.role) return false;
  if (user.role === "super_admin") return true;
  return (user.permissions || []).includes(perm);
}

/**
 * Coarse role gate. Use this for admin-only management surfaces.
 * super_admin always passes.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    if (role === "super_admin") return next();
    if (!roles.includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    return next();
  };
}

/**
 * Fine-grained permission gate.
 * Passes when the user holds ALL of the listed permissions.
 * super_admin always passes regardless of permission list.
 *
 * Use this instead of requireRole when you want custom roles to be able
 * to access the route if they have the specific permission assigned.
 */
export function requirePermission(...perms) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const missing = perms.filter((p) => !userHasPermission(req.user, p));

    if (missing.length > 0) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden",
        required: perms,
        missing,
      });
    }

    return next();
  };
}

/**
 * Passes if the user holds AT LEAST ONE of the listed permissions.
 * Useful for read routes accessible by multiple roles with different permissions.
 */
export function requireAnyPermission(...perms) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    if (role === "super_admin") return next();

    const userPerms = new Set(req.user?.permissions || []);
    if (perms.some((p) => userPerms.has(p))) return next();

    return res.status(403).json({
      ok: false,
      message: "Forbidden",
      required: `any of: ${perms.join(", ")}`,
    });
  };
}
