import mongoose from "mongoose";

// Self-service scoping for HR records (leave, expenses). A user who can only
// submit (no approve permission) sees and edits their own records; approvers
// see everyone's but may not approve their own (audit S5).

export function hasPermission(req, perm) {
  if (req.user?.role === "super_admin") return true;
  return (req.user?.permissions || []).includes(perm);
}

function myObjectId(req) {
  const id = String(req.user?.id || "");
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

/** Mongo filter matching records owned by (or created by) the current user. */
export function ownerFilter(req) {
  const me = myObjectId(req);
  if (!me) return { _id: null };
  return { $or: [{ staffUserId: me }, { createdBy: me }] };
}

/** Add the owner filter to an existing filter without clobbering its $or. */
export function withOwnerScope(req, filter = {}) {
  return { ...filter, $and: [...(filter.$and || []), ownerFilter(req)] };
}

function idOf(v) {
  if (!v) return "";
  return String(v._id || v);
}

export function isOwner(req, doc) {
  const me = String(req.user?.id || "");
  if (!me || !doc) return false;
  return idOf(doc.staffUserId) === me || idOf(doc.createdBy) === me;
}
