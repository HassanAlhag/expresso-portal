// Stage R1 — P0 security regression tests (REMEDIATION-PLAN.md P0-1…P0-4).
// Every request goes through the real Express app, middleware and controllers;
// only model calls are stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import { setupAuth, restoreAll, stopApp, startApp, stub, q, oid, call } from "./helpers.js";
import { redactUrl, createRequestLogger } from "../src/middleware/requestLogger.js";
import Project from "../src/modules/projects/project.model.js";
import Enrollment from "../src/modules/enrollments/enrollment.model.js";
import Ticket from "../src/modules/tickets/ticket.model.js";
import User from "../src/modules/iam/users/user.model.js";
import Invite from "../src/modules/iam/invites/invite.model.js";
import Portfolio from "../src/modules/portfolio/portfolio.model.js";
import Production from "../src/modules/content/productions/production.model.js";
import DigitalService from "../src/modules/web-content/digitalService.model.js";
import Solution from "../src/modules/web-content/solution.model.js";
import { createProject, updateProject, archiveProject } from "../src/modules/projects/project.controller.js";
import { deleteTicket } from "../src/modules/tickets/ticket.controller.js";

afterEach(restoreAll);
after(stopApp);

const mustNotWrite = (what) => () => assert.fail(`${what} must not be called when the request is rejected`);

// ── Actors ──────────────────────────────────────────────────────────────────
const companyA = oid();
const companyB = oid();
// External client role that an admin has (wrongly or deliberately) granted
// project and ticket write/delete permissions — the documented P0-2 scenario.
const clientA = { _id: oid(), role: "client", clientId: companyA };
// Internal staff with a custom role (global access by internal classification).
const pm = { _id: oid(), role: "delivery_lead" };
const superAdmin = { _id: oid(), role: "super_admin" };
const grantedRoles = {
  client: {
    permissions: ["projects.read", "projects.write", "projects.delete", "tickets.read", "tickets.write", "tickets.delete"],
    isInternal: false,
  },
  delivery_lead: {
    permissions: ["projects.read", "projects.write", "projects.delete", "tickets.read", "tickets.write", "tickets.delete"],
    isInternal: true,
  },
};
const asActors = () => setupAuth({ users: [clientA, pm, superAdmin], roles: grantedRoles });

// ═══ P0-2 TENANT ISOLATION — PROJECTS ════════════════════════════════════════
// Since R2, client/vendor roles can no longer hold projects.write,
// projects.delete or tickets.delete at all (they are stripped at sign-in and
// refused by the role editor), so an HTTP request from an external user stops
// at the permission gate. The R1 company boundary inside the controllers is
// still required as defence in depth, so these tests call the controllers
// directly with an external user who *does* hold the permission — the
// misconfiguration the boundary exists for. Internal staff go through HTTP.

/** Invoke a controller with a synthetic request; returns { status, body }. */
async function runController(handler, { user, params = {}, body = {} }) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  await handler({ user, params, body, query: {} }, res);
  return { status: res.statusCode, body: res.body };
}

// External user who (wrongly) holds project/ticket write and delete.
const externalHolder = {
  id: String(clientA._id),
  role: "client",
  clientId: companyA,
  isInternal: false,
  permissions: ["projects.read", "projects.write", "projects.delete", "tickets.read", "tickets.write", "tickets.delete"],
};

function projectCreateStubs() {
  const created = [];
  stub(Project, "create", async (doc) => {
    created.push(doc);
    return { _id: oid(), ...doc };
  });
  stub(Project, "findById", () => q({ _id: oid(), name: "x" }));
  stub(Enrollment, "findById", () => q(null));
  return created;
}

test("P0-2 project create: external user can create for their own company (controller boundary)", async () => {
  const created = projectCreateStubs();
  const r = await runController(createProject, { user: externalHolder, body: { name: "Own", customerId: companyA } });
  assert.equal(r.status, 201);
  assert.equal(created.length, 1);
  assert.equal(String(created[0].customerId), companyA);
});

test("P0-2 project create: cross-company create is rejected and nothing is written (controller boundary)", async () => {
  stub(Project, "create", mustNotWrite("Project.create"));
  const r = await runController(createProject, { user: externalHolder, body: { name: "Other", customerId: companyB } });
  assert.equal(r.status, 403);
});

test("P0-2 project create: external user cannot create an internal project (controller boundary)", async () => {
  stub(Project, "create", mustNotWrite("Project.create"));
  const r = await runController(createProject, { user: externalHolder, body: { name: "Internal", projectMode: "internal" } });
  assert.equal(r.status, 403);
});

test("P0-2 project create: internal staff can still create for any company and internal projects", async () => {
  asActors();
  const created = projectCreateStubs();
  const a = await call("POST", "/api/projects", { user: pm, body: { name: "B work", customerId: companyB } });
  const b = await call("POST", "/api/projects", { user: pm, body: { name: "Ops", projectMode: "internal" } });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal(String(created[0].customerId), companyB);
  assert.equal(created[1].customerId, null);
});

function existingProject(customerId) {
  const doc = { _id: oid(), name: "P", customerId, projectMode: "custom" };
  stub(Project, "findById", () => q(doc));
  return doc;
}

test("P0-2 project update: same-company update succeeds (controller boundary)", async () => {
  const p = existingProject(companyA);
  let patched = null;
  stub(Project, "findOneAndUpdate", (_id, patch) => {
    patched = patch;
    return q({ ...p, ...patch });
  });
  const r = await runController(updateProject, { user: externalHolder, params: { id: String(p._id) }, body: { name: "Renamed" } });
  assert.equal(r.status, 200);
  assert.equal(patched.name, "Renamed");
});

test("P0-2 project update: another company's project cannot be edited and is left unchanged (controller boundary)", async () => {
  const p = existingProject(companyB);
  stub(Project, "findOneAndUpdate", mustNotWrite("Project.findByIdAndUpdate"));
  const r = await runController(updateProject, { user: externalHolder, params: { id: String(p._id) }, body: { name: "Hijacked" } });
  assert.equal(r.status, 403);
});

test("P0-2 project update: external user cannot move their project to another company (controller boundary)", async () => {
  const p = existingProject(companyA);
  stub(Project, "findOneAndUpdate", mustNotWrite("Project.findByIdAndUpdate"));
  const r = await runController(updateProject, { user: externalHolder, params: { id: String(p._id) }, body: { customerId: companyB } });
  assert.equal(r.status, 403);
});

test("P0-2 project update: external user cannot turn their project internal (controller boundary)", async () => {
  const p = existingProject(companyA);
  stub(Project, "findOneAndUpdate", mustNotWrite("Project.findByIdAndUpdate"));
  const r = await runController(updateProject, { user: externalHolder, params: { id: String(p._id) }, body: { projectMode: "internal" } });
  assert.equal(r.status, 403);
});

test("P0-2 project update: internal staff can still edit and reassign any project", async () => {
  asActors();
  const p = existingProject(companyB);
  let patched = null;
  stub(Project, "findOneAndUpdate", (_id, patch) => {
    patched = patch;
    return q({ ...p, ...patch });
  });
  const r = await call("PATCH", `/api/projects/${p._id}`, { user: pm, body: { customerId: companyA } });
  assert.equal(r.status, 200);
  assert.equal(String(patched.customerId), companyA);
});

// R3 (P2-4): DELETE archives instead of deleting. The company boundary is the
// same as before; these tests now check the archive write.
test("P0-2 project delete: same-company archive succeeds (controller boundary)", async () => {
  const p = existingProject(companyA);
  let archived = null;
  stub(Project, "findByIdAndDelete", mustNotWrite("Project.findByIdAndDelete"));
  stub(Project, "updateOne", (filter, update) => {
    archived = { filter, update };
    return q({ modifiedCount: 1 });
  });
  const r = await runController(archiveProject, { user: externalHolder, params: { id: String(p._id) } });
  assert.equal(r.status, 200);
  assert.equal(String(archived.filter._id), String(p._id));
  assert.equal(archived.update.$set.status, "archived");
});

test("P0-2 project delete: another company's project is not deleted (controller boundary)", async () => {
  const p = existingProject(companyB);
  stub(Project, "findByIdAndDelete", mustNotWrite("Project.findByIdAndDelete"));
  stub(Project, "updateOne", mustNotWrite("Project.updateOne"));
  const r = await runController(archiveProject, { user: externalHolder, params: { id: String(p._id) } });
  assert.equal(r.status, 403);
});

test("P0-2 project delete: internal staff and super admin can archive any company's project", async () => {
  asActors();
  const p = existingProject(companyB);
  let archives = 0;
  stub(Project, "findByIdAndDelete", mustNotWrite("Project.findByIdAndDelete"));
  stub(Project, "updateOne", () => {
    archives += 1;
    return q({ modifiedCount: 1 });
  });
  assert.equal((await call("DELETE", `/api/projects/${p._id}`, { user: pm })).status, 200);
  assert.equal((await call("DELETE", `/api/projects/${p._id}`, { user: superAdmin })).status, 200);
  assert.equal(archives, 2);
});

test("P0-2 + R2: over the API, an external user granted project/ticket write or delete is refused before any write", async () => {
  asActors(); // the client role document grants projects.write/delete and tickets.delete
  stub(Project, "create", mustNotWrite("Project.create"));
  stub(Project, "findOneAndUpdate", mustNotWrite("Project.findByIdAndUpdate"));
  stub(Project, "findByIdAndDelete", mustNotWrite("Project.findByIdAndDelete"));
  stub(Ticket, "findByIdAndDelete", mustNotWrite("Ticket.findByIdAndDelete"));
  const p = existingProject(companyA);
  stub(Ticket, "findById", () => q({ _id: oid(), customerId: companyA }));
  assert.equal((await call("POST", "/api/projects", { user: clientA, body: { name: "Own", customerId: companyA } })).status, 403);
  assert.equal((await call("PATCH", `/api/projects/${p._id}`, { user: clientA, body: { name: "x" } })).status, 403);
  assert.equal((await call("DELETE", `/api/projects/${p._id}`, { user: clientA })).status, 403);
  assert.equal((await call("DELETE", `/api/tickets/${oid()}`, { user: clientA })).status, 403);
});

// ═══ P0-2 TENANT ISOLATION — TICKETS ═════════════════════════════════════════
function existingTicket(customerId, clientId = oid()) {
  const doc = { _id: oid(), customerId, clientId };
  stub(Ticket, "findById", () => q(doc));
  return doc;
}

test("P0-2 ticket delete: same-company delete passes the company boundary (controller boundary)", async () => {
  const t = existingTicket(companyA);
  let deleted = 0;
  stub(Ticket, "findByIdAndDelete", async () => {
    deleted += 1;
    return t;
  });
  const r = await runController(deleteTicket, { user: externalHolder, params: { id: String(t._id) } });
  assert.equal(r.status, 200);
  assert.equal(deleted, 1);
});

test("P0-2 ticket delete: another company's ticket is not deleted (controller boundary)", async () => {
  const t = existingTicket(companyB);
  stub(Ticket, "findByIdAndDelete", mustNotWrite("Ticket.findByIdAndDelete"));
  const r = await runController(deleteTicket, { user: externalHolder, params: { id: String(t._id) } });
  assert.equal(r.status, 403);
});

test("P0-2 ticket delete: internal staff can delete any company's ticket", async () => {
  asActors();
  const t = existingTicket(companyB);
  let deleted = 0;
  stub(Ticket, "findByIdAndDelete", async () => {
    deleted += 1;
    return t;
  });
  const r = await call("DELETE", `/api/tickets/${t._id}`, { user: pm });
  assert.equal(r.status, 200);
  assert.equal(deleted, 1);
});

test("P0-2 ticket delete: missing ticket still returns 404", async () => {
  asActors();
  stub(Ticket, "findById", () => q(null));
  stub(Ticket, "findByIdAndDelete", mustNotWrite("Ticket.findByIdAndDelete"));
  const r = await call("DELETE", `/api/tickets/${oid()}`, { user: pm });
  assert.equal(r.status, 404);
});

// ═══ P0-3 PRIVILEGE — SELF-DELETE AND LAST SUPER ADMIN ═══════════════════════
const sa1 = { _id: oid(), role: "super_admin", isActive: true };
const sa2 = { _id: oid(), role: "super_admin", isActive: true };
const admin = { _id: oid(), role: "admin", isActive: true };
const staffUser = { _id: oid(), role: "staff", isActive: true };
const adminRoles = { admin: { permissions: ["iam.users.read", "iam.users.write", "iam.users.delete"], isInternal: true } };

function userStore(users, { activeSuperAdmins }) {
  setupAuth({ users, roles: adminRoles });
  stub(User, "countDocuments", (filter) => {
    assert.equal(filter.role, "super_admin");
    const excluded = String(filter._id?.$ne || "");
    return q(activeSuperAdmins.filter((u) => String(u._id) !== excluded).length);
  });
}

test("P0-3 a super admin cannot delete their own account (guard now fires)", async () => {
  userStore([sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  const r = await call("DELETE", `/api/users/${sa1._id}`, { user: sa1 });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /own account/);
});

test("P0-3 deleting another super admin works while one active super admin remains", async () => {
  userStore([sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  let deleted = 0;
  stub(User, "findByIdAndDelete", async () => {
    deleted += 1;
    return sa2;
  });
  const r = await call("DELETE", `/api/users/${sa2._id}`, { user: sa1 });
  assert.equal(r.status, 200);
  assert.equal(deleted, 1);
});

test("P0-3 the last active super admin cannot be deleted", async () => {
  // sa2 is the only active super admin; sa1 (the actor) is counted out by the store.
  userStore([sa1, sa2], { activeSuperAdmins: [sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  const r = await call("DELETE", `/api/users/${sa2._id}`, { user: sa1 });
  assert.equal(r.status, 409);
});

test("P0-3 the last active super admin cannot deactivate themselves", async () => {
  userStore([sa1], { activeSuperAdmins: [sa1] });
  stub(User, "findByIdAndUpdate", mustNotWrite("User.findByIdAndUpdate"));
  const r = await call("PATCH", `/api/users/${sa1._id}/status`, { user: sa1, body: { isActive: false } });
  assert.equal(r.status, 409);
});

test("P0-3 the last active super admin cannot be demoted or deactivated through user edit", async () => {
  userStore([sa1], { activeSuperAdmins: [sa1] });
  stub(User, "findByIdAndUpdate", mustNotWrite("User.findByIdAndUpdate"));
  const demote = await call("PATCH", `/api/users/${sa1._id}`, { user: sa1, body: { role: "admin" } });
  const deactivate = await call("PATCH", `/api/users/${sa1._id}`, { user: sa1, body: { isActive: false } });
  assert.equal(demote.status, 409);
  assert.equal(deactivate.status, 409);
});

test("P0-3 a super admin can be demoted when another active super admin exists", async () => {
  userStore([sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  let patched = null;
  stub(User, "findByIdAndUpdate", (_id, patch) => {
    patched = patch;
    return q({ ...sa2, ...patch });
  });
  const r = await call("PATCH", `/api/users/${sa2._id}`, { user: sa1, body: { role: "admin" } });
  assert.equal(r.status, 200);
  assert.equal(patched.role, "admin");
});

test("P0-3 legitimate admin operations on ordinary users are unchanged", async () => {
  userStore([admin, staffUser], { activeSuperAdmins: [] });
  let updates = 0;
  stub(User, "findByIdAndUpdate", (_id, patch) => {
    updates += 1;
    return q({ ...staffUser, ...patch });
  });
  let deletes = 0;
  stub(User, "findByIdAndDelete", async () => {
    deletes += 1;
    return staffUser;
  });
  assert.equal((await call("PATCH", `/api/users/${staffUser._id}/status`, { user: admin, body: { isActive: false } })).status, 200);
  assert.equal((await call("DELETE", `/api/users/${staffUser._id}`, { user: admin })).status, 200);
  assert.equal(updates, 1);
  assert.equal(deletes, 1);
});

test("P0-3 admin still cannot delete or deactivate a super admin (existing hierarchy kept)", async () => {
  userStore([admin, sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  stub(User, "findByIdAndUpdate", mustNotWrite("User.findByIdAndUpdate"));
  assert.equal((await call("DELETE", `/api/users/${sa1._id}`, { user: admin })).status, 403);
  assert.equal((await call("PATCH", `/api/users/${sa1._id}/status`, { user: admin, body: { isActive: false } })).status, 403);
});

// ═══ P0-4 SECRET HANDLING — LOGS ═════════════════════════════════════════════
test("P0-4 redactUrl removes query strings and private-file tokens", () => {
  assert.equal(redactUrl("/api/invites/verify?token=abc123"), "/api/invites/verify?[redacted]");
  assert.equal(redactUrl("/api/private-files/eyJhbGc.sig"), "/api/private-files/[redacted]");
  assert.equal(
    redactUrl("https://portal.example/portal/reset-password?token=zzz#x"),
    "https://portal.example/portal/reset-password?[redacted]"
  );
  assert.equal(redactUrl("/api/projects/123"), "/api/projects/123");
  assert.equal(redactUrl("-"), "-");
});

test("P0-4 production log line contains neither the invite token nor a token-bearing referrer", async () => {
  const lines = [];
  const app = express();
  app.use(createRequestLogger({ production: true, stream: { write: (l) => lines.push(l) } }));
  app.get("*", (_req, res) => res.json({ ok: true }));
  const server = await new Promise((r) => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fetch(`${base}/api/invites/verify?token=INVITE-SECRET-1`, {
      headers: { referer: "https://portal.example/portal/accept-invite?token=INVITE-SECRET-2" },
    });
    await fetch(`${base}/api/private-files/FILE-SECRET-3`);
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    await new Promise((r) => server.close(r));
  }
  const log = lines.join("");
  assert.equal(lines.length, 2);
  for (const secret of ["INVITE-SECRET-1", "INVITE-SECRET-2", "FILE-SECRET-3"]) assert.ok(!log.includes(secret), `${secret} leaked: ${log}`);
  assert.match(log, /GET \/api\/invites\/verify\?\[redacted\] HTTP/);
  assert.match(log, /"https:\/\/portal\.example\/portal\/accept-invite\?\[redacted\]"/);
});

test("P0-4 the real app's request logger does not print the invite token", async () => {
  stub(Invite, "findOne", () => q(null));
  const written = [];
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    written.push(String(chunk));
    return orig(chunk, ...rest);
  };
  try {
    await call("GET", "/api/invites/verify?token=APP-INVITE-SECRET");
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    process.stdout.write = orig;
  }
  const out = written.join("");
  assert.ok(out.includes("/api/invites/verify"), "request should still be logged");
  assert.ok(!out.includes("APP-INVITE-SECRET"), "invite token must not be logged");
});

// ═══ P0-1 PUBLICATION ════════════════════════════════════════════════════════
const editor = { _id: oid(), role: "content_editor" };
const outsider = { _id: oid(), role: "client", clientId: companyA };
const pubRoles = {
  content_editor: { permissions: ["portfolio.read", "productions.read", "website.read"], isInternal: true },
  client: { permissions: ["projects.read"], isInternal: false },
};
const asPub = () => setupAuth({ users: [editor, outsider], roles: pubRoles });

/** Stub a status-based collection (Portfolio, Production): find honours filter.status. */
function statusCollection(Model, docs) {
  const seen = {};
  const match = (f = {}) => docs.filter((d) => !f.status || d.status === f.status);
  stub(Model, "countDocuments", (f) => {
    seen.filter = f;
    return q(match(f).length);
  });
  stub(Model, "find", (f) => q(match(f)));
  const bySlug = (slug) => q(docs.find((d) => d.slug === slug || String(d._id) === slug) || null);
  stub(Model, "findOne", (f) => bySlug(f.slug));
  stub(Model, "findById", (id) => bySlug(String(id)));
  return seen;
}

for (const [label, Model, path, perm] of [
  ["portfolio", Portfolio, "/api/portfolio", "portfolio.read"],
  ["productions", Production, "/api/productions", "productions.read"],
]) {
  const docs = [
    { _id: oid(), slug: "live", status: "published", title: "Live" },
    { _id: oid(), slug: "secret-draft", status: "draft", title: "Draft" },
  ];

  test(`P0-1 ${label}: anonymous list returns published only, even with ?status=draft`, async () => {
    asPub();
    const seen = statusCollection(Model, docs);
    const r = await call("GET", `${path}?status=draft`);
    assert.equal(r.status, 200);
    assert.equal(seen.filter.status, "published");
    assert.deepEqual(r.body.items.map((i) => i.slug), ["live"]);
  });

  test(`P0-1 ${label}: anonymous detail of a draft is 404; published detail is 200`, async () => {
    asPub();
    statusCollection(Model, docs);
    assert.equal((await call("GET", `${path}/secret-draft`)).status, 404);
    const ok = await call("GET", `${path}/live`);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.item.slug, "live");
  });

  test(`P0-1 ${label}: signed-in user without ${perm} still sees published only`, async () => {
    asPub();
    const seen = statusCollection(Model, docs);
    await call("GET", `${path}?status=draft`, { user: outsider });
    assert.equal(seen.filter.status, "published");
    assert.equal((await call("GET", `${path}/secret-draft`, { user: outsider })).status, 404);
  });

  test(`P0-1 ${label}: CMS user with ${perm} can still list and open drafts`, async () => {
    asPub();
    const seen = statusCollection(Model, docs);
    const list = await call("GET", `${path}?status=draft`, { user: editor });
    assert.equal(seen.filter.status, "draft");
    assert.deepEqual(list.body.items.map((i) => i.slug), ["secret-draft"]);
    assert.equal((await call("GET", `${path}/secret-draft`, { user: editor })).status, 200);
  });
}

test("P0-1 portfolio: draft cannot be fetched by ObjectId either", async () => {
  asPub();
  const draft = { _id: oid(), slug: "d", status: "draft" };
  statusCollection(Portfolio, [draft]);
  assert.equal((await call("GET", `/api/portfolio/${draft._id}`)).status, 404);
});

test("P0-1 public reads ignore an invalid token and stay public", async () => {
  asPub();
  statusCollection(Portfolio, [{ _id: oid(), slug: "live", status: "published" }]);
  const r = await fetch(`${await startApp()}/api/portfolio`, {
    headers: { authorization: "Bearer not-a-real-token" },
  });
  assert.equal(r.status, 200);
});

/** Stub an isActive-based collection (DigitalService, Solution). */
function activeCollection(Model, docs) {
  const seen = {};
  const active = (d) => d.isActive !== false;
  const matches = (f = {}, d) =>
    (f.slug === undefined || d.slug === f.slug) &&
    (f.isActive === undefined || (f.isActive === true ? d.isActive === true : f.isActive?.$ne === false ? active(d) : true));
  stub(Model, "find", (f) => {
    seen.filter = f;
    return q(docs.filter((d) => matches(f, d)));
  });
  stub(Model, "findOne", (f) => {
    seen.detail = f;
    return q(docs.find((d) => matches(f, d)) || null);
  });
  return seen;
}

for (const [label, Model, path] of [
  ["services", DigitalService, "/api/web-content/services"],
  ["solutions", Solution, "/api/web-content/solutions"],
]) {
  const docs = [
    { _id: oid(), slug: "live", isActive: true, title: "Live" },
    { _id: oid(), slug: "legacy", title: "Legacy (no isActive field)" },
    { _id: oid(), slug: "hidden", isActive: false, title: "Hidden" },
  ];

  test(`P0-1 ${label}: anonymous ?includeInactive=1 still returns active only`, async () => {
    asPub();
    const seen = activeCollection(Model, docs);
    const r = await call("GET", `${path}?includeInactive=1`);
    assert.equal(r.status, 200);
    assert.equal(seen.filter.isActive, true);
    assert.ok(!r.body.items.some((i) => i.slug === "hidden"));
  });

  test(`P0-1 ${label}: anonymous detail of an inactive record is 404; active and legacy records are 200`, async () => {
    asPub();
    activeCollection(Model, docs);
    assert.equal((await call("GET", `${path}/hidden`)).status, 404);
    assert.equal((await call("GET", `${path}/live`)).status, 200);
    assert.equal((await call("GET", `${path}/legacy`)).status, 200);
  });

  test(`P0-1 ${label}: signed-in user without website.read cannot see inactive records`, async () => {
    asPub();
    const seen = activeCollection(Model, docs);
    await call("GET", `${path}?includeInactive=1`, { user: outsider });
    assert.equal(seen.filter.isActive, true);
    assert.equal((await call("GET", `${path}/hidden`, { user: outsider })).status, 404);
  });

  test(`P0-1 ${label}: CMS editor (website.read) still lists and opens inactive records`, async () => {
    asPub();
    const seen = activeCollection(Model, docs);
    const r = await call("GET", `${path}?includeInactive=1`, { user: editor });
    assert.equal(seen.filter.isActive, undefined);
    assert.ok(r.body.items.some((i) => i.slug === "hidden"));
    assert.equal((await call("GET", `${path}/hidden`, { user: editor })).status, 200);
  });
}

// ═══ P0-1 OPTIONAL AUTHENTICATION — never grants privilege on failed auth ═══
// Each public content endpoint is called five ways. Failed authentication must
// fall back to anonymous (public content still served) and must never unlock
// drafts or inactive records.
const editorToken = () => jwt.sign({ id: String(editor._id), role: editor.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
const outsiderToken = () => jwt.sign({ id: String(outsider._id), role: outsider.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
// Same editor identity, but signed with the wrong secret.
const invalidEditorToken = () => jwt.sign({ id: String(editor._id), role: editor.role }, "not-the-server-secret", { expiresIn: "1h" });
// Same editor identity and correct secret, but already expired.
const expiredEditorToken = () =>
  jwt.sign({ id: String(editor._id), role: editor.role, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);

async function getWith(path, token) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${await startApp()}${path}`, { headers });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const OPTIONAL_AUTH_TARGETS = [
  { label: "portfolio", path: "/api/portfolio", list: "?status=draft", hidden: "secret-draft",
    install: () => statusCollection(Portfolio, [{ _id: oid(), slug: "live", status: "published" }, { _id: oid(), slug: "secret-draft", status: "draft" }]) },
  { label: "productions", path: "/api/productions", list: "?status=draft", hidden: "secret-draft",
    install: () => statusCollection(Production, [{ _id: oid(), slug: "live", status: "published" }, { _id: oid(), slug: "secret-draft", status: "draft" }]) },
  { label: "services", path: "/api/web-content/services", list: "?includeInactive=1", hidden: "hidden",
    install: () => activeCollection(DigitalService, [{ _id: oid(), slug: "live", isActive: true }, { _id: oid(), slug: "hidden", isActive: false }]) },
  { label: "solutions", path: "/api/web-content/solutions", list: "?includeInactive=1", hidden: "hidden",
    install: () => activeCollection(Solution, [{ _id: oid(), slug: "live", isActive: true }, { _id: oid(), slug: "hidden", isActive: false }]) },
];

const SCENARIOS = [
  { name: "anonymous request", token: () => null, privileged: false },
  { name: "valid token with the CMS permission", token: editorToken, privileged: true },
  { name: "valid token without the CMS permission", token: outsiderToken, privileged: false },
  { name: "invalid token (wrong signature)", token: invalidEditorToken, privileged: false },
  { name: "expired token", token: expiredEditorToken, privileged: false },
];

for (const t of OPTIONAL_AUTH_TARGETS) {
  for (const s of SCENARIOS) {
    test(`P0-1 optional auth · ${t.label} · ${s.name}: published content served; drafts ${s.privileged ? "visible" : "hidden"}`, async () => {
      asPub();
      t.install();
      const token = s.token();

      const list = await getWith(`${t.path}${t.list}`, token);
      assert.equal(list.status, 200, "public list must stay available");
      const slugs = list.body.items.map((i) => i.slug);
      assert.equal(slugs.includes(t.hidden), s.privileged, `hidden record ${s.privileged ? "should" : "must not"} be listed`);
      if (!s.privileged) assert.ok(slugs.includes("live"), "published record must be listed");

      const live = await getWith(`${t.path}/live`, token);
      assert.equal(live.status, 200, "published detail must stay available");

      const hidden = await getWith(`${t.path}/${t.hidden}`, token);
      assert.equal(hidden.status, s.privileged ? 200 : 404);
    });
  }
}

test("P0-1 optional auth: a deactivated editor's still-valid token grants no draft access", async () => {
  setupAuth({ users: [{ ...editor, isActive: false }], roles: pubRoles });
  statusCollection(Portfolio, [{ _id: oid(), slug: "live", status: "published" }, { _id: oid(), slug: "secret-draft", status: "draft" }]);
  const list = await getWith("/api/portfolio?status=draft", editorToken());
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.items.map((i) => i.slug), ["live"]);
  assert.equal((await getWith("/api/portfolio/secret-draft", editorToken())).status, 404);
});
