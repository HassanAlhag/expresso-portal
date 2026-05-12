// src/modules/iam/users/user.service.js
import mongoose from "mongoose";
import User from "./user.model.js";

export function canManageRole(actorRole, targetRole) {
  if (actorRole === "super_admin") return true;
  if (actorRole === "admin") return !["super_admin", "admin"].includes(targetRole);
  return false;
}

export async function ensureEmailUnique(email, excludeId = null) {
  const q = { email };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    q._id = { $ne: excludeId };
  }
  const exists = await User.findOne(q).select("_id").lean();
  return !exists;
}
