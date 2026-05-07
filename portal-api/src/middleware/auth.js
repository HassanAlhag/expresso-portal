import User from "../modules/iam/users/user.model.js";
import { verifyToken } from "../utils/jwt.js";

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

    // ✅ IMPORTANT: include passwordChangedAt in select
    const user = await User.findById(decoded.id).select(
      "fullName email role permissions isActive passwordChangedAt"
    );

    if (!user || user.isActive === false) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    // ✅ Force-logout-all-devices check:
    // If token issued time < passwordChangedAt => reject
    const tokenIatMs = (decoded?.iat || 0) * 1000;
    if (
      user.passwordChangedAt &&
      user.passwordChangedAt.getTime() > tokenIatMs
    ) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    req.user = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive !== false,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}

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

export function requirePermission(...perms) {
  return (req, res, next) => {
    const role = req.user?.role;
    const permissions = req.user?.permissions || [];
    if (!role)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    if (role === "super_admin") return next();

    const ok = perms.every((p) => permissions.includes(p));
    if (!ok) return res.status(403).json({ ok: false, message: "Forbidden" });

    return next();
  };
}
