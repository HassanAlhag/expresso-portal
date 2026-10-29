// R4-D (P3-7): one owner per duplicated rule.
//  - S3: one public bucket resolver; deprecated aliases still accepted with a
//    one-time warning; the private-storage rule is NOT widened.
//  - Scope normalisation: one implementation shared by templates and enrollments.
//  - Client logins: shared creation logic, two unchanged route contracts.
//  - Technology groups: the client outage fallback matches the API taxonomy.
// No AWS call is made: S3 sends are intercepted.
import "./setup-env.js";
import { test, after, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { S3Client } from "@aws-sdk/client-s3";
import { setupAuth, restoreAll, stopApp, stub, oid, q, call } from "./helpers.js";
import { publicBucket, resetPublicBucketWarning, getS3PublicUrl, uploadToS3 } from "../src/utils/s3.js";
import { privateBucket, copyPublicObjectToPrivate, putPrivate } from "../src/utils/privateStorage.js";
import { normalizeChecklist, normalizeScopeGroup, normalizeScopeGroupJob } from "../src/modules/services/scopeNormalization.js";
import ServiceTemplate from "../src/modules/services/serviceTemplate.model.js";
import Enrollment from "../src/modules/enrollments/enrollment.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import User from "../src/modules/iam/users/user.model.js";
import { SYSTEM_CLIENT_ROLES } from "../src/utils/roleRegistry.js";
import { TECHNOLOGY_GROUPS, LEGACY_GROUPS, defaultTechnologyGroup } from "../src/modules/web-content/technologyGroups.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const superAdmin = { _id: oid(), role: "super_admin" };
const BUCKET_VARS = ["AWS_S3_BUCKET", "S3_BUCKET", "AWS_BUCKET_NAME", "AWS_S3_PRIVATE_BUCKET", "NODE_ENV"];
let savedEnv;
let warnings;
let sends;
const originalWarn = console.warn;
const originalSend = S3Client.prototype.send;

beforeEach(() => {
  savedEnv = Object.fromEntries(BUCKET_VARS.map((k) => [k, process.env[k]]));
  for (const k of BUCKET_VARS.slice(0, 4)) delete process.env[k];
  resetPublicBucketWarning();
  warnings = [];
  console.warn = (...args) => warnings.push(args.join(" "));
  sends = [];
  S3Client.prototype.send = async function (command) {
    sends.push({ name: command.constructor.name, input: command.input });
    return {};
  };
  setupAuth({ users: [superAdmin] });
});
afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  console.warn = originalWarn;
  S3Client.prototype.send = originalSend;
  restoreAll();
});
after(stopApp);

const status = async () => (await call("GET", "/api/admin/system-status", { user: superAdmin })).body.configured;

// ═══ S3 bucket resolution ════════════════════════════════════════════════════
test("S3: AWS_S3_BUCKET wins over both aliases and produces no warning", async () => {
  Object.assign(process.env, { AWS_S3_BUCKET: "canonical-b", S3_BUCKET: "alias-one", AWS_BUCKET_NAME: "alias-two" });
  assert.equal(publicBucket(), "canonical-b");
  assert.match(getS3PublicUrl("media/a.png"), /^https:\/\/canonical-b\.s3\./);
  assert.equal((await status()).publicStorage, true);
  assert.deepEqual(warnings, []);
});

for (const alias of ["S3_BUCKET", "AWS_BUCKET_NAME"]) {
  test(`S3: ${alias} alone resolves for public storage, system status and the migration source`, async () => {
    process.env[alias] = "legacy-public";
    assert.equal(publicBucket(), "legacy-public");
    assert.match(getS3PublicUrl("media/a.png"), /^https:\/\/legacy-public\.s3\./);
    await uploadToS3(Buffer.from("x"), "media", "a.png", "image/png");
    assert.equal(sends.at(-1).input.Bucket, "legacy-public", "uploads use the alias bucket");

    let s = await status();
    assert.equal(s.publicStorage, true, "status agrees with what uploads use");
    assert.equal(s.privateStorage, false);
    process.env.AWS_S3_PRIVATE_BUCKET = "legacy-public";
    s = await status();
    assert.equal(s.privateStorageSeparateFromPublic, false, "compared with the resolved public bucket");
    process.env.AWS_S3_PRIVATE_BUCKET = "private-b";
    assert.equal((await status()).privateStorageSeparateFromPublic, true);

    await copyPublicObjectToPrivate("media/old.pdf", "files");
    const copy = sends.at(-1);
    assert.equal(copy.name, "CopyObjectCommand");
    assert.equal(copy.input.Bucket, "private-b");
    assert.match(copy.input.CopySource, /^legacy-public\/media\/old\.pdf$/);
  });

  test(`S3: ${alias} warns once, by name only, never with the bucket value`, async () => {
    process.env[alias] = "secret-bucket-name";
    for (let i = 0; i < 5; i++) publicBucket();
    getS3PublicUrl("k");
    await status();
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], new RegExp(`${alias} is deprecated; set AWS_S3_BUCKET`));
    assert.ok(!warnings[0].includes("secret-bucket-name"));
  });

  test(`S3: ${alias} never becomes a private-storage fallback`, async () => {
    process.env[alias] = "legacy-public";
    assert.equal(privateBucket(), "", "private rule unchanged: aliases are not used");
    await assert.rejects(copyPublicObjectToPrivate("media/old.pdf", "files"), /S3 buckets are not configured/);
    process.env.NODE_ENV = "production";
    await assert.rejects(putPrivate(Buffer.from("x"), "files", "a.pdf", "application/pdf"), /Private storage is not configured/);
    assert.equal(sends.length, 0, "nothing sent to any bucket");
  });
}

test("S3: the existing private fallback to AWS_S3_BUCKET is preserved exactly", () => {
  process.env.AWS_S3_BUCKET = "canonical-b";
  assert.equal(privateBucket(), "canonical-b");
  process.env.AWS_S3_PRIVATE_BUCKET = "private-b";
  assert.equal(privateBucket(), "private-b");
});

test("S3: with no bucket, local mode outside production and refusal in production are unchanged", async () => {
  assert.equal(publicBucket(), "");
  assert.match(getS3PublicUrl("media/a.png"), /\/uploads\/media\/a\.png$/);
  const s = await status();
  assert.equal(s.publicStorage, false);
  assert.equal(s.privateStorage, false);
  process.env.NODE_ENV = "production";
  await assert.rejects(uploadToS3(Buffer.from("x"), "media", "a.png", "image/png"), /AWS_S3_BUCKET is not configured/);
  await assert.rejects(putPrivate(Buffer.from("x"), "files", "a.pdf", "application/pdf"), /Private storage is not configured/);
  assert.equal(sends.length, 0);
  assert.deepEqual(warnings, []);
});

// The migration script's public-source precondition, run as a process with an
// empty env file and no database URI: it must stop at the precondition, or get
// past it and stop at the (missing) database, without touching anything.
// Asynchronous, so the test server's event loop is never blocked.
async function runMigration(env) {
  const empty = path.join(root, "test", ".r4d-empty.env");
  fs.writeFileSync(empty, "");
  try {
    const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !BUCKET_VARS.includes(k) && k !== "MONGO_URI"));
    return await new Promise((resolve) => {
      execFile(process.execPath, [path.join(root, "src/scripts/migrateConfidentialFiles.js")], {
        env: { ...clean, NODE_ENV: "test", ENV_FILE: empty, MONGO_URI: "", ...env },
        encoding: "utf8",
      }, (err, stdout, stderr) => resolve({ status: err ? err.code : 0, stdout, stderr }));
    });
  } finally {
    fs.rmSync(empty, { force: true });
  }
}
test("S3: the migration accepts an alias as its public source; without any public bucket it stops", async () => {
  const none = await runMigration({ AWS_S3_PRIVATE_BUCKET: "private-b" });
  assert.equal(none.status, 1);
  assert.match(none.stderr, /Set AWS_S3_BUCKET/);
  for (const alias of ["S3_BUCKET", "AWS_BUCKET_NAME", "AWS_S3_BUCKET"]) {
    const r = await runMigration({ [alias]: "legacy-public", AWS_S3_PRIVATE_BUCKET: "private-b" });
    assert.equal(r.status, 1);
    assert.doesNotMatch(r.stderr, /Set AWS_S3_BUCKET/, `${alias} passes the public-source check`);
    assert.match(r.stderr, /MONGO_URI is missing/, "stops at the database step (no database used)");
    assert.ok(!`${r.stdout}${r.stderr}`.includes("legacy-public"), "bucket value never printed");
  }
});

// ═══ Scope normalisation ═════════════════════════════════════════════════════
const RAW_GROUP = {
  id: " g1 ",
  title: " Launch ",
  jobs: [
    { id: " j1 ", title: " Shoot ", dueDays: "5", startDays: 2, dependencies: "a, b,,c", checklist: [{ id: " c1 ", text: " Brief ", required: false }, { text: "" }] },
    { title: "" },
  ],
};
// Frozen expectation of the service-template behaviour before R4-D.
const EXPECTED_GROUP = {
  id: "g1", title: "Launch", description: "", type: "deliverable_group", order: 1, dueDays: 0,
  jobs: [{
    id: "j1", title: "Shoot", description: "", type: "task", quantity: 1, unit: "", priority: "", startDays: 2, dueDays: 5, durationDays: 3,
    timeEstimate: "", effort: "", assigneeName: "", processOwner: "", dependencies: ["a", "b", "c"], seoBoardStatus: "", seoTaskType: "",
    seoTarget: "", funnelStage: "", contentPhase: "", seoQuarter: "", executionPageUrl: "", analyticsUrl: "", parentGoalId: "",
    parentGoalName: "", parentGoalUrl: "", required: true, checklist: [{ id: "c1", text: "Brief", required: false }],
  }],
};

test("scope: the shared normaliser keeps the service-template behaviour (checklist ids included)", () => {
  assert.deepEqual([RAW_GROUP].map(normalizeScopeGroup), [EXPECTED_GROUP]);
  assert.deepEqual(normalizeChecklist([{ id: 7, text: " x " }, null]), [{ id: "7", text: "x", required: true }]);
  assert.equal(normalizeScopeGroupJob({}).type, "task");
  assert.deepEqual(normalizeChecklist("nope"), []);
});

test("scope: neither controller keeps its own normaliser; both import the shared one", () => {
  for (const f of ["src/modules/services/serviceTemplate.controller.js", "src/modules/enrollments/enrollment.controller.js"]) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    assert.doesNotMatch(src, /function normalize(Checklist|ScopeGroupJob|ScopeGroup)\b/, f);
    assert.match(src, /from "(\.\/|\.\.\/services\/)scopeNormalization\.js"/, f);
  }
});

test("scope: service-template create and update store the shared normaliser's output", async () => {
  let created;
  stub(ServiceTemplate, "findOne", () => q(null));
  stub(ServiceTemplate, "create", async (doc) => { created = doc; return doc; });
  let r = await call("POST", "/api/service", { user: superAdmin, body: { name: "Social", scopeGroups: [RAW_GROUP] } });
  assert.equal(r.status, 201);
  assert.deepEqual(created.scopeGroups, [EXPECTED_GROUP]);

  let patch;
  stub(ServiceTemplate, "findById", () => q({ _id: oid(), slug: "social" }));
  stub(ServiceTemplate, "findByIdAndUpdate", (_id, p) => { patch = p; return q({ ...p }); });
  r = await call("PATCH", `/api/service/${oid()}`, { user: superAdmin, body: { name: "Social", scopeGroups: [RAW_GROUP] } });
  assert.equal(r.status, 200);
  assert.deepEqual(patch.scopeGroups, [EXPECTED_GROUP]);
});

test("scope: enrollment create and update build the same final scope; stored checklists still carry no id", async () => {
  const template = { _id: oid(), executionMode: "recurring", scopeGroups: [RAW_GROUP], price: 10, billingCycle: "monthly" };
  let created;
  stub(Customer, "findById", () => q({ _id: oid() }));
  stub(Enrollment, "findOne", () => q(null));
  stub(ServiceTemplate, "findById", () => q(template));
  stub(Enrollment, "create", async (doc) => { created = doc; return { _id: oid() }; });
  stub(Enrollment, "findById", () => q({ ok: 1 }));
  let r = await call("POST", "/api/enrollments", { user: superAdmin, body: { customerId: oid(), serviceTemplateId: template._id, overrides: { customGroups: [] } } });
  assert.equal(r.status, 201);
  assert.deepEqual(created.finalScope, { mode: "recurring", groups: [EXPECTED_GROUP] });
  const stored = new Enrollment(created).toObject();
  assert.deepEqual(stored.finalScope.groups[0].jobs[0].checklist, [{ text: "Brief", required: false }], "enrollment schema drops checklist id, as before");

  let patch;
  stub(Enrollment, "findById", () => q({ _id: oid(), serviceTemplateId: template._id, overrides: {} }));
  stub(Enrollment, "findOneAndUpdate", (_id, p) => { patch = p; return q({ ...p }); });
  r = await call("PATCH", `/api/enrollments/${oid()}`, { user: superAdmin, body: { overrides: { customGroups: [RAW_GROUP] } } });
  assert.equal(r.status, 200);
  assert.deepEqual(patch.overrides.customGroups, [EXPECTED_GROUP]);
  assert.deepEqual(patch.finalScope, { mode: "recurring", groups: [EXPECTED_GROUP] });
});

// ═══ Client logins ═══════════════════════════════════════════════════════════
function customerWorld({ owner = null, emailTaken = false } = {}) {
  const customer = { _id: oid(), companyName: "Acme", contactName: "Omar", ownerUserId: owner, saves: 0 };
  customer.save = async () => { customer.saves += 1; return customer; };
  const created = [];
  stub(Customer, "findById", () => q(customer));
  stub(User, "findOne", () => q(emailTaken ? { _id: oid() } : null));
  stub(User, "hashPassword", async () => "hashed");
  stub(User, "create", async (doc) => { const u = { _id: oid(), createdAt: new Date(0), ...doc }; created.push(u); return u; });
  return { customer, created };
}

test("create-login: success keeps role client, sets the owner and keeps the response shape", async () => {
  const { customer, created } = customerWorld();
  const r = await call("POST", `/api/customers/${customer._id}/create-login`, { user: superAdmin, body: { email: " A@Acme.Example ", tempPassword: "12345678" } });
  assert.equal(r.status, 201);
  assert.equal(created[0].role, "client");
  assert.equal(created[0].email, "a@acme.example");
  assert.equal(created[0].fullName, "Omar");
  assert.equal(created[0].passwordHash, "hashed");
  assert.equal(String(customer.ownerUserId), String(created[0]._id));
  assert.deepEqual(Object.keys(r.body), ["ok", "user", "customer"]);
  assert.deepEqual(Object.keys(r.body.user), ["_id", "fullName", "email", "role", "clientId"]);
  assert.deepEqual(Object.keys(r.body.customer), ["_id", "companyName", "contactName", "ownerUserId"]);
});

test("create-login: owner exists, duplicate email, short password, missing email, invalid id", async () => {
  let w = customerWorld({ owner: oid() });
  stub(User, "create", () => assert.fail("no user may be created"));
  let r = await call("POST", `/api/customers/${w.customer._id}/create-login`, { user: superAdmin, body: { email: "a@x.example", tempPassword: "12345678" } });
  assert.deepEqual([r.status, r.body.message], [409, "This customer already has a linked login"]);
  restoreAll(); setupAuth({ users: [superAdmin] });
  w = customerWorld({ emailTaken: true });
  r = await call("POST", `/api/customers/${w.customer._id}/create-login`, { user: superAdmin, body: { email: "a@x.example", tempPassword: "12345678" } });
  assert.deepEqual([r.status, r.body.message], [409, "Email already exists"]);
  r = await call("POST", `/api/customers/${w.customer._id}/create-login`, { user: superAdmin, body: { email: "a@x.example", tempPassword: "short" } });
  assert.deepEqual([r.status, r.body.message], [400, "tempPassword must be at least 8 characters"]);
  r = await call("POST", `/api/customers/${w.customer._id}/create-login`, { user: superAdmin, body: { tempPassword: "12345678" } });
  assert.deepEqual([r.status, r.body.message], [400, "email is required"]);
  r = await call("POST", "/api/customers/not-an-id/create-login", { user: superAdmin, body: {} });
  assert.deepEqual([r.status, r.body.message], [400, "Invalid id"]);
  assert.equal(w.created.length, 0);
});

test("/users: every registry client role is accepted; the first user becomes owner, later users do not", async () => {
  assert.deepEqual([...SYSTEM_CLIENT_ROLES], ["client", "staff_client", "procurement_client", "client_admin"]);
  const { customer, created } = customerWorld();
  for (const role of SYSTEM_CLIENT_ROLES) {
    const r = await call("POST", `/api/customers/${customer._id}/users`, { user: superAdmin, body: { email: `${role}@acme.example`, tempPassword: "12345678", role } });
    assert.equal(r.status, 201, role);
    assert.equal(r.body.user.role, role);
    assert.deepEqual(Object.keys(r.body), ["ok", "user"]);
    assert.deepEqual(Object.keys(r.body.user), ["_id", "fullName", "email", "role", "isActive", "clientId", "createdAt"]);
  }
  assert.equal(String(customer.ownerUserId), String(created[0]._id), "first user is the owner");
  assert.equal(customer.saves, 1, "later users do not replace the owner");
});

test("/users: invalid role, duplicate email (its own message), short password, invalid id", async () => {
  let w = customerWorld();
  let r = await call("POST", `/api/customers/${w.customer._id}/users`, { user: superAdmin, body: { email: "x@acme.example", tempPassword: "12345678", role: "admin" } });
  assert.deepEqual([r.status, r.body.message], [400, "Role must be one of: client, staff_client, procurement_client, client_admin"]);
  restoreAll(); setupAuth({ users: [superAdmin] });
  w = customerWorld({ emailTaken: true });
  r = await call("POST", `/api/customers/${w.customer._id}/users`, { user: superAdmin, body: { email: "x@acme.example", tempPassword: "12345678" } });
  assert.deepEqual([r.status, r.body.message], [409, "Email already in use"]);
  assert.notEqual(r.body.message, "Email already exists", "the two routes keep their own wording");
  r = await call("POST", `/api/customers/${w.customer._id}/users`, { user: superAdmin, body: { email: "x@acme.example", tempPassword: "1234" } });
  assert.deepEqual([r.status, r.body.message], [400, "tempPassword must be at least 8 characters"]);
  r = await call("POST", "/api/customers/nope/users", { user: superAdmin, body: {} });
  assert.deepEqual([r.status, r.body.message], [400, "Invalid id"]);
  assert.equal(w.created.length, 0);
});

// ═══ Technology groups: client outage fallback vs API taxonomy ══════════════
test("technology groups: the client fallback matches the API taxonomy and legacy mapping exactly", () => {
  const fallback = JSON.parse(fs.readFileSync(path.join(root, "../client/src/data/technologyGroupsFallback.json"), "utf8"));
  assert.deepEqual(fallback.map(({ legacySlugs, ...g }) => g), TECHNOLOGY_GROUPS, "ids, labels, descriptions and order");
  const fallbackMap = Object.fromEntries(fallback.flatMap((g) => g.legacySlugs.map((slug) => [slug, g.id])));
  assert.deepEqual(fallbackMap, LEGACY_GROUPS, "legacy slug → group, both directions");
  for (const [slug, id] of Object.entries(fallbackMap)) assert.equal(defaultTechnologyGroup(slug), id);
});
