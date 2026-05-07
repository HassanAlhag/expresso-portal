import Audit from "./audit.model.js";

export async function logAudit(
  req,
  { action, targetUserId = null, meta = {} }
) {
  try {
    await Audit.create({
      actorId: req.user?.id || null,
      actorEmail: req.user?.email || "",
      targetUserId,
      action,
      meta,
      ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "",
      userAgent: req.headers["user-agent"] || "",
    });
  } catch (e) {
    // don't break main flow if audit fails
    console.warn("audit log failed:", e?.message);
  }
}
