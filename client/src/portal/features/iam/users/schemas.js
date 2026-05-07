export function validateUserPayload(payload) {
  const errors = {};
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const fullName = String(payload.fullName || "").trim();

  if (!fullName) errors.fullName = "Full name is required";
  if (!email) errors.email = "Email is required";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Invalid email";

  return { ok: Object.keys(errors).length === 0, errors };
}
