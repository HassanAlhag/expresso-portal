// PI tail — Jobs (API). The public reels endpoint is an allowlist; a status
// change never makes a job public; job writes validate the client, staff
// assignees, media references and dates.
import "./setup-env.js";
import { test, after, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, oid, q, call } from "./helpers.js";
import Job from "../src/modules/content/jobs/job.model.js";
import Media from "../src/modules/content/media/media.model.js";
import Project from "../src/modules/projects/project.model.js";
import Enrollment from "../src/modules/enrollments/enrollment.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import User from "../src/modules/iam/users/user.model.js";

const admin = { _id: oid(), role: "super_admin" };
const staff = { _id: oid(), role: "staff", isActive: true };
const inactiveStaff = { _id: oid(), role: "staff", isActive: false };
const clientUser = { _id: oid(), role: "client", isActive: true };
const vendorUser = { _id: oid(), role: "vendor_rep", isActive: true };
const customInternal = { _id: oid(), role: "editor", isActive: true };
const people = [staff, inactiveStaff, clientUser, vendorUser, customInternal];

beforeEach(() => {
  setupAuth({
    users: [admin],
    roles: { vendor_rep: { permissions: [], isInternal: false }, editor: { permissions: ["jobs.read"], isInternal: true } },
  });
  stub(User, "find", (filter) => q(people.filter((p) => filter._id.$in.map(String).includes(String(p._id)))));
});
afterEach(restoreAll);
after(stopApp);

// ═══ Public endpoint ═════════════════════════════════════════════════════════
const SENSITIVE = {
  notes: "internal note", script: "secret script", storyboard: "board", shotList: "shots", caption: "draft caption",
  concept: "concept", location: "office", assigneeName: "Staff Name", processOwner: "owner@expresso.example",
  assignees: [oid()], approvals: [{ status: "internal_note", note: "do not show the client", createdBy: oid() }],
  approvalChecklist: [{ text: "QA", done: false }], postMetrics: { reach: 99 }, deliverables: [{ x: 1 }],
  projectId: oid(), enrollmentId: oid(), productionId: oid(), seoTarget: "kw", effort: "8h", dependencies: ["a"],
  createdBy: oid(), updatedBy: oid(), media: [oid()], draftMediaId: { url: "https://cdn/draft.mp4" }, priority: "high",
  futureField: "anything added to the model later",
};
const PUBLIC_KEYS = ["_id", "title", "platform", "type", "publishedAt", "externalPostUrl", "customerId", "posterMediaId", "coverMedia", "finalMediaId"].sort();

test("public reels: no login, explicit allowlist, no internal or contact data", async () => {
  let filter;
  const doc = {
    _id: oid(), title: "Launch reel", platform: "instagram", type: "reel", status: "published", websiteVisible: true,
    publishedAt: new Date("2026-10-01"), externalPostUrl: "https://instagram.example/p/1",
    customerId: { _id: oid(), companyName: "Acme", contactName: "Private Person", primaryEmail: "p@acme.example" },
    finalMediaId: { _id: oid(), url: "https://cdn/final.mp4", fileUrl: "", thumbnailUrl: "", title: "internal title", tags: ["x"] },
    posterMediaId: { url: "https://cdn/poster.jpg" }, coverMedia: null, ...SENSITIVE,
  };
  stub(Job, "countDocuments", async (f) => { filter = f; return 1; });
  stub(Job, "find", () => q([doc]));
  const r = await call("GET", "/api/jobs/public/website");
  assert.equal(r.status, 200);
  assert.deepEqual(filter, { websiteVisible: true, status: "published" });
  const [item] = r.body.items;
  assert.deepEqual(Object.keys(item).sort(), PUBLIC_KEYS, "only allowlisted fields");
  assert.deepEqual(item.customerId, { companyName: "Acme" });
  assert.deepEqual(item.finalMediaId, { url: "https://cdn/final.mp4", fileUrl: "", thumbnailUrl: "" });
  const text = JSON.stringify(r.body);
  for (const leak of ["internal note", "secret script", "do not show the client", "Private Person", "p@acme.example", "owner@expresso.example", "Staff Name", "anything added", "internal title", "draft.mp4"]) {
    assert.ok(!text.includes(leak), `public response leaks: ${leak}`);
  }
});

// ═══ Publication ═════════════════════════════════════════════════════════════
function jobWorld(current) {
  let patch = null;
  stub(Job, "findById", () => q(current));
  stub(Job, "findOneAndUpdate", (_id, p) => { patch = p; return q({ ...current, ...(p.$set || p) }); });
  stub(Media, "find", (f) => q(f._id.$in.map((id) => ({ _id: id }))));
  return () => patch;
}
const ready = { _id: oid(), customerId: oid(), status: "approved", websiteVisible: false, finalMediaId: oid(), media: [] };

test("PATCH status=published records the status but never makes the job public", async () => {
  const patch = jobWorld({ ...ready });
  const r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { status: "published" } });
  assert.equal(r.status, 200);
  assert.equal(patch().status, "published");
  assert.notEqual(patch().websiteVisible, true);
  assert.equal(r.body.item.websiteVisible, false);
});

test("explicit websiteVisible on PATCH follows the publish rule", async () => {
  // Not published: refused.
  let patch = jobWorld({ ...ready });
  let r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { websiteVisible: true } });
  assert.equal(r.status, 400);
  assert.equal(patch(), null);
  // Published but nothing to show: refused.
  restoreAll(); setupAuth({ users: [admin] });
  patch = jobWorld({ ...ready, status: "published", finalMediaId: null, media: [], externalPostUrl: "" });
  r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { websiteVisible: true } });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /Attach a video file or set an external URL/);
  // Published with a final file: allowed (the Productions "go live" toggle).
  restoreAll(); setupAuth({ users: [admin] });
  patch = jobWorld({ ...ready, status: "published" });
  r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { websiteVisible: true } });
  assert.equal(r.status, 200);
  assert.equal(patch().websiteVisible, true);
});

test("leaving published hides the job; a non-published job is never left visible", async () => {
  const patch = jobWorld({ ...ready, status: "published", websiteVisible: true });
  const r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { status: "editing" } });
  assert.equal(r.status, 200);
  assert.equal(patch().websiteVisible, false);
});

test("create never makes a job public, even when asked", async () => {
  let created;
  stub(Customer, "exists", async () => true);
  stub(Job, "create", async (doc) => { created = doc; return { _id: oid(), ...doc }; });
  const r = await call("POST", "/api/jobs", { user: admin, body: { title: "Post", customerId: oid(), status: "published", websiteVisible: true } });
  assert.equal(r.status, 201);
  assert.equal(created.websiteVisible, false);
});

test("POST /publish: succeeds only with publishable media; a failed publish stays private", async () => {
  let updated = null;
  stub(Job, "findById", () => q({ ...ready, finalMediaId: null, media: [], externalPostUrl: "" }));
  stub(Job, "findOneAndUpdate", (_id, u) => { updated = u; return q({}); });
  let r = await call("POST", `/api/jobs/${ready._id}/publish`, { user: admin, body: {} });
  assert.equal(r.status, 400);
  assert.equal(updated, null, "nothing written on a failed publish");
  restoreAll(); setupAuth({ users: [admin] });
  stub(Job, "findById", () => q({ ...ready, media: [] }));
  stub(Job, "findOneAndUpdate", (_id, u) => { updated = u; return q({ ...ready, ...u.$set }); });
  r = await call("POST", `/api/jobs/${ready._id}/publish`, { user: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(updated.$set.websiteVisible, true);
  assert.equal(updated.$set.status, "published");
  // A publish body naming media that does not exist is refused.
  restoreAll(); setupAuth({ users: [admin] });
  updated = null;
  stub(Job, "findById", () => q({ ...ready }));
  stub(Media, "find", () => q([]));
  stub(Job, "findOneAndUpdate", (_id, u) => { updated = u; return q({}); });
  r = await call("POST", `/api/jobs/${ready._id}/publish`, { user: admin, body: { finalMediaId: oid() } });
  assert.equal(r.status, 400);
  assert.equal(updated, null);
});

// ═══ Create / update validation ══════════════════════════════════════════════
function createWorld({ customerExists = true, project = null, enrollment = null } = {}) {
  const calls = { created: null };
  stub(Customer, "exists", async () => customerExists);
  stub(Project, "findById", () => q(project));
  stub(Enrollment, "findById", () => q(enrollment));
  stub(Job, "create", async (doc) => { calls.created = doc; return { _id: oid(), ...doc }; });
  return calls;
}

test("create: a missing client is rejected and nothing is created", async () => {
  const w = createWorld({ customerExists: false });
  const r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: oid() } });
  assert.deepEqual([r.status, r.body.message], [404, "Customer not found"]);
  assert.equal(w.created, null);
});

test("create: project and enrollment must belong to the chosen client", async () => {
  const cust = oid();
  let w = createWorld({ project: { _id: oid(), customerId: oid() } });
  let r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: cust, projectId: oid() } });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /does not match/);
  restoreAll(); setupAuth({ users: [admin] });
  w = createWorld({ enrollment: { _id: oid(), customerId: oid() } });
  r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: cust, enrollmentId: oid() } });
  assert.equal(r.status, 400);
  assert.equal(w.created, null);
});

test("create and update: a malformed date is a 400, not a 500", async () => {
  const w = createWorld();
  for (const field of ["dueDate", "startDate", "shootDate"]) {
    const r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: oid(), [field]: "31-31-2026" } });
    assert.deepEqual([r.status, r.body.message], [400, `${field} is not a valid date`]);
  }
  assert.equal(w.created, null);
  const patch = jobWorld({ ...ready });
  const r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { dueDate: "not a date" } });
  assert.equal(r.status, 400);
  assert.equal(patch(), null);
  const list = await call("GET", "/api/jobs?dueDateFrom=nope", { user: admin });
  assert.equal(list.status, 400);
});

test("create: active internal staff (system or custom internal role) are accepted as assignees", async () => {
  const w = createWorld();
  const r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: oid(), assignees: [staff._id, customInternal._id] } });
  assert.equal(r.status, 201);
  assert.deepEqual(w.created.assignees.map(String), [staff._id, customInternal._id].map(String));
});

for (const [label, person, message] of [
  ["an unknown id", { _id: oid() }, "Assignee not found"],
  ["an inactive staff member", inactiveStaff, "Assignees must be active staff members"],
  ["a client user", clientUser, "Assignees must be Expresso staff members"],
  ["a vendor user", vendorUser, "Assignees must be Expresso staff members"],
  ["a malformed id", { _id: "nope" }, "Invalid assignee id"],
]) {
  test(`create, update and bulk assign reject ${label} (never silently dropped)`, async () => {
    const w = createWorld();
    let r = await call("POST", "/api/jobs", { user: admin, body: { title: "T", customerId: oid(), assignees: [staff._id, person._id] } });
    assert.deepEqual([r.status, r.body.message], [400, message]);
    assert.equal(w.created, null);
    const patch = jobWorld({ ...ready, assignees: [] });
    r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { assignees: [person._id] } });
    assert.deepEqual([r.status, r.body.message], [400, message]);
    assert.equal(patch(), null);
    let bulk = null;
    stub(Job, "updateMany", async (...a) => { bulk = a; return {}; });
    r = await call("PATCH", "/api/jobs/bulk/assign", { user: admin, body: { ids: [oid()], assignees: [person._id] } });
    assert.deepEqual([r.status, r.body.message], [400, message]);
    assert.equal(bulk, null);
  });
}

test("update keeps an existing assignee who has since been deactivated; bulk assign accepts staff", async () => {
  const patch = jobWorld({ ...ready, assignees: [inactiveStaff._id] });
  let r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { assignees: [inactiveStaff._id, staff._id] } });
  assert.equal(r.status, 200);
  assert.deepEqual(patch().assignees.map(String), [inactiveStaff._id, staff._id].map(String));
  let bulk;
  stub(Job, "updateMany", async (f, u) => { bulk = u; return { matchedCount: 1, modifiedCount: 1 }; });
  r = await call("PATCH", "/api/jobs/bulk/assign", { user: admin, body: { ids: [oid()], assignees: [staff._id] } });
  assert.equal(r.status, 200);
  assert.deepEqual(bulk.$addToSet.assignees.$each.map(String), [String(staff._id)]);
});

test("update: media references must exist; clearing them is allowed", async () => {
  let patch = jobWorld({ ...ready });
  stub(Media, "find", () => q([]));
  let r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { finalMediaId: oid() } });
  assert.deepEqual([r.status, r.body.message], [400, "Media not found"]);
  r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { posterMediaId: "bad" } });
  assert.equal(r.status, 400);
  assert.equal(patch(), null);
  restoreAll(); setupAuth({ users: [admin] });
  patch = jobWorld({ ...ready });
  r = await call("PATCH", `/api/jobs/${ready._id}`, { user: admin, body: { finalMediaId: "", coverMedia: null } });
  assert.equal(r.status, 200);
  assert.equal(patch().finalMediaId, null);
  assert.equal(patch().coverMedia, null);
});

test("list: status accepts one value or a comma-separated list; unknown values are ignored", async () => {
  const seen = [];
  stub(Job, "countDocuments", async (f) => { seen.push(f.status); return 0; });
  stub(Job, "find", () => q([]));
  await call("GET", "/api/jobs?status=client_review", { user: admin });
  await call("GET", "/api/jobs?status=internal_review,client_review,nonsense", { user: admin });
  await call("GET", "/api/jobs?status=nonsense", { user: admin });
  assert.deepEqual(seen, ["client_review", { $in: ["internal_review", "client_review"] }, undefined]);
});
