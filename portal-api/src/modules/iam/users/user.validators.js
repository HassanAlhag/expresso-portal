const ROLES = new Set(["super_admin", "admin", "staff", "client"]);

export function validateCreateUser(body = {}) {
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "client")
    .trim()
    .toLowerCase();
  const isActive = body.isActive !== false;
  const clientId = body.clientId || null;

  const jobTitle = String(body.jobTitle || "").trim();
  const phone = String(body.phone || "").trim();
  const team = String(body.team || "").trim();
  const avatarUrl = String(body.avatarUrl || "").trim();
  const avatarMediaId = body.avatarMediaId || null;
  const notes = String(body.notes || "").trim();

  if (!fullName) return { ok: false, message: "fullName is required" };
  if (!email) return { ok: false, message: "email is required" };
  if (!password) return { ok: false, message: "password is required" };
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters" };
  }
  if (!role) return { ok: false, message: "role is required" };

  return {
    ok: true,
    value: {
      fullName,
      email,
      password,
      role,
      isActive,
      clientId,
      jobTitle,
      phone,
      team,
      avatarUrl,
      avatarMediaId,
      notes,
    },
  };
}

export function validateUpdateUser(body = {}) {
  const patch = {};

  if ("fullName" in body) patch.fullName = String(body.fullName || "").trim();
  if ("email" in body)
    patch.email = String(body.email || "")
      .trim()
      .toLowerCase();
  if ("role" in body)
    patch.role = String(body.role || "")
      .trim()
      .toLowerCase();
  if ("isActive" in body) patch.isActive = Boolean(body.isActive);
  if ("clientId" in body) patch.clientId = body.clientId || null;

  if ("jobTitle" in body) patch.jobTitle = String(body.jobTitle || "").trim();
  if ("phone" in body) patch.phone = String(body.phone || "").trim();
  if ("team" in body) patch.team = String(body.team || "").trim();
  if ("avatarUrl" in body)
    patch.avatarUrl = String(body.avatarUrl || "").trim();
  if ("avatarMediaId" in body) patch.avatarMediaId = body.avatarMediaId || null;
  if ("notes" in body) patch.notes = String(body.notes || "").trim();

  if ("email" in patch && !patch.email) {
    return { ok: false, message: "Email cannot be empty" };
  }

  if ("role" in patch && !patch.role) {
    return { ok: false, message: "Role cannot be empty" };
  }

  return { ok: true, value: patch };
}
