function parseBool(v) {
  if (v === true || v === false) return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function safeSort(
  sortStr,
  allowed = [
    "createdAt",
    "updatedAt",
    "fullName",
    "email",
    "role",
    "lastLoginAt",
  ]
) {
  if (!sortStr) return { createdAt: -1 };
  // supports "-createdAt"
  const dir = sortStr.startsWith("-") ? -1 : 1;
  const field = sortStr.replace(/^-/, "");
  if (!allowed.includes(field)) return { createdAt: -1 };
  return { [field]: dir };
}

module.exports = { parseBool, safeSort };
