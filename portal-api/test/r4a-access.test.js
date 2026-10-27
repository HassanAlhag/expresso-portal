// R4-A access consistency (P3-5 / P3-6): one shared role-hierarchy helper with
// unchanged behaviour, and file deletion limited to internal users holding
// files.delete. Real Express app; model calls are stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import { canManageRole } from "../src/utils/roleHierarchy.js";
import { canManageRole as fromUserService } from "../src/modules/iam/users/user.service.js";
import User from "../src/modules/iam/users/user.model.js";
import Invite from "../src/modules/iam/invites/invite.model.js";
import AccessRequest from "../src/modules/iam/access-requests/accessRequest.model.js";
import File from "../src/modules/files/file.model.js";

afterEach(restoreAll);
after(stopApp);

// ═══ canManageRole: behaviour equivalence ════════════════════════════════════
// The rule exactly as it existed in user.controller.js and invite.controller.js
// before R4-A (both copies were identical and lower-cased their inputs).
function previousRule(actorRole, targetRole) {
  const actor = String(actorRole || "").toLowerCase();
  const target = String(targetRole || "").toLowerCase();
  if (actor === "super_admin") return true;
  if (actor === "admin") return !["super_admin", "admin"].includes(target);
  return false;
}
const ROLES = [
  "super_admin", "admin", "operations_manager", "finance", "procurement_manager", "procurement_officer",
  "project_manager", "staff", "hr_management", "staff_client", "procurement_client", "client_admin",
  "client", "vendor", "custom_internal", "custom_external", "SUPER_ADMIN", "Admin", "", undefined, null,
];

test("canManageRole: identical to the previous rule for every actor × target pair", () => {
  let pairs = 0;
  for (const actor of ROLES) for (const target of ROLES) {
    assert.equal(canManageRole(actor, target), previousRule(actor, target), `${actor} → ${target}`);
    assert.equal(fromUserService(actor, target), canManageRole(actor, target), "user.service re-exports the same helper");
    pairs += 1;
  }
  assert.equal(pairs, ROLES.length ** 2);
});

test("canManageRole: the hierarchy itself is unchanged", () => {
  assert.equal(canManageRole("super_admin", "super_admin"), true);
  assert.equal(canManageRole("super_admin", "admin"), true);
  assert.equal(canManageRole("admin", "super_admin"), false);
  assert.equal(canManageRole("admin", "admin"), false);
  assert.equal(canManageRole("admin", "staff"), true);
  assert.equal(canManageRole("admin", "client"), true);
  // No ranking was invented for custom roles: holding a permission does not make a manager.
  assert.equal(canManageRole("custom_internal", "staff"), false);
  assert.equal(canManageRole("hr_management", "staff"), false);
});

// ═══ The hierarchy through every flow that uses it ═══════════════════════════
const sa = { _id: oid(), role: "super_admin", isActive: true };
const admin = { _id: oid(), role: "admin", isActive: true };
const peerAdmin = { _id: oid(), role: "admin", isActive: true, email: "peer@test.local" };
const staffUser = { _id: oid(), role: "staff", isActive: true, email: "staff@test.local" };
const manager = { _id: oid(), role: "people_ops", isActive: true };
const roles = {
  // A custom internal role that holds every user-management permission but no rank.
  people_ops: { permissions: ["iam.users.read", "iam.users.write", "iam.users.delete", "iam.invites.send"], isInternal: true },
};
const mustNotWrite = (what) => () => assert.fail(`${what} must not run when the hierarchy refuses`);

function world(users) {
  setupAuth({ users, roles });
  stub(User, "countDocuments", () => q(2));
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  stub(User, "findByIdAndUpdate", mustNotWrite("User.findByIdAndUpdate"));
  stub(User, "create", mustNotWrite("User.create"));
  stub(Invite, "create", mustNotWrite("Invite.create"));
}

test("users: admin cannot create, edit, deactivate or delete an admin; a custom role with the permissions cannot manage anyone", async () => {
  world([admin, peerAdmin, staffUser, manager, sa]);
  const body = { fullName: "New Admin", email: "new@test.local", password: "Str0ng!Passw0rd", role: "admin" };
  assert.equal((await call("POST", "/api/users", { user: admin, body })).status, 403);
  assert.equal((await call("PATCH", `/api/users/${peerAdmin._id}`, { user: admin, body: { fullName: "x" } })).status, 403);
  assert.equal((await call("PATCH", `/api/users/${peerAdmin._id}/status`, { user: admin, body: { isActive: false } })).status, 403);
  assert.equal((await call("DELETE", `/api/users/${peerAdmin._id}`, { user: admin })).status, 403);
  assert.equal((await call("DELETE", `/api/users/${sa._id}`, { user: admin })).status, 403);
  assert.equal((await call("POST", "/api/users", { user: manager, body: { ...body, role: "staff" } })).status, 403);
  assert.equal((await call("DELETE", `/api/users/${staffUser._id}`, { user: manager })).status, 403);
  assert.equal((await call("PATCH", `/api/users/${staffUser._id}`, { user: admin, body: { role: "admin" } })).status, 403, "admin cannot promote to admin");
});

test("users: admin may still manage a staff user, and super admin may manage an admin", async () => {
  // The default admin role lacks iam.users.delete (route-level), so grant it here
  // to reach the hierarchy rule, as the P0-3 tests do.
  const adminWithDelete = { admin: { permissions: ["iam.users.read", "iam.users.write", "iam.users.delete"], isInternal: true } };
  setupAuth({ users: [admin, staffUser, sa, peerAdmin], roles: { ...roles, ...adminWithDelete } });
  stub(User, "countDocuments", () => q(2));
  let deletes = 0;
  stub(User, "findByIdAndDelete", async () => { deletes += 1; return {}; });
  assert.equal((await call("DELETE", `/api/users/${staffUser._id}`, { user: admin })).status, 200);
  assert.equal((await call("DELETE", `/api/users/${peerAdmin._id}`, { user: sa })).status, 200);
  assert.equal(deletes, 2);
});

test("invites: the hierarchy refuses before any invite is written", async () => {
  world([admin, manager, sa]);
  stub(User, "findOne", () => q(null));
  stub(Invite, "findOne", () => q(null));
  const send = (user, role) => call("POST", "/api/invites", { user, body: { email: "invitee@test.local", fullName: "Invitee", role } });
  assert.equal((await send(admin, "admin")).status, 403);
  assert.equal((await send(admin, "super_admin")).status, 403);
  assert.equal((await send(manager, "staff")).status, 403);
  assert.notEqual((await send(sa, "admin")).status, 403, "super admin passes the hierarchy");
});

test("access requests: inviting from a request applies the same hierarchy", async () => {
  world([admin, manager, sa]);
  const request = { _id: oid(), status: "pending", workEmail: "req@test.local", fullName: "Requester", save: async () => {} };
  stub(AccessRequest, "findById", () => request);
  stub(User, "findOne", () => q(null));
  stub(Invite, "findOne", () => q(null));
  const invite = (user, role) => call("POST", `/api/access-requests/${request._id}/invite`, { user, body: { role } });
  assert.equal((await invite(admin, "admin")).status, 403);
  assert.equal((await invite(manager, "staff")).status, 403);
  assert.notEqual((await invite(admin, "staff")).status, 403, "admin may invite a staff member");
});

// ═══ File deletion: internal user AND files.delete ═══════════════════════════
const fileRoles = {
  delivery_custom: { permissions: ["files.read", "files.write", "files.delete"], isInternal: true },
  viewer_custom: { permissions: ["files.read"], isInternal: true },
  // An external role that was (wrongly) granted files.delete in the role editor.
  client: { permissions: ["files.read", "files.delete"], isInternal: false },
};
const companyA = oid();
const actors = {
  superAdmin: { _id: oid(), role: "super_admin" },
  admin: { _id: oid(), role: "admin" },
  internalWithDelete: { _id: oid(), role: "delivery_custom" },
  internalWithoutDelete: { _id: oid(), role: "viewer_custom" },
  clientWithDelete: { _id: oid(), role: "client", clientId: companyA },
  vendorWithExtra: { _id: oid(), role: "vendor", extraPermissions: ["files.read", "files.delete"] },
};

function fileWorld() {
  setupAuth({ users: Object.values(actors), roles: fileRoles });
  const deleted = [];
  stub(File, "findByIdAndDelete", (id) => {
    deleted.push(String(id));
    return q({ _id: id, filename: "", isPrivate: false, customerId: oid() });
  });
  return deleted;
}

test("file delete: super admin, default admin and an internal custom role with files.delete may delete", async () => {
  const deleted = fileWorld();
  for (const who of ["superAdmin", "admin", "internalWithDelete"]) {
    const r = await call("DELETE", `/api/files/${oid()}`, { user: actors[who] });
    assert.equal(r.status, 200, who);
  }
  assert.equal(deleted.length, 3);
});

test("file delete: an internal role without files.delete is refused", async () => {
  const deleted = fileWorld();
  const r = await call("DELETE", `/api/files/${oid()}`, { user: actors.internalWithoutDelete });
  assert.equal(r.status, 403);
  assert.equal(deleted.length, 0);
});

test("file delete: client and vendor users stay refused even when granted files.delete", async () => {
  const deleted = fileWorld();
  for (const who of ["clientWithDelete", "vendorWithExtra"]) {
    const r = await call("DELETE", `/api/files/${oid()}`, { user: actors[who] });
    assert.equal(r.status, 403, who);
  }
  assert.equal(deleted.length, 0, "nothing deleted");
});
