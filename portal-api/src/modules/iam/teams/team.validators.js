function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function validateCreateTeam(body = {}) {
  const key = normalizeKey(body.key);
  const label = String(body.label || "").trim();
  const description = String(body.description || "").trim();
  const isActive = body.isActive !== false;
  const leadUserId = body.leadUserId || null;

  if (!key) return { ok: false, message: "key is required" };
  if (!label) return { ok: false, message: "label is required" };

  return {
    ok: true,
    value: { key, label, description, isActive, leadUserId },
  };
}

export function validateUpdateTeam(body = {}) {
  const patch = {};

  if ("key" in body) patch.key = normalizeKey(body.key);
  if ("label" in body) patch.label = String(body.label || "").trim();
  if ("description" in body)
    patch.description = String(body.description || "").trim();
  if ("isActive" in body) patch.isActive = Boolean(body.isActive);
  if ("leadUserId" in body) patch.leadUserId = body.leadUserId || null;

  if ("key" in patch && !patch.key) {
    return { ok: false, message: "key cannot be empty" };
  }

  if ("label" in patch && !patch.label) {
    return { ok: false, message: "label cannot be empty" };
  }

  return { ok: true, value: patch };
}
