import User from "../modules/iam/users/user.model.js";
import { verifyToken } from "../utils/jwt.js";
import { resolvePermissions } from "../utils/resolvePermissions.js";

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select(
      "fullName email role permissions extraPermissions revokedPermissions isActive passwordChangedAt"
    );

    if (!user || user.isActive === false) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const tokenIatMs = (decoded?.iat || 0) * 1000;
    if (
      user.passwordChangedAt &&
      user.passwordChangedAt.getTime() > tokenIatMs
    ) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    // Resolve effective permissions: role defaults + extra - revoked
    const effectivePermissions = await resolvePermissions(
      user.role,
      user.extraPermissions || [],
      user.revokedPermissions || []
    );

    req.user = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: effectivePermissions,
      isActive: user.isActive !== false,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
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

    if (role === "super_admin") return next();

    const userPerms = new Set(req.user?.permissions || []);
    const missing = perms.filter((p) => !userPerms.has(p));

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
