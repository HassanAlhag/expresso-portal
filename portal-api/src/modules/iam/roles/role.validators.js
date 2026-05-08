import { VALID_PERMISSION_KEYS } from "../../../config/permissions.js";

function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizePermissions(list) {
  if (!Array.isArray(list)) return [];
  const unique = [...new Set(list.map((x) => String(x || "").trim()).filter(Boolean))];
  return unique.filter((k) => VALID_PERMISSION_KEYS.has(k));
}

export function validateCreateRole(body = {}) {
  const key = normalizeKey(body.key);
  const label = String(body.label || "").trim();
  const description = String(body.description || "").trim();
  const permissions = normalizePermissions(body.permissions);

  if (!key) return { ok: false, message: "key is required" };
  if (!label) return { ok: false, message: "label is required" };

  return {
    ok: true,
    value: {
      key,
      label,
      description,
      permissions,
    },
  };
}

export function validateUpdateRole(body = {}) {
  const patch = {};

  if ("key" in body) patch.key = normalizeKey(body.key);
  if ("label" in body) patch.label = String(body.label || "").trim();
  if ("description" in body)
    patch.description = String(body.description || "").trim();
  if ("permissions" in body)
    patch.permissions = normalizePermissions(body.permissions);

  if ("key" in patch && !patch.key) {
    return { ok: false, message: "key cannot be empty" };
  }

  if ("label" in patch && !patch.label) {
    return { ok: false, message: "label cannot be empty" };
  }

  return { ok: true, value: patch };
}
