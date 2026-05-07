// src/middleware/rbac.js
export function requireActiveUser(req, res, next) {
  if (!req.user || req.user.status !== "active") {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    // superadmin always passes
    if (role === "superadmin") return next();

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

    // superadmin always passes
    if (role === "superadmin") return next();

    const ok = perms.every((p) => permissions.includes(p));
    if (!ok) return res.status(403).json({ ok: false, message: "Forbidden" });

    return next();
  };
}
