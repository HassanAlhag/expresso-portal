import User from "../iam/users/user.model.js";
import Team from "../iam/teams/team.model.js";
import Role from "../iam/roles/role.model.js";
import { isSystemInternalRole } from "../../utils/roleRegistry.js";
import { userHasPermission } from "../../middleware/auth.js";
import { ownerCommand, ownerOverview, periodCommand } from "./operating.service.js";
import { jobCommand } from "./jobOperating.service.js";
import { insist } from "./operating.rules.js";

export function operatingFailure(res, error) {
  const status = error.code === "TRANSACTIONS_UNSUPPORTED" ? 503 : error.code === 11000 ? 409 : error.status || 500;
  if (status === 500) console.error("Operating command failed:", error.message);
  return res.status(status).json({ ok: false, message: status === 500 ? "The operating action failed; nothing was committed." : error.message, code: error.code });
}
export async function operatingOptions(req, res) {
  try {
    const [users, roles, teams] = await Promise.all([User.find({ isActive: true }).select("fullName role").lean(), Role.find({}).select("key isInternal").lean(), Team.find({ isActive: true }).select("label leadUserId").lean()]);
    const internal = (u) => { const r = roles.find((x) => x.key === u.role); return u.role === "super_admin" || (typeof r?.isInternal === "boolean" ? r.isInternal : isSystemInternalRole(u.role)); };
    return res.json({ ok: true, users: users.filter(internal).map((u) => ({ _id: u._id, fullName: u.fullName })), teams });
  } catch (e) { return operatingFailure(res, e); }
}
export const enrollmentOverview = async (req, res) => { try { return res.json({ ok: true, ...await ownerOverview("enrollment", req.params.id, req.query) }); } catch (e) { return operatingFailure(res, e); } };
export const projectOverview = async (req, res) => { try { return res.json({ ok: true, ...await ownerOverview("project", req.params.id, req.query) }); } catch (e) { return operatingFailure(res, e); } };
async function ownerAction(kind, req, res) {
  try {
    if (["activate", "open-period"].includes(req.params.command) || req.body?.adoptionMappings?.length) insist(userHasPermission(req.user, "jobs.write"), "Job creation/assignment permission is required", 403);
    return res.json({ ok: true, ...await ownerCommand(kind, req.params.id, req.params.command, req.body || {}, req.user) });
  } catch (e) { return operatingFailure(res, e); }
}
export const enrollmentAction = (req, res) => ownerAction("enrollment", req, res);
export const projectAction = (req, res) => ownerAction("project", req, res);
export async function periodAction(req, res) {
  try { return res.json({ ok: true, ...await periodCommand(req.params.id, req.params.periodId, req.params.command, req.body || {}, req.user) }); }
  catch (e) { return operatingFailure(res, e); }
}
export async function jobAction(req, res) {
  try {
    if (req.params.command === "decide") insist(userHasPermission(req.user, "jobs.approve"), "Approval permission is required", 403);
    else insist(userHasPermission(req.user, "jobs.write"), "Job write permission is required", 403);
    return res.json({ ok: true, ...await jobCommand(req.params.id, req.params.command, req.body || {}, req.user) });
  } catch (e) { return operatingFailure(res, e); }
}
