// src/modules/iam/users/user.service.js
import mongoose from "mongoose";
import User from "./user.model.js";

// The hierarchy rule has one implementation (R4-A); re-exported for callers of this module.
export { canManageRole } from "../../../utils/roleHierarchy.js";

export async function ensureEmailUnique(email, excludeId = null) {
  const q = { email };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    q._id = { $ne: excludeId };
  }
  const exists = await User.findOne(q).select("_id").lean();
  return !exists;
}
